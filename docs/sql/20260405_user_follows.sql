-- 校友关注：登录用户关注某校友，后续资料更新可据此推送（小程序页 / 公众号等）
-- 部署：在 MySQL 目标库执行一次

CREATE TABLE IF NOT EXISTS user_follows (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  follower_user_id INT NOT NULL COMMENT '关注者 users.id',
  followee_user_id INT NOT NULL COMMENT '被关注者 users.id',
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_follow (follower_user_id, followee_user_id),
  KEY idx_followee (followee_user_id),
  KEY idx_follower (follower_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
