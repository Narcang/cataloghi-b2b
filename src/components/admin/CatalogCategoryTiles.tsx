import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  FileArchive,
  FileText,
  LayoutDashboard,
  Presentation,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { categoryDisplayLabel, categoryPhotoTile, categoryToSlug } from '@/lib/catalogCategories'
import { gestioneCataloghiHref } from '@/lib/catalogNavigation'
import { tCatalogCount, tAdmin } from '@/lib/i18nAdmin'
import type { AppLocale } from '@/lib/locale'

const CATEGORY_FALLBACK_ICON: Record<string, LucideIcon> = {
  'File 2D': FileText,
  'File 3D': FileArchive,
  Listini: BookOpen,
  Agenti: Users,
  Scontistiche: BookOpen,
  'Power Point': Presentation,
  Partner: Users,
  Studio: LayoutDashboard,
  'Listini Netti': BookOpen,
}

function fallbackIcon(categoria: string): LucideIcon {
  return CATEGORY_FALLBACK_ICON[categoria] ?? LayoutDashboard
}

export default function CatalogCategoryTiles({
  categorie,
  counts,
  lingua,
  nome,
  locale,
}: {
  categorie: string[]
  counts: Record<string, number>
  lingua: string
  nome: string
  locale: AppLocale
}) {
  const copy = tAdmin(locale)

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 list-none p-0 m-0">
      {categorie.map((categoria) => {
        const photo = categoryPhotoTile(categoria)
        const Icon = fallbackIcon(categoria)
        const count = counts[categoria] ?? 0
        const href = gestioneCataloghiHref({
          lingua,
          nome,
          categoriaSlug: categoryToSlug(categoria),
        })
        return (
          <li key={categoria}>
            <Link
              href={href}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm"
            >
              <div className="relative aspect-square overflow-hidden bg-zinc-900 border border-white/10 shadow-sm">
                {photo ? (
                  <Image
                    src={photo}
                    alt={categoryDisplayLabel(categoria)}
                    fill
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <Icon
                      size={48}
                      strokeWidth={1.25}
                      className="text-white/80 transition-transform duration-300 group-hover:scale-105"
                      aria-hidden
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 flex w-full items-baseline justify-between gap-2">
                <p className="min-w-0 text-left text-sm sm:text-base uppercase leading-snug text-zinc-100 tracking-wide font-medium truncate">
                  {categoryDisplayLabel(categoria)}
                </p>
                <p className="shrink-0 text-xs sm:text-sm uppercase leading-snug text-red-500">
                  {tCatalogCount(locale, count)}
                </p>
              </div>
              <span className="sr-only">{copy.apriCategoria}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
