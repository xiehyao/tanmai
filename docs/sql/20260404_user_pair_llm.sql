-- 双人连连看主结果与追问历史（MySQL）
-- 部署：在目标库执行后无需改代码中的表名

CREATE TABLE IF NOT EXISTS user_pair_llm (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_min_id INT NOT NULL,
  user_max_id INT NOT NULL,
  hash_min VARCHAR(64) NOT NULL,
  hash_max VARCHAR(64) NOT NULL,
  main_thinking MEDIUMTEXT NULL,
  main_answer MEDIUMTEXT NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uk_pair_users (user_min_id, user_max_id),
  KEY idx_um (user_min_id),
  KEY idx_ux (user_max_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_pair_llm_message (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pair_llm_id BIGINT NOT NULL,
  seq INT NOT NULL,
  role VARCHAR(16) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  created_at DATETIME NULL,
  UNIQUE KEY uk_pair_seq (pair_llm_id, seq),
  KEY idx_pair (pair_llm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
