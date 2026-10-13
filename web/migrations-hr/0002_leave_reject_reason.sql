-- Lý do từ chối đơn nghỉ phép (BUG-008). Áp dụng cho DB HR trước khi deploy bản sửa.
ALTER TABLE hr_leave_requests ADD COLUMN reject_reason TEXT;
