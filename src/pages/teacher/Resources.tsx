import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import type { ResourceType } from '@/types'

export default function TeacherResources() {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ResourceType>('ARTICLE')
  const [tags, setTags] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [contentMd, setContentMd] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function publish() {
    setMsg(null)
    const data = await apiFetch<{ success: true; resource: { id: string } }>('/api/teacher/resources', {
      method: 'POST',
      body: JSON.stringify({
        title,
        type,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        contentUrl: contentUrl || undefined,
        contentMd: contentMd || undefined,
      }),
    })

    setMsg(`发布成功：${data.resource.id}`)
    setTitle('')
    setTags('')
    setContentUrl('')
    setContentMd('')
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">资源发布</div>
        <div className="mt-1 text-sm text-zinc-600">发布后学生端“资源中心”可见。</div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-7">
            <div className="mb-1 text-xs font-semibold text-zinc-700">标题</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="资源标题" />
          </div>

          <div className="col-span-12 md:col-span-5">
            <div className="mb-1 text-xs font-semibold text-zinc-700">类型</div>
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={type}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'LAW_SUMMARY' || v === 'CASE' || v === 'VIDEO' || v === 'ARTICLE') {
                  setType(v)
                }
              }}
            >
              <option value="LAW_SUMMARY">法条摘要</option>
              <option value="CASE">案例</option>
              <option value="VIDEO">视频</option>
              <option value="ARTICLE">工具</option>
            </select>
          </div>

          <div className="col-span-12">
            <div className="mb-1 text-xs font-semibold text-zinc-700">标签（逗号分隔）</div>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例如：校园安全, 网络法治" />
          </div>

          <div className="col-span-12">
            <div className="mb-1 text-xs font-semibold text-zinc-700">外链（可选）</div>
            <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="col-span-12">
            <div className="mb-1 text-xs font-semibold text-zinc-700">正文（可选）</div>
            <textarea
              className="min-h-[140px] w-full rounded-2xl border border-zinc-200 bg-white p-4 text-sm"
              value={contentMd}
              onChange={(e) => setContentMd(e.target.value)}
              placeholder="支持纯文本或 Markdown（当前版本按文本展示）"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Tag>建议优先放权威工具链接</Tag>
            <Tag>可配合关卡主题</Tag>
          </div>
          <Button onClick={publish} disabled={!title.trim()}>
            发布
          </Button>
        </div>

        {msg && (
          <div className="mt-4 rounded-2xl border border-[color:var(--p-primary)]/20 bg-[color:var(--p-primary)]/10 px-4 py-3 text-sm text-zinc-800">
            {msg}
          </div>
        )}
      </Card>
    </div>
  )
}
