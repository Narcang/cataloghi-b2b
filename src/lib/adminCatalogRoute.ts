import { resolveAdminDataContext } from '@/lib/adminApiMercato'
import { NextRequest, NextResponse } from 'next/server'

/** Helper per route admin cataloghi: auth IT, dati sul mercato selezionato. */
export async function requireAdminCatalogContext() {
  return resolveAdminDataContext({ requireAdmin: true })
}

export function redirectAdminCatalogMessage(request: NextRequest, message: string) {
  const url = new URL(`/dashboard/gestione-cataloghi?message=${encodeURIComponent(message)}`, request.url)
  return NextResponse.redirect(url, { status: 303 })
}
