SELECT 'room_bookings' as table_name, count(*) as c FROM room_bookings WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011';
SELECT 'system_notifications' as table_name, count(*) as c FROM system_notifications WHERE user_id = 'letan.teamlead' OR user_id = '202206011';
SELECT 'zalo_user_links' as table_name, count(*) as c FROM zalo_user_links WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011';
SELECT 'auth_login_history' as table_name, count(*) as c FROM auth_login_history WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011';
SELECT 'admin_alert_recipients' as table_name, count(*) as c FROM admin_alert_recipients WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011' OR email = 'letan.teamlead@tbsgroup.vn' OR email = '202206011@tbsgroup.vn';
SELECT 'audit_logs' as table_name, count(*) as c FROM audit_logs WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011' OR user_id = 'letan.teamlead' OR user_id = '202206011';
SELECT 'notifications' as table_name, count(*) as c FROM notifications WHERE user_id = 'letan.teamlead' OR user_id = '202206011' OR emp_code = 'letan.teamlead' OR emp_code = '202206011';
SELECT 'zalo_notification_logs' as table_name, count(*) as c FROM zalo_notification_logs WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011' OR recipient_id = 'letan.teamlead' OR recipient_id = '202206011';
SELECT 'sys_users' as table_name, count(*) as c FROM sys_users WHERE emp_code = 'letan.teamlead' OR emp_code = '202206011';
