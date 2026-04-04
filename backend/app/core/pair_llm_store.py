"""
双人连连看：资料 hash、主分析结果、追问轮次的持久化（user_pair_llm / user_pair_llm_message）
"""
from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.alumni_data import fetch_user_bundle_for_llm, format_alumni_for_llm


def ordered_pair(uid_a: int, uid_b: int) -> Tuple[int, int]:
    a, b = int(uid_a), int(uid_b)
    return (a, b) if a < b else (b, a)


def compute_user_profile_hash(db: Session, user_id: int) -> str:
    b = fetch_user_bundle_for_llm(db, user_id)
    if not b:
        return ""
    s = format_alumni_for_llm([b], include_hidden=True)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def pair_hashes(db: Session, uid_a: int, uid_b: int) -> Tuple[int, int, str, str]:
    umin, umax = ordered_pair(uid_a, uid_b)
    hmin = compute_user_profile_hash(db, umin)
    hmax = compute_user_profile_hash(db, umax)
    return umin, umax, hmin, hmax


def _row_to_dict(row) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    if hasattr(row, "_mapping"):
        return dict(row._mapping)
    if isinstance(row, dict):
        return row
    keys = getattr(row, "_fields", None) or []
    if keys:
        return dict(zip(keys, row))
    return None


def load_pair_row(db: Session, user_min_id: int, user_max_id: int) -> Optional[Dict[str, Any]]:
    try:
        r = db.execute(
            text(
                """
                SELECT id, user_min_id, user_max_id, hash_min, hash_max, main_thinking, main_answer, created_at, updated_at
                FROM user_pair_llm
                WHERE user_min_id = :a AND user_max_id = :b
                LIMIT 1
                """
            ),
            {"a": user_min_id, "b": user_max_id},
        )
        row = r.fetchone()
        d = _row_to_dict(row)
        return d
    except Exception:
        return None


def list_messages(db: Session, pair_llm_id: int) -> List[Dict[str, Any]]:
    try:
        r = db.execute(
            text(
                """
                SELECT seq, role, content, created_at
                FROM user_pair_llm_message
                WHERE pair_llm_id = :pid
                ORDER BY seq ASC
                """
            ),
            {"pid": pair_llm_id},
        )
        out = []
        for row in r.fetchall():
            d = _row_to_dict(row)
            if d:
                out.append(
                    {
                        "seq": d.get("seq"),
                        "role": d.get("role"),
                        "content": d.get("content") or "",
                        "created_at": str(d.get("created_at") or ""),
                    }
                )
        return out
    except Exception:
        return []


def next_seq(db: Session, pair_llm_id: int) -> int:
    try:
        r = db.execute(
            text("SELECT COALESCE(MAX(seq), 0) AS m FROM user_pair_llm_message WHERE pair_llm_id = :pid"),
            {"pid": pair_llm_id},
        )
        row = r.fetchone()
        d = _row_to_dict(row)
        m = d.get("m") if d else 0
        return int(m or 0) + 1
    except Exception:
        return 1


def delete_messages_for_pair(db: Session, pair_llm_id: int) -> None:
    db.execute(text("DELETE FROM user_pair_llm_message WHERE pair_llm_id = :pid"), {"pid": pair_llm_id})


def upsert_pair_main(
    db: Session,
    user_min_id: int,
    user_max_id: int,
    hash_min: str,
    hash_max: str,
    main_thinking: str,
    main_answer: str,
) -> int:
    """写入或更新主分析；更新时清空追问记录（主分析重新生成后上下文重置）"""
    now = datetime.utcnow()
    row = load_pair_row(db, user_min_id, user_max_id)
    thinking = main_thinking or ""
    answer = main_answer or ""

    if row:
        pid = int(row["id"])
        delete_messages_for_pair(db, pid)
        db.execute(
            text(
                """
                UPDATE user_pair_llm
                SET hash_min = :hmin, hash_max = :hmax,
                    main_thinking = :th, main_answer = :ans,
                    updated_at = :ua
                WHERE id = :id
                """
            ),
            {"hmin": hash_min, "hmax": hash_max, "th": thinking, "ans": answer, "ua": now, "id": pid},
        )
        return pid

    db.execute(
        text(
            """
            INSERT INTO user_pair_llm (user_min_id, user_max_id, hash_min, hash_max, main_thinking, main_answer, created_at, updated_at)
            VALUES (:umin, :umax, :hmin, :hmax, :th, :ans, :ca, :ua)
            """
        ),
        {
            "umin": user_min_id,
            "umax": user_max_id,
            "hmin": hash_min,
            "hmax": hash_max,
            "th": thinking,
            "ans": answer,
            "ca": now,
            "ua": now,
        },
    )
    r2 = load_pair_row(db, user_min_id, user_max_id)
    return int(r2["id"]) if r2 else 0


def insert_message(db: Session, pair_llm_id: int, seq: int, role: str, content: str) -> None:
    now = datetime.utcnow()
    db.execute(
        text(
            """
            INSERT INTO user_pair_llm_message (pair_llm_id, seq, role, content, created_at)
            VALUES (:pid, :seq, :role, :content, :ca)
            """
        ),
        {"pid": pair_llm_id, "seq": seq, "role": role, "content": content or "", "ca": now},
    )


def display_excerpt(main_answer: str, max_len: int = 160) -> str:
    t = (main_answer or "").strip()
    if not t:
        return "暂无连连看分析。点击下方「帮我连连看」生成。"
    if len(t) <= max_len:
        return t
    return t[:max_len] + "…"


def build_full_text_for_sheet(main_thinking: str, main_answer: str, messages: List[Dict[str, Any]]) -> str:
    parts = []
    if (main_thinking or "").strip():
        parts.append("【思考】\n" + main_thinking.strip())
    if (main_answer or "").strip():
        if parts:
            parts.append("")
        parts.append(main_answer.strip())
    for m in messages:
        role = m.get("role") or ""
        c = (m.get("content") or "").strip()
        if not c:
            continue
        if role == "user":
            parts.append("\n【追问】\n" + c)
        elif role == "assistant":
            parts.append("\n【回复】\n" + c)
    return "\n".join(parts).strip()
