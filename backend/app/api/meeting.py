from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import verify_token
from app.models.meeting import MeetingRequest
from typing import Optional

router = APIRouter()


class CreateMeetingRequest(BaseModel):
    receiver_id: int
    purpose: str  # coffee/dinner/project/interest
    suggested_time: Optional[datetime] = None
    suggested_location: Optional[str] = None
    notes: Optional[str] = None


@router.post("/create")
async def create_meeting(
    request: CreateMeetingRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """创建约见请求"""
    requester_id = token["sub"]
    
    meeting = MeetingRequest(
        requester_id=requester_id,
        receiver_id=request.receiver_id,
        purpose=request.purpose,
        suggested_time=request.suggested_time,
        suggested_location=request.suggested_location,
        notes=request.notes,
        status="pending"
    )
    
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    return {
        "success": True,
        "meeting": {
            "id": meeting.id,
            "status": meeting.status
        }
    }


@router.get("/my")
async def get_my_meetings(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """获取我的约见"""
    user_id = token["sub"]
    
    # 发出的约见
    sent_meetings = db.query(MeetingRequest).filter(
        MeetingRequest.requester_id == user_id
    ).all()
    
    # 收到的约见
    received_meetings = db.query(MeetingRequest).filter(
        MeetingRequest.receiver_id == user_id
    ).all()
    
    return {
        "success": True,
        "sent": [
            {
                "id": m.id,
                "receiver_id": m.receiver_id,
                "purpose": m.purpose,
                "suggested_time": m.suggested_time.isoformat() if m.suggested_time else None,
                "status": m.status
            }
            for m in sent_meetings
        ],
        "received": [
            {
                "id": m.id,
                "requester_id": m.requester_id,
                "purpose": m.purpose,
                "suggested_time": m.suggested_time.isoformat() if m.suggested_time else None,
                "status": m.status
            }
            for m in received_meetings
        ]
    }


@router.post("/{meeting_id}/accept")
async def accept_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """接受约见"""
    user_id = token["sub"]
    
    meeting = db.query(MeetingRequest).filter(
        MeetingRequest.id == meeting_id,
        MeetingRequest.receiver_id == user_id
    ).first()
    
    if not meeting:
        return {"success": False, "error": "约见不存在"}
    
    meeting.status = "accepted"
    db.commit()
    
    return {"success": True}


@router.post("/{meeting_id}/reject")
async def reject_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """拒绝约见"""
    user_id = token["sub"]
    
    meeting = db.query(MeetingRequest).filter(
        MeetingRequest.id == meeting_id,
        MeetingRequest.receiver_id == user_id
    ).first()
    
    if not meeting:
        return {"success": False, "error": "约见不存在"}
    
    meeting.status = "rejected"
    db.commit()
    
    return {"success": True}

