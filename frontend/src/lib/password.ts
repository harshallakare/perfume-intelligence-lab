import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 64 } as const

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, SCRYPT_PARAMS.dkLen, {
    N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p,
  }).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const hashBuf    = Buffer.from(hash, 'hex')
    const supplied   = scryptSync(plain, salt, SCRYPT_PARAMS.dkLen, {
      N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p,
    })
    return timingSafeEqual(hashBuf, supplied)
  } catch {
    return false
  }
}

/** Generate a human-readable recovery code like PIL-A3F2-B7C9 */
export function generateRecoveryCode(): string {
  const part = () => randomBytes(2).toString('hex').toUpperCase()
  return `PIL-${part()}-${part()}`
}
