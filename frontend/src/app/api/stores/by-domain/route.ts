import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Deprecated endpoint. Use backend /api/store/resolve instead.' }, { status: 410 });
}
