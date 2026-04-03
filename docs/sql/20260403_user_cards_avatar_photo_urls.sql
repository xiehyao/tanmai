-- 用户名片：上传相片原图 URL + 混元风格化结果 URL（需在 MySQL 执行一次）
ALTER TABLE user_cards
  ADD COLUMN avatar_photo_original_url VARCHAR(500) NULL COMMENT 'COS 上传原图 URL' AFTER personal_photos,
  ADD COLUMN avatar_photo_cartoon_url VARCHAR(500) NULL COMMENT '混元图生图风格化 COS URL' AFTER avatar_photo_original_url;
