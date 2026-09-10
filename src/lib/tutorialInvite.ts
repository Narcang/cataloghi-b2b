import type { AppLocale } from '@/lib/locale'

export type TutorialKind = 'agenzia' | 'rivenditori' | 'studio'

const TUTORIAL_FILES: Record<TutorialKind, Partial<Record<AppLocale, string>>> = {
  agenzia: {
    it: '/tutorial/tutorial-agenzia-it.pdf',
  },
  rivenditori: {
    it: '/tutorial/tutorial-rivenditori-it.pdf',
  },
  studio: {
    it: '/tutorial/tutorial-studio-it.pdf',
  },
}

export function tutorialKindForRuolo(ruolo: string | null | undefined): TutorialKind | null {
  if (!ruolo) return null
  if (ruolo === 'agenzia' || ruolo === 'agente' || ruolo === 'back_office') return 'agenzia'
  if (ruolo === 'rivenditore' || ruolo === 'distributore' || ruolo === 'partner_dipendente') {
    return 'rivenditori'
  }
  if (ruolo === 'studio') return 'studio'
  return null
}

/** PDF del tutorial per ruolo e lingua UI; se manca la lingua, usa l’italiano. */
export function tutorialPdfHref(
  ruolo: string | null | undefined,
  locale: AppLocale,
): string | null {
  const kind = tutorialKindForRuolo(ruolo)
  if (!kind) return null
  const files = TUTORIAL_FILES[kind]
  return files[locale] ?? files.it ?? null
}
