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
 * 配色走**浅色案件板**：底色用案件数据里自带的 `scene.bgColor`（每个场景一个
 * 浅色渐变），于是美术教室是暖橙、走廊是冷蓝、天台是紫粉 —— 每个场景有自己的
 * 色彩身份，翻场景时能感觉到「换了个地方」。这是原先就有的数据，只是此前被
 * 深色底盖掉了。
 *
 * 用 HTML 绝对定位而不是 SVG：家具标签在 `preserveAspectRatio="none"` 的
 * SVG 里会被非等比拉伸，字号忽大忽小。
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
  bgColor,
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
  /** 场景自身的浅色渐变，来自案件数据 */
  bgColor: string
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
        // 有些场景的 bgColor 与页面底色很接近（法庭的校园案是浅蓝对浅蓝），
        // 只靠一层极淡的描边看不出「现场」的边界。用一圈白边把它像照片一样
        // 「裱」起来，再压一道投影 —— 边界就出来了。
        'relative w-full overflow-hidden rounded-3xl',
        'ring-4 ring-white shadow-[0_8px_28px_rgba(15,23,42,0.10)]',
        'bg-gradient-to-br',
        bgColor,
      )}
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* 房间轮廓 */}
      <div
        className="absolute rounded-2xl border border-dashed border-zinc-500/25"
        style={{ inset: `${inset}%` }}
      />

      {/* 门 */}
      {(map?.doors ?? []).map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.45)]"
          style={doorStyle(d)}
        />
      ))}

      {/* 家具。纯装饰，不参与交互 */}
      {(map?.fixtures ?? []).map((f, i) => (
        <span
          key={i}
          aria-hidden
          className={clsx(
            'absolute grid place-items-center bg-white/55 ring-1 ring-zinc-900/[0.07]',
            'text-[10px] font-bold text-zinc-500/80 select-none',
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
                'relative grid h-10 w-10 place-items-center rounded-full text-lg transition-transform',
                found
                  ? 'bg-sky-50 shadow-sm ring-2 ring-sky-300'
                  : 'animate-soft-pulse bg-white shadow-[0_4px_14px_rgba(15,23,42,0.14)] ring-2 ring-sky-400 hover:scale-110',
              )}
            >
              {/* 找到之后仍然显示 emoji，只加一个小对勾角标 ——
                  换成一个纯 ✓ 会让场景丢掉「这是什么东西」的信息 */}
              {hs.emoji}
              {found && (
                <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-[9px] font-bold text-white ring-2 ring-white">
                  ✓
                </span>
              )}
            </span>
            {!found && (
              <span className="max-w-[110px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-900/[0.06]">
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
                'relative grid h-11 w-11 place-items-center rounded-full text-xl shadow-[0_4px_14px_rgba(15,23,42,0.14)] ring-2 transition-transform',
                active
                  ? 'bg-sky-500 ring-sky-200'
                  : 'animate-soft-pulse bg-white ring-sky-400 hover:scale-110',
              )}
            >
              {npc.emoji}
              <span
                className={clsx(
                  'absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-white',
                  secret ? 'bg-amber-400 text-zinc-900' : 'bg-sky-500 text-white',
                )}
              >
                {secret ? '🤫' : talked ? '✓' : '💬'}
              </span>
            </span>
            <span className="max-w-[110px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-900/[0.06]">
              {npc.name}
            </span>
          </button>
        )
      })}

      {/* 图例 */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-3 rounded-full bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 backdrop-blur-sm">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-white ring-1 ring-sky-400" />
          线索
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-white ring-1 ring-sky-400" />
          人物
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-amber-400/80" />
          门
        </span>
      </div>
    </div>
  )
}
