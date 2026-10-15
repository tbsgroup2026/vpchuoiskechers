-- Rollback 0014: xóa bảng mật khẩu (mọi người quay về mật khẩu mặc định + bắt đổi)
DROP TABLE IF EXISTS auth_credentials;
