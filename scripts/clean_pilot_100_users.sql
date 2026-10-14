-- Cleanup Script for Pilot 100 Users
DELETE FROM sys_users WHERE is_test_account = 1 OR ghi_chu = 'TEST_PILOT_100_USERS';
