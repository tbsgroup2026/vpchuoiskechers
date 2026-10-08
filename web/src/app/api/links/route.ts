import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dept = searchParams.get('dept') || 'finance';

    const appsScriptUrl = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbysvkyvGieeOtHLgLQCEXBvnG8tS9URcb5k_TkR1Hf-g7IOxgsXZNn7L8RkDaSISWBl0g/exec';
    const appsScriptKey = process.env.APPS_SCRIPT_KEY || 'TBS@2026!LinkSecure';

    const fetchUrl = `${appsScriptUrl}?action=get_links&k=${encodeURIComponent(appsScriptKey)}&dept=${encodeURIComponent(dept)}`;

    const res = await fetch(fetchUrl, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch links: ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('[Links API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
