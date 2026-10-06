import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin, isReceptionistOrAdmin, isAccountantOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export const runtime = 'edge';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'DB not found' }, { status: 500 });

    await ensureKaizenSchema(db);

    const trip = await db.prepare('SELECT * FROM business_trips WHERE id = ?').bind(params.id).first();
    if (!trip) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const isExec = isExecutiveOrAdmin(user);
    const isAdmin = user.roles?.includes('admin');
    const isRecep = isReceptionistOrAdmin(user);
    const isKeToan = user.roles?.includes('ke_toan');
    const isTP = user.roles?.includes('truong_phong') || user.is_department_head;

    const hasAccess = (() => {
       if (isExec || isAdmin || isRecep) return true;
       if (isKeToan) return ['APPROVED', 'FINISHED'].includes(trip.status) || trip.payment_status !== 'NOT_STARTED';
       if (isTP) return trip.department_id === user.departmentCode || trip.creator_emp_code === user.empCode;
       return trip.creator_emp_code === user.empCode || (trip.participants_json && trip.participants_json.includes(user.empCode));
    })();

    if (!hasAccess) return NextResponse.json({ success: false, error: 'Forbidden: Bạn không có quyền xem đơn công tác này.' }, { status: 403 });

    // Fetch related files from trip_files table if any
    const files = await db.prepare('SELECT * FROM trip_files WHERE trip_id = ? ORDER BY created_at ASC').bind(params.id).all();

    // Map files to trip
    let invoices = [];
    let attachments = [];
    if (trip.invoices_json) {
       try { invoices = JSON.parse(trip.invoices_json); } catch(e){}
    }
    if (trip.attachments_json) {
       try { attachments = JSON.parse(trip.attachments_json); } catch(e){}
    }

    // Append files from R2 table
    if (files.results) {
       files.results.forEach((f: any) => {
          if (f.file_type === 'INVOICE') {
             invoices.push({
                id: f.id,
                name: f.original_name,
                fileUrl: `/api/files/${f.id}`,
                amount: 0,
                date: f.created_at.split(' ')[0],
                category: 'OTHER'
             });
          } else if (f.file_type === 'ATTACHMENT') {
             attachments.push({
                id: f.id,
                name: f.original_name,
                fileData: `/api/files/${f.id}`
             });
          }
       });
    }

    const data = {
      id: trip.id,
      code: trip.code,
      title: trip.title,
      region: trip.region,
      factory: trip.factory,
      creator: trip.creator,
      department: trip.department,
      location: trip.location,
      startDate: trip.start_date,
      endDate: trip.end_date,
      daysCount: trip.days_count,
      transport: trip.transport,
      participantsCount: trip.participants_count,
      purpose: trip.purpose,
      address: trip.address,
      proposalText: trip.proposal_text,
      attachments,
      invoices,
      participants: trip.participants_json ? JSON.parse(trip.participants_json) : [],
      destinations: trip.destinations_json ? JSON.parse(trip.destinations_json) : [],
      status: trip.status,
      estimatedCost: trip.estimated_cost,
      version: trip.version,
      budgetStatus: trip.budget_status,
      logistics: trip.logistics_json ? JSON.parse(trip.logistics_json) : null,
      logisticsStatus: trip.logistics_status,
      paymentStatus: trip.payment_status,
      signedTravelPaper: trip.signed_travel_paper_json ? JSON.parse(trip.signed_travel_paper_json) : null,
      paymentNotes: trip.payment_notes,
      tripType: trip.trip_type,
      createdAt: trip.created_at
    };

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
