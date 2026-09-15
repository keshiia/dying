import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

export interface BannerSlide {
  src: string
  alt?: string
}

type Props = {
  slides: BannerSlide[]
  /** 自动轮播间隔（ms），默认 5000 */
  interval?: number
  /** 圆角风格 */
  rounded?: '3xl' | '2xl'
}

const TRANSITION = 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'

export default function BannerCarousel({ slides, interval = 5000, rounded = '3xl' }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef(0)
  const timerRef = useRef<number>(0)

  // --- positioning: ONLY via this function, React never touches transform ---
  // 用 useCallback 稳住：它只依赖 slides.length 和 ref，稳定之后下面几处依赖
  // 数组才写得进去 —— 否则每次渲染都是新函数，加进依赖反而会反复触发。
  const applyTransform = useCallback(
    (idx: number, animate = true) => {
      const el = trackRef.current
      if (!el) return
      const pct = slides.length > 1 ? (idx * 100) / slides.length : 0
      el.style.transition = animate ? TRANSITION : 'none'
      el.style.transform = `translateX(-${pct}%)`
    },
    [slides.length],
  )

  const slideTo = useCallback(
    (idx: number, animate = true) => {
      if (slides.length <= 1) return
      const next = ((idx % slides.length) + slides.length) % slides.length
      currentRef.current = next
      setCurrent(next)
      applyTransform(next, animate)
    },
    [slides.length, applyTransform],
  )

  // initial position
  useEffect(() => {
    if (slides.length > 1) applyTransform(0, false)
  }, [slides.length, applyTransform])

  // auto-play
  useEffect(() => {
    if (paused || slides.length <= 1) return
    timerRef.current = window.setInterval(() => slideTo(currentRef.current + 1), interval)
    return () => window.clearInterval(timerRef.current)
  }, [paused, interval, slideTo, slides.length])

  // --- drag ---
  const dragRef = useRef({ active: false, startX: 0, moved: false })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // ignore clicks on buttons/dots — they stopPropagation
    dragRef.current = { active: true, startX: e.clientX, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d.active) return
    const diff = e.clientX - d.startX
    if (Math.abs(diff) > 4) d.moved = true
    if (!d.moved) return
    const el = trackRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = `translateX(calc(-${(currentRef.current * 100) / slides.length}% + ${diff}px))`
  }, [slides.length])

  const onPointerUp = useCallback(() => {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    if (!d.moved) return // let onClick handle it
    const diff = /* last known */ parseFloat(trackRef.current?.style.transform.match(/calc\([^)]*\+\s*([-\d.]+)px\)/)?.[1] ?? '0')
    if (diff < -50) slideTo(currentRef.current + 1)
    else if (diff > 50) slideTo(currentRef.current - 1)
    else applyTransform(currentRef.current)
  }, [slideTo, applyTransform])

  if (slides.length === 0) return null
  const single = slides.length === 1

  return (
    <div
      className={clsx(
        `rounded-${rounded} overflow-hidden border border-zinc-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]`,
        'group relative select-none',
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* viewport — receives pointer events for drag */}
      <div
        className="relative w-full aspect-[3.5/1] overflow-hidden bg-zinc-100"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        {/* track — transform is NEVER in React inline style */}
        <div
          ref={trackRef}
          className="flex h-full"
          style={{ width: `${slides.length * 100}%` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="h-full shrink-0" style={{ width: `${100 / slides.length}%` }}>
              <img
                src={s.src}
                alt={s.alt ?? ''}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-black/[0.03]" />
      </div>

      {/* arrows */}
      {!single && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); slideTo(currentRef.current - 1) }}
            className={clsx(
              'absolute left-2.5 top-1/2 -translate-y-1/2 z-10',
              'grid h-8 w-8 place-items-center rounded-full',
              'bg-white/70 backdrop-blur-sm border border-white/40 shadow-sm',
              'text-zinc-600 hover:text-zinc-900 hover:bg-white/90 hover:shadow-md',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); slideTo(currentRef.current + 1) }}
            className={clsx(
              'absolute right-2.5 top-1/2 -translate-y-1/2 z-10',
              'grid h-8 w-8 place-items-center rounded-full',
              'bg-white/70 backdrop-blur-sm border border-white/40 shadow-sm',
              'text-zinc-600 hover:text-zinc-900 hover:bg-white/90 hover:shadow-md',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* dots */}
      {!single && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => slideTo(i)}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                i === current
                  ? 'w-5 bg-white shadow-sm'
                  : 'w-1.5 bg-white/50 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}

      {/* counter */}
      {!single && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-white pointer-events-none">
          {current + 1} / {slides.length}
        </div>
      )}
    </div>
  )
}
