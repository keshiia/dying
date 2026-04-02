import { useCallback, useEffect, useMemo, useState } from 'react'
import { Scale } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { apiFetch } from '@/utils/api'
import type { ResourceDetail, ResourceListItem, ResourceType } from '@/types'
import { legalChecklist, legalTips } from '@/data/legalContent'

type ToolCategory = 'ALL' | 'HELP' | 'REPORT' | 'SEARCH' | 'VERIFY'

const types: Array<{ value: ResourceType | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'LAW_SUMMARY', label: '法条摘要' },
  { value: 'CASE', label: '案例' },
  { value: 'ARTICLE', label: '工具' },
]

const toolCategories: Array<{ value: Exclude<ToolCategory, 'ALL'>; label: string; hint: string }> = [
  { value: 'HELP', label: '求助', hint: '法律咨询与热线' },
  { value: 'REPORT', label: '举报', hint: '投诉、举报与维权' },
  { value: 'SEARCH', label: '查询', hint: '法条、文书与庭审' },
  { value: 'VERIFY', label: '辟谣', hint: '信息核验与防误导' },
]

const sceneFilters: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: '全部场景' },
  { value: '校园安全', label: '校园冲突' },
  { value: '网络法治', label: '网暴诈骗' },
  { value: '消费者权益', label: '消费纠纷' },
  { value: '交通安全', label: '交通事故' },
  { value: '禁毒教育', label: '禁毒防诱导' },
]

const actionLabelByType: Record<ResourceType, string> = {
  LAW_SUMMARY: '看法条',
  CASE: '看案例',
  VIDEO: '看视频',
  ARTICLE: '打开工具',
}

const toolCategoryLabelMap: Record<ToolCategory, string> = {
  ALL: '全部工具',
  HELP: '求助',
  REPORT: '举报',
  SEARCH: '查询',
  VERIFY: '辟谣',
}

const toolCategoryById: Record<string, Exclude<ToolCategory, 'ALL'>> = {
  'res-4': 'HELP',
  'res-tool-01': 'SEARCH',
  'res-tool-02': 'HELP',
  'res-tool-03': 'REPORT',
  'res-tool-04': 'REPORT',
  'res-tool-05': 'REPORT',
  'res-tool-06': 'REPORT',
  'res-tool-07': 'VERIFY',
  'res-tool-08': 'SEARCH',
  'res-tool-09': 'SEARCH',
  'res-tool-10': 'SEARCH',
}

function getToolCategory(resource: ResourceListItem): Exclude<ToolCategory, 'ALL'> {
  const direct = toolCategoryById[resource.id]
  if (direct) return direct

  const text = `${resource.title} ${resource.tags.join(' ')}`.toLowerCase()
  if (/(辟谣|核验|谣言)/.test(text)) return 'VERIFY'
  if (/(查询|检索|数据库|文书|庭审|执行)/.test(text)) return 'SEARCH'
  if (/(举报|投诉|12315|12321|12377|公安)/.test(text)) return 'REPORT'
  return 'HELP'
}

export default function Resources() {
  const [q, setQ] = useState('')
  const [type, setType] = useState<ResourceType | 'ALL'>('ALL')
  const [scene, setScene] = useState<string>('ALL')
  const [toolCategory, setToolCategory] = useState<ToolCategory>('ALL')
  const [items, setItems] = useState<ResourceListItem[]>([])
  const [toolCatalog, setToolCatalog] = useState<ResourceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ResourceDetail | null>(null)
  const [showChecklist, setShowChecklist] = useState(false)
  const [visibleResourceCount, setVisibleResourceCount] = useState(8)

  const todayTip = legalTips[new Date().getDate() % legalTips.length]

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type !== 'ALL') params.set('type', type)
    if (scene !== 'ALL') params.set('tag', scene)
    const data = await apiFetch<{ success: true; resources: ResourceListItem[] }>(`/api/resources?${params.toString()}`)
    setItems(data.resources)
    setVisibleResourceCount(8)
    setLoading(false)
  }, [q, type, scene])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (type !== 'ARTICLE' && toolCategory !== 'ALL') {
      setToolCategory('ALL')
    }
  }, [type, toolCategory])

  useEffect(() => {
    async function loadToolCatalog() {
      const data = await apiFetch<{ success: true; resources: ResourceListItem[] }>('/api/resources?type=ARTICLE')
      setToolCatalog(data.resources)
    }
    void loadToolCatalog()
  }, [])

  const title = useMemo(() => {
    const t = types.find((x) => x.value === type)?.label ?? '全部'
    return `资源中心 · ${t}`
  }, [type])

  const activeSceneLabel = useMemo(
    () => sceneFilters.find((x) => x.value === scene)?.label ?? '全部场景',
    [scene],
  )

  const activeTypeLabel = useMemo(
    () => types.find((x) => x.value === type)?.label ?? '全部',
    [type],
  )

  const hasRefinedFilter = scene !== 'ALL' || type !== 'ALL' || toolCategory !== 'ALL'

  const toolCategoryCounts = useMemo(() => {
    const initial: Record<Exclude<ToolCategory, 'ALL'>, number> = {
      HELP: 0,
      REPORT: 0,
      SEARCH: 0,
      VERIFY: 0,
    }
    for (const r of toolCatalog) {
      if (r.type !== 'ARTICLE') continue
      const cat = getToolCategory(r)
      initial[cat] += 1
    }
    return initial
  }, [toolCatalog])

  const filteredItems = useMemo(() => {
    if (toolCategory === 'ALL') return items
    return items.filter((r) => r.type === 'ARTICLE' && getToolCategory(r) === toolCategory)
  }, [items, toolCategory])

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleResourceCount)
  }, [filteredItems, visibleResourceCount])

  async function open(itemId: string) {
    setOpenId(itemId)
    setDetail(null)
    const data = await apiFetch<{ success: true; resource: ResourceDetail }>(`/api/resources/${itemId}`)
    setDetail(data.resource)
  }

  return (
    <div className="resource-center grid gap-4">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
            <Scale className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold tracking-tight text-zinc-900">今日学习提示</div>
            <div className="mt-0.5 text-xs text-zinc-500">先看法律知识，再按清单行动会更稳妥</div>
            <div className="mt-2 text-sm font-bold leading-snug text-zinc-800">{todayTip.tip}</div>
            <div className="mt-1.5 text-xs text-zinc-500">— {todayTip.law}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold tracking-tight text-zinc-900">法律行动清单</div>
              <div className="text-xs text-zinc-500 mt-0.5">遇到风险时，按顺序执行</div>
            </div>
            <button
              type="button"
              onClick={() => setShowChecklist((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {showChecklist ? '收起清单' : '展开清单'}
            </button>
          </div>
          {showChecklist && (
            <div className="mt-3 grid gap-2">
            {legalChecklist.map((item, idx) => (
              <div
                key={item}
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <span className="mr-2 font-bold text-zinc-900">{idx + 1}.</span>
                {item}
              </div>
            ))}
            </div>
          )}
        </div>
      </Card>

      <div className="sticky top-[68px] lg:top-2 z-20">
        <Card className="p-5 border-zinc-100/80 bg-white/90 backdrop-blur-sm shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold text-zinc-900">{title}</div>
            <div className="mt-1 text-sm text-zinc-600">按主题快速查找案例、法条摘要与权威工具。</div>
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

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-zinc-100 bg-gradient-to-r from-slate-50 to-blue-50/60 p-3">
            <div className="text-[11px] font-bold tracking-wide text-slate-600">场景优先</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sceneFilters.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={
                    scene === s.value
                      ? 'rounded-full bg-slate-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm'
                      : 'rounded-full border border-zinc-200 bg-white text-zinc-600 px-3.5 py-1.5 text-xs font-semibold hover:bg-zinc-50'
                  }
                  onClick={() => {
                    setScene(s.value)
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-3">
            <div className="text-[11px] font-bold tracking-wide text-zinc-500">资源类型</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={
                    type === t.value
                      ? 'rounded-full bg-[var(--p-accent)] text-white px-4 py-1.5 text-xs font-semibold shadow-sm'
                      : 'rounded-full bg-zinc-100 text-zinc-700 px-4 py-1.5 text-xs font-semibold hover:bg-zinc-200'
                  }
                  onClick={() => {
                    setType(t.value)
                    if (t.value !== 'ARTICLE') setToolCategory('ALL')
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {type === 'ARTICLE' && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-bold tracking-wide text-zinc-500">权威工具快捷分类</div>
                <div className="text-[11px] text-zinc-400">已进入工具筛选</div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {toolCategories.map((c) => {
                  const active = toolCategory === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      className={
                        active
                          ? 'rounded-2xl border border-[var(--p-accent)] bg-[var(--p-accent)]/8 px-3 py-2 text-left'
                          : 'rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left hover:bg-zinc-100'
                      }
                      onClick={() => {
                        setType('ARTICLE')
                        setScene('ALL')
                        setQ('')
                        setToolCategory(c.value)
                        setVisibleResourceCount(8)
                      }}
                    >
                      <div className="text-xs font-semibold text-zinc-900">{c.label}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">{c.hint}</div>
                      <div className="mt-1 text-[11px] font-medium text-zinc-600">
                        {toolCategoryCounts[c.value]} 条
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2 text-xs">
            <div className="text-zinc-600">
              当前筛选：<span className="font-semibold text-zinc-900">{activeSceneLabel}</span> ·{' '}
              <span className="font-semibold text-zinc-900">{activeTypeLabel}</span>
              {toolCategory !== 'ALL' && (
                <>
                  {' '}
                  · <span className="font-semibold text-zinc-900">{toolCategoryLabelMap[toolCategory]}</span>
                </>
              )}
            </div>
            {hasRefinedFilter && (
              <button
                type="button"
                onClick={() => {
                  setScene('ALL')
                  setType('ALL')
                  setToolCategory('ALL')
                }}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                清空筛选
              </button>
            )}
          </div>
        </div>
        </Card>
      </div>

      <Card className="p-5">
        {loading ? (
          <div className="animate-pulse grid gap-2">
            <div className="h-14 bg-zinc-100 rounded-2xl" />
            <div className="h-14 bg-zinc-100 rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-2">
            {visibleItems.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{r.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {r.excerpt ?? '点击查看完整内容与法条依据。'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.tags.slice(0, 3).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => open(r.id)}>
                  {actionLabelByType[r.type]}
                </Button>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                当前筛选下暂无资源，试试更换关键词或分类。
              </div>
            )}
            {!loading && filteredItems.length === 0 && items.length > 0 && toolCategory !== 'ALL' && (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                当前工具分类下暂无内容，试试切换到其他工具分类。
              </div>
            )}
            {visibleResourceCount < filteredItems.length && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setVisibleResourceCount((prev) => prev + 8)}
                >
                  加载更多（剩余 {filteredItems.length - visibleResourceCount} 条）
                </Button>
              </div>
            )}
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
            {detail.contentUrl && (
              <div className="mt-3">
                <a className="text-sm font-semibold text-slate-600 hover:text-slate-700 hover:underline" href={detail.contentUrl} target="_blank" rel="noreferrer">
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
