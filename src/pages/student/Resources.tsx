import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { apiFetch } from '@/utils/api'
import type { ResourceDetail, ResourceListItem, ResourceType } from '@/types'

const types: Array<{ value: ResourceType | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'LAW_SUMMARY', label: '法条摘要' },
  { value: 'CASE', label: '案例' },
  { value: 'VIDEO', label: '视频' },
  { value: 'ARTICLE', label: '文章' },
]

export default function Resources() {
  const [q, setQ] = useState('')
  const [type, setType] = useState<ResourceType | 'ALL'>('ALL')
  const [items, setItems] = useState<ResourceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ResourceDetail | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type !== 'ALL') params.set('type', type)
    const data = await apiFetch<{ success: true; resources: ResourceListItem[] }>(`/api/resources?${params.toString()}`)
    setItems(data.resources)
    setLoading(false)
  }, [q, type])

  useEffect(() => {
    void load()
  }, [load])

  const title = useMemo(() => {
    const t = types.find((x) => x.value === type)?.label ?? '全部'
    return `资源中心 · ${t}`
  }, [type])

  async function open(itemId: string) {
    setOpenId(itemId)
    setDetail(null)
    const data = await apiFetch<{ success: true; resource: ResourceDetail }>(`/api/resources/${itemId}`)
    setDetail(data.resource)
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold text-zinc-900">{title}</div>
            <div className="mt-1 text-sm text-zinc-600">按主题快速查找案例、法条摘要与可信链接。</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[220px]">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索资源标题" />
            </div>
            <Button variant="secondary" onClick={load}>
              搜索
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              className={
                type === t.value
                  ? 'rounded-full bg-[var(--p-accent)] text-white px-4 py-2 text-xs font-semibold'
                  : 'rounded-full bg-zinc-100 text-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-200'
              }
              onClick={() => {
                setType(t.value)
                setTimeout(() => void load(), 0)
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        {loading ? (
          <div className="animate-pulse grid gap-2">
            <div className="h-14 bg-zinc-100 rounded-2xl" />
            <div className="h-14 bg-zinc-100 rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-2">
            {items.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{r.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.tags.slice(0, 3).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => open(r.id)}>
                  查看
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!openId}
        title={detail ? detail.title : '资源详情'}
        onClose={() => {
          setOpenId(null)
          setDetail(null)
        }}
      >
        {!detail ? (
          <div className="text-sm text-zinc-600">加载中...</div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-2">
              {detail.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <div className="mt-3 text-xs text-zinc-500">作者：{detail.author}</div>
            {detail.contentUrl && (
              <div className="mt-3">
                <a className="text-sm font-semibold text-[var(--p-accent)] hover:underline" href={detail.contentUrl} target="_blank" rel="noreferrer">
                  打开链接
                </a>
              </div>
            )}
            {detail.contentMd && (
              <div className="mt-4 rounded-2xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-800 whitespace-pre-line">
                {detail.contentMd}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
