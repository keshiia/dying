/**
 * 漫画已读状态的本地缓存。
 *
 * 服务端才是事实源（`/api/student/comic-reads`），这里只是接口不可用时的
 * 退路 —— 列表页和阅读器都要读同一份缓存，所以抽出来共用，避免两边
 * key 拼得不一样。
 */

const storageKey = (userId: string) => `comic_read_${userId}`

export function readComicIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function writeComicIds(userId: string, ids: Iterable<string>): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...ids]))
  } catch {
    // 隐私模式下 localStorage 可能直接抛错，缓存失败不该影响阅读本身
  }
}
