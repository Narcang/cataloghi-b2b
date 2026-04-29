import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CatalogPdfViewer from '@/components/CatalogPdfViewer'

export default async function CatalogoDetail({ params }: { params: Promise<{ catalogoId: string }> }) {
  const { catalogoId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch del catalogo (RLS: anon/authenticated free → solo attivi; agenti/manager secondo policy)
  const { data: catalogo, error } = await supabase
    .from('cataloghi')
    .select('*')
    .eq('id', catalogoId)
    .single()

  if (error || !catalogo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#fafafa]">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Accesso Negato o Non Trovato</h1>
        <p className="text-zinc-600 max-w-md">Il catalogo che stai cercando non esiste oppure non è disponibile per la tua area geografica.</p>
        <Link href="/">
          <Button className="mt-8 bg-[#060d41] text-white hover:bg-[#0a155a]" variant="default">Torna alla Dashboard</Button>
        </Link>
      </div>
    )
  }

  // Ospite / utente free: solo cataloghi pubblicati
  const catalogoNonPubblico = catalogo.stato_pubblicazione !== 'attivo'

  if (!user && catalogoNonPubblico) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#fafafa]">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Catalogo non disponibile</h1>
        <p className="text-zinc-600 max-w-md">Questo catalogo non è pubblico oppure non è accessibile senza account.</p>
        <Link href="/dashboard">
          <Button className="mt-8 bg-[#060d41] text-white hover:bg-[#0a155a]" variant="default">Torna ai cataloghi</Button>
        </Link>
      </div>
    )
  }

  if (user) {
    const { data: profiloCatalogo } = await supabase.from('profili').select('ruolo').eq('id', user.id).maybeSingle()
    const ruolo = profiloCatalogo?.ruolo ?? 'free'
    if (ruolo === 'free' && catalogoNonPubblico) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#fafafa]">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Catalogo non disponibile</h1>
          <p className="text-zinc-600 max-w-md">Con un accesso free puoi aprire solo cataloghi pubblicati (stato attivo).</p>
          <Link href="/dashboard">
            <Button className="mt-8 bg-[#060d41] text-white hover:bg-[#0a155a]" variant="default">Torna ai cataloghi</Button>
          </Link>
        </div>
      )
    }
  }

  // Costruzione della URL pubblica (Assumendo che il bucket si chiami 'cataloghi')
  const { data: publicUrlData } = supabase
    .storage
    .from('cataloghi')
    .getPublicUrl(catalogo.url_file)

  const proxiedPdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(publicUrlData.publicUrl)}`

  return (
    <div className="flex flex-col h-screen bg-white text-zinc-900">
      <header className="flex items-center p-3 bg-[#060d41] border-b border-black/20 shadow-md z-10 text-[#fafafa]">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-3 text-[#fafafa] hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5 text-[#fafafa]" />
          </Button>
        </Link>
        <div className="flex-1 truncate">
          <h1 className="text-base font-semibold truncate text-white">{catalogo.titolo}</h1>
          <p className="text-xs text-white/70">Area: {catalogo.area_geografica_target}</p>
        </div>
      </header>
      
      <main className="flex-1 relative overflow-hidden bg-zinc-100">
        <CatalogPdfViewer url={proxiedPdfUrl} title={catalogo.titolo} />
      </main>
    </div>
  )
}
