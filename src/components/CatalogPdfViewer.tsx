'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type CatalogPdfViewerProps = {
  url: string
  title: string
}

const TOOLBAR_H = 52

export default function CatalogPdfViewer({ url, title }: CatalogPdfViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [pageNatural, setPageNatural] = useState<{ w: number; h: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setCurrentPage(1)
    setNumPages(0)
    setPageNatural(null)
  }, [url])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerWidth(Math.floor(width))
      setContainerHeight(Math.floor(height))
    })
    ro.observe(el)
    setContainerWidth(Math.floor(el.clientWidth))
    setContainerHeight(Math.floor(el.clientHeight))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (numPages <= 0) return
    setCurrentPage((p) => Math.min(Math.max(1, p), numPages))
  }, [numPages])

  const onPageLoadSuccess = useCallback((page: { getViewport: (opts: { scale: number }) => { width: number; height: number } }) => {
    const v = page.getViewport({ scale: 1 })
    setPageNatural({ w: v.width, h: v.height })
  }, [])

  const pageWidth = useMemo(() => {
    if (containerWidth <= 0 || containerHeight <= 0) return undefined
    const availW = containerWidth - 24
    const availH = Math.max(120, containerHeight - TOOLBAR_H - 24)
    if (pageNatural && pageNatural.w > 0 && pageNatural.h > 0) {
      const scale = Math.min(availW / pageNatural.w, availH / pageNatural.h)
      return Math.max(120, Math.floor(pageNatural.w * scale))
    }
    const aspect = 595 / 842
    return Math.max(120, Math.floor(Math.min(availW, availH * aspect)))
  }, [containerWidth, containerHeight, pageNatural])

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentPage((p) => (numPages > 0 ? Math.min(numPages, p + 1) : p))
  }, [numPages])

  const goFirst = useCallback(() => setCurrentPage(1), [])
  const goLast = useCallback(() => {
    setCurrentPage((p) => (numPages > 0 ? numPages : p))
  }, [numPages])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goFirst()
      } else if (e.key === 'End') {
        e.preventDefault()
        goLast()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, goFirst, goLast])

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return
    const x = e.changedTouches[0]?.clientX
    if (x == null) return
    const dx = x - touchStartX.current
    touchStartX.current = null
    if (dx < -56) goNext()
    else if (dx > 56) goPrev()
  }

  const canPrev = currentPage > 1
  const canNext = numPages > 0 && currentPage < numPages

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-0 w-full flex-col bg-zinc-950 text-zinc-100"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label={title}
    >
      <div
        className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center gap-1 border-b border-white/10 bg-black/50 px-2 backdrop-blur-sm sm:gap-2"
        style={{ height: TOOLBAR_H }}
      >
        <button
          type="button"
          onClick={goFirst}
          disabled={!canPrev}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 disabled:opacity-30 sm:h-11 sm:w-11"
          aria-label="Prima pagina"
        >
          <ChevronsLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 disabled:opacity-30 sm:h-11 sm:w-11"
          aria-label="Pagina precedente"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <span className="min-w-[4.5rem] rounded-md border border-white/20 bg-black/40 px-2 py-1 text-center text-xs font-medium tabular-nums sm:min-w-[5.5rem] sm:text-sm">
          {numPages > 0 ? `${currentPage} / ${numPages}` : '—'}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 disabled:opacity-30 sm:h-11 sm:w-11"
          aria-label="Pagina successiva"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={goLast}
          disabled={!canNext}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 disabled:opacity-30 sm:h-11 sm:w-11"
          aria-label="Ultima pagina"
        >
          <ChevronsRight className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        style={{ paddingTop: TOOLBAR_H }}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex h-48 items-center justify-center text-zinc-400">Caricamento catalogo…</div>
          }
          error={
            <div className="flex h-48 items-center justify-center text-red-400">Impossibile caricare il PDF.</div>
          }
        >
          {numPages > 0 && pageWidth ? (
            <Page
              key={`${url}-${currentPage}`}
              pageNumber={currentPage}
              width={pageWidth}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-2xl"
            />
          ) : null}
        </Document>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between"
        style={{ top: TOOLBAR_H }}
      >
        {canPrev ? (
          <button
            type="button"
            onClick={goPrev}
            className="pointer-events-auto flex h-[min(48vh,220px)] w-11 shrink-0 items-center justify-center bg-gradient-to-r from-black/65 to-transparent text-white/95 transition hover:from-black/80 sm:w-14"
            aria-label="Pagina precedente"
          >
            <ChevronLeft className="h-10 w-10 drop-shadow-md sm:h-12 sm:w-12" strokeWidth={1.25} />
          </button>
        ) : (
          <span className="w-11 sm:w-14" aria-hidden />
        )}
        {canNext ? (
          <button
            type="button"
            onClick={goNext}
            className="pointer-events-auto flex h-[min(48vh,220px)] w-11 shrink-0 items-center justify-center bg-gradient-to-l from-black/65 to-transparent text-white/95 transition hover:from-black/80 sm:w-14"
            aria-label="Pagina successiva"
          >
            <ChevronRight className="h-10 w-10 drop-shadow-md sm:h-12 sm:w-12" strokeWidth={1.25} />
          </button>
        ) : (
          <span className="w-11 sm:w-14" aria-hidden />
        )}
      </div>

      <span className="sr-only">{title}</span>
    </div>
  )
}
