import { NextResponse } from 'next/server';

const MOCK_PROJECTS = [
  {
    id: 'PROJ-01',
    code: 'PROJ-DIGITAL-2026',
    name: 'Chuyển Đổi Số SKECHERS 2026',
    description: 'Dự án số hóa toàn diện quy trình sản xuất, Gemba & MMTB Văn phòng chuỗi SKECHERS - TBS Group.',
    manager_emp_code: '202608001',
    manager_name: 'Phạm Nguyễn Anh Huy',
    status: 'IN_PROGRESS',
    progress: 75,
    members: [
      { empCode: '202608001', name: 'Phạm Nguyễn Anh Huy', department: 'IT_CDS', role: 'PROJECT_MANAGER' },
      { empCode: 'NS-001', name: 'Nguyễn Thị Lan Anh', department: 'NHAN_SU', role: 'MEMBER' },
      { empCode: 'QC-001', name: 'Bùi Thị Hằng', department: 'CHAT_LUONG_QC', role: 'MEMBER' },
      { empCode: 'KT-001', name: 'Trần Thị Thu Hương', department: 'KE_TOAN', role: 'MEMBER' },
    ],
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (projectId) {
      const proj = MOCK_PROJECTS.find((p) => p.id === projectId || p.code === projectId);
      if (!proj) return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
      return NextResponse.json({ success: true, project: proj });
    }

    return NextResponse.json({
      success: true,
      projects: MOCK_PROJECTS,
      count: MOCK_PROJECTS.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
