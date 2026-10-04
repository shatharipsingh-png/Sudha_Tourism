// Compatibility cleanup for Phase 1 databases whose non-destructive seed
// intentionally leaves existing catalog rows unchanged. Only the known old
// development warning is removed; owner-authored content stays intact.
export function publicPackageInfo(info) {
  if (!info || !Array.isArray(info.important)) return info;
  return {...info, important:info.important.filter(value => value !== 'DEMO PRICES — edit before launch.')};
}
