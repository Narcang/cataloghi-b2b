import { Phone, MessageCircle, Mail } from 'lucide-react'

const RUOLO_LABEL: Record<string, string> = {
  agenzia:            'Agenzia',
  agente:             'Agente',
  distributore:       'Partner',
  studio:             'Studio',
  partner_dipendente: 'Partner Dip.',
  manager:            'Manager',
  admin:              'Admin',
}

const RUOLO_BADGE_CLASS: Record<string, string> = {
  agenzia:            'bg-amber-50 text-amber-800 border-amber-200',
  agente:             'bg-emerald-50 text-emerald-800 border-emerald-200',
  distributore:       'bg-blue-50 text-blue-800 border-blue-200',
  studio:             'bg-violet-50 text-violet-800 border-violet-200',
  partner_dipendente: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  manager:            'bg-zinc-100 text-zinc-700 border-zinc-300',
}

type Props = {
  nome: string | null
  email: string | null
  telefono: string | null
  ruolo?: string | null
}

export default function ContattoDirettoCard({ nome, email, telefono, ruolo }: Props) {
  const tel = telefono?.trim() || null
  const mail = email?.trim() || null
  const badgeClass = ruolo ? (RUOLO_BADGE_CLASS[ruolo] ?? 'bg-zinc-100 text-zinc-700 border-zinc-300') : null

  return (
    <div className="bg-white border border-black rounded-2xl p-6 pb-8 flex flex-col h-full shadow-lg">
      <div className="mb-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-medium text-zinc-900">{nome || 'Contatto Senza Nome'}</h3>
          {ruolo && badgeClass ? (
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
              {RUOLO_LABEL[ruolo] ?? ruolo}
            </span>
          ) : null}
        </div>
        {mail ? <p className="text-zinc-600 text-sm">{mail}</p> : null}
        {tel ? <p className="text-zinc-600 text-sm">{tel}</p> : null}
      </div>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        {tel ? (
          <>
            <a
              href={`tel:${tel}`}
              className="flex-1 min-w-[7rem] flex justify-center items-center gap-2 bg-[#060d41] text-white hover:bg-[#0a155a] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
            >
              <Phone size={16} /> Chiama
            </a>
            <a
              href={`https://wa.me/${tel.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[7rem] flex justify-center items-center gap-2 border border-black bg-zinc-50 hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] text-zinc-900 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </>
        ) : null}
        {mail ? (
          <a
            href={`mailto:${mail}`}
            className="ladiva-dashboard-btn-light flex-1 min-w-[7rem] flex justify-center items-center gap-2 border border-black bg-white text-black hover:bg-zinc-100 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
          >
            <Mail size={16} /> Scrivi
          </a>
        ) : null}
        {!tel && !mail ? (
          <>
            <span className="flex-1 flex justify-center items-center gap-2 bg-zinc-100 text-zinc-600 opacity-50 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-not-allowed">
              <Phone size={16} /> Chiama
            </span>
            <span className="flex-1 flex justify-center items-center gap-2 border border-black text-zinc-600 opacity-50 bg-zinc-50 py-2.5 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
              <MessageCircle size={16} /> WhatsApp
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}
