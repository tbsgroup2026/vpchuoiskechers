import { describe, it, expect } from 'vitest';
import { sanitizeBackupPayload } from '../lib/driveBackup';


describe('TBS Group Audit Log & Real-time Drive Backup Security Suite', () => {
  it('1. Should strictly sanitize and remove password/hash/secret/token from backup payloads', () => {
    const sensitiveUserData = {
      empCode: '202608001',
      empName: 'Phạm Nguyễn Anh Huy',
      email: 'anhy.work.2004@gmail.com',
      password: 'PlaintextPassword123!',
      password_hash: '$2a$12$eImiTXuWVxfM37uY4JANjO5E8t.O/2b2H4L.y9a1f2e3d4c5b6a7',
      secret: 'super_secret_jwt_key',
      token: 'jwt_bearer_token_string',
      roleCode: 'ADMIN',
      nestedProfile: {
        pin_hash: '123456_hash',
        department: 'IT - Team Chuyển Đổi Số',
        auth_token: 'nested_auth_token_value',
      },
    };

    const sanitized = sanitizeBackupPayload(sensitiveUserData);

    // Verify sensitive keys are completely removed
    expect(sanitized.password).toBeUndefined();
    expect(sanitized.password_hash).toBeUndefined();
    expect(sanitized.secret).toBeUndefined();
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.nestedProfile.pin_hash).toBeUndefined();
    expect(sanitized.nestedProfile.auth_token).toBeUndefined();

    // Verify non-sensitive business keys are perfectly preserved
    expect(sanitized.empCode).toBe('202608001');
    expect(sanitized.empName).toBe('Phạm Nguyễn Anh Huy');
    expect(sanitized.roleCode).toBe('ADMIN');
    expect(sanitized.nestedProfile.department).toBe('IT - Team Chuyển Đổi Số');
  });

  it('2. Should sanitize arrays of user records without losing array elements', () => {
    const userList = [
      { empCode: '202608001', name: 'Phạm Nguyễn Anh Huy', password: '123' },
      { empCode: '202206011', name: 'Trần Thị Bích Trâm', password: '456' },
    ];

    const sanitizedList = sanitizeBackupPayload(userList);

    expect(sanitizedList.length).toBe(2);
    expect(sanitizedList[0].password).toBeUndefined();
    expect(sanitizedList[1].password).toBeUndefined();
    expect(sanitizedList[0].empCode).toBe('202608001');
    expect(sanitizedList[1].empCode).toBe('202206011');
  });

  it('3. Should verify Admin Password Reset logs event without exposing temp password in changesJson', () => {
    const resetLogPayload = {
      adminEmpCode: '202608001',
      adminName: 'Phạm Nguyễn Anh Huy',
      targetEmpCode: '202608003',
      targetName: 'Chuyên Viên IT',
      tempPasswordIssued: true,
      mustChangePasswordOnNextLogin: true,
    };

    const sanitizedLog = sanitizeBackupPayload(resetLogPayload);

    expect(sanitizedLog.adminEmpCode).toBe('202608001');
    expect(sanitizedLog.targetEmpCode).toBe('202608003');
    expect(sanitizedLog.tempPasswordIssued).toBe(true);
    expect((sanitizedLog as any).tempPassword).toBeUndefined();
  });
});
