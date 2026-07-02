# Guida setup — Ricerca Velo su Wix

## 1. Attivare Velo

1. Dashboard Wix → **Modifica sito**
2. Menu **Sviluppatore** → **Attiva Velo**
3. In basso compare il pannello codice

## 2. Impostare gli ID degli elementi

Ogni elemento Wix ha un **ID** usato nel codice (`$w('#headerSearchInput')`).

1. Clicca sull'elemento nell'editor
2. Pannello destro → **Impostazioni** → scorri fino a **ID elemento**
3. Inserisci l'ID indicato nella checklist (es. `headerSearchInput`)

> Gli ID sono case-sensitive: `headerSearchInput` ≠ `HeaderSearchInput`

## 3. Header — masterPage.js

1. Nel pannello Velo sinistro: **Pubblico** → **`masterPage.js`**
2. Incolla il codice da `velo/masterPage.js`
3. Salva

Il codice intercetta click e Invio sull'input e reindirizza a:

```
/search-results?q=TERMINE
```

Con Wix Multilingual il prefisso lingua (`/it/`, `/de/`) viene gestito automaticamente da `wixLocation.to()`.

## 4. Pagina search-results

### Creare la pagina

1. **Pagine e menu** → **+ Aggiungi pagina**
2. Nome suggerito: "Risultati ricerca" (solo per te)
3. **SEO / URL pagina** → slug: `search-results`

### Layout suggerito

```
┌─────────────────────────────────────┐
│  [searchTermText]                   │
│  Risultati per: "..."               │
├─────────────────────────────────────┤
│  [resultsRepeater]                  │
│  ┌───────────────────────────────┐  │
│  │ [itemType]  Barca / Pagina    │  │
│  │ [itemTitle]                   │  │
│  │ [itemDescription]             │  │
│  │ [itemLink] → Vedi             │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [noResults] — collapsed default    │
│  Nessun risultato trovato.          │
└─────────────────────────────────────┘
```

### Codice pagina

1. Seleziona la pagina `search-results` nell'editor
2. Tab codice in basso (nome pagina, es. `Search Results`)
3. Incolla `velo/search-results.js`

## 5. Come funziona la ricerca barche

- Query su collezione **`Courses`**
- Scarica fino a 1000 elementi (ce ne sono ~16)
- Filtra lato client su tutti i campi testuali (esclude link, ID, campi sistema)
- Link risultato: campo **`link-courses-all`** (pagina dinamica aggiornata)

## 6. Pagine statiche nel codice

La funzione `searchStaticPages` cerca in titolo, descrizione e parole chiave su voci del menu principale. **Aggiorna i `link:`** se gli slug reali del sito sono diversi.

Per trovare lo slug corretto: **Pagine** → pagina → **Impostazioni SEO** → URL pagina.

## 7. Test consigliati

| Ricerca | Atteso |
|---------|--------|
| `Joker` | Varie barche Joker Boat |
| `Cannigione` | Barche con porto Cannigione |
| `yacht` | Pagina Luxury Yachts for Charter |
| `helicopter` | Pagina Helicopter Tours |
| `xyz123` | Messaggio nessun risultato |

Testare in **anteprima** e in **lingua IT** e **EN**.
