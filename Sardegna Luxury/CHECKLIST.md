# Checklist — ultime cose da fare su Wix

Segui in ordine. Spunta mentalmente ogni voce.

---

## Fase 1 — Header (barra ricerca globale)

- [ ] Apri l'**editor Wix** del sito Sardegna Luxury
- [ ] Attiva **Velo** (Sviluppatore → Attiva Velo)
- [ ] Modifica l'**Header** del sito (visibile su tutte le pagine)
- [ ] Aggiungi un **Text Input** → imposta ID elemento: `headerSearchInput`
- [ ] Aggiungi un **Button** (o icona lente) → imposta ID: `headerSearchButton`
- [ ] Nel pannello Velo apri **`masterPage.js`**
- [ ] Incolla il contenuto da `velo/masterPage.js` (sostituisci tutto se il file è vuoto)
- [ ] **Pubblica** o usa Anteprima

**Test:** digita "Joker" nell'header e premi Invio → deve aprire `/search-results?q=Joker` (o `/it/search-results?...` in italiano)

---

## Fase 2 — Pagina risultati

- [ ] Crea una **nuova pagina** nel sito
- [ ] Imposta lo **slug URL**: `search-results` (senza slash iniziale nelle impostazioni pagina)
- [ ] Aggiungi gli elementi con questi **ID esatti**:

| Elemento Wix | ID |
|--------------|-----|
| Text (titolo) | `searchTermText` |
| Repeater | `resultsRepeater` |
| Text dentro repeater (titolo risultato) | `itemTitle` |
| Text dentro repeater (descrizione) | `itemDescription` |
| Text dentro repeater (tipo: Barca/Pagina) | `itemType` |
| Button o Text cliccabile (link) | `itemLink` |
| Text "Nessun risultato" | `noResults` |

- [ ] Imposta `noResults` come **Collapsed** (nascosto) di default
- [ ] Nel pannello Velo apri il codice della pagina **search-results**
- [ ] Incolla il contenuto da `velo/search-results.js`
- [ ] **Pubblica** o Anteprima

**Test:** cerca "Cannigione", "Joker", "yacht" → devono comparire barche e/o pagine statiche

---

## Fase 3 — Ritocchi

- [ ] **Slug pagine statiche**: in `search-results.js` verifica che i `link:` nella funzione `searchStaticPages` coincidano con gli URL reali (Pagine → SEO di ogni pagina)
- [ ] **Descrizione barca**: se nei risultati manca la descrizione, apri il campo *Boat Short Description* → Modifica campo → copia **ID campo** e aggiorna `search-results.js` (vedi commento nel file)
- [ ] **Traduzioni**: testa la ricerca in **EN**, **IT**, **DE** — i risultati barche dovrebbero essere nella lingua attiva
- [ ] **Pagina duplicata**: rimuovi dal menu/footer la voce "Copia di Inflatable Boats for Rent..." se esiste ancora
- [ ] **Redirect 301**: verifica che i vecchi URL `/semirigidboatsrentsardinia` reindirizzino al nuovo (EN, IT, DE)

---

## Fase 4 — Opzionale (altre collezioni)

Se vuoi cercare anche **yacht**, **vela**, **ville**, ecc., servono query aggiuntive su altre collezioni CMS (stesso metodo usato per `Courses`). Aggiungi le Collection ID quando le hai.

---

## Problemi comuni

| Problema | Soluzione |
|----------|-----------|
| `wixData` sottolineato rosso | Aggiungi `import wixData from 'wix-data';` in cima al file **pagina**, non in file Public generici |
| Elemento non trovato | ID elemento in editor deve coincidere **esattamente** (maiuscole incluse) |
| Nessun risultato barche | Controlla che la collezione si chiami `Courses` e che gli elementi siano **Pubblicato** |
| Pagina 404 su search-results | Slug pagina deve essere `search-results` |
| Doppio `/it/it/` | Nei redirect Wix non scrivere `/it/` se la lingua del redirect è già impostata su italiano |

---

## Nota piano Wix

Il sito era oltre il limite elementi CMS (2499/1000). Verifica che il piano sia adeguato per form e nuovi elementi.
