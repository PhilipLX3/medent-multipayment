import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const { username, password } = await request.json()

    if (username === process.env.BASIC_AUTH_USER &&
        password === process.env.BASIC_AUTH_PASSWORD) {
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false }, { status: 401 })
}
