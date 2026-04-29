export function writeCookie(
  name: 'flowstate-theme' | 'flowstate-currency',
  value: string
): void {
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
