import { NextResponse } from 'next/server';
import { getAuthUser, isAccountantOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export const runtime = 'edge';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const body = await request.json();
    const { tripId, action, notes } = body;

    if (!tripId || !action) {
      return NextResponse.json({ success: false, error: 'Missing tripId or action' }, { status: 400 });
    }

    const trip = await db.prepare('SELECT id, creator, status, payment_status, invoices_json FROM business_trips WHERE id = ?').bind(tripId).first();
    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    const isCreator = trip.creator.includes(user.empCode);
    const isAccountant = isAccountantOrAdmin(user);

    let newStatus = trip.payment_status || 'NOT_STARTED';

    if (action === 'SUBMIT') {
      if (!isCreator) return NextResponse.json({ success: false, error: 'Chỉ người tạo đơn mới được gửi quyết toán' }, { status: 403 });
      if (trip.status !== 'APPROVED') return NextResponse.json({ success: false, error: 'Đơn chưa duyệt' }, { status: 400 });
      
      let invoices = [];
      try { invoices = JSON.parse(trip.invoices_json || '[]'); } catch(e){}
      if (invoices.length === 0 && !trip.signed_travel_paper_json) {
         return NextResponse.json({ success: false, error: 'Bạn phải đính kèm Hóa đơn hoặc Giấy đi đường trước khi gửi' }, { status: 400 });
      }

      newStatus = 'SUBMITTED';
    } 
    else if (action === 'ACCOUNTING_REVIEW') {
      if (!isAccountant) return NextResponse.json({ success: false, error: 'Chỉ kế toán' }, { status: 403 });
      newStatus = 'ACCOUNTING_REVIEW';
    }
    else if (action === 'REJECT') {
      if (!isAccountant) return NextResponse.json({ success: false, error: 'Chỉ kế toán' }, { status: 403 });
      if (!notes) return NextResponse.json({ success: false, error: 'Phải nhập lý do từ chối' }, { status: 400 });
      newStatus = 'REJECTED_DOCS';
    }
    else if (action === 'APPROVE') {
      if (!isAccountant) return NextResponse.json({ success: false, error: 'Chỉ kế toán' }, { status: 403 });
      newStatus = 'APPROVED_FOR_PAYMENT';
    }
    else if (action === 'PAY') {
      if (!isAccountant) return NextResponse.json({ success: false, error: 'Chỉ kế toán' }, { status: 403 });
      newStatus = 'PAID';
    }
    else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Update DB
    await db.prepare('UPDATE business_trips SET payment_status = ?, payment_notes = ? WHERE id = ?')
            .bind(newStatus, notes || trip.payment_notes || null, tripId)
            .run();

    // Determine notification message
    let notifTitle = "";
    let notifMessage = "";
    let notifTarget = "";

    if (newStatus === 'SUBMITTED') {
      notifTitle = "Thanh toán: Có đơn mới gửi quyết toán";
      notifMessage = `Đơn công tác "${trip.id.substring(0,6)}" vừa gửi chứng từ cho Kế toán.`;
      notifTarget = "KT-001"; // Or send to a role 'ACCOUNTANT' if the browserNotification supported role targets. For now, Kế Toán is KT-001.
    } else if (newStatus === 'REJECTED_DOCS') {
      notifTitle = "Thanh toán: Chứng từ bị từ chối";
      notifMessage = `Kế toán yêu cầu sửa lại chứng từ đơn "${trip.id.substring(0,6)}". Lý do: ${notes}`;
      notifTarget = trip.creator.split(" - ")[0];
    } else if (newStatus === 'PAID') {
      notifTitle = "Thanh toán: Đã chuyển khoản";
      notifMessage = `Kế toán đã chuyển khoản cho chuyến công tác "${trip.id.substring(0,6)}". Ghi chú: ${notes}`;
      notifTarget = trip.creator.split(" - ")[0];
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Đã cập nhật trạng thái', 
      newStatus,
      notify: notifTitle ? { title: notifTitle, message: notifMessage, targetUser: notifTarget, link: `/business-trip?id=${tripId}` } : null
    });
  } catch (err: any) {
    console.error("Payment status API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
