import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { getZaloBotToken, getZaloWebhookSecret, sendZaloNotification } from '@/lib/zaloNotificationService';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    const empCode = session?.empCode || 'LT-001';

    const db = getDbBinding();
    let config = {
      quiet_hours_start: '17:00',
      quiet_hours_end: '06:30',
      meeting_reminder_mins: 30,
      visitor_reminder_days: 2,
      reception_group_chat_id: '',
      confirmed_group_chat_id: '',
      event_toggles_json: '{}',
      priority_config_json: '{}',
    };

    let logs: any[] = [];
    let capturedGroups: any[] = [];
    let isBotConnected = !!getZaloBotToken();

    if (db) {
      await ensureKaizenSchema(db);
      const confRes: any = await db.prepare("SELECT * FROM zalo_config WHERE id = 'main'").first().catch(() => null);
      if (confRes) {
        config = { ...config, ...confRes };
      }

      const logsRes: any = await db.prepare(`
        SELECT * FROM zalo_notification_logs
        ORDER BY created_at DESC
        LIMIT 50
      `).all().catch(() => ({ results: [] }));

      if (logsRes && logsRes.results) {
        logs = logsRes.results;
      }

      const groupsRes: any = await db.prepare(`
        SELECT * FROM zalo_captured_groups
        ORDER BY updated_at DESC
        LIMIT 20
      `).all().catch(() => ({ results: [] }));

      if (groupsRes && groupsRes.results) {
        capturedGroups = groupsRes.results;
      }
    }

    return NextResponse.json({
      success: true,
      config,
      logs,
      capturedGroups,
      isBotConnected,
      hasWebhookSecret: !!getZaloWebhookSecret(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthUser(request);
    const empCode = session?.empCode || 'LT-001';

    const body = await request.json();
    const {
      quiet_hours_start = '21:00',
      quiet_hours_end = '06:30',
      meeting_reminder_mins = 30,
      visitor_reminder_days = 2,
      reception_group_chat_id = '',
      confirmed_group_chat_id = '',
      event_toggles_json = '{}',
      priority_config_json = '{}',
    } = body;

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`
        INSERT INTO zalo_config (
          id, quiet_hours_start, quiet_hours_end, meeting_reminder_mins, visitor_reminder_days,
          reception_group_chat_id, confirmed_group_chat_id, event_toggles_json, priority_config_json, updated_at
        ) VALUES ('main', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          quiet_hours_start = excluded.quiet_hours_start,
          quiet_hours_end = excluded.quiet_hours_end,
          meeting_reminder_mins = excluded.meeting_reminder_mins,
          visitor_reminder_days = excluded.visitor_reminder_days,
          reception_group_chat_id = excluded.reception_group_chat_id,
          confirmed_group_chat_id = excluded.confirmed_group_chat_id,
          event_toggles_json = excluded.event_toggles_json,
          priority_config_json = excluded.priority_config_json,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        quiet_hours_start,
        quiet_hours_end,
        meeting_reminder_mins,
        visitor_reminder_days,
        reception_group_chat_id,
        confirmed_group_chat_id,
        typeof event_toggles_json === 'string' ? event_toggles_json : JSON.stringify(event_toggles_json),
        typeof priority_config_json === 'string' ? priority_config_json : JSON.stringify(priority_config_json)
      ).run();
    }

    return NextResponse.json({
      success: true,
      message: '✅ Đã lưu cấu hình thông báo Zalo thành công!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    const empCode = session?.empCode || 'LT-001';
    const userName = session?.name || 'Cán bộ (Lễ Tân)';

    const body = await request.json();
    const { action, logId } = body;

    if (action === 'SIMULATE_GROUP') {
      const db = getDbBinding();
      const groupId = body.groupId || 'group_tbs_letan_2026';
      const groupName = body.groupName || 'Nhóm Zalo Bàn Lễ Tân TBS Group';
      const senderName = body.senderName || `${userName}`;
      const lastMessage = body.lastMessage || 'Bot ơi, cập nhật giúp lịch họp phòng VIP chiều nay!';

      if (db) {
        await ensureKaizenSchema(db);
        await db.prepare(`
          INSERT INTO zalo_captured_groups (group_chat_id, group_name, last_message, sender_name, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(group_chat_id) DO UPDATE SET
            group_name = excluded.group_name,
            last_message = excluded.last_message,
            sender_name = excluded.sender_name,
            updated_at = CURRENT_TIMESTAMP
        `).bind(groupId, groupName, lastMessage, senderName).run().catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `⚡ Đã mô phỏng bắt thành công Group Chat ID: ${groupId}`,
        groupId,
      });
    }

    if (action === 'CREATE_DEMO_LOGS') {
      const db = getDbBinding();
      if (db) {
        await ensureKaizenSchema(db);
        const demoLogs = [
          {
            id: `zlog_${Date.now()}_1`,
            event_type: 'ROOM_CHANGE_EMERGENCY',
            priority: 'EMERGENCY',
            recipient: empCode,
            chat_id: 'chat_zalo_889911',
            message: '🔴 [KHẨN CẤP]\nPhòng VIP 101 bị khóa bảo trì đột xuất! Đã tự động chuyển cuộc họp sang Phòng Họp WORK (Tầng 2).',
            status: 'SUCCESS',
            error: null,
          },
          {
            id: `zlog_${Date.now()}_2`,
            event_type: 'MEETING_CONFIRMED',
            priority: 'IMPORTANT',
            recipient: empCode,
            chat_id: 'group_tbs_letan_2026',
            message: '🟠 [QUAN TRỌNG]\nLễ Tân đã duyệt & xếp phòng: "Hop Giao Ban SKX Q4" tại Phòng Họp OTI (Tầng 3) - 09:30 15/08/2026.',
            status: 'SUCCESS',
            error: null,
          },
          {
            id: `zlog_${Date.now()}_3`,
            event_type: 'NEW_VISITOR_NOTICE',
            priority: 'NORMAL',
            recipient: empCode,
            chat_id: 'group_tbs_letan_2026',
            message: '🟢 [THÔNG THƯỜNG]\nĐã đăng ký đón khách: Nguyễn Văn An (Công ty Skechers VN) - Đón bởi Ban Quản Lý lúc 14:00.',
            status: 'SUCCESS',
            error: null,
          },
        ];

        for (const log of demoLogs) {
          await db.prepare(`
            INSERT INTO zalo_notification_logs (
              id, event_type, priority, recipient_emp_code, chat_id, message_text, status, error_detail, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            log.id, log.event_type, log.priority, log.recipient, log.chat_id, log.message, log.status, log.error
          ).run().catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        message: '⚡ Đã tạo 3 nhật ký thông báo Zalo mẫu thành công!',
      });
    }

    if (action === 'TEST') {
      const res = await sendZaloNotification(
        `🤖 THÔNG BÁO THỬ NHIỆM ZALO BOT\nThành viên: ${userName} (${empCode})\nThời gian gửi: ${new Date().toLocaleString('vi-VN')}\nHệ thống thông báo Zalo đang hoạt động bình thường!`,
        {
          priority: 'NORMAL',
          eventType: 'TEST_NOTIFICATION',
          recipientEmpCode: empCode,
        }
      );

      const db = getDbBinding();
      if (db) {
        await ensureKaizenSchema(db);
        const id = `zlog_${Date.now()}_test`;
        await db.prepare(`
          INSERT INTO zalo_notification_logs (
            id, event_type, priority, recipient_emp_code, chat_id, message_text, status, error_detail, created_at
          ) VALUES (?, 'TEST_NOTIFICATION', 'NORMAL', ?, 'chat_zalo_demo', ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          id,
          empCode,
          `🟢 [THÔNG THƯỜNG]\n🤖 THÔNG BÁO THỬ NHIỆM ZALO BOT\nThành viên: ${userName} (${empCode})\nThời gian gửi: ${new Date().toLocaleString('vi-VN')}`,
          res.success ? 'SUCCESS' : (res.status || 'SKIPPED_NO_TOKEN'),
          res.message || 'Gửi thử nghiệm hệ thống'
        ).run().catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: res.message || '✅ Đã ghi nhận nhật ký gửi thử Zalo!',
        detail: res,
      });
    }

    if (action === 'RETRY_LOG' && logId) {
      const db = getDbBinding();
      if (!db) {
        return NextResponse.json({ success: false, error: 'Database binding unavailable' }, { status: 400 });
      }

      await ensureKaizenSchema(db);
      const logItem: any = await db.prepare('SELECT * FROM zalo_notification_logs WHERE id = ?').bind(logId).first().catch(() => null);

      if (!logItem) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy nhật ký thông báo' }, { status: 440 });
      }

      const res = await sendZaloNotification(logItem.message_text.replace(/^🔴 \[KHẨN CẤP\]\n|^🟠 \[QUAN TRỌNG\]\n|^🟢 \[THÔNG THƯỜNG\]\n/, ''), {
        priority: logItem.priority as any,
        eventType: logItem.event_type,
        recipientEmpCode: logItem.recipient_emp_code,
        chatId: logItem.chat_id,
      });

      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

