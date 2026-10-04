export function publicOrigin(value) {
  try {
    const url = new URL(value);
    if (
      /[;\s"'<>]/.test(url.hostname) ||
      url.protocol !== 'https:' ||
      url.origin !== value ||
      url.username ||
      url.password
    )
      return null;
    if (
      ['localhost', '[::1]', '0.0.0.0'].includes(url.hostname) ||
      /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) ||
      /\.(localhost|local)$/.test(url.hostname)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
