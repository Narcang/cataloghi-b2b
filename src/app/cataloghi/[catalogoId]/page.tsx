import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function CatalogoDetail({ params }: { params: Promise<{ catalogoId: string }> }) {
  const { catalogoId } = await params
  const supabase = await createClient()

  // Controllo sessione
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch del catalogo (RLS impedisce l'accesso se non autorizzato)
  const { data: catalogo, error } = await supabase
    .from('cataloghi')
    .select('*')
    .eq('id', catalogoId)
    .single()

  if (error || !catalogo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-zinc-50 dark:bg-zinc-950">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Accesso Negato o Non Trovato</h1>
        <p className="text-muted-foreground max-w-md">Il catalogo che stai cercando non esiste oppure non è disponibile per la tua area geografica.</p>
        <Link href="/">
          <Button className="mt-8" variant="default">Torna alla Dashboard</Button>
        </Link>
      </div>
    )
  }

  // Costruzione della URL pubblica (Assumendo che il bucket si chiami 'cataloghi')
  const { data: publicUrlData } = supabase
    .storage
    .from('cataloghi')
    .getPublicUrl(catalogo.url_file)

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center p-3 bg-zinc-900 border-b border-zinc-800 shadow-md z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-3 text-zinc-300 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 truncate">
          <h1 className="text-base font-semibold truncate">{catalogo.titolo}</h1>
          <p className="text-xs text-zinc-400">Area: {catalogo.area_geografica_target}</p>
        </div>
      </header>
      
      {/* 
        Utilizziamo un iframe nativo come player PDF per la Fase 1: 
        E' la soluzione più stabile su iPad/Tablet Android per preservare 
        il pinch-to-zoom vettoriale fluido nativo senza sgranature.
      */}
      <main className="flex-1 relative overflow-hidden bg-zinc-800">
         <iframe 
           src={`${publicUrlData.publicUrl}#toolbar=0&navpanes=0`} 
           className="w-full h-full border-0"
           title={catalogo.titolo}
           allowFullScreen
         />
      </main>
    </div>
  )
}
