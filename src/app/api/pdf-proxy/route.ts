import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url')
  if (!sourceUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
  }

  const supabaseHost = new URL(supabaseUrl).host
  if (parsedUrl.host !== supabaseHost) {
    return NextResponse.json({ error: 'Forbidden host' }, { status: 403 })
  }

  const upstream = await fetch(parsedUrl.toString(), {
    headers: {
      accept: 'application/pdf,*/*',
    },
    cache: 'no-store',
  })

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Failed to fetch pdf: ${upstream.status}` },
      { status: upstream.status }
    )
  }

  const bytes = await upstream.arrayBuffer()
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'cache-control': 'private, max-age=60',
    },
  })
}
