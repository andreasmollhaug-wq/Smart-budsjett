import { createCipheriv, randomBytes } from 'crypto'

/**
 * Encrypt PSU id (e.g. Norwegian fødselsnummer) for x-psu-id header.
 * Format: base64(iv + ciphertext + authTag), AES-128-GCM.
 * @see https://docs.neonomics.io/docs/sensitive-end-user-data
 */
export function encryptPsuId(plaintext: string, rawValueBase64: string): string {
  const key = Buffer.from(rawValueBase64, 'base64')
  if (key.length !== 16) {
    throw new Error(`Forventet 16-byte AES-nøkkel, fikk ${key.length} byte`)
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-128-gcm', key, iv, { authTagLength: 16 })
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, enc, tag]).toString('base64')
}
