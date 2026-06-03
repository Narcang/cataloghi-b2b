export function sanitizeStorageFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function buildPdfStoragePath(userId: string, originalFileName: string): string {
  const sanitized = sanitizeStorageFileName(originalFileName)
  const base = sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`
  return `${userId}/${Date.now()}-${base}`
}

export function buildZipStoragePath(userId: string, originalFileName: string): string {
  const sanitized = sanitizeStorageFileName(originalFileName)
  const base = sanitized.toLowerCase().endsWith('.zip') ? sanitized : `${sanitized}.zip`
  return `${userId}/${Date.now()}-${base}`
}

export function buildCoverStoragePath(userId: string, originalFileName: string): string {
  const sanitized = sanitizeStorageFileName(originalFileName)
  return `covers/${userId}/${Date.now()}-${sanitized}`
}

/**
 * Controlla che il path sia nella cartella dell'utente, non contenga
 * path traversal e termini con l'estensione attesa.
 * Non vincoliamo i caratteri del nome file: li ha già sanitizzati il client
 * e `assertStorageFileExists` lato server verifica l'esistenza reale.
 */
function isValidUserStoragePath(
  path: string,
  userId: string,
  ext: '.pdf' | '.zip',
): boolean {
  if (!path || path.includes('..') || path.includes('//') || path.includes('\0')) return false
  if (!path.startsWith(`${userId}/`)) return false
  // Struttura attesa: {userId}/{timestamp}-{filename}.{ext}
  const afterUserId = path.slice(userId.length + 1)
  const dashIdx = afterUserId.indexOf('-')
  if (dashIdx < 1) return false
  const ts = afterUserId.slice(0, dashIdx)
  if (!/^\d+$/.test(ts)) return false
  return afterUserId.toLowerCase().endsWith(ext)
}

export function isValidUserPdfStoragePath(path: string, userId: string): boolean {
  return isValidUserStoragePath(path, userId, '.pdf')
}

export function isValidUserZipStoragePath(path: string, userId: string): boolean {
  return isValidUserStoragePath(path, userId, '.zip')
}

export function isValidUserCoverStoragePath(path: string, userId: string): boolean {
  if (path.includes('..') || path.includes('//')) return false
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^covers/${escaped}/\\d+-[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]+$`).test(path)
}
