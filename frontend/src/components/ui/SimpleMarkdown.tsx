import { useMemo } from 'react'

/**
 * 极简 Markdown 渲染器，只处理普法正文实际用到的三种结构：
 * 段落、`-` 无序列表、`1)` 有序列表。
 *
 * 为什么不用 react-markdown：资源正文最长只有 245 字符，实测 62 篇里
 * 没有出现过标题、加粗、表格、代码、引用、链接中的任何一种。而 react-markdown
 * 会连带 unified / micromark 整条解析管线（约 116KB），且首次渲染要在主线程上
 * 初始化这条管线——实测首次打开案例详情阻塞主线程约 187ms，之后复用才消失。
 * 为两种列表付这个代价不成比例。
 *
 * 文本由 React 渲染，自动转义，不存在注入风险。
 */

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }

const UL = /^[-*]\s+(.*)$/
const OL = /^\d+[.)]\s+(.*)$/

export function parseSimpleMarkdown(source: string): Block[] {
  const blocks: Block[] = []
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null
  let para: string[] = []

  const flushList = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  // Markdown 的软换行规则：段落内连续的单个换行会被合并（渲染成一个空格），
  // 而不是分成两段。正文里「情境：」与其下的一句描述就是靠这个规则连成一段的，
  // 这里必须照做，否则会改变现有页面的版式。
  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: 'p', text: para.join('\n') })
      para = []
    }
  }

  const flush = () => {
    flushList()
    flushPara()
  }

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }

    const ul = UL.exec(line)
    if (ul) {
      flushPara()
      if (list?.kind !== 'ul') {
        flushList()
        list = { kind: 'ul', items: [] }
      }
      list.items.push(ul[1])
      continue
    }

    const ol = OL.exec(line)
    if (ol) {
      flushPara()
      if (list?.kind !== 'ol') {
        flushList()
        list = { kind: 'ol', items: [] }
      }
      list.items.push(ol[1])
      continue
    }

    flushList()
    para.push(line)
  }

  flush()
  return blocks
}

type Props = {
  children: string
  className?: string
}

export default function SimpleMarkdown({ children, className }: Props) {
  const blocks = useMemo(() => parseSimpleMarkdown(children ?? ''), [children])

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.kind === 'ul') {
          return (
            <ul key={i} className="my-3 list-disc space-y-2 pl-5 marker:text-zinc-400">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          )
        }
        if (b.kind === 'ol') {
          return (
            <ol key={i} className="my-3 list-decimal space-y-2 pl-5 marker:text-zinc-400">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="my-3">
            {b.text}
          </p>
        )
      })}
    </div>
  )
}
