/**
 * 漫画学法 — 故事数据。
 *
 * 原先这份数据硬编码在 `pages/student/Comics.tsx` 里。抽出来是因为
 * 阅读器搬到了独立路由 `/play/comics/:storyId`，而路由只有 `storyId`
 * 一个参数 —— 数据留在页面组件里就没法按 id 反查。
 */

import type { Topic } from './topics'

export interface ComicPanel {
  image: string
  caption?: string
}

/**
 * 读完后的总结题。
 *
 * 出题口径是「从故事上升到一般规则」，不是知识题 —— 问「遇到 XX 情况，
 * 正确做法是？」而不是「以下哪个说法正确」。
 *
 * `evidencePanel` 是这道题的护栏：正确答案必须能指回故事里具体某一格。
 * 守不住这条，漫画总结题就退化成第 304 道闯关题了（闯关题考的是迁移，
 * 答案不在任何看过的素材里）。
 */
export interface ComicQuiz {
  question: string
  options: { id: string; text: string; isCorrect: boolean }[]
  explanation: string
  /** 正确答案对应的分镜序号（从 1 开始），用于「回到第 N 格」 */
  evidencePanel: number
}

export interface ComicStory {
  id: string
  title: string
  /** 卡片标签上的具体文案（如「校园欺凌」），比主题更细 */
  topicLabel: string
  /** 所属主题，全平台坐标轴。用于跨模块推荐路由 */
  topic: Topic
  tagColor: 'blue' | 'purple' | 'orange' | 'red' | 'yellow' | 'green'
  emoji: string
  cover: string
  description: string
  panels: ComicPanel[]
  lawTip: string
  relatedLaw: string
  quiz: ComicQuiz
}

export const comicStories: ComicStory[] = [
  {
    id: 'comic-bullying-1',
    title: '小明的烦恼',
    topicLabel: '校园欺凌',
    topic: '校园安全',
    tagColor: 'blue',
    emoji: '🏫',
    cover: '/images/comics/bullying-1/01.webp',
    description: '小明在放学路上被同学围堵索要零花钱，他该如何应对？',
    panels: [
      { image: '/images/comics/bullying-1/01.webp', caption: '放学后的小明独自走在回家的路上...' },
      { image: '/images/comics/bullying-1/02.webp', caption: '突然，几个高年级同学挡住了他的去路。' },
      { image: '/images/comics/bullying-1/03.webp', caption: '"喂，把零花钱交出来！"' },
      { image: '/images/comics/bullying-1/04.webp', caption: '小明想起了老师讲过的应对方法...' },
      { image: '/images/comics/bullying-1/05.webp', caption: '"我不给，你们这样做是违法的！"' },
      { image: '/images/comics/bullying-1/06.webp', caption: '小明勇敢地告诉了老师和家长，最终得到了保护。' },
    ],
    lawTip: '遇到校园欺凌，要勇敢说「不」！记住：告诉老师、家长或拨打 110 报警都是正确做法，沉默只会让欺凌者更加嚣张。',
    relatedLaw: '《未成年人保护法》第二十七条 · 学校不得对未成年人实施体罚、变相体罚或者其他侮辱人格尊严的行为。',
    quiz: {
      question: '遇到有人向你索要钱财、还威胁不许说出去，最应该做的是？',
      options: [
        { id: 'a', text: '先把钱给他，事后再自己想办法解决', isCorrect: false },
        { id: 'b', text: '明确拒绝，并第一时间告诉老师和家长', isCorrect: true },
        { id: 'c', text: '叫上几个朋友，自己去找对方理论', isCorrect: false },
        { id: 'd', text: '先忍着不说，等对方自己收手', isCorrect: false },
      ],
      explanation:
        '小明做对了两件事：先明确说「我不给」（第 5 格），然后告诉了老师和家长（第 6 格）。私下解决和忍着不说都会让欺凌继续 —— 欺凌者最怕的恰恰是事情被大人知道。',
      evidencePanel: 5,
    },
  },
  {
    id: 'comic-online-1',
    title: '天上掉馅饼？',
    topicLabel: '网络诈骗',
    topic: '网络安全',
    tagColor: 'purple',
    emoji: '🌐',
    cover: '/images/comics/online-1/01.webp',
    description: '小红收到一条中奖短信，奖品丰厚，她需要怎么做？',
    panels: [
      { image: '/images/comics/online-1/01.webp', caption: '周末，小红收到一条短信：' },
      { image: '/images/comics/online-1/02.webp', caption: '"恭喜您被抽中一等奖！请点击链接领取..."' },
      { image: '/images/comics/online-1/03.webp', caption: '小红有些心动，正准备点击链接...' },
      { image: '/images/comics/online-1/04.webp', caption: '妈妈看到了，赶紧阻止了她。' },
      { image: '/images/comics/online-1/05.webp', caption: '"这很可能是诈骗短信，千万别点！"' },
      { image: '/images/comics/online-1/06.webp', caption: '小红学会了辨别诈骗信息，还把案例分享给了同学。' },
    ],
    lawTip: '收到「中奖」「免费领」等消息时，不要点击陌生链接，更不要输入个人信息或转账。遇到可疑情况，拨打 12377 举报网络不良信息。',
    relatedLaw: '《反电信网络诈骗法》第三十一条 · 任何单位和个人不得非法买卖、出租、出借电话卡、银行卡。',
    quiz: {
      question: '收到「恭喜中奖，点击链接领取」这类消息时，正确做法是？',
      options: [
        { id: 'a', text: '点开看看，只要不填银行卡号就没事', isCorrect: false },
        { id: 'b', text: '转发到班级群，让同学帮忙判断真假', isCorrect: false },
        { id: 'c', text: '不点链接，把它当作诈骗信息处理', isCorrect: true },
        { id: 'd', text: '回复消息问清楚活动规则再决定', isCorrect: false },
      ],
      explanation:
        '妈妈拦住小红时说的是「千万别点」（第 5 格）—— 不是「小心点」。「不填银行卡就没事」是错的：点开链接本身就可能泄露设备信息，回复消息则等于告诉对方这个号码是活的。',
      evidencePanel: 5,
    },
  },
  {
    id: 'comic-consumer-1',
    title: '买的球鞋是假货',
    topicLabel: '消费者权益',
    topic: '消费者权益',
    tagColor: 'orange',
    emoji: '🛍️',
    cover: '/images/comics/consumer-1/01.webp',
    description: '小刚在网上买的限量球鞋到手后发现是假货，他该怎么维权？',
    panels: [
      { image: '/images/comics/consumer-1/01.webp', caption: '小刚攒了很久的零花钱，终于买了心仪的限量球鞋。' },
      { image: '/images/comics/consumer-1/02.webp', caption: '拆开快递后，他发现鞋子的做工很粗糙...' },
      { image: '/images/comics/consumer-1/03.webp', caption: '"这不就是假货吗！"' },
      { image: '/images/comics/consumer-1/04.webp', caption: '小刚保留了聊天记录、商品页面截图和实物照片。' },
      { image: '/images/comics/consumer-1/05.webp', caption: '他先联系卖家要求退货退款，被拒绝后...' },
      { image: '/images/comics/consumer-1/06.webp', caption: '小刚向平台投诉并拨打 12315，最终成功维权。' },
    ],
    lawTip: '网购维权关键：保留证据（聊天记录、商品截图、实物照片），先与商家协商，协商不成可向平台投诉或拨打 12315。',
    relatedLaw: '《消费者权益保护法》第五十五条 · 经营者提供商品有欺诈行为的，应当增加赔偿其受到的损失，增加赔偿的金额为价款的三倍。',
    quiz: {
      question: '网购收到的商品与描述不符，打算维权时最先应该做的是？',
      options: [
        { id: 'a', text: '立刻把商品寄回给卖家，要求退款', isCorrect: false },
        { id: 'b', text: '到社交平台上发帖曝光这家店', isCorrect: false },
        { id: 'c', text: '直接拨打 12315，不用自己联系卖家', isCorrect: false },
        { id: 'd', text: '先保存聊天记录、商品页面截图和实物照片', isCorrect: true },
      ],
      explanation:
        '小刚做的第一件事是保存证据（第 4 格）—— 聊天记录、商品页面截图、实物照片。先寄回商品等于把证据交出去，之后卖家否认就说不清了。',
      evidencePanel: 4,
    },
  },
]

export function getComicById(id: string): ComicStory | undefined {
  return comicStories.find((c) => c.id === id)
}
