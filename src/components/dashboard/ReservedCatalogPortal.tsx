import Image from 'next/image'
import Link from 'next/link'

type ReservedCatalogPortalProps = {
  sectionId: string
  href: string
  iconSrc: string
  iconAlt: string
  caption: string
}

export default function ReservedCatalogPortal({
  sectionId,
  href,
  iconSrc,
  iconAlt,
  caption,
}: ReservedCatalogPortalProps) {
  return (
    <section id={sectionId} className="scroll-mt-32">
      <Link
        href={href}
        className="group flex max-w-md flex-col items-center gap-4 rounded-2xl border border-black bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-[#060d41] hover:shadow-[0_12px_40px_rgba(6,13,65,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
      >
        <div className="relative h-40 w-40 sm:h-48 sm:w-48">
          <Image
            src={iconSrc}
            alt={iconAlt}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="192px"
          />
        </div>
        <span className="text-center text-lg font-medium uppercase tracking-wide text-zinc-900 group-hover:text-[#060d41]">
          {caption}
        </span>
      </Link>
    </section>
  )
}
