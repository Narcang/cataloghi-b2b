import wixData from 'wix-data';
import wixLocation from 'wix-location';

// Link pagina singola barca (colonna "Motorboot zum Mieten Sardinien")
const BOAT_LINK_FIELD = 'link-courses-title';

$w.onReady(async () => {
  $w('#resultsHtml').onClick((event) => {
    const target = event.target;
    if (typeof target !== 'string') return;

    if (target.startsWith('http')) {
      try {
        wixLocation.to(new URL(target).pathname.replace(/^\/website(?=\/)/, ''));
      } catch (e) { /* ignore */ }
    } else if (target.startsWith('/')) {
      wixLocation.to(target);
    }
  });

  const term = (wixLocation.query.q || '').trim();

  if (!term) {
    $w('#searchTermText').text = 'Inserisci un termine di ricerca';
    $w('#resultsHtml').collapse();
    return;
  }

  $w('#searchTermText').text = `Risultati per: "${term}"`;
  await runSearch(term);
});

async function runSearch(term) {
  const boatResults = await searchBoats(term);
  const pageResults = searchStaticPages(term);
  const all = [...boatResults, ...pageResults];

  if (all.length === 0) {
    $w('#resultsHtml').html = '<p>Nessun risultato trovato.</p>';
    $w('#resultsHtml').expand();
    return;
  }

  $w('#resultsHtml').html = all.map((item) => `
    <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #ddd;">
      <div style="font-size:12px;color:#666;margin-bottom:4px;">${escapeHtml(item.type)}</div>
      <div style="font-size:18px;font-weight:bold;margin-bottom:6px;">${escapeHtml(item.title)}</div>
      <div style="margin-bottom:8px;">${escapeHtml(item.description || '')}</div>
      <a href="${item.link}" style="color:#0066cc;text-decoration:underline;">Vedi →</a>
    </div>
  `).join('');

  $w('#resultsHtml').expand();
}

function toPath(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.startsWith('wix:')) return '';
    return value;
  }
  if (typeof value === 'object') {
    if (typeof value.path === 'string' && !value.path.startsWith('wix:')) return value.path;
    if (typeof value.url === 'string' && !value.url.startsWith('wix:')) return value.url;
  }
  return '';
}

function normalizePath(raw) {
  let path = toPath(raw);
  if (!path) return '';

  if (path.startsWith('http')) {
    try {
      path = new URL(path).pathname;
    } catch (e) {
      return '';
    }
  }

  if (!path.startsWith('/')) path = `/${path}`;

  while (path.startsWith('/website/')) {
    path = path.substring('/website'.length);
  }

  return path;
}

function pageUrl(raw) {
  const path = normalizePath(raw);
  if (!path) return '#';
  return wixLocation.baseUrl.replace(/\/$/, '') + path;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function searchBoats(term) {
  const t = term.toLowerCase();
  const res = await wixData.query('Courses').limit(1000).find();

  const matches = res.items.filter((item) =>
    Object.keys(item).some((key) => {
      if (key.startsWith('_') || key.startsWith('link') || key === 'ID') return false;
      const val = item[key];
      if (typeof val !== 'string') return false;
      if (val.startsWith('/') || val.startsWith('http') || val.startsWith('wix:')) return false;
      return val.toLowerCase().includes(t);
    })
  );

  return matches.map((b) => ({
    type: 'Barca',
    title: b.title || 'Barca',
    description: b.description || '',
    link: pageUrl(b[BOAT_LINK_FIELD]),
  }));
}

function searchStaticPages(term) {
  const t = term.toLowerCase();
  const pages = [
    { title: 'Luxury Yachts for Charter', description: 'Noleggio yacht di lusso', link: '/luxury-yachts-for-charter', keywords: 'yacht charter lusso aquila' },
    { title: 'Sailing Yachts and Catamarans', description: 'Barche a vela e catamarani', link: '/sailing-yachts-and-catamarans', keywords: 'vela catamarani sailing' },
    { title: 'Luxury Water Toys', description: 'Giochi acquatici', link: '/luxury-water-toys', keywords: 'water toys giochi acquatici' },
    { title: 'Luxury Villa Rent', description: 'Ville di lusso in affitto', link: '/luxury-villa-rent', keywords: 'villa ville affitto' },
    { title: 'Luxury Cars and Transfer Services', description: 'Auto di lusso e transfer', link: '/luxury-cars-and-transfer', keywords: 'auto car transfer' },
    { title: 'Private Guide Tours', description: 'Tour con guida privata', link: '/private-guide-tours', keywords: 'guida tour' },
    { title: 'Helicopter Tours', description: 'Tour in elicottero', link: '/helicopter-tours', keywords: 'elicottero helicopter' },
    { title: 'Private Jet Charters', description: 'Noleggio jet privati', link: '/private-jet-charters', keywords: 'jet aereo' },
    { title: 'Events and Fun', description: 'Eventi e divertimento', link: '/events-and-fun', keywords: 'eventi fun party' },
    { title: 'Sardinia North', description: 'Destinazione Sardegna Nord', link: '/sardinia-north', keywords: 'sardegna nord costa smeralda' },
    { title: 'Costa Baunei - Golfo Orosei', description: 'Destinazione Golfo Orosei', link: '/golfo-orosei', keywords: 'baunei orosei cala gonone' },
    { title: 'Sardinia South', description: 'Destinazione Sardegna Sud', link: '/sardinia-south', keywords: 'sardegna sud' },
    { title: 'Amalfi Coast', description: 'Costiera Amalfitana', link: '/amalfi-coast', keywords: 'amalfi costiera' },
    { title: 'Tuscany Archipelago', description: 'Arcipelago Toscano', link: '/tuscany-archipelago', keywords: 'toscana arcipelago elba' },
    { title: 'Contact', description: 'Contatti', link: '/contact', keywords: 'contatti contact email telefono' },
  ];

  return pages
    .filter((p) => (`${p.title} ${p.description} ${p.keywords}`).toLowerCase().includes(t))
    .map((p) => ({
      type: 'Pagina',
      title: p.title,
      description: p.description,
      link: pageUrl(p.link),
    }));
}
