/**
 * Sardegna Luxury — Header search
 * File Wix: masterPage.js (codice sito / header globale)
 *
 * Elementi richiesti nell'header:
 *   - Text Input  → ID: headerSearchInput
 *   - Button      → ID: headerSearchButton
 */

import wixLocation from 'wix-location';

$w.onReady(() => {
  $w('#headerSearchButton').onClick(goToSearch);
  $w('#headerSearchInput').onKeyPress((event) => {
    if (event.key === 'Enter') goToSearch();
  });
});

function goToSearch() {
  const term = $w('#headerSearchInput').value.trim();
  if (!term) return;
  wixLocation.to(`/search-results?q=${encodeURIComponent(term)}`);
}
