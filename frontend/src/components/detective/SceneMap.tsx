import { Check, MessageCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { SCENE_MAPS, type Door } from '@/data/sceneMaps'
import type { DetectiveHotspot, DetectiveNpc } from '@/data/detectiveCases'

/**
 * 现场示意图。
 *
 * 改造前这里是一个空白 div 上撒了几十个 `opacity-30` 的 emoji 当布景 ——
 * 没有任何「现场」可言，热点是浮在半空的胶囊按钮。现在是一张俯视平面图：
 * 墙、门、家具用色块表示，热点长在它对应的家具上。
 *
 * 用 HTML 绝对定位而不是 SVG：家具标签在 `preserveAspectRatio="none"` 的
 * SVG 里会被非等比拉伸，字号忽大忽小；HTML 层的字号与容器无关。
 *
 * 热点和 NPC 的坐标来自 `sceneMaps.ts`，不在这里也不在案件数据里 ——
 * 坐标是这张图的属性。
 */

function doorStyle(d: Door) {
  const len = 14
  const thick = 1.6
  switch (d.side) {
    case 'top':
      return { left: `${d.at - len / 2}%`, top: '0%', width: `${len}%`, height: `${thick}%` }
    case 'bottom':
      return { left: `${d.at - len / 2}%`, bottom: '0%', width: `${len}%`, height: `${thick}%` }
    case 'left':
      return { top: `${d.at - len / 2}%`, left: '0%', height: `${len}%`, width: `${thick}%` }
    case 'right':
      return { top: `${d.at - len / 2}%`, right: '0%', height: `${len}%`, width: `${thick}%` }
  }
}

export default function SceneMap({
  sceneId,
  clues,
  foundClues,
  npcs,
  interviewedNpcs,
  secretsRevealed,
  currentNpcId,
  onFindClue,
  onTalkToNpc,
  locked,
}: {
  sceneId: string
  clues: DetectiveHotspot[]
  foundClues: string[]
  npcs: DetectiveNpc[]
  interviewedNpcs: string[]
  secretsRevealed: string[]
  currentNpcId: string | null
  onFindClue: (hs: DetectiveHotspot) => void
  onTalkToNpc: (id: string) => void
  /** 正在看某个 NPC 的对话时，地图上的点位不可点，避免对话被切走 */
  locked?: boolean
}) {
  const map = SCENE_MAPS[sceneId]
  const inset = map?.inset ?? 6

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden rounded-3xl',
        'bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.10),transparent_60%)] bg-zinc-900',
        'ring-1 ring-white/10',
      )}
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* 房间轮廓 */}
      <div
        className="absolute rounded-2xl border border-dashed border-white/15"
        style={{ inset: `${inset}%` }}
      />

      {/* 门 */}
      {(map?.doors ?? []).map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
          style={doorStyle(d)}
        />
      ))}

      {/* 家具。纯装饰，不参与交互 */}
      {(map?.fixtures ?? []).map((f, i) => (
        <span
          key={i}
          aria-hidden
          className={clsx(
            'absolute grid place-items-center bg-white/[0.05] ring-1 ring-white/10',
            'text-[10px] font-bold text-white/35 select-none',
            f.shape === 'circle' ? 'rounded-full' : 'rounded-xl',
          )}
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
        >
          {/* 窗、门这类细长家具放不下文字，10% 以下的高度会把字压扁 */}
          {f.h >= 10 && f.w >= 10 ? f.label : ''}
        </span>
      ))}

      {/* 线索热点 */}
      {clues.map((hs) => {
        const found = foundClues.includes(hs.id)
        const pos = SCENE_MAPS[sceneId]?.spots[hs.id] ?? { x: 50, y: 50 }
        return (
          <button
            key={hs.id}
            type="button"
            disabled={found || locked}
            onClick={() => onFindClue(hs)}
            title={hs.label}
            className={clsx(
              'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1',
              found ? 'cursor-default' : 'cursor-pointer',
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <span
              className={clsx(
                'grid h-10 w-10 place-items-center rounded-full text-lg shadow-lg transition-transform',
                found
                  ? 'bg-zinc-700/80 ring-2 ring-zinc-600'
                  : 'animate-soft-pulse bg-white/95 ring-2 ring-sky-400 hover:scale-110',
              )}
            >
              {found ? '✓' : hs.emoji}
            </span>
            {!found && (
              <span className="max-w-[110px] truncate rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white/90">
                {hs.label}
              </span>
            )}
          </button>
        )
      })}

      {/* 人物 */}
      {npcs.map((npc) => {
        const pos = SCENE_MAPS[sceneId]?.npcs[npc.id] ?? { x: 50, y: 50 }
        const secret = secretsRevealed.includes(npc.id)
        const talked = interviewedNpcs.includes(npc.id)
        const active = currentNpcId === npc.id
        return (
          <button
            key={npc.id}
            type="button"
            disabled={locked}
            onClick={() => onTalkToNpc(npc.id)}
            title={`${npc.name} · ${npc.role}`}
            className={clsx(
              'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1',
              locked ? 'cursor-default opacity-60' : 'cursor-pointer',
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <span
              className={clsx(
                'relative grid h-11 w-11 place-items-center rounded-full text-xl shadow-lg ring-2 transition-transform',
                active
                  ? 'bg-sky-500 ring-sky-200'
                  : 'animate-soft-pulse bg-slate-100 ring-sky-400 hover:scale-110',
              )}
            >
              {npc.emoji}
              <span
                className={clsx(
                  'absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-zinc-900',
                  secret ? 'bg-amber-400 text-zinc-900' : 'bg-sky-500 text-white',
                )}
              >
                {secret ? '🤫' : talked ? <Check className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
              </span>
            </span>
            <span className="max-w-[110px] truncate rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white/90">
              {npc.name}
            </span>
          </button>
        )
      })}

      {/* 图例 */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-3 text-[10px] font-semibold text-white/40">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-white/80 ring-1 ring-sky-400" />
          线索
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-200 ring-1 ring-sky-400" />
          人物
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-amber-400/70" />
          门
        </span>
      </div>
    </div>
  )
}
