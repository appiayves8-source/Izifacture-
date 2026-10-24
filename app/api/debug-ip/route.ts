import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json({
      success: true,
      server_ip: data.ip,
      raw: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
