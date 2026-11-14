/**
 * Ask Cloudinary for a resized, compressed copy of an image (smaller downloads on phones).
 * Only touches Cloudinary links; any other link is returned unchanged.
 *   cld(url, 'w_200,h_200,c_fill')  →  .../image/upload/f_auto,q_auto,w_200,h_200,c_fill/...
 */
export function cld(url: string | undefined | null, transform = ''): string | undefined {
  if (!url) return undefined
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) return url
  const t = ['f_auto', 'q_auto', transform].filter(Boolean).join(',')
  return url.replace('/image/upload/', `/image/upload/${t}/`)
}
