import { NextResponse } from 'next/server';
import { getAuthUser, isReceptionistOrAdmin } from '@/lib/auth';

function getDb(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isReceptionistOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Lễ tân hoặc Admin' }, { status: 403 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'DB context not found' }, { status: 500 });
    }

    // Get all trips that passed Level 1 or need cancellation/unable handling by Receptionist
    const { results } = await db.prepare(
      `SELECT * FROM business_trips WHERE status IN ('APPROVED', 'PENDING_L2', 'REJECTED', 'RECALLED') OR logistics_status IN ('NOT_STARTED', 'PENDING', 'ARRANGED', 'UNABLE', 'CANCELLED', 'CANCELLED_HANDLED') ORDER BY start_date ASC`
    ).all();

    const formatted = (results || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      region: row.region,
      factory: row.factory,
      creator: row.creator,
      department: row.department,
      departmentId: row.department_id,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      daysCount: row.days_count,
      transport: row.transport,
      participantsCount: row.participants_count,
      purpose: row.purpose,
      address: row.address,
      proposalText: row.proposal_text,
      logisticsStatus: row.logistics_status || 'NOT_STARTED',
      status: row.status,
      estimatedCost: row.estimated_cost,
      version: row.version,
      approvedLevel: row.approved_level,
      rejectedLevel: row.rejected_level,
      rejectionReason: row.rejection_reason,
      budgetStatus: row.budget_status,
      budgetAmount: row.budget_amount,
      paymentStatus: row.payment_status,
      paymentNotes: row.payment_notes,
      createdAt: row.created_at,
      attachments_json: row.attachments_json,
      invoices_json: row.invoices_json,
      participants_json: row.participants_json,
      logistics_json: row.logistics_json,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isReceptionistOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Lễ tân hoặc Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { id, logisticsData } = body;

    if (!id || !logisticsData) {
      return NextResponse.json({ success: false, error: 'Missing id or logisticsData' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'DB context not found' }, { status: 500 });
    }

    const logisticsJson = JSON.stringify(logisticsData);
    const targetStatus = body.logisticsStatus || (body.cancellationHandled ? 'CANCELLED_HANDLED' : 'ARRANGED');

    const result = await db.prepare(
      `UPDATE business_trips 
       SET logistics_json = ?, logistics_status = ? 
       WHERE id = ?`
    ).bind(logisticsJson, targetStatus, id).run();

    if (!result.success) {
       return NextResponse.json({ success: false, error: 'Failed to update db' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật thông tin hậu cần thành công!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
