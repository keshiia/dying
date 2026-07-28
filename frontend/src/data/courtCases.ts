// 模拟法庭案件数据
// MVP 先放一个案件，后续扩展

export type HotspotType = 'physical' | 'digital' | 'testimony' | 'document'

export interface SceneHotspot {
  id: string
  label: string
  emoji: string
  /** CSS position on the scene canvas (0-100%) */
  x: number
  y: number
  type: HotspotType
  found: boolean
  content: {
    title: string
    desc: string
    detail: string
    insight?: string
  }
}

export interface EvidenceItem {
  id: string
  title: string
  emoji: string
  type: HotspotType
  description: string
  detail: string
  /** Is this evidence admissible? */
  admissible: boolean
  /** If not admissible, why? */
  inadmissibleReason?: string
  /** The correct answer for whether to accept this evidence */
  correctAccept: boolean
}

export interface DebateChoice {
  id: string
  text: string
  /** What new info this choice reveals */
  reveal: string
  /** Is this the "correct" / recommended choice */
  isRecommended: boolean
  /** Why this choice is good/bad */
  feedback: string
}

export interface DebateStage {
  id: string
  speaker: string
  speakerEmoji: string
  dialogue: string
  choices: DebateChoice[]
}

export interface LawOption {
  id: string
  name: string
  summary: string
  isCorrect: boolean
  explanation: string
}

export interface VerdictOption {
  id: string
  label: string
  desc: string
  isCorrect: boolean
  explanation: string
}

export interface PenaltOption {
  id: string
  label: string
  desc: string
  isCorrect: boolean
  explanation: string
}

export interface CourtCaseData {
  id: string
  title: string
  subtitle: string
  emoji: string
  /** Intro narrative for the case */
  intro: {
    narrative: string[]
    plaintiff: { name: string; avatar: string; info: string }
    defendant: { name: string; avatar: string; info: string }
  }
  /** Step 1: Scene hotspots */
  scene: {
    title: string
    description: string
    bgColor: string
    hotspots: SceneHotspot[]
  }
  /** Step 2: Evidence examination */
  evidence: {
    title: string
    description: string
    items: EvidenceItem[]
  }
  /** Step 3: Court debate */
  debate: {
    title: string
    description: string
    stages: DebateStage[]
  }
  /** Step 4: Deliberation */
  deliberation: {
    title: string
    description: string
    laws: LawOption[]
    verdict: {
      question: string
      options: VerdictOption[]
    }
    penalty?: {
      question: string
      options: PenaltOption[]
    }
  }
  /** Step 5: Result */
  result: {
    title: string
    correctVerdict: string
    correctLaw: string
    summary: string
    lawExplanation: string
    xpReward: number
  }
}

export const courtCases: CourtCaseData[] = [
  {
    id: 'case-campus-1',
    title: '走廊里的阴影',
    subtitle: '校园欺凌案',
    emoji: '🏫',
    intro: {
      narrative: [
        '阳光中学初一（3）班的李明最近越来越害怕去学校。',
        '同校初二（1）班的张强，从本学期开始就经常在放学后拦住李明，以"借点钱花"为名索要零花钱。李明不给时，张强就推搡他、在班级群里发他的丑照配文"这个怂包"，还散布"李明偷东西"的谣言。',
        '事情持续了两个月。直到李明的妈妈发现儿子手臂上的淤青和越来越沉默的性格，追问之下才知道真相。李明的妈妈向学校反映后，校方组织了调解。但由于张强否认欺凌行为，调解未能达成一致。',
        '最终，李明的家长将张强及其监护人告上法庭，要求停止侵害、赔礼道歉并赔偿精神损害。',
      ],
      plaintiff: {
        name: '李明',
        avatar: '👦',
        info: '14岁 · 初一（3）班学生，性格内向，成绩中等',
      },
      defendant: {
        name: '张强',
        avatar: '🧑',
        info: '15岁 · 初二（1）班学生，性格外向，此前无违纪记录',
      },
    },
    scene: {
      title: '🔍 案发现场调查',
      description: '你是一名助理法官，被派往阳光中学调查这起案件。在校园里走一走，点击可疑的地方收集线索。',
      bgColor: 'from-sky-100 to-blue-50',
      hotspots: [
        {
          id: 'hotspot-note',
          label: '地上有张揉皱的纸条',
          emoji: '📄',
          x: 15,
          y: 55,
          type: 'physical',
          found: false,
          content: {
            title: '威胁纸条',
            desc: '在走廊角落发现的纸条，上面写着威胁性文字。',
            detail:
              '纸条上用黑色水笔写着："李明，放学别走，我有话跟你说。别告诉老师，否则有你好看。——张"。经笔迹初步比对，与张强的作业本字迹相似。纸条已被塑封袋保存作为物证。',
          },
        },
        {
          id: 'hotspot-phone',
          label: '李明手机里的聊天记录',
          emoji: '📱',
          x: 30,
          y: 40,
          type: 'digital',
          found: false,
          content: {
            title: '班级群聊天记录',
            desc: '李明提供的班级群聊天记录截图。',
            detail:
              '群聊中，张强多次发布李明被P图的表情包，配文如"年度怂包""小偷李"等。其他同学有跟着起哄的，也有少数同学说"别这样"。李明在群中从未回应。时间跨度约3周，共计12条侮辱性内容。',
          },
        },
        {
          id: 'hotspot-witness',
          label: '目击同学小王',
          emoji: '👤',
          x: 65,
          y: 60,
          type: 'testimony',
          found: false,
          content: {
            title: '目击证言 — 王浩',
            desc: '同班同学王浩愿意作证。',
            detail:
              '"我看见过三次。张强在放学后堵在楼梯口，不让李明走。有一次还推了他一把，李明差点摔倒。张强看到我在旁边，就说"看什么看"，我就走了。我觉得李明挺可怜的，但我怕说出来被报复。"',
          },
        },
        {
          id: 'hotspot-teacher',
          label: '班主任工作记录',
          emoji: '📋',
          x: 45,
          y: 25,
          type: 'document',
          found: false,
          content: {
            title: '班主任调解记录',
            desc: '班主任王老师的调解工作记录本。',
            detail:
              '记录显示：王老师分别于2025年9月15日、10月8日、10月22日三次组织双方谈话。第一次张强承认"推了他一下"，但说是"闹着玩"。第二次张强否认发过表情包，称"账号被盗"。第三次张强直接拒绝沟通，称"烦不烦"。三次调解均无结果。',
          },
        },
        {
          id: 'hotspot-bruise',
          label: '李明手臂上的伤痕',
          emoji: '🤕',
          x: 80,
          y: 45,
          type: 'physical',
          found: false,
          content: {
            title: '伤情照片与医院记录',
            desc: '李明妈妈拍摄的手臂淤青照片和医院就诊记录。',
            detail:
              '照片显示李明右前臂有一片约5cm×3cm的紫红色淤青。医院就诊记录诊断为"软组织挫伤"，建议休息观察。就诊日期为2025年10月10日，与李明妈妈声称的"被张强推倒撞到墙角"的时间吻合。',
          },
        },
        {
          id: 'hotspot-cctv',
          label: '走廊监控',
          emoji: '🎥',
          x: 55,
          y: 15,
          type: 'digital',
          found: false,
          content: {
            title: '走廊监控录像',
            desc: '学校走廊监控拍到了事发片段。',
            detail:
              '监控视频（时长47秒）显示：2025年10月10日下午放学后，张强在走廊拦住李明，两人对话约20秒后，张强伸手推了李明肩膀，李明后退两步后转身离开。张强朝着李明离开的方向站立了约5秒后也离开。视频中无音频，故对话内容无法确认。',
          },
        },
      ],
    },
    evidence: {
      title: '⚖️ 法庭调查',
      description: '控辩双方已提交证据。作为主审法官，请逐一审查这些证据是否应该被法庭采纳。点击证据查看详情，然后选择"采纳"或"驳回"。',
      items: [
        {
          id: 'ev-note',
          title: '威胁纸条',
          emoji: '📄',
          type: 'physical',
          description: '在走廊发现的威胁纸条，笔迹已初步比对。',
          detail:
            '物证保全完整，有提取笔录和见证人签名。笔迹鉴定虽不是100%准确，但作为初步证据可以采纳，最终证明力由法庭综合判断。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-chat',
          title: '聊天记录截图',
          emoji: '📱',
          type: 'digital',
          description: '李明提供的班级群聊天记录截图。',
          detail:
            '截图作为电子数据证据，需要确认其真实性。李明能提供原始手机记录供核对，且截图时间连续、内容完整，可以作为证据提交。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-witness',
          title: '王浩证言',
          emoji: '👤',
          type: 'testimony',
          description: '目击同学王浩的书面证词。',
          detail:
            '王浩的证言是直接证据，描述了亲眼所见的事实。虽然王浩担心被报复有所顾虑，但不影响证言的真实性。法庭可要求其出庭作证，并采取保护措施。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-teacher',
          title: '班主任调解记录',
          emoji: '📋',
          type: 'document',
          description: '班主任三次调解的工作记录。',
          detail:
            '工作记录属于书证，记录了张强在不同阶段的说法变化（从承认到否认到拒绝沟通），能反映事实经过。虽然不是正式法律文书，但有参考价值。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-injury',
          title: '伤情照片',
          emoji: '🤕',
          type: 'physical',
          description: '李明手臂淤青照片和医院记录。',
          detail:
            '照片和医院记录能证明伤害后果的存在。但需要确认淤青是否确实由张强的行为造成。监控视频恰好能与此形成印证。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-cctv',
          title: '监控录像',
          emoji: '🎥',
          type: 'digital',
          description: '走廊监控拍到的推搡画面。',
          detail:
            '监控视频是客观证据，能直接证明张强对李明有推搡行为。虽然没有音频无法确认对话内容，但画面本身已足够说明问题。',
          admissible: true,
          correctAccept: true,
        },
      ],
    },
    debate: {
      title: '💬 法庭辩论',
      description: '现在进入法庭辩论环节。作为主审法官，你需要适时追问，查明案件真相。每次对话中有多个追问方向，请选择你认为更合适的。',
      stages: [
        {
          id: 'debate-1',
          speaker: '原告律师（李明的代理律师）',
          speakerEmoji: '👨‍⚖️',
          dialogue:
            '审判长，我方当事人李明自入学以来长期遭受被告张强的欺凌，包括但不限于语言侮辱、身体推搡、恶意P图、散布谣言等行为。这些行为已对李明的身心健康造成严重影响。现有物证、证人证言、监控视频等证据足以证明欺凌事实的存在。',
          choices: [
            {
              id: 'd1-q1',
              text: '询问原告律师：请详细说明欺凌行为持续的时间和频率。',
              reveal: '原告律师出示了一份时间线清单，记录了9月至10月间共计14次不同程度的欺凌事件，平均每周约2次。',
              isRecommended: true,
              feedback: '✅ 好问题！明确时间和频率有助于判断是否构成"持续性"欺凌。',
            },
            {
              id: 'd1-q2',
              text: '直接问被告方：对原告的指控有什么要说的？',
              reveal: '被告律师打断："审判长，我方的当事人否认全部指控。请允许我方进行辩护。"',
              isRecommended: false,
              feedback: '⚠️ 跳过原告陈述直接问被告，在法庭程序上不太规范。应先让原告方充分陈述。',
            },
            {
              id: 'd1-q3',
              text: '问原告：你当时为什么不告诉老师？',
              reveal: '李明低声回答："我……我怕他报复我。他说过告诉老师就让我好看。"',
              isRecommended: false,
              feedback: '⚠️ 这个问题有"指责受害者"的倾向。被欺凌者不告诉老师的原因往往就是害怕报复，不应以此质疑受害者的可信度。',
            },
          ],
        },
        {
          id: 'debate-2',
          speaker: '被告律师（张强的辩护律师）',
          speakerEmoji: '👩‍⚖️',
          dialogue:
            '审判长，我方当事人张强确实与李明有过一些"冲突"，但这只是同学之间的正常矛盾，并非所谓的"欺凌"。至于表情包，现在的孩子都喜欢在群里开玩笑，不能因为李明比较敏感就说是欺凌。至于"推了一下"，那是张强在和李明"闹着玩"，并没有恶意。',
          choices: [
            {
              id: 'd2-q1',
              text: '质问被告律师：李明明确表示拒绝后，张强仍持续针对他，这能算"闹着玩"吗？',
              reveal: '被告律师略微停顿："我的当事人……他可能没有意识到李明不喜欢这样。但这依然是同学间的矛盾，不构成法律意义上的欺凌。"',
              isRecommended: true,
              feedback: '✅ 有力！法律上判断是否构成欺凌，"被害人感受"和"是否违背被害人意愿"是重要标准。',
            },
            {
              id: 'd2-q2',
              text: '问被告张强：你知不知道李明因为你这些话受到很大伤害？',
              reveal: '张强耸了耸肩："我怎么知道他那么脆弱。大家都在玩，就他玩不起。"',
              isRecommended: false,
              feedback: '⚠️ 这个问题虽然想唤起共情，但在法庭上，被告可能不会真诚回答。更需要的是从法律角度剖析行为性质。',
            },
            {
              id: 'd2-q3',
              text: '问班主任：张强此前是否有其他类似行为记录？',
              reveal: '班主任王老师证实："张强上学期曾因推搡同学被警告过一次，但当时被认为是偶发事件。"',
              isRecommended: false,
              feedback: '⚠️ 虽然这个信息有参考价值，但偏离了"本案中张强的行为是否构成欺凌"的核心争议焦点。',
            },
          ],
        },
        {
          id: 'debate-3',
          speaker: '原告律师（李明的代理律师）',
          speakerEmoji: '👨‍⚖️',
          dialogue:
            '审判长，我方最后强调：未成年人保护法和相关司法实践明确指出，校园欺凌的认定不应以"是否造成严重身体伤害"为前提。持续性语言侮辱、社交排斥、恶意传播隐私等行为，即使没有造成明显外伤，也可能构成欺凌。本案证据清晰完整，请求法庭依法裁决。',
          choices: [
            {
              id: 'd3-q1',
              text: '总结陈词：本案核心证据链完整——威胁纸条、聊天记录、监控视频、证人证言、伤情照片，互相印证。本庭将依法裁决。',
              reveal: '法庭肃静。双方律师结束辩论。休庭后，你走进合议室，准备做出最终的裁决。',
              isRecommended: true,
              feedback: '✅ 专业的总结！梳理证据链是法官的重要职责，也有助于双方当事人理解判决的依据。',
            },
            {
              id: 'd3-q2',
              text: '问被告张强：你最后还有什么要说的吗？',
              reveal: '张强沉默了一会儿："……我就是觉得好玩。我不知道会这么严重。"',
              isRecommended: false,
              feedback: '⚠️ 虽然给被告最后陈述机会是程序正义，但在证据已经很清楚的情况下，这拖延了判决进程。',
            },
          ],
        },
      ],
    },
    deliberation: {
      title: '🧠 合议裁决',
      description: '休庭后，你需要根据庭审情况和相关法律，做出最终裁决。',
      laws: [
        {
          id: 'law-1',
          name: '《未成年人保护法》第三十九条',
          summary: '学校应当建立学生欺凌防控工作制度，对学生欺凌行为应当立即制止并通知实施欺凌和被欺凌未成年学生的监护人。',
          isCorrect: false,
          explanation:
            '这条确实相关，但它规范的是学校的责任（应当制止并通知监护人），而非对欺凌行为的法律定性。',
        },
        {
          id: 'law-2',
          name: '《民法典》第一千零二十四条（名誉权）',
          summary: '任何组织或者个人不得以侮辱、诽谤等方式侵害他人的名誉权。',
          isCorrect: false,
          explanation:
            '张强在群内散布谣言、发布侮辱性表情包，确实涉及名誉权侵害。但本案的核心争议是"是否构成校园欺凌"，名誉权只是欺凌行为的一种表现形式。',
        },
        {
          id: 'law-3',
          name: '《未成年人保护法》第一百三十条（欺凌定义）',
          summary:
            '学生欺凌，是指发生在学生之间，一方蓄意或者恶意通过肢体、语言及网络等手段实施欺压、侮辱，造成另一方人身伤害、财产损失或者精神损害的行为。',
          isCorrect: true,
          explanation:
            '✅ 完全正确！本条明确界定了"学生欺凌"的法律定义，包含三个核心要素：①发生在学生之间；②蓄意或恶意；③通过肢体/语言/网络等手段造成伤害。本案中张强的行为完全符合这一定义。',
        },
        {
          id: 'law-4',
          name: '《治安管理处罚法》第四十三条',
          summary: '殴打他人的，或者故意伤害他人身体的，处五日以上十日以下拘留，并处罚款。',
          isCorrect: false,
          explanation:
            '本案虽然有推搡行为，但从监控来看尚未达到"殴打"的程度。且张强是未成年人，优先适用教育矫治而非行政处罚。',
        },
      ],
      verdict: {
        question: '根据现有证据和法律规定，你认为张强的行为是否构成校园欺凌？',
        options: [
          {
            id: 'verdict-yes',
            label: '✅ 构成欺凌',
            desc: '张强的行为符合《未成年人保护法》中"学生欺凌"的定义，对李明造成了身心伤害。',
            isCorrect: true,
            explanation:
              '正确！张强对李明的行为具有持续性（2个月）、蓄意性（多次针对同一人）、伤害性（身心双重伤害），完全符合欺凌的认定标准。即使部分行为（如推搡）单独看可能"不严重"，但综合全部行为来看，欺凌的事实是清楚的。',
          },
          {
            id: 'verdict-no',
            label: '❌ 不构成欺凌',
            desc: '这只是同学之间的矛盾，张强并没有主观恶意，不应该上纲上线。',
            isCorrect: false,
            explanation:
              '不正确。虽然同学矛盾与欺凌之间的界限有时确实模糊，但本案中：①持续时间长达2个月；②行为方式多样（语言/肢体/网络）；③李明明确表现出恐惧和回避；④张强在调解中说法前后矛盾。综合来看，已经超过了"普通冲突"的范畴。',
          },
          {
            id: 'verdict-partial',
            label: '⚠️ 部分构成',
            desc: '推搡和谣言构成欺凌，但"开玩笑"的部分不算。',
            isCorrect: false,
            explanation:
              '这个判断有合理之处，但在法律实践中，欺凌的认定是综合性的——不需要每一次行为都单独构成欺凌。整体来看，张强的行为模式已经形成了对李明的持续性欺压。',
          },
        ],
      },
      penalty: {
        question: '既然认定构成欺凌，你认为应该采取哪种措施？',
        options: [
          {
            id: 'pen-dismiss',
            label: '不予处理，口头批评即可',
            desc: '毕竟都是未成年人，批评教育一下就行了。',
            isCorrect: false,
            explanation:
              '不妥。口头批评不足以让张强认识到行为的严重性，也无法对潜在的欺凌行为形成震慑。',
          },
          {
            id: 'pen-educate',
            label: '学校纪律处分 + 法治教育',
            desc: '责令张强及其监护人赔礼道歉，张强接受学校纪律处分和专门法治教育。',
            isCorrect: true,
            explanation:
              '✅ 恰当的处置！对于未成年人欺凌，教育矫治为主、惩罚为辅。赔礼道歉可以弥补李明的精神伤害，纪律处分和法治教育有助于张强认识到错误并改正。',
          },
          {
            id: 'pen-punish',
            label: '移送公安机关，依法处罚',
            desc: '张强的行为已违法，应该由公安机关介入处理。',
            isCorrect: false,
            explanation:
              '本案中张强的行为尚未达到需要公安机关介入的严重程度（如构成治安管理处罚或刑事犯罪）。优先通过学校教育和民事赔偿途径解决，更有利于未成年人成长。',
          },
        ],
      },
    },
    result: {
      title: '⚖️ 宣判',
      correctVerdict: '构成欺凌',
      correctLaw: '《未成年人保护法》第一百三十条（欺凌定义）',
      summary:
        '张强对李明实施的辱骂、推搡、散布谣言等行为，具有持续性、蓄意性和伤害性，已构成校园欺凌。',
      lawExplanation:
        '💡 什么是校园欺凌？根据《未成年人保护法》第一百三十条，学生欺凌有三个核心判断标准：\n\n' +
        '① **发生在学生之间** — ✅ 张强和李明是同校学生\n' +
        '② **蓄意或恶意** — ✅ 张强行为具有持续性，且在调解中说法前后矛盾，可见其主观故意\n' +
        '③ **造成伤害** — ✅ 李明身心均受到伤害（淤青、恐惧、社交退缩）\n\n' +
        '💡 遇到欺凌怎么办？\n' +
        '• 第一时间告诉老师、家长或其他可信成年人\n' +
        '• 保存证据（聊天记录截图、伤情照片等）\n' +
        '• 不要独自承受，不要以暴制暴\n' +
        '• 必要时拨打 12355（青少年服务台）或 110 求助',
      xpReward: 30,
    },
  },
  {
    id: 'case-network-1',
    title: '刷单的陷阱',
    subtitle: '网络诈骗案',
    emoji: '🌐',
    intro: {
      narrative: [
        '初二学生小宇在刷短视频时看到一则广告："动动手指，日赚500！正规平台，学生可做！"',
        '小宇添加了对方微信后，被拉进一个"兼职刷单群"。群里有上百人，不断有人发"到账截图"。',
        '群主"星辰导师"私聊小宇，说需要先垫付98元激活账户，做完3单即可提现本金+佣金。',
        '小宇转账98元后，对方又说要做"连单任务"需要再付588元才能一起返现。小宇表示没钱了，对方便诱导他使用父母的手机付款。',
        '小宇偷偷用妈妈手机支付了588元后，对方立刻将他拉黑并解散了群。小宇这才意识到被骗了。',
        '妈妈发现转账记录后报警。警方抓获了以王某为首的诈骗团伙，该团伙通过虚假刷单骗取数十名未成年人共计8万余元。',
      ],
      plaintiff: {
        name: '小宇（化名）',
        avatar: '👦',
        info: '14岁 · 初二学生，想靠兼职赚零花钱',
      },
      defendant: {
        name: '王某',
        avatar: '👨',
        info: '28岁 · 无业，组织刷单诈骗团伙，涉案金额8万余元',
      },
    },
    scene: {
      title: '🔍 调查取证',
      description: '作为主审法官，你需要审查警方提交的电子证据，了解诈骗的全过程。',
      bgColor: 'from-purple-100 to-indigo-50',
      hotspots: [
        {
          id: 'hotspot-ad',
          label: '短视频广告截图',
          emoji: '📱',
          x: 20,
          y: 30,
          type: 'digital',
          found: false,
          content: {
            title: '诈骗广告截图',
            desc: '小宇刷到的虚假兼职广告。',
            detail: '广告文案写着"学生党福利！手机兼职，日入300-500元，无需押金，一单一结"。评论区有许多水军刷好评。该账号注册仅3天，无实名认证信息。',
          },
        },
        {
          id: 'hotspot-chat',
          label: '微信聊天记录',
          emoji: '💬',
          x: 45,
          y: 35,
          type: 'digital',
          found: false,
          content: {
            title: '小宇与"星辰导师"的聊天记录',
            desc: '完整的微信聊天记录导出文件。',
            detail: '记录显示：对方先发送了伪造的营业执照和"成功案例"，获取小宇信任后，以"激活账户""连单任务""系统卡单"等话术逐步诱导转账。小宇曾询问"怎么还要交钱"，对方回复"这是流程，做完一起退"。',
          },
        },
        {
          id: 'hotspot-transfer',
          label: '转账记录',
          emoji: '💰',
          x: 60,
          y: 45,
          type: 'digital',
          found: false,
          content: {
            title: '银行转账记录',
            desc: '小宇妈妈手机中的两笔转账记录。',
            detail: '第一笔98元，交易时间19:23，备注"激活费"。第二笔588元，交易时间19:47，收款方为"某网络科技公司"（后查证为空壳公司）。两笔转账均通过微信零钱完成。',
          },
        },
        {
          id: 'hotspot-group',
          label: '刷单群截图',
          emoji: '👥',
          x: 75,
          y: 55,
          type: 'digital',
          found: false,
          content: {
            title: '刷单群聊天记录',
            desc: '"日进斗金"刷单群的群聊记录。',
            detail: '群内有126人，群主每日发布"任务"。多名"群友"定期发布到账截图（经查系团伙成员操纵的托）。群公告写着"本群为正规电商合作推广群"。该群在诈骗得手后立即解散。',
          },
        },
        {
          id: 'hotspot-police',
          label: '警方调查记录',
          emoji: '📋',
          x: 35,
          y: 60,
          type: 'document',
          found: false,
          content: {
            title: '警方案件调查报告',
            desc: '警方对本案的调查取证记录。',
            detail: '警方通过技术手段锁定犯罪嫌疑人王某在广东省某市的落脚点，现场查获手机12部、银行卡8张、U盾4个。手机中发现用于诈骗的话术本，包含"如何获取学生信任""当受害人质疑时的话术"等内容。',
          },
        },
        {
          id: 'hotspot-victims',
          label: '其他受害人名单',
          emoji: '📄',
          x: 50,
          y: 20,
          type: 'document',
          found: false,
          content: {
            title: '其他受害人清单',
            desc: '警方查获的该团伙诈骗记录。',
            detail: '除小宇外，还有31名受害人均为14-17岁学生，分布在全国12个省份。诈骗金额从98元到2000元不等，累计金额82560元。证明这不是偶发行为，而是有组织的针对未成年人的诈骗犯罪。',
          },
        },
      ],
    },
    evidence: {
      title: '⚖️ 法庭调查',
      description: '检方提交了以下证据。请逐一审查是否应被法庭采纳。',
      items: [
        {
          id: 'ev-ad',
          title: '虚假广告截图',
          emoji: '📱',
          type: 'digital',
          description: '小宇保存的短视频广告截图。',
          detail: '电子数据证据。截图保存完整，时间和链接信息清晰。小宇能提供原始手机记录供核对。可作为证据采纳。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-chat-log',
          title: '微信聊天记录',
          emoji: '💬',
          type: 'digital',
          description: '小宇与诈骗分子的完整聊天记录。',
          detail: '从手机导出的完整聊天记录，包含时间戳和双方消息。证据提取过程合法，内容完整。可作为电子数据证据。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-transfer',
          title: '转账流水',
          emoji: '💰',
          type: 'digital',
          description: '银行出具的转账流水凭证。',
          detail: '由银行官方出具的流水凭证，加盖银行公章，真实性无异议。可作为书证采纳。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-script',
          title: '诈骗话术本',
          emoji: '📋',
          type: 'document',
          description: '警方在王某住处查获的纸质话术本。',
          detail: '话术本详细记录了针对不同人群的诈骗话术，其中"学生组"专门标注了"利用其社会经验不足、渴望赚钱的心理"。话术本上有王某的指纹。物证保全程序合法。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-testimony',
          title: '其他受害人证言',
          emoji: '📄',
          type: 'document',
          description: '警方对多名受害学生的询问笔录。',
          detail: '询问笔录格式规范，有被询问人签名确认。虽然部分内容与本案无直接关联，但能证明该团伙的诈骗模式和主观恶意。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-age',
          title: '王某年龄争议',
          emoji: '📅',
          type: 'document',
          description: '王某的户籍信息与出生证明不一致。',
          detail: '户籍登记显示王某28岁，但辩护方提交的出生证明显示实际年龄可能为17岁（作案时不满18岁）。该证据需要进一步核实。',
          admissible: false,
          inadmissibleReason: '出生证明的真实性存疑，且与户籍登记不一致。需要进一步调查核实后才能决定是否采纳。',
          correctAccept: false,
        },
      ],
    },
    debate: {
      title: '💬 法庭辩论',
      description: '现在进入法庭辩论环节。作为主审法官，请选择更合适的追问方向。',
      stages: [
        {
          id: 'debate-n1',
          speaker: '公诉人',
          speakerEmoji: '👨‍⚖️',
          dialogue:
            '审判长，被告人王某以非法占有为目的，利用电信网络技术手段，虚构"刷单返利"事实，骗取多名未成年人钱财共计8万余元。其行为已构成诈骗罪，且针对未成年人犯罪、利用网络实施犯罪，均应依法从重处罚。',
          choices: [
            {
              id: 'dn1-q1',
              text: '问公诉人：请详细说明被告人的犯罪手法和组织形式。',
              reveal: '公诉人出示了组织架构图：王某为团伙首要分子，下设"话务组"（负责引流）3人、"技术组"（负责伪造截图）2人、"洗钱组"（负责转移资金）2人。分工明确、组织严密。',
              isRecommended: true,
              feedback: '✅ 好问题！查明犯罪组织架构有助于确定王某在共同犯罪中的地位和作用。',
            },
            {
              id: 'dn1-q2',
              text: '直接问王某：你对指控认不认罪？',
              reveal: '王某低头："认……认罪。"',
              isRecommended: false,
              feedback: '⚠️ 在公诉人尚未完整陈述前就直接问被告，程序上不够严谨。',
            },
          ],
        },
        {
          id: 'debate-n2',
          speaker: '辩护律师',
          speakerEmoji: '👩‍⚖️',
          dialogue:
            '审判长，我方当事人虽然认罪，但有几点需要说明：第一，王某本人文化程度较低，法律意识淡薄；第二，王某到案后如实供述，认罪态度良好；第三，王某家属愿意积极退赃退赔。请求法庭从轻处罚。',
          choices: [
            {
              id: 'dn2-q1',
              text: '问辩护律师：你们的退赔方案是什么？小宇的损失能否全额追回？',
              reveal: '辩护律师表示王某家属已筹集4万元退赔款，但全部损失8万余元无法全额赔偿。"我们尽力了，但确实能力有限。"',
              isRecommended: true,
              feedback: '✅ 关注受害人的实际损失能否挽回，这是法官应该关心的核心问题。',
            },
            {
              id: 'dn2-q2',
              text: '质问辩护律师：法律意识淡薄就能减轻责任吗？',
              reveal: '辩护律师："不，我方只是希望法庭综合考虑。"',
              isRecommended: false,
              feedback: '⚠️ 这个问题带有情绪化倾向。法官应保持中立客观，不宜在庭上表现出对某一方的不满。',
            },
          ],
        },
        {
          id: 'debate-n3',
          speaker: '公诉人（反驳）',
          speakerEmoji: '👨‍⚖️',
          dialogue:
            '审判长，辩护方提到的退赃退赔可以酌情考虑，但本案被告的行为具有明确针对性和预谋性——话术本中专门针对"学生党"设计话术，利用了未成年人社会经验不足的特点实施诈骗。且受害人多为14-15岁的中学生，被骗的钱不少是家里给的生活费或父母的辛苦钱。社会危害性大，应依法严惩。',
          choices: [
            {
              id: 'dn3-q1',
              text: '休庭后综合评议。提醒双方：本庭会综合考虑认罪态度、退赃情况和犯罪情节作出判决。',
              reveal: '双方律师表示没有补充意见。法庭宣布休庭。你走进合议室，准备做出裁决。',
              isRecommended: true,
              feedback: '✅ 专业的处理！法官在庭上不宜过早表态，保持中立、充分听取双方意见后合议裁决，是最规范的做法。',
            },
            {
              id: 'dn3-q2',
              text: '问王某：你对那些被你骗了钱的学生有什么想说的？',
              reveal: '王某："我……对不起。我以后不会了。"',
              isRecommended: false,
              feedback: '⚠️ 这个问题虽然想唤起悔意，但法庭上被告人的"对不起"没有实际法律意义，且可能让受害人感到更加愤怒。',
            },
          ],
        },
      ],
    },
    deliberation: {
      title: '🧠 合议裁决',
      description: '现在你需要根据庭审情况和相关法律，对本案作出裁决。',
      laws: [
        {
          id: 'law-n1',
          name: '《刑法》第二百六十六条（诈骗罪）',
          summary: '诈骗公私财物，数额较大的，处三年以下有期徒刑、拘役或者管制，并处或者单处罚金。',
          isCorrect: true,
          explanation: '✅ 正确！本案的核心就是诈骗罪。王某以非法占有为目的，虚构事实骗取他人财物，8万余元已达到"数额巨大"标准。',
        },
        {
          id: 'law-n2',
          name: '《反电信网络诈骗法》',
          summary: '电信网络诈骗的预防和惩治，保护公民合法权益。',
          isCorrect: false,
          explanation: '虽然本案涉及电信网络诈骗手法，但定罪量刑仍应适用《刑法》。该法更多是行政法层面的规范。',
        },
        {
          id: 'law-n3',
          name: '《未成年人保护法》',
          summary: '保护未成年人身心健康，保障未成年人合法权益。',
          isCorrect: false,
          explanation: '受害人确实是未成年人，但这是定罪情节的考量因素，不是定罪的法律依据。',
        },
      ],
      verdict: {
        question: '你认为王某的行为构成什么罪？',
        options: [
          {
            id: 'verdict-n-yes',
            label: '✅ 诈骗罪',
            desc: '王某以非法占有为目的，虚构刷单返利事实，骗取他人财物，数额巨大。',
            isCorrect: true,
            explanation: '正确！诈骗罪的构成要件：①非法占有为目的；②虚构事实/隐瞒真相；③骗取数额较大的财物。本案中王某的行为完全满足这三个要件。而且针对未成年人实施诈骗、利用网络实施诈骗，均属于从重处罚情节。',
          },
          {
            id: 'verdict-n-no',
            label: '❌ 不构成犯罪',
            desc: '这只是民事纠纷，王某应该退钱但不构成犯罪。',
            isCorrect: false,
            explanation: '不正确。诈骗金额达8万余元、受害人32人、有组织有预谋，远超民事纠纷范畴。',
          },
        ],
      },
      penalty: {
        question: '考虑到王某认罪认罚、部分退赃，你认为如何量刑？',
        options: [
          {
            id: 'pen-n-light',
            label: '有期徒刑三年，缓刑四年',
            desc: '既然认罪态度好、部分退赃，给一个改过自新的机会。',
            isCorrect: false,
            explanation: '虽然认罪退赃可以从轻，但本案涉案金额巨大、受害人多、针对未成年人，社会危害性大。缓刑不足以体现刑罚的惩戒功能。',
          },
          {
            id: 'pen-n-medium',
            label: '有期徒刑三年六个月，并处罚金',
            desc: '综合考虑犯罪情节和悔罪态度。',
            isCorrect: true,
            explanation: '✅ 恰当的判决！《刑法》规定诈骗"数额巨大"（3万-10万以上）处3-10年有期徒刑。8万余元属于数额巨大，3年6个月在法定刑幅度内，且结合了认罪认罚从宽处理的原则。',
          },
          {
            id: 'pen-n-heavy',
            label: '有期徒刑七年，并处罚金',
            desc: '针对未成年人犯罪，必须严惩。',
            isCorrect: false,
            explanation: '刑罚过重。虽然针对未成年人犯罪应从重，但王某有认罪认罚、部分退赃等从轻情节，7年明显超出了合理范围。',
          },
        ],
      },
    },
    result: {
      title: '⚖️ 宣判',
      correctVerdict: '诈骗罪成立',
      correctLaw: '《刑法》第二百六十六条（诈骗罪）',
      summary:
        '王某以非法占有为目的，利用电信网络手段虚构"刷单返利"事实，骗取32名未成年人8万余元，构成诈骗罪。综合认罪认罚、部分退赃等情节，判处有期徒刑三年六个月，并处罚金。',
      lawExplanation:
        '💡 **什么是诈骗罪？**\n\n' +
        '根据《刑法》第二百六十六条，诈骗罪的核心是：\n' +
        '① **非法占有为目的** — 从来没想过返利，就是骗钱\n' +
        '② **虚构事实/隐瞒真相** — "刷单返利"是假的\n' +
        '③ **骗取数额较大财物** — 8万余元已达"数额巨大"\n\n' +
        '💡 **防骗提醒**\n' +
        '• 凡是要求"先垫付""先交钱"的兼职，100%是诈骗\n' +
        '• 不要轻信短视频、微信群的"轻松赚钱"广告\n' +
        '• 不要向陌生人透露手机验证码、支付密码\n' +
        '• 遇到诈骗第一时间告诉家长并拨打110\n' +
        '• 96110是反诈预警劝阻电话，一定要接！',
      xpReward: 30,
    },
  },
  {
    id: 'case-consumer-1',
    title: '648元的秘密',
    subtitle: '未成年人网游充值案',
    emoji: '🎮',
    intro: {
      narrative: [
        '12岁的小杰是一名初一学生，最近迷上了一款热门手机游戏。',
        '在游戏里，他通过不断充值购买"皮肤"和"装备"来提升段位。短短一个月内，他先后通过妈妈的微信支付充值了27笔，累计金额12684元。',
        '小杰知道妈妈手机的支付密码（妈妈平时买菜让他帮忙输入过）。每次充值后，他都删除了银行的扣款短信。',
        '直到妈妈去银行取钱时发现余额不对，打印流水后才发现这27笔"某游戏公司"的扣款记录。',
        '妈妈带着小杰联系游戏公司客服要求退款，但客服以"账号是成年人实名认证的"为由拒绝退款。',
        '无奈之下，小杰的妈妈将该游戏公司诉至法院，要求返还充值款项。',
      ],
      plaintiff: {
        name: '小杰（及其法定监护人）',
        avatar: '👦',
        info: '12岁 · 初一学生，使用妈妈手机玩游戏并充值',
      },
      defendant: {
        name: '某网络游戏公司',
        avatar: '🏢',
        info: '注册资金1000万元，运营多款手机网络游戏',
      },
    },
    scene: {
      title: '🔍 调查取证',
      description: '作为主审法官，你需要审查双方提交的证据材料。',
      bgColor: 'from-emerald-100 to-teal-50',
      hotspots: [
        {
          id: 'hotspot-pay',
          label: '微信支付记录',
          emoji: '💳',
          x: 25,
          y: 30,
          type: 'digital',
          found: false,
          content: {
            title: '微信支付流水账单',
            desc: '小杰妈妈手机中的微信支付记录。',
            detail: '近30天内共有27笔向"某游戏公司"的付款，金额从6元到648元不等，合计12684元。交易时间集中在放学后的18:00-22:00以及周末全天。其中最大一笔648元发生在某周六凌晨1:23。',
          },
        },
        {
          id: 'hotspot-game',
          label: '游戏账号信息',
          emoji: '🎮',
          x: 45,
          y: 25,
          type: 'digital',
          found: false,
          content: {
            title: '游戏账号注册信息',
            desc: '小杰在该游戏中的账号资料。',
            detail: '该账号使用手机号注册，实名认证信息为"张XX"（小杰妈妈的名字）。游戏内角色等级65级，VIP等级8级（累计充值1万元以上）。近30天登录IP地址均为本市。该账号没有更换过绑定手机。',
          },
        },
        {
          id: 'hotspot-school',
          label: '学校证明',
          emoji: '📄',
          x: 65,
          y: 35,
          type: 'document',
          found: false,
          content: {
            title: '学校出具的在校证明',
            desc: '小杰所在学校出具的学生在校时间证明。',
            detail: '证明小杰为该校初一（3）班在读学生，年龄12周岁，在校时间为周一至周五7:30-17:00。充值记录显示，其中12笔充值发生在在校时间以外，另有3笔充值发生在凌晨时段。',
          },
        },
        {
          id: 'hotspot-history',
          label: '充值历史截图',
          emoji: '📱',
          x: 40,
          y: 50,
          type: 'digital',
          found: false,
          content: {
            title: '游戏内充值历史',
            desc: '从游戏账号中导出的充值历史。',
            detail: '27笔充值的购买记录与微信支付记录完全吻合，每笔充值均获得了对应的游戏虚拟道具（皮肤、月卡、战令等）。部分道具已被使用，部分仍在背包中。该账号的游戏内聊天记录显示有"明天上学要迟到了""偷偷买的别让我妈知道"等语句。',
          },
        },
        {
          id: 'hotspot-policy',
          label: '游戏公司的条款',
          emoji: '📋',
          x: 60,
          y: 55,
          type: 'document',
          found: false,
          content: {
            title: '游戏用户协议（节选）',
            desc: '该游戏的用户注册协议和充值条款。',
            detail: '协议中写有"用户须确保其为具有完全民事行为能力的自然人""如用户为未成年人，应在监护人同意和使用下使用本服务"。但注册流程中无实质性的年龄核验机制，仅通过点击"我已同意"完成。实名认证仅需输入身份证号，无活体验证。',
          },
        },
        {
          id: 'hotspot-activity',
          label: '游戏行为日志',
          emoji: '📊',
          x: 30,
          y: 60,
          type: 'digital',
          found: false,
          content: {
            title: '游戏行为日志分析',
            desc: '游戏公司提供的该账号行为数据。',
            detail: '账号平均每次登录时长2.3小时。充值行为有规律性：工作日在18-22点，周末在9-23点。游戏内聊天内容显示与其他玩家的交流用词和语气符合低龄特征（如"大佬带带我""这皮肤好帅但好贵"）。',
          },
        },
      ],
    },
    evidence: {
      title: '⚖️ 法庭调查',
      description: '双方提交了以下证据。请逐一审查。',
      items: [
        {
          id: 'ev-c-pay',
          title: '微信支付流水',
          emoji: '💳',
          type: 'digital',
          description: '原告方提交的微信支付记录，证明充值事实。',
          detail: '银行官方流水，加盖印章，证据形式合法。27笔记录完整清晰，时间、金额、收款方均明确。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-c-account',
          title: '游戏账号信息',
          emoji: '🎮',
          type: 'digital',
          description: '游戏公司提供的账号注册和充值信息。',
          detail: '游戏公司系统导出数据，证明该账号确实收到了充值并发放了对应道具。数据完整真实。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-c-school',
          title: '在校证明',
          emoji: '📄',
          type: 'document',
          description: '学校出具的小杰在校证明。',
          detail: '学校官方出具的证明文件，有学校公章。能证明小杰的年龄和在校时间。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-c-chat',
          title: '聊天记录',
          emoji: '💬',
          type: 'digital',
          description: '游戏内聊天记录片段。',
          detail: '虽然能反映使用者的语言习惯，但聊天记录可能被篡改或断章取义。需要结合其他证据综合判断。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-c-eula',
          title: '用户协议',
          emoji: '📋',
          type: 'document',
          description: '游戏公司的用户注册协议。',
          detail: '协议中有对未成年人充值的相关条款，但实际执行中未设置有效核验。协议本身不能免除游戏公司的审核义务。',
          admissible: true,
          correctAccept: true,
        },
        {
          id: 'ev-c-ip',
          title: 'IP地址属地分析',
          emoji: '🌐',
          type: 'digital',
          description: '游戏公司提供的IP地址属地信息。',
          detail: 'IP分析显示所有登录和充值行为均发生在小杰所在城市。且IP段与其家庭宽带吻合。这证明充值行为确实是在小杰家中完成的。',
          admissible: true,
          correctAccept: true,
        },
      ],
    },
    debate: {
      title: '💬 法庭辩论',
      description: '双方律师进行法庭辩论。请选择更合适的追问方向。',
      stages: [
        {
          id: 'debate-c1',
          speaker: '原告律师（小杰的代理律师）',
          speakerEmoji: '👨‍⚖️',
          dialogue:
            '审判长，我方当事人小杰年仅12岁，属于限制民事行为能力人。根据《民法典》规定，其大额消费行为需要法定代理人同意或追认。本案中27笔共计12684元的充值明显超出了其年龄和智力相适应的范围，其法定代理人（母亲）明确表示不同意，因此该充值行为应认定为无效，游戏公司应当全额退款。',
          choices: [
            {
              id: 'dc1-q1',
              text: '问原告律师：请说明小杰的年龄与民事行为能力的法律关系。',
              reveal: '原告律师出示了民法典相关条文："《民法典》第十九条——八周岁以上的未成年人为限制民事行为能力人，实施民事法律行为由其法定代理人代理或者经其法定代理人同意、追认。"',
              isRecommended: true,
              feedback: '✅ 好问题！确认法律依据是裁决的基础。',
            },
            {
              id: 'dc1-q2',
              text: '问被告律师：你们对这个问题怎么看？',
              reveal: '被告律师："请允许我方答辩。我方认为用户协议已明确说明，用户注册即视为同意协议条款。"',
              isRecommended: false,
              feedback: '⚠️ 原告尚未充分陈述，直接问被告不利于查明事实。',
            },
          ],
        },
        {
          id: 'debate-c2',
          speaker: '被告律师（游戏公司代理律师）',
          speakerEmoji: '👩‍⚖️',
          dialogue:
            '审判长，我方不同意原告诉求。第一，该账号使用成年人的身份信息完成实名认证，游戏公司有理由相信使用者是成年人；第二，充值后虚拟道具已经被消耗使用，无法"退货"；第三，家长没有尽到对手机和支付密码的监管责任，不应将责任全部转嫁给游戏公司。',
          choices: [
            {
              id: 'dc2-q1',
              text: '问被告律师：你们的实名认证系统能否有效识别未成年人？',
              reveal: '被告律师承认："我们的实名认证通过公安接口验证姓名和身份证号是否匹配，但……没有活体检测。如果未成年人使用家长的身份信息，确实难以识别。"',
              isRecommended: true,
              feedback: '✅ 抓住关键问题！实名认证系统的漏洞是本案的核心争议点之一。',
            },
            {
              id: 'dc2-q2',
              text: '问原告方：你们为什么没有看好孩子和手机？',
              reveal: '原告母亲："我……我平时要上班，不可能24小时盯着他。支付密码是我买菜时让他帮忙输入过，他就记住了。"',
              isRecommended: false,
              feedback: '⚠️ 这个问题有"指责家长"的倾向。法官应避免让当事人感到被审判。',
            },
          ],
        },
        {
          id: 'debate-c3',
          speaker: '原告律师（补充陈述）',
          speakerEmoji: '👨‍⚖️',
          dialogue:
            '审判长，关于被告提出的"家长监管责任"问题，我方认为：即使家长存在一定的疏忽，也不能免除游戏公司依法应承担的责任。《未成年人保护法》明确规定，网络产品和服务提供者应当建立便捷、合理的投诉和举报渠道，及时处理涉未成年人的纠纷。游戏公司明知账号消费异常——凌晨充值、高频小额充值——却未采取任何预警或干预措施，存在明显过错。',
          choices: [
            {
              id: 'dc3-q1',
              text: '总结：本案核心是未成年人保护与商业利益之间的平衡。本庭将综合考虑双方过错程度作出裁决。',
              reveal: '双方律师表示无补充。法庭休庭。你进入合议室准备裁决。',
              isRecommended: true,
              feedback: '✅ 准确的总结！法官要看到问题的本质：这不是简单的"退不退钱"，而是如何在保护未成年人和维护交易安全之间找到平衡。',
            },
            {
              id: 'dc3-q2',
              text: '问双方：你们是否愿意庭外调解？',
              reveal: '原告表示愿意接受调解，但被告表示"公司政策不支持部分退款"。调解可能性不大。',
              isRecommended: false,
              feedback: '⚠️ 虽然调解是好事，但从被告的表态看调解成功的可能性很低，继续推进庭审更有效率。',
            },
          ],
        },
      ],
    },
    deliberation: {
      title: '🧠 合议裁决',
      description: '现在你需要根据庭审情况和相关法律，对本案作出裁决。',
      laws: [
        {
          id: 'law-c1',
          name: '《民法典》第十九条',
          summary: '八周岁以上的未成年人为限制民事行为能力人，实施民事法律行为由其法定代理人同意、追认。',
          isCorrect: true,
          explanation: '✅ 正确！这是本案最核心的法律依据。小杰12岁，属于限制民事行为能力人，其12684元的充值行为显然超出了其年龄和智力相适应的范围，需要法定代理人追认才有效。',
        },
        {
          id: 'law-c2',
          name: '《未成年人保护法》第七十七条',
          summary: '网络产品和服务提供者应当建立便捷、合理的投诉和举报渠道，及时处理涉未成年人的纠纷。',
          isCorrect: false,
          explanation: '这条规定也很重要，但它规定的是网络服务提供者的义务，而非本案实体争议的法律依据。',
        },
        {
          id: 'law-c3',
          name: '《消费者权益保护法》第二十五条',
          summary: '经营者采用网络方式销售商品，消费者有权自收到商品之日起七日内退货。',
          isCorrect: false,
          explanation: '该条规定的"七天无理由退货"适用于一般商品。虚拟道具是否适用存在争议，且本案核心不是退货问题，而是民事行为是否有效。',
        },
      ],
      verdict: {
        question: '你认为小杰的充值行为是否有效？游戏公司应否退款？',
        options: [
          {
            id: 'verdict-c-yes',
            label: '✅ 充值无效，应部分退款',
            desc: '小杰的行为超出其民事行为能力，监护人未追认，充值无效。但监护人也有疏忽，应承担部分责任。',
            isCorrect: true,
            explanation: '正确！法院应综合考虑：①小杰的充值行为未经监护人同意，应认定为无效；②但监护人未妥善保管支付密码，存在一定过错；③虚拟道具部分已被消耗。因此判决游戏公司退还大部分款项（如70-80%），剩余部分由监护人承担。这是司法实践中常见的处理方式。',
          },
          {
            id: 'verdict-c-full',
            label: '⚖️ 全额退款',
            desc: '既然充值无效，游戏公司就应当全额返还。',
            isCorrect: false,
            explanation: '虽然充值行为无效，但监护人确实存在保管支付密码不当的过错，且部分虚拟道具已被消耗。全额退款对游戏公司不公平，也不利于督促家长履行监护职责。司法实践中极少支持全额退款。',
          },
          {
            id: 'verdict-c-no',
            label: '❌ 驳回诉求，不退款',
            desc: '家长管理不当，游戏公司无责。',
            isCorrect: false,
            explanation: '不正确。虽然家长存在疏忽，但游戏公司的实名认证系统存在明显漏洞（无活体验证），且在消费异常时未采取任何预警措施。完全免除游戏公司的责任不符合未成年人保护的法律精神。',
          },
        ],
      },
      penalty: {
        question: '你认为赔偿比例如何确定？',
        options: [
          {
            id: 'pen-c-80',
            label: '游戏公司退还80%',
            desc: '游戏公司承担主要责任，家长承担次要责任。',
            isCorrect: true,
            explanation: '✅ 合理的比例！游戏公司实名认证系统存在漏洞、未对异常消费预警，应承担主要责任（约80%）。家长未妥善保管支付密码，承担次要责任（约20%）。这与最高人民法院发布的未成年人网游充值典型案例的处理原则一致。',
          },
          {
            id: 'pen-c-50',
            label: '双方各承担50%',
            desc: '一半一半，公平合理。',
            isCorrect: false,
            explanation: '虽然看似"公平"，但游戏公司作为专业经营者，在未成年人保护方面的法定义务更重，承担50%的比例过低，不足以督促其改进认证系统。',
          },
          {
            id: 'pen-c-100',
            label: '游戏公司退100%',
            desc: '孩子不懂事，公司应该全退。',
            isCorrect: false,
            explanation: '家长确实存在保管支付密码的疏忽。司法实践中，法院通常不会支持100%退款，而是根据双方过错程度确定比例。',
          },
        ],
      },
    },
    result: {
      title: '⚖️ 宣判',
      correctVerdict: '充值无效·部分退款',
      correctLaw: '《民法典》第十九条（限制民事行为能力人）',
      summary:
        '小杰（12岁，限制民事行为能力人）的12684元充值行为超出其年龄和智力相适应的范围，监护人未追认，行为无效。但监护人存在保管支付密码不当的过错。判决游戏公司退还充值金额的80%，即10147元。',
      lawExplanation:
        '💡 **限制民事行为能力人是什么？**\n\n' +
        '《民法典》第十九条：8-18岁的人属于**限制民事行为能力人**。\n' +
        '→ 可以独立实施纯获利益的民事法律行为（如收红包）\n' +
        '→ 可以独立实施与其年龄、智力相适应的行为（如买文具）\n' +
        '→ **大额消费需要监护人同意或追认**\n\n' +
        '💡 **未成年人网游充值怎么处理？**\n' +
        '• 充值金额明显超出年龄范围 → 家长可主张无效要求退款\n' +
        '• 但家长也需要证明是孩子充值、自己有尽到监管\n' +
        '• 司法实践中通常支持部分退款（70-85%），非100%\n\n' +
        '💡 **给青少年的建议**\n' +
        '• 游戏充值前先问家长，不要偷拿手机付款\n' +
        '• 删除扣款短信不是"没事了"，反而会让问题更严重\n' +
        '• 648元的皮肤≠快乐，理性消费才是真酷！',
      xpReward: 30,
    },
  },
  {
    id: 'case-traffic-1',
  title: '十字路口的抉择',
  subtitle: '未成年人骑行电动车肇事案',
  emoji: '🚦',
  intro: {
    narrative: [
      '16岁的高一学生小杰，每天骑电动车上下学。',
      '某天放学后，小杰载着同学小林一起回家。途经一个没有红绿灯的十字路口时，小杰没有减速观察，直接横穿马路。',
      '一辆正常行驶的小轿车为了避让小杰的电动车，紧急转向撞上了路边的电线杆。轿车车头严重损坏，司机王先生头部受伤。',
      '交警调查认定：小杰未满18周岁驾驶电动车、违规载人、通过路口未减速让行，负事故主要责任。',
      '王先生出院后，将小杰及其监护人诉至法院，要求赔偿医疗费、车辆维修费等共计68000元。',
    ],
    plaintiff: { name: '王先生', avatar: '👨', info: '35岁 · 公司职员，正常驾驶中被撞伤' },
    defendant: { name: '小杰（及其监护人）', avatar: '👦', info: '16岁 · 高一学生，违规驾驶电动车载人肇事' },
  },
  scene: {
    title: '🔍 事故现场调查',
    description: '你是一名交通法庭的法官，需要审查交警部门提交的事故证据材料。',
    bgColor: 'from-sky-100 to-slate-50',
    hotspots: [
      {
        id: 'ts-scene', label: '事故现场照片', emoji: '📷', x: 25, y: 30, type: 'physical', found: false,
        content: { title: '事故现场全景', desc: '交警拍摄的事故现场照片。', detail: '一辆银色轿车撞在路边的电线杆上，车头左侧严重凹陷。电动车倒在轿车后方约3米处，地上有明显的刹车痕迹和刮擦痕。路口四个方向均无交通信号灯。', insight: '电动车位置和刹车痕迹能帮助判断当时的车速和碰撞过程。' },
      },
      {
        id: 'ts-damage', label: '车辆损坏鉴定', emoji: '🔧', x: 45, y: 35, type: 'physical', found: false,
        content: { title: '车辆损坏鉴定报告', desc: '专业机构出具的两车损坏鉴定。', detail: '轿车：前保险杠断裂、左前大灯破碎、引擎盖变形，维修估价42000元。电动车：前轮偏摆、车身右侧刮痕，维修估价600元。', insight: '轿车损失远大于电动车，说明司机为了避让做了紧急转向。' },
      },
      {
        id: 'ts-driver', label: '轿车司机陈述', emoji: '🗣️', x: 65, y: 50, type: 'testimony', found: false,
        content: { title: '王先生的陈述', desc: '轿车司机王先生对事故经过的描述。', detail: '「我当时正常行驶，大概40码的速度。到路口时突然看到右边冲出来一辆电动车，车上还坐了两个人！我本能地猛打方向盘想避开，结果就撞上了电线杆。」王先生因头部撞击导致轻微脑震荡，住院5天。', insight: '40码是正常速度。电动车从右侧突然冲出——说明小杰没有在路口停车观察。' },
      },
      {
        id: 'ts-teen', label: '小杰的陈述', emoji: '👦', x: 35, y: 55, type: 'testimony', found: false,
        content: { title: '小杰的事故陈述', desc: '小杰在交警队的询问笔录。', detail: '「我就想着赶紧回家……那个路口平时没什么车的。我确实没看到那辆车……等我看到的时候已经来不及了。我知道不能载人的，但小林说顺路带他一程……」小杰在询问中数次哽咽。', insight: '「没看到」说明他根本没有在路口减速观察。「知道不能载人但还是做了」——明知故犯。' },
      },
      {
        id: 'ts-law', label: '交通法规摘录', emoji: '📋', x: 50, y: 20, type: 'document', found: false,
        content: { title: '相关交通法规', desc: '交警部门提供的交通法规依据。', detail: '《道路交通安全法实施条例》第七十二条：驾驶电动自行车必须年满16周岁。第七十三条：非机动车不得载人。通过没有信号灯的路口应当减速慢行、让行。', insight: '小杰年满16岁可以骑电动车，但电动车不得载人——他已经违规了。' },
      },
      {
        id: 'ts-medical', label: '医院诊断书', emoji: '🏥', x: 70, y: 25, type: 'document', found: false,
        content: { title: '王先生的医疗记录', desc: '医院出具的王先生的诊断书和费用清单。', detail: '诊断：轻度脑震荡、颈部软组织损伤。住院5天，医疗费共计12000元。医嘱建议休息2周。所有费用清单完整，有医院公章。', insight: '伤势不算特别严重但确凿属实，医疗费是合理的实际损失。' },
      },
    ],
  },
  evidence: {
    title: '⚖️ 法庭调查',
    description: '双方提交了以下证据，请逐一审查是否采纳。',
    items: [
      { id: 'ev-ts-photo', title: '事故现场照片', emoji: '📷', type: 'physical', description: '交警拍摄的现场全景照片及细节照片。', detail: '照片证据形式合法，有拍摄时间和地点信息，能客观反映事故现场情况。', admissible: true, correctAccept: true },
      { id: 'ev-ts-report', title: '交警事故认定书', emoji: '📄', type: 'document', description: '交警部门出具的道路交通事故认定书。', detail: '官方文书，有交警部门盖章和经办人签名，认定事实清楚。', admissible: true, correctAccept: true },
      { id: 'ev-ts-medical', title: '医疗费用清单', emoji: '🏥', type: 'document', description: '王先生的医疗费用明细和诊断证明。', detail: '医院正规票据，诊断与事故的关联性明确，费用合理。', admissible: true, correctAccept: true },
      { id: 'ev-ts-repair', title: '车辆维修报价单', emoji: '🔧', type: 'document', description: '4S店出具的车辆维修估价单。', detail: '4S店官方报价，各项维修项目明码标价。', admissible: true, correctAccept: true },
      { id: 'ev-ts-cctv', title: '路口监控录像', emoji: '📹', type: 'digital', description: '附近商铺的监控拍到了事故经过。', detail: '监控录像清晰记录了电动车横穿路口与轿车碰撞的全过程，是最有力的证据之一。', admissible: true, correctAccept: true },
      { id: 'ev-ts-school', title: '学校违纪记录', emoji: '📋', type: 'document', description: '小杰在校的违纪记录，证明其多次违反校规。', detail: '虽然能反映小杰的行为习惯，但与本次交通事故无直接关联，且可能引起对当事人品格的偏见。', admissible: false, inadmissibleReason: '品格证据与本案无直接关联，可能引起不公正偏见。', correctAccept: false },
    ],
  },
  debate: {
    title: '💬 法庭辩论',
    description: '双方律师就责任划分和赔偿金额展开辩论。',
    stages: [
      {
        id: 'debate-t1', speaker: '原告律师', speakerEmoji: '👨‍⚖️',
        dialogue: '审判长，被告小杰未满18周岁驾驶电动车上路、违规载人、通过路口未减速让行，其违法行为是导致本次事故发生的直接原因。我方当事人正常行驶无任何过错。请求法庭判令被告及其监护人赔偿全部损失。',
        choices: [
          { id: 'dt1-q1', text: '问原告律师：请说明各赔偿项目的具体依据。', reveal: '原告律师逐项说明了医疗费12000元、护理费3000元、误工费8000元、车辆维修费42000元、精神损害抚慰金3000元，共计68000元的计算依据。每一项都有对应的票据或法律依据。', isRecommended: true, feedback: '✅ 好问题！明确赔偿依据有助于后续裁决。' },
          { id: 'dt1-q2', text: '直接问小杰：你知不知道骑电动车不能载人？', reveal: '小杰低头：「知……知道。」', isRecommended: false, feedback: '⚠️ 跳过原告陈述直接质问被告，程序上不规范。' },
        ],
      },
      {
        id: 'debate-t2', speaker: '被告律师', speakerEmoji: '👩‍⚖️',
        dialogue: '审判长，我方承认小杰的行为存在过错。但原告作为驾驶经验丰富的成年人，在经过路口时也未做到充分的观察和预判。且我方当事人是未成年人，认知能力和判断力有限，请求法庭在责任划分上综合考虑。',
        choices: [
          { id: 'dt2-q1', text: '要求被告律师说明：未成年人身份是否应减轻赔偿责任？', reveal: '被告律师引用了《民法典》第一千一百八十八条：无民事行为能力人、限制民事行为能力人造成他人损害的，由监护人承担侵权责任。', isRecommended: true, feedback: '✅ 切中要害！未成年人侵权时监护人确实应承担责任，关键在于监护是否到位。' },
          { id: 'dt2-q2', text: '问原告：你当时有没有看到电动车？', reveal: '王先生：「我看到的时候已经就在我车前面了——大概就两三米远！我根本没有反应时间！」', isRecommended: false, feedback: '⚠️ 这个问题偏向于找原告的过错，但小杰确实没有观察就直接横穿了路口。' },
        ],
      },
      {
        id: 'debate-t3', speaker: '原告律师（反驳）', speakerEmoji: '👨‍⚖️',
        dialogue: '审判长，从监控录像可以清楚看到，小杰驾车横穿路口时完全没有减速或观察，是事故的根本原因。监护人允许16岁的孩子骑电动车上下学，本身就未尽到充分的监管义务。请求法庭依法支持我方全部诉求。',
        choices: [
          { id: 'dt3-q1', text: '总结：本案争议焦点明确。本庭将根据过错程度、损失情况和法律规定作出公正裁决。', reveal: '休庭后，你走进合议室准备作出裁决。', isRecommended: true, feedback: '✅ 专业的庭审控制！' },
          { id: 'dt3-q2', text: '问双方是否愿意调解？', reveal: '原告要求全额赔偿，被告表示最多承担70%。差距较大，调解难以达成。', isRecommended: false, feedback: '⚠️ 从双方态度看调解可行性低，直接裁决更有效率。' },
        ],
      },
    ],
  },
  deliberation: {
    title: '🧠 合议裁决',
    description: '根据庭审情况，作出你的裁决。',
    laws: [
      { id: 'law-t1', name: '《民法典》第一千一百六十五条', summary: '行为人因过错侵害他人民事权益造成损害的，应当承担侵权责任。', isCorrect: false, explanation: '这条是侵权责任的一般原则，是正确的但不够具体。' },
      { id: 'law-t2', name: '《民法典》第一千一百八十八条', summary: '无民事行为能力人、限制民事行为能力人造成他人损害的，由监护人承担侵权责任。', isCorrect: true, explanation: '✅ 正确！小杰16岁属于限制民事行为能力人，其侵权责任应由监护人承担。这是本案责任主体的核心法律依据。' },
      { id: 'law-t3', name: '《道路交通安全法实施条例》第七十二条', summary: '驾驶电动自行车必须年满16周岁，非机动车不得载人。', isCorrect: false, explanation: '这是行政法层面的规定，用以判断小杰是否存在违法行为，但民事赔偿责任的划分应适用《民法典》。' },
    ],
    verdict: {
      question: '你认为小杰及其监护人应承担多少责任？',
      options: [
        { id: 'verdict-t-all', label: '✅ 承担主要责任（80%）', desc: '小杰违规载人、未减速让行是事故主因。', isCorrect: true, explanation: '正确！交警认定小杰负主要责任。根据《民法典》，限制民事行为能力人造成损害的，由监护人承担侵权责任。但王先生作为司机也有一定注意义务，所以小杰方承担80%较合理。' },
        { id: 'verdict-t-half', label: '⚠️ 各承担50%', desc: '双方都有过错，对半分担。', isCorrect: false, explanation: '监控显示小杰是突然冲出的，王先生确实来不及反应。让王先生承担50%不符合公平原则。' },
        { id: 'verdict-t-zero', label: '❌ 小杰无责', desc: '未成年人不应承担责任。', isCorrect: false, explanation: '年龄不是免责的理由。侵权造成损害时，监护人要承担替代责任。' },
      ],
    },
    penalty: {
      question: '你认为赔偿金额应为多少？',
      options: [
        { id: 'pen-t-full', label: '全额赔偿68000元', desc: '造成的损失应当全部赔偿。', isCorrect: false, explanation: '小杰虽负主要责任但非全部责任，全额赔偿不合理。' },
        { id: 'pen-t-80', label: '赔偿54400元（80%）', desc: '按责任比例承担。', isCorrect: true, explanation: '✅ 合理！按80%责任计算：68000×80%=54400元。由小杰的监护人承担。' },
        { id: 'pen-t-low', label: '赔偿20000元', desc: '未成年人没有经济能力，象征性赔偿即可。', isCorrect: false, explanation: '侵权责任不因侵权人没有经济能力而免除，监护人应当承担赔偿责任。' },
      ],
    },
  },
  result: {
    title: '⚖️ 宣判',
    correctVerdict: '监护人承担80%赔偿责任',
    correctLaw: '《民法典》第一千一百八十八条',
    summary: '小杰未满18周岁违规载人、通过路口未减速让行，负事故主要责任。因其系限制民事行为能力人，由监护人承担80%的赔偿责任，共计54400元。',
    lawExplanation: '💡 **交通安全要点**\n• 年满16周岁才能骑电动自行车\n• 电动车、自行车不得载人\n• 通过路口必须减速观察、确认安全\n• 未满18周岁不能驾驶机动车\n\n💡 **监护人责任**\n《民法典》规定，未成年人造成他人损害的，由监护人承担侵权责任。家长应加强对孩子的交通安全教育。',
    xpReward: 30,
    },
  },
  {
    id: 'case-drug-1',
  title: '提神糖的秘密',
  subtitle: '新型毒品伪装与法律责任案',
  emoji: '🚫',
  intro: {
    narrative: [
      '16岁的小凯在网吧认识了一个叫「阿龙」的社会青年。阿龙经常请小凯喝饮料、打游戏，两人很快熟络起来。',
      '某天，阿龙拿出一颗彩色糖果状的东西对小凯说：「这是聪明糖，吃了精力充沛、打游戏反应超快。很多学生都在吃，不含毒品成分的。」',
      '小凯吃了一颗后确实感觉精神兴奋，连赢了好几局游戏。之后他又从阿龙那里买了多次。渐渐地，小凯发现不吃就浑身难受、注意力无法集中。',
      '直到有一天，小凯在学校课堂上突然晕倒，被医院检出甲基苯丙胺（冰毒）阳性。家长报警后，警方抓获了阿龙，在其住处查获了大量伪装成糖果、跳跳糖、奶茶粉的毒品。',
      '经查，阿龙通过熟人介绍在学校周边以「提神」「增强记忆力」为噱头向未成年人售卖毒品，已查明的受害学生有9人。',
    ],
    plaintiff: { name: '检察机关（公诉人）', avatar: '⚖️', info: '以9名未成年受害人为代表的公诉案件' },
    defendant: { name: '阿龙（龙某）', avatar: '🧑', info: '22岁 · 无业，向未成年人售卖伪装毒品' },
  },
  scene: {
    title: '🔍 调查取证',
    description: '审查警方提交的毒品犯罪证据材料。',
    bgColor: 'from-red-100 via-rose-50 to-orange-50',
    hotspots: [
      {
        id: 'dg-drugs', label: '查获的毒品', emoji: '🍬', x: 25, y: 30, type: 'physical', found: false,
        content: { title: '伪装成零食的毒品', desc: '警方在阿龙住处查获的毒品物证照片。', detail: '外观与普通糖果、跳跳糖、奶茶粉完全一样，部分包装袋上印有卡通图案。经鉴定均含有甲基苯丙胺成分。现场还查获了电子秤和分装袋。', insight: '这些毒品和普通零食没有区别，青少年很容易被迷惑。卡通包装直接针对未成年人。' },
      },
      {
        id: 'dg-chat', label: '聊天记录', emoji: '💬', x: 45, y: 35, type: 'digital', found: false,
        content: { title: '阿龙与小凯的聊天记录', desc: '从双方手机中提取的微信聊天记录。', detail: '阿龙：「这个吃了打游戏超猛，真的不骗你。」小凯：「不会有问题吧？」阿龙：「我吃了半年了你看我有事吗？放心，好多学生都在吃。」', insight: '阿龙明知对方是学生，还以「打游戏超猛」诱导购买。这是针对未成年人的精准犯罪。' },
      },
      {
        id: 'dg-money', label: '转账记录', emoji: '💰', x: 60, y: 40, type: 'digital', found: false,
        content: { title: '交易转账记录', desc: '受害学生的微信转账记录。', detail: '频次从一周1次增加到一周3-4次，金额从100元到500元不等。9人累计向阿龙转账32000元。备注有时写「糖」或「零食」。', insight: '频次由少到多、金额由小到大——这是典型的成瘾特征。' },
      },
      {
        id: 'dg-school', label: '学校周边调查', emoji: '🏫', x: 35, y: 55, type: 'testimony', found: false,
        content: { title: '学校周边走访记录', desc: '警方走访获取的线索。', detail: '阿龙常在学校附近的奶茶店、网吧门口以请客方式接近学生，先免费赠送「试吃装」，等上瘾后再收费。部分学生知道不对劲但觉得兴奋。', insight: '「免费试吃」是毒贩惯用手段——先让你上瘾，再高价出售。' },
      },
      {
        id: 'dg-lab', label: '鉴定报告', emoji: '🔬', x: 70, y: 55, type: 'document', found: false,
        content: { title: '毒品成分鉴定报告', desc: '物证鉴定中心出具的鉴定书。', detail: '送检物品均检出甲基苯丙胺成分。其中「糖果」每颗含毒量约0.3g，达到「数量较大」标准。鉴定程序合法。', insight: '鉴定报告是定罪的关键证据。含毒量达到「数量较大」意味着刑罚更重。' },
      },
      {
        id: 'dg-testimony', label: '受害学生证言', emoji: '👥', x: 50, y: 20, type: 'testimony', found: false,
        content: { title: '受害学生的询问笔录', desc: '警方对9名学生的询问记录。', detail: '6人知道可能不是好东西但抱着「试一次没事」的心态尝试；3人完全被骗。所有学生都表示后悔，「没想到会上瘾」「不敢告诉家长」。', insight: '青少年普遍有「试一次没事」的侥幸心理，但毒品试一次就可能毁一生。' },
      },
    ],
  },
  evidence: {
    title: '⚖️ 法庭调查',
    description: '检方提交了以下证据，请逐项审查。',
    items: [
      { id: 'ev-dg-drugs', title: '毒品物证', emoji: '🍬', type: 'physical', description: '查获的伪装毒品和分装工具。', detail: '扣押程序合法，物证保管链完整。', admissible: true, correctAccept: true },
      { id: 'ev-dg-chat', title: '聊天记录', emoji: '💬', type: 'digital', description: '阿龙与受害者的聊天记录。', detail: '依法提取，内容完整，可证明主观故意。', admissible: true, correctAccept: true },
      { id: 'ev-dg-money', title: '转账记录', emoji: '💰', type: 'digital', description: '受害学生的转账记录。', detail: '与聊天记录相互印证。', admissible: true, correctAccept: true },
      { id: 'ev-dg-report', title: '鉴定报告', emoji: '🔬', type: 'document', description: '毒品成分含量鉴定书。', detail: '鉴定机构和人员有资质，程序合法。', admissible: true, correctAccept: true },
      { id: 'ev-dg-statement', title: '询问笔录', emoji: '📄', type: 'document', description: '受害学生的询问笔录。', detail: '形式规范，有被询问人签名确认。', admissible: true, correctAccept: true },
      { id: 'ev-dg-criminal', title: '前科记录', emoji: '📋', type: 'document', description: '阿龙曾因吸毒被拘留的记录。', detail: '与本次贩卖毒品罪无直接关联，可能引起偏见。', admissible: false, inadmissibleReason: '前科记录与本案无直接关联', correctAccept: false },
    ],
  },
  debate: {
    title: '💬 法庭辩论',
    description: '公诉人与辩护律师就定罪量刑展开辩论。',
    stages: [
      {
        id: 'debate-d1', speaker: '公诉人', speakerEmoji: '👨‍⚖️',
        dialogue: '审判长，被告人阿龙明知是毒品而向多人（包括多名未成年人）贩卖，已构成贩卖毒品罪。将毒品伪装成零食销售，手段隐蔽、性质恶劣，依法应从重处罚。',
        choices: [
          { id: 'dd1-q1', text: '问公诉人：请说明针对未成年人的犯罪手法。', reveal: '阿龙在奶茶店以请客为名接近学生，先免费送低毒试吃装，上瘾后再高价出售。还制作了卡通包装的「特别版」。', isRecommended: true, feedback: '✅ 查明犯罪手法对量刑很重要。针对未成年人的犯罪应从重处罚。' },
          { id: 'dd1-q2', text: '问阿龙：你知道你卖的是学生吗？', reveal: '阿龙低头：「知道……但他们想买，我就卖了。」', isRecommended: false, feedback: '⚠️ 公诉人尚未陈述完毕，此时打断不严谨。' },
        ],
      },
      {
        id: 'debate-d2', speaker: '辩护律师', speakerEmoji: '👩‍⚖️',
        dialogue: '我方当事人认罪认罚，配合调查。且阿龙本人也是在网吧被人引诱吸毒的受害者。请求从轻处罚。',
        choices: [
          { id: 'dd2-q1', text: '质问：阿龙自己受害就能祸害更多人吗？', reveal: '辩护律师无言以对。旁听席上受害学生家长忍不住哭了。', isRecommended: false, feedback: '⚠️ 法官应保持中立，不宜在庭上表现情绪化。' },
          { id: 'dd2-q2', text: '问辩护律师：退赃退赔情况如何？', reveal: '阿龙已供述全部事实并提供上家线索。但贩毒所得32000元已被挥霍，无力退赔。', isRecommended: true, feedback: '✅ 客观中立！认罪认罚可以从宽，但退赃是重要考量因素。' },
        ],
      },
      {
        id: 'debate-d3', speaker: '公诉人反驳', speakerEmoji: '👨‍⚖️',
        dialogue: '即便认罪认罚，本案仍有从重情节：贩卖对象含9名未成年人、毒品伪装成零食、数量达较大标准。建议判处七年至八年。',
        choices: [
          { id: 'dd3-q1', text: '宣布休庭合议。本案事实清楚，本庭将依法判决。', reveal: '法槌落下。你走进合议室准备裁决。', isRecommended: true, feedback: '✅ 果断、专业！' },
          { id: 'dd3-q2', text: '问阿龙有什么想对受害学生说的？', reveal: '阿龙沉默了很久：「对不起。」', isRecommended: false, feedback: '⚠️ 一句对不起无法弥补对9个孩子的伤害。' },
        ],
      },
    ],
  },
  deliberation: {
    title: '🧠 合议裁决',
    description: '根据庭审情况，对本案作出裁决。',
    laws: [
      { id: 'law-d1', name: '《刑法》第三百四十七条（贩卖毒品罪）', summary: '贩卖毒品无论数量多少都追究刑事责任。向未成年人出售从重处罚。', isCorrect: true, explanation: '✅ 正确！这是本案定罪的核心法条。贩卖毒品罪是行为犯，只要有贩卖行为就构成犯罪。' },
      { id: 'law-d2', name: '《禁毒法》', summary: '预防和惩治毒品犯罪行为。', isCorrect: false, explanation: '这是原则性法律，定罪量刑应适用《刑法》。' },
      { id: 'law-d3', name: '《治安管理处罚法》第七十二条', summary: '非法持有少量毒品的处拘留或罚款。', isCorrect: false, explanation: '阿龙是贩卖而非仅持有，性质严重得多。' },
    ],
    verdict: {
      question: '阿龙的行为构成什么罪？',
      options: [
        { id: 'verdict-d-yes', label: '✅ 贩卖毒品罪', desc: '阿龙明知是毒品而向他人贩卖。', isCorrect: true, explanation: '正确！向9名未成年人出售、将毒品伪装成零食均为从重情节。' },
        { id: 'verdict-d-no', label: '❌ 诱导吸毒罪', desc: '他没有制造毒品，只是诱导他人。', isCorrect: false, explanation: '阿龙实际出售并获利，贩卖毒品罪是更准确的罪名。' },
      ],
    },
    penalty: {
      question: '你认为应如何量刑？',
      options: [
        { id: 'pen-d-light', label: '有期徒刑五年', desc: '认罪认罚从宽。', isCorrect: false, explanation: '向9名未成年人贩卖、伪装零食等从重情节叠加，五年偏轻。' },
        { id: 'pen-d-medium', label: '有期徒刑七年六个月', desc: '综合从重和从轻情节。', isCorrect: true, explanation: '✅ 适当的量刑！认罪认罚、提供上家线索等从轻情节下，七年六个月在合理范围内。' },
        { id: 'pen-d-heavy', label: '有期徒刑十二年', desc: '毒贩必须严惩。', isCorrect: false, explanation: '有从轻情节，十二年过于严厉。' },
      ],
    },
  },
  result: {
    title: '⚖️ 宣判',
    correctVerdict: '贩卖毒品罪成立',
    correctLaw: '《刑法》第三百四十七条',
    summary: '阿龙以伪装成零食的方式向9名未成年人贩卖毒品，构成贩卖毒品罪，判处有期徒刑七年六个月，并处罚金。',
    lawExplanation: '💡 **禁毒知识**\n• 毒品可能伪装成糖果、奶茶粉——陌生人给的零食不要吃\n• 凡是声称「提神」「增强记忆力」的药物都要警惕\n• 一次好奇尝试可能导致终身成瘾\n\n💡 **法律红线**\n• 贩卖毒品无论多少都追究刑责\n• 向未成年人出售毒品从重处罚\n\n💡 **求助渠道**\n• 发现涉毒线索拨打110\n• 戒毒求助拨打12348法律援助热线',
    xpReward: 30,
  },
},
];

export function getCaseById(id: string): CourtCaseData | undefined {
  return courtCases.find((c) => c.id === id)
}
