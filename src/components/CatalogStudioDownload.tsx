'use client'

import { Download, FileArchive } from 'lucide-react'

type CatalogStudioDownloadProps = {
  catalogoId: string
  titolo: string
}

export default function CatalogStudioDownload({ catalogoId, titolo }: CatalogStudioDownloadProps) {
  const downloadHref = `/api/cataloghi/${catalogoId}/download`

  return (
    <div className="flex h-full min-h-[min(70vh,32rem)] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <FileArchive className="h-10 w-10 text-[#060d41]" aria-hidden />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-zinc-900">{titolo}</h2>
      <p className="mb-8 max-w-md text-sm text-zinc-600">
        Pacchetto riservato alla linea Studio (archivio ZIP, max 15 MB). Scarica il file sul tuo dispositivo per
        consultarlo offline.
      </p>
      <a
        href={downloadHref}
        download
        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#060d41] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a155a]"
      >
        <Download className="mr-2 h-4 w-4" aria-hidden />
        Scarica archivio ZIP
      </a>
    </div>
  )
}
