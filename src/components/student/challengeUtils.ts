export function safeParseOptions(json: string | null): Array<{ key: string; text: string }> {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    if (!Array.isArray(v)) return []
    return v
      .map((x) => {
        if (typeof x !== 'object' || x === null) return { key: '', text: '' }
        const r = x as Record<string, unknown>
        return {
          key: typeof r.key === 'string' ? r.key : String(r.key ?? ''),
          text: typeof r.text === 'string' ? r.text : String(r.text ?? ''),
        }
      })
      .filter((x) => x.key && x.text)
  } catch {
    return []
  }
}

