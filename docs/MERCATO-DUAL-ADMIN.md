# Admin dual-market (Italia + Russia)

## Architettura

| Componente | Italia | Russia |
|------------|--------|--------|
| Repo | `cataloghi-b2b` | `cataloghi-b2b-ru` |
| Supabase | Progetto IT | Progetto RU (separato) |
| Vercel | Deploy IT | Deploy RU |
| Login utenti | Progetto IT | Progetto RU |
| Login admin multi-mercato | Sito IT (sessione IT) | — |

Gli **admin** sul portale italiano possono scegliere quale mercato monitorare (cookie `admin_mercato`).

## Variabili ambiente (portale IT)

```env
# Mercato principale (Italia) — già presenti
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=

# Mercato Russia (solo server admin multi-mercato)
NEXT_PUBLIC_SUPABASE_URL_RU=
SUPABASE_SERVICE_ROLE_KEY_RU=
```

## UI

- `AdminMercatoSwitcher` in `/dashboard/gestione-utenti` e `/dashboard/gestione-cataloghi` (solo ruolo `admin`).
- Manager e agenzia operano sempre sul mercato IT.

## Codice chiave

- `src/lib/mercato.ts` — tipi e env
- `src/lib/mercatoServer.ts` — lettura cookie lato server
- `src/utils/supabase/market.ts` — client Supabase per mercato
- `src/lib/adminApiMercato.ts` — contesto auth IT + dati mercato
- `src/app/api/admin/mercato/route.ts` — API switch mercato

## Route admin già allineate al mercato

- Gestione utenti / cataloghi (pagine)
- `/api/admin/profili/update`, `delete`, `storico`, `specializzazione-opzioni`
- `/api/admin/cataloghi/*` (create, delete, status, cover, roles)

Altre route admin (permessi catalogo, inviti, crea-associato) usano ancora solo IT: estendere con `getAdminDataSupabase()` quando servirà gestione RU completa da IT.
