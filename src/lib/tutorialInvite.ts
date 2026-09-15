import type { AppLocale } from '@/lib/locale'

export type TutorialKind = 'agenzia' | 'rivenditori' | 'studio'

const TUTORIAL_FILES: Record<TutorialKind, Partial<Record<AppLocale, string>>> = {
  agenzia: {
    it: '/tutorial/tutorial-agenzia-it.pdf',
    en: '/tutorial/tutorial-agenzia-en.pdf',
    es: '/tutorial/tutorial-agenzia-es.pdf',
    fr: '/tutorial/tutorial-agenzia-fr.pdf',
    el: '/tutorial/tutorial-agenzia-el.pdf',
  },
  rivenditori: {
    it: '/tutorial/tutorial-rivenditori-it.pdf',
    en: '/tutorial/tutorial-rivenditori-en.pdf',
    es: '/tutorial/tutorial-rivenditori-es.pdf',
    fr: '/tutorial/tutorial-rivenditori-fr.pdf',
    el: '/tutorial/tutorial-rivenditori-el.pdf',
  },
  studio: {
    it: '/tutorial/tutorial-studio-it.pdf',
    en: '/tutorial/tutorial-studio-en.pdf',
    es: '/tutorial/tutorial-studio-es.pdf',
    fr: '/tutorial/tutorial-studio-fr.pdf',
    el: '/tutorial/tutorial-studio-el.pdf',
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
