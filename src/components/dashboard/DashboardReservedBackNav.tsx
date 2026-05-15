import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type DashboardReservedBackNavProps = {
  /** Es. "area riservata partner" (minuscolo) */
  areaLabel: string
}

export default function DashboardReservedBackNav({ areaLabel }: DashboardReservedBackNavProps) {
  return (
    <p className="mb-6 flex flex-wrap items-center gap-x-2 text-sm font-medium lowercase text-zinc-600">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 transition-colors hover:text-[#060d41]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span>torna alla dashboard</span>
      </Link>
      <span>{areaLabel}</span>
    </p>
  )
}
