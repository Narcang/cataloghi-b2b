export function sanitizeStorageFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function buildPdfStoragePath(userId: string, originalFileName: string): string {
  const sanitized = sanitizeStorageFileName(originalFileName)
  const base = sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`
  return `${userId}/${Date.now()}-${base}`
}

export function buildCoverStoragePath(userId: string, originalFileName: string): string {
  const sanitized = sanitizeStorageFileName(originalFileName)
  return `covers/${userId}/${Date.now()}-${sanitized}`
}

export function isValidUserPdfStoragePath(path: string, userId: string): boolean {
  if (path.includes('..') || path.includes('//')) return false
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}/\\d+-[a-zA-Z0-9._-]+\\.pdf$`, 'i').test(path)
}

export function isValidUserCoverStoragePath(path: string, userId: string): boolean {
  if (path.includes('..') || path.includes('//')) return false
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^covers/${escaped}/\\d+-[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]+$`).test(path)
}
