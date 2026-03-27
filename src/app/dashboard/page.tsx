import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Phone, MessageCircle } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Recupera i dati del profilo
  const { data: profilo } = await supabase
    .from('profili')
    .select('id, nome_completo, ruolo, area_geografica')
    .eq('id', user.id)
    .single()

  // Recupera i cataloghi (RLS attivo)
  const { data: cataloghi, error: cataloghiError } = await supabase
    .from('cataloghi')
    .select('*')
    .order('creato_il', { ascending: false })

  // Recupera fornitori associati a questo agente
  const { data: fornitoriRaw } = await supabase
    .from('connessioni_agente_fornitore')
    .select(`
      fornitore:profili!fornitore_id (
        id,
        nome_completo,
        telefono,
        email
      )
    `)
    .eq('agente_id', user.id)

  const fornitori = fornitoriRaw?.map((f: any) => f.fornitore) || []

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <header className="mb-8 flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalogo Digitale B2B</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Bentornato {profilo?.nome_completo || user.email}
            {profilo?.area_geografica ? ` (Area: ${profilo.area_geografica})` : ''} 
            {profilo?.ruolo === 'admin' ? <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 border-emerald-200">Admin</span> : ''}
          </p>
        </div>
        <form action="/auth/signout" method="post">
           <Button variant="outline" type="submit">Esci dal Portale</Button>
        </form>
      </header>

      <main className="space-y-12">
        {/* SEZIONE CATALOGHI */}
        <section id="cataloghi">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">I Tuoi Cataloghi</h2>
          </div>
          
          {cataloghiError ? (
            <div className="text-red-500 font-medium">Errore nel caricamento: {cataloghiError.message}</div>
          ) : cataloghi && cataloghi.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cataloghi.map((catalogo) => (
                <Card key={catalogo.id} className="flex flex-col shadow-sm border overflow-hidden">
                  <CardHeader className="bg-zinc-100/50 dark:bg-zinc-800/50 pb-4">
                    <CardTitle className="text-xl leading-tight">{catalogo.titolo}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground border-y border-dashed">
                      <span className="text-sm font-medium px-4 text-center">
                        Documento PDF
                        <br />
                        <span className="text-xs font-normal text-zinc-400 mt-1 block">{(catalogo.url_file || '').split('/').pop()}</span>
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Link href={`/cataloghi/${catalogo.id}`} className="w-full">
                      <Button className="w-full font-medium">Sfoglia Catalogo</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-white dark:bg-zinc-900 h-48">
              <h3 className="text-lg font-semibold">Nessun catalogo disponibile</h3>
              <p className="max-w-sm text-sm text-muted-foreground mt-2">
                {profilo?.ruolo === 'admin' 
                  ? "Non ci sono cataloghi pubblicati nel database."
                  : "Non ci sono cataloghi attivi disponibili per la tua area in questo momento."}
              </p>
            </div>
          )}
        </section>

        {/* SEZIONE CONTATTI RAPIDI (FORNITORI / AGENTI) */}
        <section id="contatti">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">I Tuoi Contatti Diretti</h2>
          </div>
          
          {fornitori && fornitori.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {fornitori.map((fornitore: any) => (
                <Card key={fornitore.id} className="flex flex-col shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{fornitore.nome_completo || 'Fornitore Senza Nome'}</CardTitle>
                    <CardDescription>{fornitore.email}</CardDescription>
                  </CardHeader>
                  <CardFooter className="gap-2 flex-wrap">
                    {fornitore.telefono ? (
                      <>
                        <a href={`tel:${fornitore.telefono?.trim()}`} className="flex-1">
                          <Button variant="default" className="w-full">
                            <Phone className="w-4 h-4 mr-2" /> Chiama
                          </Button>
                        </a>
                        <a href={`https://wa.me/${fornitore.telefono?.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900 dark:text-green-500">
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                          </Button>
                        </a>
                      </>
                    ) : (
                      <>
                        <Button variant="default" className="flex-1" disabled>
                          <Phone className="w-4 h-4 mr-2" /> Chiama
                        </Button>
                        <Button variant="outline" className="flex-1" disabled>
                          <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center border rounded-xl border-dashed bg-white dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">
                Non hai ancora nessun fornitore assegnato in rubrica.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
