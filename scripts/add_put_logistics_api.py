import os

file_path = r'd:\Work\TBS II\web\src\app\api\business-trips\logistics\route.ts'

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

put_method = """
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

    const result = await db.prepare(
      `UPDATE business_trips 
       SET logistics_json = ?, logistics_status = 'ARRANGED' 
       WHERE id = ?`
    ).bind(logisticsJson, id).run();

    if (!result.success) {
       return NextResponse.json({ success: false, error: 'Failed to update db' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật thông tin hậu cần thành công!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
"""

if "export async function PUT" not in content:
    content += "\n" + put_method
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added PUT method to logistics API")
else:
    print("PUT method already exists")
