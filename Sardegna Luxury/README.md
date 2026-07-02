# Sardegna Luxury — Ricerca custom Velo (Wix)

Progetto locale di riferimento per implementare la **barra di ricerca** sul sito [sardegnaluxury.com](https://www.sardegnaluxury.com/) via **Velo**, senza usare il plugin ufficiale Wix Site Search.

## Perché questa soluzione

Il Site Search nativo Wix:
- indicizza in modo lento/stale (mostrava pagine duplicate o non più visibili)
- gestisce male le **pagine dinamiche CMS** e il **multilingua**

Approccio scelto (**hybrid**):
- **Barche/gommoni** → query **live** sulla collezione CMS `Courses`
- **Pagine statiche** (servizi, destinazioni, contatti) → lista nel codice
- **Header** → input + bottone che porta a `/search-results?q=...`

## Dati CMS già verificati

| Cosa | Valore |
|------|--------|
| ID collezione | `Courses` |
| Nome visibile | Inflatable Boats for Rent Sardinia |
| Titolo barca | `title` |
| Link pagina dinamica | `link-courses-all` |

## Struttura cartella

```
Sardegna Luxury/
├── README.md              ← questo file
├── CHECKLIST.md           ← cosa resta da fare su Wix
├── SETUP.md               ← guida passo-passo nell'editor
└── velo/
    ├── masterPage.js      ← codice header (globale)
    └── search-results.js  ← codice pagina risultati
```

## Prossimo passo

Apri **`CHECKLIST.md`** e segui i punti in ordine nell'editor Wix.
