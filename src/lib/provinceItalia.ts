import province from '@/data/capoluoghiProvince.json'
import type { AreaCitta } from '@/lib/areaInteresse'

const PER_CAPOLUOGO = province as Record<string, AreaCitta>

function piega(testo: string): string {
  return testo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it')
}

/**
 * Se il nome è un capoluogo, il territorio è l’intera provincia
 * (Genova include Chiavari, Rapallo, Lavagna). Gli altri comuni restano il proprio confine.
 */
export function areaProvinciaCapoluogo(nome: string): AreaCitta | null {
  const area = PER_CAPOLUOGO[piega(nome.trim())]
  if (!area || (area.type !== 'Polygon' && area.type !== 'MultiPolygon')) return null
  return area
}
