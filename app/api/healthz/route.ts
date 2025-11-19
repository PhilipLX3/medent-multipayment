import { NextResponse } from 'next/server';

// accessible via /api/healthz
export function GET() {
    return NextResponse.json({ status: 'ok' }, { status: 200 });
}