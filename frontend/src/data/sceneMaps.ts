/**
 * 现场示意图的几何定义。
 *
 * 坐标为什么放在这里、而不是留在 `detectiveCases.ts`：
 * 它们是**图的属性**，不是案件叙事的属性。放在案件数据里会导致「改一张图要动
 * 一个 1975 行的数据文件」。原先更分裂 —— `DetectiveNpc` 类型里声明了 x/y 字段、
 * 案件数据里 15 个 NPC 一个都没填、UI 文件里又硬编码了第三份 `NPC_POSITIONS`。
 *
 * 坐标系是 0-100 的百分比，与容器尺寸无关。房间轮廓由 `inset` 决定（默认 6），
 * 所以新增场景只要摆家具、摆点位，不用算墙。
 */

export type Fixture = {
  x: number
  y: number
  w: number
  h: number
  label?: string
  /** rect=家具/柜子/桌子（默认）；circle=水塔/柱子/圆桌 */
  shape?: 'rect' | 'circle'
}

export type Door = {
  side: 'top' | 'bottom' | 'left' | 'right'
  /** 沿该边方向的百分比位置 */
  at: number
}

export type SceneMapData = {
  /** 房间轮廓距容器边缘的百分比，默认 6 */
  inset?: number
  fixtures: Fixture[]
  doors?: Door[]
  /** 热点 id → 位置。缺项时回落 50/50，不会漏渲染 */
  spots: Record<string, { x: number; y: number }>
  /** NPC id → 位置 */
  npcs: Record<string, { x: number; y: number }>
}

const DEFAULT_POS = { x: 50, y: 50 }

export const SCENE_MAPS: Record<string, SceneMapData> = {
  // ── 案件一：画室的神秘涂鸦 ──
  'scene-artroom': {
    fixtures: [
      { x: 10, y: 18, w: 26, h: 20, label: '画架区' },
      { x: 44, y: 36, w: 30, h: 16, label: '长桌' },
      { x: 78, y: 46, w: 14, h: 30, label: '储物柜' },
      { x: 46, y: 8, w: 24, h: 5, label: '窗' },
    ],
    doors: [{ side: 'bottom', at: 20 }],
    spots: {
      'hotspot-painting': { x: 23, y: 28 },
      'hotspot-paint-tube': { x: 52, y: 62 },
      'hotspot-footprint': { x: 66, y: 14 },
      'hotspot-schedule': { x: 88, y: 24 },
    },
    npcs: { 'npc-xiaomei': { x: 16, y: 62 } },
  },
  'scene-hallway': {
    fixtures: [
      { x: 8, y: 10, w: 84, h: 14, label: '一排储物柜' },
      { x: 8, y: 66, w: 84, h: 14, label: '教室门' },
    ],
    doors: [{ side: 'left', at: 46 }],
    spots: {
      'hotspot-locker': { x: 30, y: 26 },
      'hotspot-gossip': { x: 62, y: 46 },
      'hotspot-cctv2': { x: 86, y: 16 },
    },
    npcs: { 'npc-chenhao': { x: 20, y: 48 } },
  },
  'scene-rooftop': {
    fixtures: [
      { x: 60, y: 16, w: 26, h: 26, label: '水塔', shape: 'circle' },
      { x: 10, y: 68, w: 30, h: 14, label: '长椅' },
    ],
    doors: [{ side: 'bottom', at: 84 }],
    spots: {
      'hotspot-note': { x: 44, y: 56 },
      'hotspot-phone': { x: 24, y: 30 },
    },
    npcs: { 'npc-linyue': { x: 70, y: 62 } },
  },

  // ── 案件二：食堂的幽灵窃贼 ──
  'scene-canteen': {
    fixtures: [
      { x: 14, y: 18, w: 34, h: 18, label: '充值机' },
      { x: 58, y: 18, w: 28, h: 18, label: '打饭窗口' },
      { x: 16, y: 62, w: 44, h: 12, label: '餐桌' },
    ],
    doors: [{ side: 'right', at: 78 }],
    spots: {
      'hotspot-charge-machine': { x: 30, y: 34 },
      'hotspot-receipt': { x: 48, y: 68 },
      'hotspot-staff': { x: 46, y: 32 },
      'hotspot-qr': { x: 84, y: 74 },
    },
    npcs: { 'npc-zhang': { x: 24, y: 54 } },
  },
  'scene-server': {
    fixtures: [
      { x: 16, y: 20, w: 30, h: 16, label: '办公桌' },
      { x: 60, y: 34, w: 26, h: 26, label: '机柜' },
      { x: 30, y: 8, w: 34, h: 5, label: '窗' },
    ],
    doors: [{ side: 'bottom', at: 24 }],
    spots: {
      'hotspot-computer': { x: 31, y: 28 },
      'hotspot-log': { x: 48, y: 52 },
      'hotspot-cup': { x: 22, y: 46 },
      'hotspot-window': { x: 47, y: 14 },
    },
    npcs: { 'npc-chen': { x: 72, y: 72 } },
  },
  'scene-playground': {
    fixtures: [
      { x: 12, y: 18, w: 34, h: 22, label: '小卖部窗口' },
      { x: 58, y: 16, w: 26, h: 14, label: '货架' },
      { x: 62, y: 62, w: 24, h: 18, label: '后巷入口' },
    ],
    doors: [{ side: 'left', at: 40 }],
    spots: {
      'hotspot-shopkeeper': { x: 28, y: 32 },
      'hotspot-list': { x: 70, y: 24 },
      'hotspot-cctv3': { x: 74, y: 70 },
    },
    npcs: { 'npc-xiaoyu': { x: 28, y: 64 } },
  },

  // ── 案件三：朋友圈的谣言风暴 ──
  'scene-rumor-school': {
    fixtures: [
      { x: 30, y: 22, w: 40, h: 12, label: '公告栏' },
      { x: 12, y: 62, w: 24, h: 14, label: '长椅' },
      { x: 64, y: 62, w: 24, h: 14, label: '服务台' },
    ],
    doors: [{ side: 'bottom', at: 50 }],
    spots: {
      'rumor-article': { x: 36, y: 30 },
      'rumor-photo': { x: 58, y: 30 },
      'rumor-witness': { x: 46, y: 52 },
      'rumor-sub': { x: 76, y: 62 },
    },
    npcs: {},
  },
  'scene-rumor-classroom': {
    fixtures: [
      { x: 26, y: 18, w: 48, h: 8, label: '黑板' },
      { x: 16, y: 46, w: 20, h: 14, label: '课桌' },
      { x: 42, y: 46, w: 20, h: 14, label: '课桌' },
    ],
    doors: [{ side: 'bottom', at: 76 }],
    spots: {
      'rumor-target': { x: 26, y: 54 },
      'rumor-phone': { x: 52, y: 54 },
      'rumor-class-girl': { x: 70, y: 32 },
      'rumor-schedule': { x: 86, y: 66 },
    },
    npcs: {
      'npc-zhao': { x: 18, y: 72 },
      'npc-linsi': { x: 78, y: 44 },
    },
  },
  'scene-rumor-office': {
    fixtures: [
      { x: 10, y: 16, w: 80, h: 12, label: '一排电脑' },
      { x: 10, y: 44, w: 80, h: 12, label: '一排电脑' },
      { x: 10, y: 72, w: 80, h: 12, label: '一排电脑' },
    ],
    doors: [{ side: 'left', at: 30 }],
    spots: {
      'rumor-computer': { x: 30, y: 22 },
      'rumor-wechat': { x: 30, y: 50 },
    },
    npcs: { 'npc-teacher': { x: 74, y: 78 } },
  },

  // ── 案件四：体育器材室的黑影 ──
  'scene-gym-room': {
    fixtures: [
      { x: 14, y: 18, w: 30, h: 22, label: '展示柜' },
      { x: 58, y: 18, w: 28, h: 16, label: '器材架' },
      { x: 60, y: 60, w: 26, h: 22, label: '花坛（窗外）' },
    ],
    doors: [{ side: 'bottom', at: 24 }],
    spots: {
      'gym-case': { x: 29, y: 30 },
      'gym-tool': { x: 48, y: 64 },
      'gym-window': { x: 78, y: 42 },
      'gym-footprint': { x: 73, y: 72 },
    },
    npcs: { 'npc-liu': { x: 20, y: 60 } },
  },
  'scene-gym-outside': {
    fixtures: [
      { x: 8, y: 12, w: 84, h: 8, label: '学校围墙' },
      { x: 56, y: 40, w: 30, h: 20, label: '建筑工人休息棚' },
      { x: 14, y: 62, w: 34, h: 10, label: '泥地' },
    ],
    doors: [{ side: 'right', at: 24 }],
    spots: {
      'gym-fence': { x: 26, y: 20 },
      'gym-construction': { x: 71, y: 50 },
      'gym-bike': { x: 30, y: 70 },
      'gym-cctv4': { x: 86, y: 66 },
    },
    npcs: { 'npc-coach': { x: 46, y: 34 } },
  },
  'scene-gym-school': {
    fixtures: [
      { x: 14, y: 20, w: 34, h: 16, label: '办公桌' },
      { x: 60, y: 18, w: 26, h: 20, label: '文件柜' },
      { x: 20, y: 60, w: 60, h: 12, label: '会议桌' },
    ],
    doors: [{ side: 'bottom', at: 50 }],
    spots: {
      'gym-student': { x: 28, y: 30 },
      'gym-teacher': { x: 44, y: 66 },
      'gym-maqiang': { x: 73, y: 28 },
    },
    npcs: { 'npc-maqiang': { x: 72, y: 66 } },
  },

  // ── 案件五：班级群里的幽灵 ──
  'scene-ghost-class': {
    fixtures: [
      { x: 26, y: 18, w: 48, h: 8, label: '黑板' },
      { x: 16, y: 46, w: 20, h: 14, label: '课桌' },
      { x: 42, y: 46, w: 20, h: 14, label: '课桌' },
    ],
    doors: [{ side: 'bottom', at: 76 }],
    spots: {
      'ghost-chat': { x: 28, y: 30 },
      'ghost-transfer2': { x: 60, y: 30 },
      'ghost-victim': { x: 26, y: 68 },
      'ghost-phishing': { x: 78, y: 56 },
    },
    npcs: { 'npc-zhangqing': { x: 24, y: 54 } },
  },
  'scene-ghost-lab': {
    fixtures: [
      { x: 10, y: 16, w: 80, h: 12, label: '一排电脑' },
      { x: 10, y: 44, w: 80, h: 12, label: '一排电脑' },
      { x: 10, y: 72, w: 80, h: 12, label: '一排电脑' },
    ],
    doors: [{ side: 'right', at: 50 }],
    spots: {
      'ghost-ip': { x: 30, y: 22 },
      'ghost-student2': { x: 62, y: 50 },
      'ghost-motive': { x: 30, y: 78 },
    },
    npcs: { 'npc-wanghao': { x: 74, y: 78 } },
  },
  'scene-ghost-meeting': {
    fixtures: [
      { x: 22, y: 32, w: 56, h: 28, label: '会议桌' },
      { x: 8, y: 10, w: 22, h: 8, label: '投影幕布' },
    ],
    doors: [{ side: 'bottom', at: 50 }],
    spots: {
      'ghost-phone2': { x: 44, y: 46 },
      'ghost-phone1': { x: 30, y: 68 },
      'ghost-confession': { x: 66, y: 68 },
    },
    npcs: { 'npc-lixiaoming': { x: 74, y: 30 } },
  },
}

export function spotPos(sceneId: string, spotId: string): { x: number; y: number } {
  return SCENE_MAPS[sceneId]?.spots[spotId] ?? DEFAULT_POS
}

export function npcPos(sceneId: string, npcId: string): { x: number; y: number } {
  return SCENE_MAPS[sceneId]?.npcs[npcId] ?? DEFAULT_POS
}
