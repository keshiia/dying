// 案件侦查 — 案件数据 (auto-generated)
// 自由搜证、逻辑推理，做一名少年侦探！

export type ClueType = "physical" | "digital" | "testimony" | "observation"

export interface DetectiveHotspot {
  id: string
  label: string
  emoji: string
  x: number
  y: number
  sceneId: string
  type: ClueType
  found: boolean
  content: {
    title: string
    desc: string
    detail: string
    insight: string
  }
}

export interface DetectiveScene {
  id: string
  name: string
  description: string
  bgColor: string
  bgDecorations: { emoji: string; x: number; y: number; size?: string }[]
  hotspots: DetectiveHotspot[]
}

export interface DetectiveNpc {
  id: string
  name: string
  emoji: string
  role: string
  sceneId: string
  /** Position on the scene canvas (0-100). Falls back to default if not set. */
  x?: number
  y?: number
  dialogue: string
  secret: string
  triggerQuestion: string
  otherQuestions: { question: string; response: string }[]
}

export interface DeductionQuestion {
  id: string
  question: string
  options: { id: string; text: string; isCorrect: boolean; explanation: string }[]
}

export interface DetectiveCaseData {
  id: string
  title: string
  subtitle: string
  emoji: string
  difficulty: "\u7b80\u5355" | "\u4e2d\u7b49" | "\u56f0\u96be"
  intro: {
    narrative: string[]
    briefing: string
  }
  scenes: DetectiveScene[]
  npcs: DetectiveNpc[]
  minCluesToUnlock: number
  deduction: {
    title: string
    description: string
    questions: DeductionQuestion[]
  }
  result: {
    summary: string
    fullStory: string
    xpReward: number
  }
}

export const detectiveCases: DetectiveCaseData[] = [
  {
    "id": "detective-art-1",
    "title": "画室的神秘涂鸦",
    "subtitle": "是谁破坏了参赛作品？",
    "emoji": "🎨",
    "difficulty": "简单",
    "intro": {
      "narrative": [
        "阳光中学的美术教室里，一幅即将参加市里比赛的画作被泼上了红色颜料。",
        "受害者小美是初三（2）班的学生，这幅《春日的校园》她画了整整一个月。",
        "事发当天是周一的早晨。小美第一个到达美术教室，发现画布上多了一道刺眼的红色涂鸦——一个歪歪扭扭的\"X\"。",
        "美术老师王老师立刻通知了学校，而你——少年侦探社的成员，被请来调查这件事。"
      ],
      "briefing": "你的任务：搜查画室和周边区域，找线索、询问相关人员，查明是谁破坏了画作以及原因。"
    },
    "scenes": [
      {
        "id": "scene-artroom",
        "name": "🎨 美术教室",
        "description": "案发第一现场。画架上放着被破坏的画作，地上有些零散的痕迹。",
        "bgColor": "from-amber-100 via-orange-50 to-yellow-50",
        "bgDecorations": [
          {
            "emoji": "🖼️",
            "x": 8,
            "y": 10,
            "size": "text-5xl"
          },
          {
            "emoji": "🎨",
            "x": 85,
            "y": 8,
            "size": "text-4xl"
          },
          {
            "emoji": "🪟",
            "x": 80,
            "y": 35,
            "size": "text-3xl"
          },
          {
            "emoji": "🖌️",
            "x": 75,
            "y": 70,
            "size": "text-3xl"
          },
          {
            "emoji": "📦",
            "x": 10,
            "y": 70,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "hotspot-painting",
            "label": "被破坏的画作",
            "emoji": "🖼️",
            "x": 30,
            "y": 25,
            "sceneId": "scene-artroom",
            "type": "physical",
            "found": false,
            "content": {
              "title": "被涂鸦的画作",
              "desc": "小美的参赛作品，被红色颜料打了个大叉。",
              "detail": "画布上有一个用红色丙烯颜料画的\"X\"，从左上到右下贯穿了整个画面。颜料已经干了，说明是事发当天之前被涂上的。画作本身是校园春景，画工相当精细。",
              "insight": "红色丙烯颜料——这种颜料在美术教室是公用的，任何人都能拿到。而且颜料已干，意味着破坏发生在周日或更早。"
            }
          },
          {
            "id": "hotspot-paint-tube",
            "label": "地上的颜料管",
            "emoji": "🎨",
            "x": 55,
            "y": 60,
            "sceneId": "scene-artroom",
            "type": "physical",
            "found": false,
            "content": {
              "title": "红色丙烯颜料管",
              "desc": "在地上发现的一管红色丙烯颜料。",
              "detail": "颜料管被随意扔在地上，盖子也没盖紧。品牌是美术教室统一采购的\"马利牌\"丙烯颜料。管身上有一些淡淡的指纹痕迹（已被法证提取）。",
              "insight": "指纹！如果比对出是谁的指纹，就有直接证据了。但美术教室的颜料是公用的，可能很多人的指纹都在上面。"
            }
          },
          {
            "id": "hotspot-footprint",
            "label": "窗台上的脚印",
            "emoji": "👣",
            "x": 78,
            "y": 40,
            "sceneId": "scene-artroom",
            "type": "observation",
            "found": false,
            "content": {
              "title": "窗台上的可疑脚印",
              "desc": "教室后窗的窗台上有一个模糊的鞋印。",
              "detail": "窗台上有一个约26cm长的鞋印，纹路清晰可辨。窗台高度约1.2米，外面是一楼的花坛。鞋印的方向是朝外的，说明有人从窗户翻出去过。",
              "insight": "26cm的鞋印——这不是一个女生的鞋码（通常23-24cm），更像男生或大脚的女生的鞋子。而且窗台有脚印，说明有人从窗户进出。"
            }
          },
          {
            "id": "hotspot-schedule",
            "label": "墙上的值日表",
            "emoji": "📋",
            "x": 50,
            "y": 12,
            "sceneId": "scene-artroom",
            "type": "digital",
            "found": false,
            "content": {
              "title": "美术教室使用记录表",
              "desc": "贴在墙上的美术教室课后使用登记表。",
              "detail": "表格显示，上周日下午2:00-4:00有\"美术兴趣小组活动\"，参加人员登记为：小美、林悦、陈浩。小美是受害人，林悦和陈浩上周日都来过画室。",
              "insight": "上周日下午林悦和陈浩都来过画室！破坏可能发生在周日活动期间或之后。这两个人都有嫌疑。"
            }
          }
        ]
      },
      {
        "id": "scene-hallway",
        "name": "🏢 教学楼走廊",
        "description": "美术教室外的走廊。远处有几个学生在围观讨论。",
        "bgColor": "from-sky-100 via-blue-50 to-indigo-50",
        "bgDecorations": [
          {
            "emoji": "🚪",
            "x": 10,
            "y": 40,
            "size": "text-4xl"
          },
          {
            "emoji": "🪟",
            "x": 55,
            "y": 15,
            "size": "text-4xl"
          },
          {
            "emoji": "📮",
            "x": 85,
            "y": 50,
            "size": "text-3xl"
          },
          {
            "emoji": "🌿",
            "x": 90,
            "y": 75,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "hotspot-locker",
            "label": "陈浩的储物柜",
            "emoji": "🔒",
            "x": 20,
            "y": 40,
            "sceneId": "scene-hallway",
            "type": "physical",
            "found": false,
            "content": {
              "title": "陈浩的储物柜（半开着）",
              "desc": "走廊尽头的储物柜，其中一个柜门没关紧。",
              "detail": "柜门缝里露出一角蓝色的布料。打开一看，是一件校服外套，袖口上沾着红色颜料——和小美画作上的颜料看起来一样。外套内侧标签写着\"陈浩\"。",
              "insight": "陈浩的校服上有红色颜料！而且他上周日也参加过美术小组活动。如果他只是正常画画，颜料沾到身上很正常……但为什么外套塞在储物柜里，而不是带回家洗？"
            }
          },
          {
            "id": "hotspot-gossip",
            "label": "窃窃私语的同学",
            "emoji": "👥",
            "x": 65,
            "y": 55,
            "sceneId": "scene-hallway",
            "type": "testimony",
            "found": false,
            "content": {
              "title": "两位同学的对话",
              "desc": "两个低年级学生在走廊角落小声议论。",
              "detail": "走近听到：\"听说了吗？小美的画被毁了！\"\"知道，听说陈浩上周日和小美吵架了，吵得特别凶。\"\"真的假的？为啥？\"\"好像跟比赛有关……美术老师本来想推荐陈浩的，但最后选了小美。\"",
              "insight": "陈浩有动机！他本来可能是参赛选手，老师选了小美没选他。而且他和上周日小美吵过架。"
            }
          },
          {
            "id": "hotspot-cctv2",
            "label": "走廊监控摄像头",
            "emoji": "📹",
            "x": 45,
            "y": 20,
            "sceneId": "scene-hallway",
            "type": "digital",
            "found": false,
            "content": {
              "title": "走廊监控（周日录像）",
              "desc": "走廊顶角的监控摄像头，可以查看上周日的录像。",
              "detail": "保安调出了上周日下午的监控：2:10小美、林悦、陈浩先后进入美术教室。3:45林悦离开。4:00小美和陈浩一起出来。但凌晨12:15——一个穿连帽衫的身影出现在走廊，进入了美术教室，12:28离开。",
              "insight": "凌晨12:15有人偷偷进了美术教室！穿连帽衫看不清脸，身高大约165-170cm。这个人最有可能是真正的破坏者。"
            }
          }
        ]
      },
      {
        "id": "scene-rooftop",
        "name": "🌇 学校天台",
        "description": "教学楼天台，视野开阔，偶尔有学生上来吹风。",
        "bgColor": "from-sky-200 via-purple-100 to-pink-100",
        "bgDecorations": [
          {
            "emoji": "☁️",
            "x": 15,
            "y": 5,
            "size": "text-5xl"
          },
          {
            "emoji": "☁️",
            "x": 70,
            "y": 8,
            "size": "text-4xl"
          },
          {
            "emoji": "🏙️",
            "x": 50,
            "y": 25,
            "size": "text-5xl"
          },
          {
            "emoji": "🌳",
            "x": 20,
            "y": 55,
            "size": "text-4xl"
          },
          {
            "emoji": "🌳",
            "x": 80,
            "y": 50,
            "size": "text-4xl"
          }
        ],
        "hotspots": [
          {
            "id": "hotspot-note",
            "label": "地上有张揉皱的纸",
            "emoji": "📄",
            "x": 35,
            "y": 55,
            "sceneId": "scene-rooftop",
            "type": "physical",
            "found": false,
            "content": {
              "title": "揉皱的草稿纸",
              "desc": "天台角落发现一张揉皱的纸，被风吹到角落。",
              "detail": "展开来看，是一幅用铅笔画的校园风景速写。画工很好，但右下角被人用红色圆珠笔写了几个字：\"凭什么是你？\"字迹看起来有些激动，笔画很重，纸都被划破了。",
              "insight": "\"凭什么是你？\"——这明显是有人对比赛结果不满。结合监控和同学对话，陈浩的嫌疑越来越大了。"
            }
          },
          {
            "id": "hotspot-phone",
            "label": "手机聊天记录（林悦提供）",
            "emoji": "💬",
            "x": 65,
            "y": 60,
            "sceneId": "scene-rooftop",
            "type": "digital",
            "found": false,
            "content": {
              "title": "林悦提供的聊天记录",
              "desc": "林悦主动提供了她和陈浩上周六的微信聊天记录。",
              "detail": "陈浩：\"王老师最后还是选了小美……\"林悦：\"你也别太难过，下次还有机会。\"陈浩：\"我在画室画了三个月的画，说换就换了？\"林悦：\"但她画得确实好。\"陈浩：\"哼，好又怎么样。等着看吧。\"",
              "insight": "\"等着看吧\"——这句话像是威胁！陈浩在比赛结果公布后非常不满。但这是不是太明显了？"
            }
          }
        ]
      }
    ],
    "npcs": [
      {
        "id": "npc-xiaomei",
        "name": "小美",
        "emoji": "👧",
        "role": "受害者 / 画作作者",
        "sceneId": "scene-artroom",
        "dialogue": "呜呜……我画了一个月，每天放学都留下来画。我不知道是谁做的，但我真的很伤心……",
        "secret": "小美擦了擦眼泪说：\"其实……上周五王老师找过我，说本来打算推荐陈浩去参赛的，但看了我的作品后觉得我的更好，所以换成了我。\"",
        "triggerQuestion": "安慰她并询问比赛相关的事",
        "otherQuestions": [
          {
            "question": "直接问：你觉得是谁干的？",
            "response": "小美摇摇头：\"我不知道……我真的不知道。\""
          },
          {
            "question": "问：你最近和谁有矛盾吗？",
            "response": "小美低头：\"没有吧……我和大家都挺好的。\""
          }
        ]
      },
      {
        "id": "npc-chenhao",
        "name": "陈浩",
        "emoji": "🧑",
        "role": "嫌疑人",
        "sceneId": "scene-hallway",
        "dialogue": "干嘛？你们不会是怀疑我吧？我跟那事儿没关系！",
        "secret": "陈浩压低声音说：\"好吧……我承认我周日确实很生气。我去画室拿走了我自己的画，出门的时候不小心打翻了红色颜料洒在地上。但我只是擦了一下就走了！我真的没有碰她的画！\"",
        "triggerQuestion": "质问校服上为什么有红色颜料",
        "otherQuestions": [
          {
            "question": "问：你周日和小美吵架了吗？",
            "response": "陈浩：\"没有吵架！我们就是争论了一下比赛的事。\""
          },
          {
            "question": "问：凌晨12点你在哪里？",
            "response": "陈浩：\"凌晨？我早睡了！我妈可以作证。\""
          }
        ]
      },
      {
        "id": "npc-linyue",
        "name": "林悦",
        "emoji": "👩",
        "role": "目击者 / 同学",
        "sceneId": "scene-rooftop",
        "dialogue": "我也参加了美术兴趣小组，上周日我也在画室。但我3:45就先走了，走的时候画还好好的。",
        "secret": "林悦小声说：\"我给你看个东西……但你别告诉陈浩是我说的。\"她拿出手机翻出一张照片——是周日晚上10点她从自家窗户拍的对面教学楼。\"我看到画室的灯亮着，就拍下来了。你看，窗口有个人影……\"",
        "triggerQuestion": "问她周日离开后有没有看到什么异常",
        "otherQuestions": [
          {
            "question": "问：你知道陈浩和小美的矛盾吗？",
            "response": "林悦：\"知道一些……陈浩确实很不服气。但我觉得他不会做这种事。\""
          },
          {
            "question": "问：你觉得是谁做的？",
            "response": "林悦：\"不好说……但我觉得不是陈浩。\""
          }
        ]
      }
    ],
    "minCluesToUnlock": 5,
    "deduction": {
      "title": "🧩 真相拼图",
      "description": "你已经收集了足够的线索。现在来还原真相吧！",
      "questions": [
        {
          "id": "ded-q1",
          "question": "🔍 画作是在什么时间被破坏的？",
          "options": [
            {
              "id": "q1a",
              "text": "周日下午美术小组活动期间",
              "isCorrect": false,
              "explanation": "活动期间大家都在画室，如果有人当着大家的面破坏画作，不可能不被发现。监控也显示活动期间一切正常。"
            },
            {
              "id": "q1b",
              "text": "周日深夜（凌晨0:15左右）",
              "isCorrect": true,
              "explanation": "正确！监控录像显示凌晨0:15有人进入美术教室。红色颜料已经干了，说明不是当天白天涂的，与凌晨作案的时间吻合。"
            },
            {
              "id": "q1c",
              "text": "周一早晨小美来之前",
              "isCorrect": false,
              "explanation": "如果凶手是周一早上作的案，颜料应该是湿的。但颜料已经干了。"
            }
          ]
        },
        {
          "id": "ded-q2",
          "question": "👟 窗台上的脚印说明了什么？",
          "options": [
            {
              "id": "q2a",
              "text": "凶手是从窗户翻进来作案的",
              "isCorrect": false,
              "explanation": "鞋印方向是朝外的，说明是从窗户翻出去，而不是翻进来。"
            },
            {
              "id": "q2b",
              "text": "凶手作案后从窗户翻出去逃走了",
              "isCorrect": true,
              "explanation": "正确！监控显示凶手0:28离开。正门走廊有监控，凶手为了避开监控，选择了从窗户翻出去离开。26cm的鞋码更像男生的鞋。"
            },
            {
              "id": "q2c",
              "text": "那只是之前某个学生留下的普通脚印",
              "isCorrect": false,
              "explanation": "窗台上的脚印纹路清晰，是最近才留下的。如果是很久以前的脚印，应该已经被灰尘覆盖了。"
            }
          ]
        },
        {
          "id": "ded-q3",
          "question": "🧪 陈浩校服上的红色颜料是怎么回事？",
          "options": [
            {
              "id": "q3a",
              "text": "他就是凶手，作案时沾上的",
              "isCorrect": false,
              "explanation": "陈浩承认了周日他在画室不小心打翻了颜料，所以才沾到校服上。而且监控显示真正的作案发生在凌晨，那个时间他应该在家睡觉。"
            },
            {
              "id": "q3b",
              "text": "周日画画时不慎沾到的",
              "isCorrect": true,
              "explanation": "正确！陈浩周日确实在画室活动，颜料沾到校服上是合理的。他承认自己打翻了颜料。虽然他有动机，但时间线上看，凌晨的监控中那个人不是他。"
            },
            {
              "id": "q3c",
              "text": "这是伪造的证据，有人故意陷害陈浩",
              "isCorrect": false,
              "explanation": "这个推理方向很敏锐，但目前没有证据支持陷害的说法。陈浩的校服是周日就沾上颜料的，而破坏发生在凌晨。"
            }
          ]
        },
        {
          "id": "ded-q4",
          "question": "🎯 综合所有证据，真正的凶手是？",
          "options": [
            {
              "id": "q4a",
              "text": "陈浩（动机最强）",
              "isCorrect": false,
              "explanation": "陈浩虽然有动机，但他周日4点就回家了，凌晨有妈妈作证在家。时间线对不上。"
            },
            {
              "id": "q4b",
              "text": "林悦（一直在现场附近）",
              "isCorrect": true,
              "explanation": "恭喜你，破了这个案子！真相：林悦周日3:45假装离开，实际上躲在走廊拐角。等小美和陈浩4点离开后，她等到凌晨拿走了教室备用钥匙（她是美术课代表），穿上宽松的连帽衫潜入画室破坏了画作。然后从窗户翻出绕路回家。她的动机——她也提交了参赛作品但连初选都没过。她拍下的深夜画室人影照片，其实是她自己作案后自导自演的。"
            },
            {
              "id": "q4c",
              "text": "校外陌生人潜入学校",
              "isCorrect": false,
              "explanation": "学校里没有被盗其他东西，只有小美的画被破坏。校外陌生人不可能知道美术教室的备用钥匙放在哪里。"
            }
          ]
        }
      ]
    },
    "result": {
      "summary": "经过缜密的现场搜查和推理，你成功找到了真相——破坏画作的凶手是林悦。她因为嫉妒小美获得参赛资格，精心策划了这场深夜破坏案。",
      "fullStory": "🏆 **案件真相**\n\n林悦——美术兴趣小组中一直默默无闻的成员。她和小美、陈浩一起参加了市里的绘画比赛选拔，但她的作品连初选都没过。\n\n当王老师宣布小美获得参赛资格后，林悦的嫉妒心越来越强。周日美术小组活动结束后，她假装先离开，实际上躲在走廊尽头的厕所里。等小美和陈浩都走了，她悄悄拿走了备用的教室钥匙——作为美术课代表，她知道钥匙放在哪里。\n\n凌晨0:15，她换上宽松的连帽衫（掩盖身形），潜入画室，用红色丙烯颜料在画作上打了个大叉。然后从窗户翻出（避开走廊监控），绕路回家。\n\n她还故意在第二天主动提供和陈浩的聊天记录，暗示陈浩有动机。\n\n**关键证据链：**\n1️⃣ 凌晨监控拍到连帽衫身影，身高165-170cm（与林悦相符）\n2️⃣ 窗台脚印26cm（林悦穿38码鞋正好26cm）\n3️⃣ 她主动提供的聊天记录反而暴露了她想嫁祸陈浩的意图\n4️⃣ 天台找到的草稿纸\"凭什么是你？\"——笔迹对比后与林悦的字迹一致\n\n💡 **教训：** 嫉妒会让人做出可怕的事。比赛中输赢很正常，重要的是从过程中学习成长。",
      "xpReward": 35
    }
  },
  {
    "id": "detective-canteen-1",
    "title": "食堂的幽灵窃贼",
    "subtitle": "是谁偷了饭卡里的钱？",
    "emoji": "🍱",
    "difficulty": "中等",
    "intro": {
      "narrative": [
        "阳光中学食堂的充值机上，最近发生了一件怪事。",
        "好几个同学的饭卡在充完值后，余额莫名其妙地减少了。不是刷卡消费的，因为查询消费记录完全空白。",
        "第一个发现问题的是一年级的张小星。他周一刚充了100元，周三去打饭时发现余额只剩30元。",
        "\"我没刷过卡啊！\"张小星找食堂管理员理论，管理员查了系统——没有消费记录。",
        "接下来，同样的投诉接二连三地出现。一周内，有8名同学报告了类似的情况，总损失超过500元。",
        "大家都说是\"幽灵\"干的，因为钱消失得无影无踪。但你知道——世上没有幽灵，只有没被发现的真相。"
      ],
      "briefing": "你的任务：检查充值机、查看监控录像、询问相关人员，找出饭卡余额神秘消失的原因和幕后黑手。"
    },
    "scenes": [
      {
        "id": "scene-canteen",
        "name": "🍽️ 食堂充值处",
        "description": "食堂入口处的充值机和充值窗口。学生们排队充值的地方。",
        "bgColor": "from-yellow-100 via-orange-50 to-amber-50",
        "bgDecorations": [
          {
            "emoji": "🏪",
            "x": 8,
            "y": 15,
            "size": "text-5xl"
          },
          {
            "emoji": "🍚",
            "x": 60,
            "y": 60,
            "size": "text-4xl"
          },
          {
            "emoji": "🥘",
            "x": 80,
            "y": 55,
            "size": "text-4xl"
          },
          {
            "emoji": "🧑‍🍳",
            "x": 85,
            "y": 25,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "hotspot-charge-machine",
            "label": "充值机",
            "emoji": "💳",
            "x": 20,
            "y": 35,
            "sceneId": "scene-canteen",
            "type": "physical",
            "found": false,
            "content": {
              "title": "食堂充值机",
              "desc": "食堂门口的自动充值机，支持刷脸和输入卡号充值。",
              "detail": "这是一台较老型号的充值机，屏幕有轻微划痕。充值操作流程：输入卡号→放入现金→确认充值→打印小票。张小星说他充值时有另一个人站得很近，但他以为是在排队。充值机没有安装遮挡罩，旁边的人可以看到输入操作。",
              "insight": "旁边的人能看到输入卡号？如果有人故意记住别人的卡号然后……但不能通过充值机取钱啊。肯定还有别的方法。"
            }
          },
          {
            "id": "hotspot-receipt",
            "label": "地上的小票",
            "emoji": "🧾",
            "x": 35,
            "y": 55,
            "sceneId": "scene-canteen",
            "type": "physical",
            "found": false,
            "content": {
              "title": "揉皱的充值小票",
              "desc": "在垃圾桶旁边发现几张被丢弃的充值小票。",
              "detail": "小票上的打印内容清晰可见：卡号、充值金额、时间、充值机编号。但奇怪的是——这几张小票上的卡号不属于任何一位投诉的同学。经过比对，小票上的卡号在系统中都不存在。",
              "insight": "有人在用学校的充值机打印小票，但不是在给真实的卡充值！这是在干什么？"
            }
          },
          {
            "id": "hotspot-staff",
            "label": "食堂管理员老陈",
            "emoji": "🧑‍💼",
            "x": 55,
            "y": 30,
            "sceneId": "scene-canteen",
            "type": "observation",
            "found": false,
            "content": {
              "title": "食堂管理员老陈的证词",
              "desc": "负责食堂充值系统管理的工作人员。",
              "detail": "老陈说：系统没有问题！我查过了，没有任何黑客入侵的记录。每次他们的卡余额减少时，系统里都没有相应的消费记录——就好像钱凭空蒸发了一样。",
              "insight": "系统没有问题、没有消费记录、但钱确实少了。那钱是怎么被取走的？如果不需要刷卡就能扣钱呢？"
            }
          },
          {
            "id": "hotspot-qr",
            "label": "角落里的二维码",
            "emoji": "📱",
            "x": 70,
            "y": 50,
            "sceneId": "scene-canteen",
            "type": "digital",
            "found": false,
            "content": {
              "title": "一张可疑的二维码",
              "desc": "贴在充值机旁边不起眼处的二维码，上面写着快速充值通道。",
              "detail": "二维码印刷粗糙。用手机扫描后，跳转到一个仿冒的学校充值页面——和真正的校园卡充值页面几乎一模一样，但网址不一样。页面要求输入校园卡号和充值金额。",
              "insight": "钓鱼网站！如果有人以为这是正规充值入口输入卡号，这些信息就会被骗子获取。"
            }
          }
        ]
      },
      {
        "id": "scene-server",
        "name": "🖥️ 食堂办公室",
        "description": "食堂管理员的办公室，有一台连接充值系统的电脑。",
        "bgColor": "from-slate-100 via-zinc-50 to-gray-100",
        "bgDecorations": [
          {
            "emoji": "🖥️",
            "x": 15,
            "y": 20,
            "size": "text-5xl"
          },
          {
            "emoji": "📚",
            "x": 70,
            "y": 15,
            "size": "text-4xl"
          },
          {
            "emoji": "☕",
            "x": 80,
            "y": 55,
            "size": "text-3xl"
          },
          {
            "emoji": "🌱",
            "x": 85,
            "y": 75,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "hotspot-computer",
            "label": "管理员电脑",
            "emoji": "🖥️",
            "x": 20,
            "y": 35,
            "sceneId": "scene-server",
            "type": "physical",
            "found": false,
            "content": {
              "title": "充值系统管理电脑",
              "desc": "老陈平时用来管理充值系统的台式电脑。",
              "detail": "电脑开机不需要密码，直接进入桌面。桌面上有一个校园卡管理系统的快捷方式。系统有一个手动调整余额的功能——输入卡号和金额就可以修改余额！这个操作没有二次验证，也不留下修改人信息。",
              "insight": "这个系统没有任何安全防护。任何人只要坐到这台电脑前，就可以随意修改任意一张校园卡的余额！"
            }
          },
          {
            "id": "hotspot-log",
            "label": "系统操作记录",
            "emoji": "📊",
            "x": 45,
            "y": 40,
            "sceneId": "scene-server",
            "type": "digital",
            "found": false,
            "content": {
              "title": "充值系统的操作日志",
              "desc": "系统虽然不记录调整余额操作，但记录了登录和登出时间。",
              "detail": "日志显示，在发生余额异常的那几天，每天下午4:30-5:00都有人登录系统。登录用户显示为管理员。但老陈说他那几天这个时间都在食堂窗口帮忙打饭。",
              "insight": "老陈在那段时间不在办公室！那管理员是谁？有人趁老陈不在时溜进来操作的。"
            }
          },
          {
            "id": "hotspot-cup",
            "label": "桌上的杯子",
            "emoji": "☕",
            "x": 65,
            "y": 55,
            "sceneId": "scene-server",
            "type": "physical",
            "found": false,
            "content": {
              "title": "一个用过的纸杯",
              "desc": "办公桌角落有一个用过的纸杯。",
              "detail": "纸杯上印着学校小卖部的logo。老陈用的是自己的保温杯，而这个纸杯是某学生或老师才会去小卖部买的。杯口处提取到一枚指纹。",
              "insight": "老陈用自己的保温杯，那这个纸杯就是来访者留下的！"
            }
          },
          {
            "id": "hotspot-window",
            "label": "办公室窗户",
            "emoji": "🪟",
            "x": 75,
            "y": 30,
            "sceneId": "scene-server",
            "type": "observation",
            "found": false,
            "content": {
              "title": "办公室的后窗",
              "desc": "办公室有一扇朝向后巷的小窗户。",
              "detail": "窗户是老式的推拉窗，锁扣已经坏了。窗外是一条很少有人经过的巷子。窗台上有一个大约24cm的脚印，像是一个女生的鞋码。",
              "insight": "有人从后窗翻进来过！24cm的脚印……和之前的26cm不一样，可能是另一个人。"
            }
          }
        ]
      },
      {
        "id": "scene-playground",
        "name": "🏫 校园小卖部",
        "description": "学校的小卖部，放学后很多学生会来这里买东西。",
        "bgColor": "from-sky-100 via-blue-50 to-cyan-50",
        "bgDecorations": [
          {
            "emoji": "🏪",
            "x": 10,
            "y": 20,
            "size": "text-5xl"
          },
          {
            "emoji": "🍦",
            "x": 50,
            "y": 25,
            "size": "text-4xl"
          },
          {
            "emoji": "🍭",
            "x": 75,
            "y": 35,
            "size": "text-4xl"
          },
          {
            "emoji": "🧃",
            "x": 80,
            "y": 60,
            "size": "text-3xl"
          },
          {
            "emoji": "🍪",
            "x": 55,
            "y": 65,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "hotspot-shopkeeper",
            "label": "小卖部老板的回忆",
            "emoji": "🧑‍🔧",
            "x": 55,
            "y": 35,
            "sceneId": "scene-playground",
            "type": "testimony",
            "found": false,
            "content": {
              "title": "小卖部老板提供的线索",
              "desc": "小卖部老板是个热心的大叔。",
              "detail": "你说那段时间啊——我想起来了！有个初三的女生，就是经常来帮忙搬货的那个，她说她表哥在搞什么校园卡充值优惠。充100送10块！好多学生都去找她充值。",
              "insight": "充100送10块？有人在用这个优惠活动吸引学生，然后用管理员的电脑给这些学生的卡充上钱——但充的钱是从别人的卡里扣来的！"
            }
          },
          {
            "id": "hotspot-list",
            "label": "充值优惠宣传单",
            "emoji": "📄",
            "x": 40,
            "y": 50,
            "sceneId": "scene-playground",
            "type": "physical",
            "found": false,
            "content": {
              "title": "手写的充值优惠传单",
              "desc": "一张手写的宣传单，贴在公告栏的角落。",
              "detail": "传单上写着：🎉校园卡充值福利！充100送10块，充200送25！数量有限先到先得！联系初三五班 小雨。字迹圆润，画了一些小星星和爱心的装饰。",
              "insight": "小雨，初三五班——有名字有班级！她收了同学的钱，然后通过有漏洞的系统给同学的卡充值。但送的那部分钱是从别人的卡上扣的！"
            }
          },
          {
            "id": "hotspot-cctv3",
            "label": "后巷监控",
            "emoji": "📹",
            "x": 70,
            "y": 15,
            "sceneId": "scene-playground",
            "type": "digital",
            "found": false,
            "content": {
              "title": "教学楼后巷监控录像",
              "desc": "学校操场角落的监控，拍到了食堂办公室后窗。",
              "detail": "监控回放显示：连续三天下午4:40左右，一名穿校服的女生出现在后巷，靠近办公室的后窗。她身形娇小，扎马尾辫。第三次时她明显是从窗户翻了出来。",
              "insight": "扎马尾辫、初三女生、会从小卖部进货……这些信息和小雨的特征很吻合。"
            }
          }
        ]
      }
    ],
    "npcs": [
      {
        "id": "npc-zhang",
        "name": "张小星",
        "emoji": "👦",
        "role": "第一名受害者",
        "sceneId": "scene-canteen",
        "dialogue": "我周一充了100块，周三去打饭发现只剩30了！我真的没有刷过卡！",
        "secret": "张小星想了想又说：哦对了！我充值那天，有个学姐站在旁边。她看我操作，还跟我说这个机器反应有点慢，要多等一会儿。但她好像看到我输入的卡号了。",
        "triggerQuestion": "询问他充值时的细节",
        "otherQuestions": [
          {
            "question": "问：你有没有把卡借给别人？",
            "response": "张小星摇头：卡一直在我身上。"
          },
          {
            "question": "问：你认识那个学姐吗？",
            "response": "张小星：不认识……但后来我在小卖部门口又看到过她。"
          }
        ]
      },
      {
        "id": "npc-xiaoyu",
        "name": "小雨",
        "emoji": "👩",
        "role": "嫌疑人",
        "sceneId": "scene-playground",
        "dialogue": "啊？充值优惠？我……我就是帮同学一个忙。我表哥说他有内部渠道。",
        "secret": "小雨低着头：其实我没有什么表哥……那是我在网上认识的一个网友，他说他发现了学校充值系统的漏洞。他教我怎么操作……后来我发现可以从别人的卡里转钱……我真的知道错了！",
        "triggerQuestion": "质问她所谓的表哥是谁",
        "otherQuestions": [
          {
            "question": "问：你知道这是违法的吗？",
            "response": "小雨哭了：我……我当时没想那么多。"
          },
          {
            "question": "问：你从后窗翻进去过几次？",
            "response": "小雨：我……我进去了三次……"
          }
        ]
      },
      {
        "id": "npc-chen",
        "name": "老陈",
        "emoji": "🧑‍💼",
        "role": "食堂管理员",
        "sceneId": "scene-server",
        "dialogue": "我在学校干了八年，从来没出过这种事。那个系统确实有点老旧，但以前从来没出过问题啊！",
        "secret": "老陈低声说：其实……我前几天就注意到有人动过我的电脑。鼠标的位置跟我摆放的不一样，但我怕说出来被批评就没声张。",
        "triggerQuestion": "问他有没有注意到办公室的异常",
        "otherQuestions": [
          {
            "question": "问：那几天下午4:30你在哪里？",
            "response": "老陈：我在打饭窗口帮忙。每天下午4点到5点半都在窗口。"
          },
          {
            "question": "问：你认识小雨吗？",
            "response": "老陈：初三五班的小雨？她常去小卖部帮忙搬货。"
          }
        ]
      }
    ],
    "minCluesToUnlock": 5,
    "deduction": {
      "title": "🧩 真相拼图",
      "description": "线索已经足够多了。现在来梳理整个案件吧！",
      "questions": [
        {
          "id": "ded-q-c1",
          "question": "🔍 饭卡里的钱是怎么被偷走的？",
          "options": [
            {
              "id": "c1a",
              "text": "有人黑了学校的充值系统远程转账",
              "isCorrect": false,
              "explanation": "系统日志显示没有外部入侵记录。"
            },
            {
              "id": "c1b",
              "text": "有人用办公室电脑手动调整余额把A卡的钱转到B卡",
              "isCorrect": true,
              "explanation": "正确！手法很简单：①偷看别人卡号；②从后窗翻进办公室；③用无密码的电脑登录系统；④手动调整余额把别人卡上的钱转走。"
            },
            {
              "id": "c1c",
              "text": "充值机被安装了盗刷装置",
              "isCorrect": false,
              "explanation": "充值机没有发现任何外接设备。"
            }
          ]
        },
        {
          "id": "ded-q-c2",
          "question": "👣 窗台上的脚印是谁的？",
          "options": [
            {
              "id": "c2a",
              "text": "小雨的——她翻窗进去操作电脑",
              "isCorrect": true,
              "explanation": "正确！24cm鞋码对应36-37码鞋子，监控拍到扎马尾的女生从后窗进出。"
            },
            {
              "id": "c2b",
              "text": "老陈的——他监守自盗",
              "isCorrect": false,
              "explanation": "老陈的鞋码是42码，窗台上的脚印明显小得多。"
            },
            {
              "id": "c2c",
              "text": "那是以前修理工留下的",
              "isCorrect": false,
              "explanation": "窗台上的脚印纹路清晰，是近几天留下的。"
            }
          ]
        },
        {
          "id": "ded-q-c3",
          "question": "🧪 地上的小票是怎么回事？",
          "options": [
            {
              "id": "c3a",
              "text": "小雨用充值机打印假小票来伪造交易记录",
              "isCorrect": false,
              "explanation": "小票上的卡号在系统中不存在，不是伪造交易记录。"
            },
            {
              "id": "c3b",
              "text": "有人在测试充值机，打印小票但没实际充值",
              "isCorrect": true,
              "explanation": "正确！小雨在作案前先用测试卡号打印了几张小票，确认充值机能正常出票。这是作案前的踩点。"
            },
            {
              "id": "c3c",
              "text": "其他学生充值后随手丢弃的",
              "isCorrect": false,
              "explanation": "小票上的卡号在系统中不存在，说明不是真实充值产生的。"
            }
          ]
        },
        {
          "id": "ded-q-c4",
          "question": "🎯 综合判断，这个案子的主谋是谁？",
          "options": [
            {
              "id": "c4a",
              "text": "小雨（学生）——她是实际操作者",
              "isCorrect": true,
              "explanation": "恭喜你破案了！小雨在网上认识了一个黑客网友，对方教她利用学校充值系统漏洞作案。小雨以充值优惠为名收集卡号和现金，趁老陈不在时潜入办公室操作电脑转账。"
            },
            {
              "id": "c4b",
              "text": "老陈（管理员）——他监守自盗",
              "isCorrect": false,
              "explanation": "老陈没有动机也没有作案时间——他每天下午都在打饭窗口帮忙。"
            },
            {
              "id": "c4c",
              "text": "外面的黑客远程入侵",
              "isCorrect": false,
              "explanation": "手法需要物理接触电脑（后窗进出、桌上纸杯），不是纯远程攻击。"
            }
          ]
        }
      ]
    },
    "result": {
      "summary": "一个利用学校充值系统漏洞的充值优惠骗局。小雨在网友教唆下，通过后窗潜入办公室，用系统漏洞盗取他人饭卡余额。",
      "fullStory": "🏆 **案件真相**\n\n小雨在网上认识了一个自称程序猿的网友。对方发现某学校充值系统的漏洞后，一直在寻找有内应的学校下手。小雨成了他的棋子。\n\n作案手法：\n1️⃣ **收集信息**：在充值机旁偷看卡号，或以充值优惠为名直接收集\n2️⃣ **潜入办公室**：趁老陈去帮忙打饭，从后窗翻进办公室\n3️⃣ **操作转账**：使用无密码电脑，手动调整余额\n4️⃣ **收取现金**：以充100送10为名收现金，用偷来的余额给同学的卡赠送额度\n\n**关键证据链：**\n1️⃣ 监控拍到小雨从后窗翻进翻出，与24cm脚印吻合\n2️⃣ 纸杯上提取到小雨的指纹\n3️⃣ 小卖部老板证实小雨在推广充值优惠\n4️⃣ 小票证实小雨提前测试过充值机\n\n💡 **教训：** 不要轻信网上的优惠福利，发现系统漏洞应报告老师而不是利用它。",
      "xpReward": 35
    }
  },
  {
    "id": "detective-rumor-1",
    "title": "朋友圈的谣言风暴",
    "subtitle": "是谁在造谣？",
    "emoji": "📱",
    "difficulty": "中等",
    "intro": {
      "narrative": [
        "周三早上，一条消息像病毒一样在阳光中学的学生群里传播开来。",
        "\"重磅！初三（1）班的赵子豪在校外打架被警察抓了！有图有真相！\"配图是一张少年被警察带走的照片。",
        "消息最先出现在一个名叫\"阳光爆料台\"的公众号上。随后被疯狂转发到各个班级群、家长群。",
        "到了中午，赵子豪发现所有同学都在用异样的眼光看他。他昨天确实去过派出所——但那是去帮妈妈取身份证的！",
        "赵子豪又气又委屈。他找到你——学校少年侦探社的成员——希望你能帮他查出谣言的源头。"
      ],
      "briefing": "你的任务：追踪谣言的传播路径，找出最初的造谣者，还原真相，还赵子豪一个清白。"
    },
    "scenes": [
      {
        "id": "scene-rumor-school",
        "name": "🏫 教学楼大厅",
        "description": "学校教学楼一楼大厅，公告栏前围满了议论纷纷的学生。",
        "bgColor": "from-indigo-100 via-sky-50 to-blue-50",
        "bgDecorations": [
          {
            "emoji": "🏛️",
            "x": 8,
            "y": 10,
            "size": "text-5xl"
          },
          {
            "emoji": "📋",
            "x": 50,
            "y": 30,
            "size": "text-4xl"
          },
          {
            "emoji": "🌳",
            "x": 80,
            "y": 60,
            "size": "text-4xl"
          },
          {
            "emoji": "👥",
            "x": 30,
            "y": 55,
            "size": "text-4xl"
          }
        ],
        "hotspots": [
          {
            "id": "rumor-article",
            "label": "谣言文章截图",
            "emoji": "📄",
            "x": 30,
            "y": 25,
            "sceneId": "scene-rumor-school",
            "type": "digital",
            "found": false,
            "content": {
              "title": "阳光爆料台公众号文章",
              "desc": "那条引爆全校的公众号文章截图。",
              "detail": "文章标题：震惊！阳光中学学生校外斗殴被警方带走！正文称我校初三（1）班赵某在外打架斗殴已被警方带走。配图是一张经过裁剪的照片——一个少年背影被警察带走。",
              "insight": "这个公众号像是一个校园爆料账号。文章里的赵某虽然没写全名但配上班级信息谁都能看出来是赵子豪。"
            }
          },
          {
            "id": "rumor-photo",
            "label": "原版照片",
            "emoji": "📷",
            "x": 45,
            "y": 30,
            "sceneId": "scene-rumor-school",
            "type": "digital",
            "found": false,
            "content": {
              "title": "未裁剪的原照片",
              "desc": "在公众号后台找到的原始上传图片。",
              "detail": "照片的EXIF信息显示拍摄时间昨天下午4:30，地点为xx路派出所门口。照片中确实有一个少年被警察带出，但仔细看那个少年的校服不是阳光中学的——是隔壁四中的！",
              "insight": "这根本不是赵子豪！有人故意裁剪了照片模糊处理，让人误以为是赵子豪。"
            }
          },
          {
            "id": "rumor-witness",
            "label": "围观的同学们",
            "emoji": "👥",
            "x": 65,
            "y": 45,
            "sceneId": "scene-rumor-school",
            "type": "testimony",
            "found": false,
            "content": {
              "title": "围观同学的议论",
              "desc": "几个正在议论这件事的同学说漏了嘴。",
              "detail": "好几个同学都指向最早的消息来源——是林思雨先发到群里的。",
              "insight": "林思雨？她和赵子豪认识吗？她为什么第一个发这个消息？"
            }
          },
          {
            "id": "rumor-sub",
            "label": "公众号注册信息",
            "emoji": "🔍",
            "x": 20,
            "y": 50,
            "sceneId": "scene-rumor-school",
            "type": "digital",
            "found": false,
            "content": {
              "title": "阳光爆料台账号信息",
              "desc": "通过学校老师查询的公众号后台注册信息。",
              "detail": "注册邮箱显示为 lin*****@***.com——lin开头的邮箱名很可能是某人的姓名拼音缩写。",
              "insight": "lin开头的邮箱……林思雨也姓林。难道这个公众号是她注册的？"
            }
          }
        ]
      },
      {
        "id": "scene-rumor-classroom",
        "name": "📚 初三教学楼",
        "description": "初三年级的教学楼走廊。赵子豪的班级在三楼。",
        "bgColor": "from-orange-100 via-amber-50 to-yellow-50",
        "bgDecorations": [
          {
            "emoji": "📚",
            "x": 10,
            "y": 15,
            "size": "text-4xl"
          },
          {
            "emoji": "🪟",
            "x": 55,
            "y": 20,
            "size": "text-4xl"
          },
          {
            "emoji": "🗄️",
            "x": 70,
            "y": 50,
            "size": "text-3xl"
          },
          {
            "emoji": "🪴",
            "x": 80,
            "y": 65,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "rumor-target",
            "label": "赵子豪本人",
            "emoji": "👦",
            "x": 30,
            "y": 40,
            "sceneId": "scene-rumor-classroom",
            "type": "testimony",
            "found": false,
            "content": {
              "title": "赵子豪的自述",
              "desc": "受害人赵子豪满脸委屈。",
              "detail": "我昨天下午是去了派出所——我妈的身份证丢了，让我去帮她取新办的。我取完就回家了！门口确实看到有个穿四中校服的人被警察带进去，但我根本不认识他！",
              "insight": "赵子豪昨天确实去过派出所但只是正常办事。造谣者利用这个真实信息来编造假故事。"
            }
          },
          {
            "id": "rumor-phone",
            "label": "赵子豪的手机",
            "emoji": "📱",
            "x": 50,
            "y": 45,
            "sceneId": "scene-rumor-classroom",
            "type": "digital",
            "found": false,
            "content": {
              "title": "赵子豪收到的私信",
              "desc": "赵子豪展示了一条他昨晚收到的私信。",
              "detail": "昨晚10:30，一个陌生账号发来消息：赵子豪？听说你昨天在派出所门口被拍了？有人要搞你，好自为之。该账号是刚注册的新号。",
              "insight": "发私信的人知道赵子豪昨天去过派出所！说明造谣者要么认识赵子豪要么也去了派出所附近。"
            }
          },
          {
            "id": "rumor-class-girl",
            "label": "林思雨的同班同学",
            "emoji": "👩",
            "x": 65,
            "y": 35,
            "sceneId": "scene-rumor-classroom",
            "type": "testimony",
            "found": false,
            "content": {
              "title": "林思雨的同学提供的信息",
              "desc": "林思雨的同班同学小芳愿意提供一些线索。",
              "detail": "林思雨最近一直在玩公众号。她和赵子豪之间有点过节——上个月学生会竞选赵子豪当选了副主席，林思雨落选了。她当时在朋友圈发过一条呵呵。",
              "insight": "动机出现了！学生会竞选落选——林思雨可能因此怀恨在心。"
            }
          },
          {
            "id": "rumor-schedule",
            "label": "林思雨的周末行踪",
            "emoji": "📅",
            "x": 55,
            "y": 20,
            "sceneId": "scene-rumor-classroom",
            "type": "digital",
            "found": false,
            "content": {
              "title": "林思雨的周末轨迹",
              "desc": "从同学们的聊天记录中拼凑出林思雨周六的活动。",
              "detail": "有同学说周六下午在派出所附近的奶茶店看到过林思雨——她一个人坐在窗边玩手机，大概4点左右。而派出所大门就在奶茶店斜对面！",
              "insight": "林思雨周六下午4点在派出所对面的奶茶店——正好能看到学生被警察带走的场景。她拍了照片然后发到了自己的公众号上！"
            }
          }
        ]
      },
      {
        "id": "scene-rumor-office",
        "name": "💻 学校机房",
        "description": "学校的计算机教室。林思雨经常利用午休时间来机房。",
        "bgColor": "from-gray-100 via-zinc-50 to-slate-100",
        "bgDecorations": [
          {
            "emoji": "🖥️",
            "x": 10,
            "y": 15,
            "size": "text-4xl"
          },
          {
            "emoji": "🖥️",
            "x": 35,
            "y": 25,
            "size": "text-4xl"
          },
          {
            "emoji": "🖥️",
            "x": 60,
            "y": 20,
            "size": "text-4xl"
          },
          {
            "emoji": "🪴",
            "x": 80,
            "y": 60,
            "size": "text-3xl"
          }
        ],
        "hotspots": [
          {
            "id": "rumor-computer",
            "label": "机房电脑历史记录",
            "emoji": "💻",
            "x": 25,
            "y": 35,
            "sceneId": "scene-rumor-office",
            "type": "digital",
            "found": false,
            "content": {
              "title": "机房电脑的浏览历史",
              "desc": "林思雨经常使用的那台电脑的浏览器历史记录。",
              "detail": "历史记录显示，本周一和周二午休时间有人在这台电脑上登录了微信公众号后台，编辑并发布了那篇阳光爆料台的文章。",
              "insight": "公众号文章是在学校机房发布的！说明运营者就是本校学生。"
            }
          },
          {
            "id": "rumor-wechat",
            "label": "林思雨的微信聊天",
            "emoji": "💬",
            "x": 50,
            "y": 40,
            "sceneId": "scene-rumor-office",
            "type": "digital",
            "found": false,
            "content": {
              "title": "林思雨和闺蜜的微信聊天",
              "desc": "林思雨在机房登录了网页版微信，没有退出。",
              "detail": "聊天记录中，林思雨对闺蜜说：哈哈你看到那个文章了吗？赵子豪这次肯定凉了。谁让他上次竞选的时候在台上说我经验不足？我倒要看看谁不足。",
              "insight": "铁证如山！林思雨亲口承认了造谣动机——报复赵子豪在学生会竞选时对她的评价。"
            }
          }
        ]
      }
    ],
    "npcs": [
      {
        "id": "npc-zhao",
        "name": "赵子豪",
        "emoji": "👦",
        "role": "受害人",
        "sceneId": "scene-rumor-classroom",
        "dialogue": "我真的快崩溃了！今天一整天都有人对我指指点点，我解释了也没人信！",
        "secret": "赵子豪说：其实我大概知道是谁干的。上个月学生会竞选我和林思雨都竞选副主席。我在演讲时说了一些可能不太好听的话。后来我当选了，她发了一条朋友圈说呵呵。",
        "triggerQuestion": "问他最近和谁有过矛盾",
        "otherQuestions": [
          {
            "question": "问：你昨天去派出所的事有谁知道？",
            "response": "赵子豪：我同桌知道，但我同桌不会乱说的。"
          },
          {
            "question": "问：那条私信你回复了吗？",
            "response": "赵子豪：没有。我当时看到挺害怕的。"
          }
        ]
      },
      {
        "id": "npc-linsi",
        "name": "林思雨",
        "emoji": "👩",
        "role": "嫌疑人",
        "sceneId": "scene-rumor-classroom",
        "dialogue": "干嘛？那文章又不是我写的。我就是转发了而已……",
        "secret": "在证据面前林思雨终于低下了头：好吧……那公众号是我做的。我那天在奶茶店看到派出所门口有人被带走就拍了照片。后来听说赵子豪也去了派出所……我就是一时生气……",
        "triggerQuestion": "出示机房电脑的登录记录和聊天记录",
        "otherQuestions": [
          {
            "question": "问：你知道造谣是违法的吗？",
            "response": "林思雨：我以为用公众号发就没人知道是我……"
          },
          {
            "question": "问：你和赵子豪之间有什么矛盾？",
            "response": "林思雨：竞选的时候他说话太难听了。"
          }
        ]
      },
      {
        "id": "npc-teacher",
        "name": "年级主任李老师",
        "emoji": "👩‍🏫",
        "role": "学校负责人",
        "sceneId": "scene-rumor-office",
        "dialogue": "这件事对学校影响很坏！家长群都炸了。我已经让班主任在群里澄清了。",
        "secret": "李老师叹了口气：林思雨这个孩子其实一直挺优秀的，就是太要强了。上次竞选落选后她来找过我，说自己很不甘心。",
        "triggerQuestion": "询问学校对此事的态度",
        "otherQuestions": [
          {
            "question": "问：学校会对造谣者怎么处理？",
            "response": "李老师：按校规传播谣言损害他人名誉的行为会受到纪律处分。"
          },
          {
            "question": "问：赵子豪的状态怎么样？",
            "response": "李老师：孩子心理压力很大，我们已经安排心理老师和他沟通了。"
          }
        ]
      }
    ],
    "minCluesToUnlock": 5,
    "deduction": {
      "title": "🧩 真相拼图",
      "description": "所有的线索都齐了。现在来还原这起谣言事件的真相。",
      "questions": [
        {
          "id": "ded-q-r1",
          "question": "📸 那张被抓的照片到底是怎么回事？",
          "options": [
            {
              "id": "r1a",
              "text": "照片是真的拍到赵子豪被警察带走",
              "isCorrect": false,
              "explanation": "被带走的学生穿的是隔壁四中的校服，不是赵子豪。"
            },
            {
              "id": "r1b",
              "text": "照片是假的有人用PS合成的",
              "isCorrect": false,
              "explanation": "照片是真的在派出所门口拍摄的。问题出在文字说明上。"
            },
            {
              "id": "r1c",
              "text": "照片是真的但拍的是别人，被故意说成赵子豪",
              "isCorrect": true,
              "explanation": "正确！林思雨在奶茶店拍到派出所门口有人被带走，后来听说赵子豪也去了派出所，就故意把两件事联系起来制造谣言。"
            }
          ]
        },
        {
          "id": "ded-q-r2",
          "question": "🔍 公众号阳光爆料台是谁运营的？",
          "options": [
            {
              "id": "r2a",
              "text": "林思雨——她在机房登录了公众号后台",
              "isCorrect": true,
              "explanation": "正确！机房电脑的浏览器记录显示有人登录了公众号后台，注册邮箱以lin开头。林思雨自己也承认了。"
            },
            {
              "id": "r2b",
              "text": "校外人员运营的跟学生没关系",
              "isCorrect": false,
              "explanation": "文章是在学校机房的电脑上发布的。如果是校外人员没必要来学校机房操作。"
            },
            {
              "id": "r2c",
              "text": "赵子豪自己炒作",
              "isCorrect": false,
              "explanation": "赵子豪是受害人，完全没有动机造自己的谣。"
            }
          ]
        },
        {
          "id": "ded-q-r3",
          "question": "💡 造谣者的动机是什么？",
          "options": [
            {
              "id": "r3a",
              "text": "林思雨因为学生会竞选落选怀恨在心",
              "isCorrect": true,
              "explanation": "正确！林思雨和赵子豪都竞选学生会副主席，赵子豪当选后林思雨一直心怀不满。"
            },
            {
              "id": "r3b",
              "text": "为了给公众号赚流量涨粉丝",
              "isCorrect": false,
              "explanation": "涨粉只是手段不是根本动机。真正的导火索是个人怨恨。"
            },
            {
              "id": "r3c",
              "text": "恶作剧没想到会闹这么大",
              "isCorrect": false,
              "explanation": "从聊天记录看林思雨是故意策划的，不是临时起意的恶作剧。"
            }
          ]
        },
        {
          "id": "ded-q-r4",
          "question": "⚖️ 以下哪项是对林思雨行为最恰当的说法？",
          "options": [
            {
              "id": "r4a",
              "text": "这属于民事侵权，侵犯了赵子豪的名誉权",
              "isCorrect": true,
              "explanation": "正确！林思雨捏造事实传播谣言导致赵子豪社会评价降低精神受伤害，侵犯了名誉权。《民法典》第一千零二十四条规定不得以侮辱诽谤方式侵害他人名誉权。"
            },
            {
              "id": "r4b",
              "text": "这只是同学之间的矛盾道个歉就行了",
              "isCorrect": false,
              "explanation": "利用网络公众平台捏造事实传播谣言，已经超出普通矛盾范畴。"
            },
            {
              "id": "r4c",
              "text": "这是言论自由她想说什么就说什么",
              "isCorrect": false,
              "explanation": "言论自由不是绝对的！捏造事实侵害他人合法权益的言论不受法律保护。"
            }
          ]
        }
      ]
    },
    "result": {
      "summary": "这是一起由个人恩怨引发的网络谣言事件。林思雨因学生会竞选落选对赵子豪怀恨在心，利用公众号捏造事实传播谣言。",
      "fullStory": "🏆 **案件真相**\n\n林思雨和赵子豪的矛盾始于一个月前的学生会竞选。两人都是副主席候选人，在竞选演讲中赵子豪说了一句林思雨经验不足的话，刺痛了林思雨的自尊心。\n\n周六下午林思雨在派出所对面的奶茶店喝奶茶时看到隔壁四中的一个学生被警察带走，她拍了照片。后来听说赵子豪也去了派出所——一个报复的计划在她脑海中形成。\n\n她裁剪照片模糊处理，在自己的公众号阳光爆料台上发布了那条谣言。她以为用公众号发布就不会被追查到——但机房电脑的浏览记录、公众号注册信息、以及她自己没退出的微信聊天记录全都成了指证她的铁证。\n\n**关键证据链：**\n1️⃣ 公众号注册邮箱以lin开头，与林思雨姓名吻合\n2️⃣ 机房电脑记录显示有人登录该公众号后台\n3️⃣ 微信聊天记录显示林思雨承认了造谣动机\n4️⃣ 奶茶店目击证词证实林思雨当天在现场拍照\n\n💡 **教训：** 网络不是法外之地，造谣传谣要承担法律责任。看到劲爆消息先核实再转发。同学之间有矛盾应正面沟通而不是背后使绊子。",
      "xpReward": 35
    }
  }
,
{
  id: "detective-gym-1",
  title: "体育器材室的黑影",
  subtitle: "冠军奖杯被盗案",
  emoji: "🏆",
  difficulty: "中等",
  intro: {
    narrative: ["阳光中学体育器材室的展示柜里存放着学校足球队去年获得的全市中学生足球联赛冠军奖杯。", "周一的早晨体育老师刘老师发现展示柜的玻璃被砸碎奖杯不翼而飞。", "更奇怪的是器材室的门锁完好无损门窗没有被撬的痕迹。", "保安调取了监控录像发现周日凌晨1点左右有一个黑影从器材室的通风口爬了进去。", "但当晚下着大雨监控画面非常模糊只能看出一个穿着深色雨衣的人影。", "刘老师立刻报警并通知了你少年侦探社的成员。"],
    briefing: "你的任务：搜查器材室内外、询问相关人员、找出偷走奖杯的人。"
  },
  scenes: [
{
      id: "scene-gym-room",
      name: "🏟️ 体育器材室",
      description: "存放体育器材和奖杯的房间。展示柜被砸碎碎片散落一地。",
      bgColor: "from-emerald-100 via-teal-50 to-green-50",
      bgDecorations: [
{ emoji: "🏟️", x: 8, y: 12, size: "text-5xl" },
{ emoji: "⚽", x: 60, y: 25, size: "text-4xl" },
{ emoji: "🏀", x: 75, y: 45, size: "text-4xl" },
{ emoji: "🏓", x: 80, y: 65, size: "text-3xl" },
{ emoji: "🎽", x: 20, y: 65, size: "text-3xl" }
      ],
      hotspots: [
{
          id: "gym-case",
          label: "破碎的展示柜",
          emoji: "💎",
          x: 25,
          y: 30,
          sceneId: "scene-gym-room",
          type: "physical",
          found: false,
          content: { title: "被砸碎的展示柜", desc: "原来放冠军奖杯的玻璃展示柜。", detail: "玻璃柜门被钝器砸碎碎片向内散落。展示柜里其他奖牌和纪念品都在只有冠军奖杯不见了。这说明目标非常明确就是冲着冠军奖杯来的。玻璃碎片上有少量血迹。", insight: "玻璃向内散落说明是从外面砸的。目标明确只偷奖杯应该是认识这个奖杯价值的人。血迹可能是小偷不小心划伤了自己。" }
        },
{
          id: "gym-tool",
          label: "地上的铁棍",
          emoji: "🔧",
          x: 40,
          y: 45,
          sceneId: "scene-gym-room",
          type: "physical",
          found: false,
          content: { title: "作案工具", desc: "地上发现一根沾着玻璃碎屑的铁棍。", detail: "铁棍长约40cm是学校操场边上建筑工地的废料。上面提取到模糊的指纹和微量血迹。铁棍的一端有玻璃碎屑附着与展示柜玻璃的碎片吻合。", insight: "指纹和血迹如果能比对出来就是直接证据！而且铁棍来自学校工地说明作案者对学校环境很熟悉。" }
        },
{
          id: "gym-window",
          label: "通风口",
          emoji: "💨",
          x: 65,
          y: 20,
          sceneId: "scene-gym-room",
          type: "observation",
          found: false,
          content: { title: "被拆下的通风口百叶窗", desc: "器材室天花板角落的通风口百叶窗被拆了下来。", detail: "通风口尺寸约50cmx40cm一个体型瘦小的人可以爬进去。百叶窗的螺丝被用螺丝刀拧了下来不是暴力破坏而是专业拆卸。通风口内壁有泥土痕迹从外面踩踏带入。", insight: "专业拆卸不像是一时冲动的行为。而且通风口直通室外外面的地面是花坛雨后泥土会留下鞋印。" }
        },
{
          id: "gym-footprint",
          label: "花坛中的鞋印",
          emoji: "👣",
          x: 70,
          y: 50,
          sceneId: "scene-gym-room",
          type: "observation",
          found: false,
          content: { title: "通风口外的鞋印", desc: "器材室外的花坛泥地里留下了清晰的鞋印。", detail: "鞋印长约27cm纹路是运动鞋的波浪形花纹。鞋印深度约2cm说明作案者的体重不轻。鞋印只留下了一组从花坛走向通风口的没有离开的。", insight: "27cm的鞋印大约对应43码成年男性的鞋码。但通风口只有50cm宽一个成年男性爬进去会不会太挤了。" }
        }
      ]
    },
{
      id: "scene-gym-outside",
      name: "🌳 器材室周边",
      description: "器材室外面是操场和花坛远处是学校围墙。",
      bgColor: "from-sky-200 via-blue-100 to-cyan-50",
      bgDecorations: [
{ emoji: "🌳", x: 12, y: 20, size: "text-5xl" },
{ emoji: "🌳", x: 75, y: 18, size: "text-4xl" },
{ emoji: "🏃", x: 50, y: 40, size: "text-4xl" },
{ emoji: "🚧", x: 80, y: 55, size: "text-4xl" },
{ emoji: "🚪", x: 20, y: 50, size: "text-3xl" }
      ],
      hotspots: [
{
          id: "gym-fence",
          label: "学校围墙",
          emoji: "🧱",
          x: 15,
          y: 40,
          sceneId: "scene-gym-outside",
          type: "observation",
          found: false,
          content: { title: "学校后门的围墙", desc: "器材室旁边就是学校后门围墙。", detail: "围墙上有一处明显的攀爬痕迹墙头有几块瓦片被踩碎了。墙外侧是城市道路。围墙高度约2.5米一个成年人可以翻越。墙内侧泥土中有一个清晰的鞋印和花坛中的鞋印纹路一致。", insight: "作案者翻墙进出学校！鞋印一致说明是同一个人。2.5米的墙能翻过去说明身体条件不错。" }
        },
{
          id: "gym-construction",
          label: "建筑工人休息棚",
          emoji: "🏗️",
          x: 70,
          y: 35,
          sceneId: "scene-gym-outside",
          type: "testimony",
          found: false,
          content: { title: "工地工人的证词", desc: "学校旁边建筑工地的工人说周日早上看到了什么。", detail: "工人老李说周日早上6点半我到工地开工看到一个穿黑色雨衣的人从学校后门那边走出来怀里鼓鼓囊囊的。我当时觉得奇怪但没多想以为是学校里的老师。现在回想起来那天又没下雨穿什么雨衣？", insight: "没下雨穿雨衣就是为了遮住身形和面孔。这个人怀里鼓鼓囊囊的应该就是藏着奖杯。" }
        },
{
          id: "gym-bike",
          label: "泥地上的自行车印",
          emoji: "🚲",
          x: 55,
          y: 55,
          sceneId: "scene-gym-outside",
          type: "observation",
          found: false,
          content: { title: "模糊的自行车轮胎印", desc: "学校后门外的泥地上除了鞋印还有自行车胎印。", detail: "轮胎印宽度约4cm是普通自行车的轮胎。轮胎印从围墙下延伸到马路方向。鞋印在围墙内外都有但自行车印只出现在墙外。说明作案者可能是骑自行车来的。", insight: "骑自行车作案说明住处应该不会太远。结合附近的监控也许能查到自行车的去向。" }
        },
{
          id: "gym-cctv4",
          label: "路口监控",
          emoji: "📹",
          x: 40,
          y: 25,
          sceneId: "scene-gym-outside",
          type: "digital",
          found: false,
          content: { title: "附近路口的治安监控", desc: "学校后门对面路口的监控录像。", detail: "周日凌晨1:15左右一个穿黑色雨衣骑着自行车的人从学校方向经过路口。因为下雨且戴了雨衣帽子看不清面容。但可以看出体态偏瘦身高约170-175cm。自行车是普通黑色女式车没有明显特征。", insight: "身高170-175cm体型偏瘦骑着黑色女式自行车。凌晨1:15距离监控拍到黑影进入器材室的时间吻合。" }
        }
      ]
    },
{
      id: "scene-gym-school",
      name: "📋 学校办公室",
      description: "教导主任的办公室。关于奖杯被盗似乎有一些学生间的传闻。",
      bgColor: "from-stone-100 via-zinc-50 to-gray-100",
      bgDecorations: [
{ emoji: "📚", x: 10, y: 15, size: "text-4xl" },
{ emoji: "🗄️", x: 60, y: 20, size: "text-4xl" },
{ emoji: "☕", x: 75, y: 50, size: "text-3xl" },
{ emoji: "🖥️", x: 35, y: 30, size: "text-4xl" }
      ],
      hotspots: [
{
          id: "gym-student",
          label: "知情学生",
          emoji: "👦",
          x: 40,
          y: 35,
          sceneId: "scene-gym-school",
          type: "testimony",
          found: false,
          content: { title: "一名学生提供的线索", desc: "一位不愿透露姓名的学生来向侦探社报告。", detail: "听说之前校足球队有个叫马强的替补队员因为比赛没让他上场和教练大吵了一架后来就退队了。他走的时候放话说你们会后悔的。那之后没多久奖杯就被偷了我觉得有点巧。", insight: "马强替补队员被开除后放狠话他确实有动机报复。" }
        },
{
          id: "gym-teacher",
          label: "教练的陈述",
          emoji: "👨‍🏫",
          x: 55,
          y: 35,
          sceneId: "scene-gym-school",
          type: "testimony",
          found: false,
          content: { title: "足球队教练的回忆", desc: "校足球队张教练提供的线索。", detail: "马强那孩子身体素质其实不错就是脾气太急了。上次市赛我没让他首发他当场就摔了水瓶骂骂咧咧走了。后来赌气退了队。但我觉得他不会偷奖杯吧？", insight: "张教练觉得他不会但是人在气头上什么事都做得出来。马强既然是足球队的肯定知道奖杯放在器材室的展示柜里。" }
        },
{
          id: "gym-maqiang",
          label: "马强的近况",
          emoji: "🔍",
          x: 65,
          y: 40,
          sceneId: "scene-gym-school",
          type: "digital",
          found: false,
          content: { title: "马强的个人信息", desc: "从学校学籍系统中查到的马强最新信息。", detail: "马强17岁高二学生。退队后转学去了隔壁区的育才中学。家庭住址距学校约3公里。育才中学的班主任反馈马强转学后表现一般经常迟到早退。上周五他请了病假。", insight: "马强住的方向和监控中自行车去的方向一致！而且他上周五请病假。" }
        }
      ]
    }
  ],
  npcs: [
{
      id: "npc-coach",
      name: "张教练",
      emoji: "👨‍🏫",
      role: "足球队教练",
      sceneId: "scene-gym-outside",
      dialogue: "这个奖杯可是孩子们拼了命拿回来的。现在被偷了队员们都很难过。",
      secret: "张教练犹豫了一下说其实马强退队后找我道过歉说那天太冲动了。我本来想让他归队的但还没来得及跟学校说。他上周五还来学校找过我说想回来。我当时不在办公室他在门口等了半小时。",
      triggerQuestion: "询问马强最近有没有回学校",
      otherQuestions: [
{ question: "你觉得会是谁干的？", response: "张教练摇头我真的想不出来谁会做这种事。" },
{ question: "器材室的钥匙谁有？", response: "张教练我有一把刘老师有一把还有一把备用钥匙在教导处。门锁没有被撬的痕迹应该是从通风口进去的。" }
      ]
    },
{
      id: "npc-maqiang",
      name: "马强",
      emoji: "🧑",
      role: "嫌疑人",
      sceneId: "scene-gym-school",
      dialogue: "什么？奖杯被偷了？跟我有什么关系？我早就不是那个学校的人了！",
      secret: "马强声音低了下来好吧我上周五确实回过学校去找张教练想归队。但我在门口等了半小时他都不在我就走了。至于奖杯我承认我说过气话。但真不是我偷的！我可以给你看我的手机定位周日凌晨我在家睡觉！",
      triggerQuestion: "质问他的不在场证明",
      otherQuestions: [
{ question: "你为什么上周五请假？", response: "马强我真的是不舒服！头疼得厉害我妈可以作证。" },
{ question: "你知道奖杯放在哪里吗？", response: "马强翻了个白眼当然知道在展示柜里。但全校谁不知道？那又不是什么秘密。" }
      ]
    },
{
      id: "npc-liu",
      name: "刘老师",
      emoji: "👩‍🏫",
      role: "体育老师",
      sceneId: "scene-gym-room",
      dialogue: "我教了十五年体育从来没遇到过这种事。那个奖杯对我来说也很重要那是我带队拿的第一个冠军。",
      secret: "刘老师低声说其实周日晚上我不在学校。我带家人出去吃饭了9点多才回家。但是我回家的路上好像看到一个人影从学校方向骑车过来当时没在意现在想想可能就是那个小偷。",
      triggerQuestion: "问她周日晚上在哪里",
      otherQuestions: [
{ question: "你有没有把钥匙借给别人？", response: "刘老师没有！钥匙一直在我身上。" },
{ question: "你觉得会是谁做的？", response: "刘老师我怀疑过马强。但我不敢乱说万一不是他呢？" }
      ]
    }
  ],
  minCluesToUnlock: 5,
  deduction: {
    title: "🧩 真相拼图",
    description: "所有线索收集完毕现在来还原案件真相。",
    questions: [
{
        id: "ded-q-g1",
        question: "🔍 小偷是怎么进入器材室的？",
        options: [
{ id: "g1a", text: "用偷来的钥匙开门进入", isCorrect: false, explanation: "三个有钥匙的人都没有丢失或外借钥匙。门锁完好没有被撬。" },
{ id: "g1b", text: "从通风口爬进去的", isCorrect: true, explanation: "正确！通风口的百叶窗被专业拆卸内壁有泥土痕迹监控拍到黑影从通风口方向进入所有证据都指向通风口是入口。" },
{ id: "g1c", text: "有人给他开了门", isCorrect: false, explanation: "如果有人在里面开门没必要拆卸通风口。而且凌晨1点在学校里有人接应的可能性不大。" }
        ]
      },
{
        id: "ded-q-g2",
        question: "👟 花坛里的鞋印告诉我们什么？",
        options: [
{ id: "g2a", text: "小偷是个成年男性", isCorrect: false, explanation: "27cm鞋码像成年男性但通风口只有50cm宽成年男性很难爬进去。马强体型偏瘦170cm穿43码鞋符合条件。" },
{ id: "g2b", text: "小偷是个体型偏瘦的人可能是个学生", isCorrect: true, explanation: "正确！鞋码大但能从50cm通风口爬进去的人体型必须很瘦。马强身高170cm体重约55kg符合条件。" },
{ id: "g2c", text: "鞋印和小偷无关可能是白天学生留下的", isCorrect: false, explanation: "周日下雨如果是白天留下的鞋印应该被雨水冲刷掉了。" }
        ]
      },
{
        id: "ded-q-g3",
        question: "🎯 为什么只有冠军奖杯被偷了？",
        options: [
{ id: "g3a", text: "小偷只认识冠军奖杯值钱", isCorrect: false, explanation: "展示柜里还有其他奖牌小偷没有碰说明目标非常明确。" },
{ id: "g3b", text: "小偷针对这个奖杯而来有特殊感情或怨恨", isCorrect: true, explanation: "正确！只偷冠军奖杯说明目标明确。马强因没被允许上场而退队这个奖杯对他来说既是耻辱也是怨恨的象征。" },
{ id: "g3c", text: "小偷没来得及偷别的", isCorrect: false, explanation: "时间充足展示柜已砸开顺手拿其他奖牌完全来得及。为什么没拿？因为目标就是冠军奖杯。" }
        ]
      },
{
        id: "ded-q-g4",
        question: "⚖️ 综合所有证据谁是真正的窃贼？",
        options: [
{ id: "g4a", text: "马强前足球队替补队员", isCorrect: true, explanation: "恭喜你破案了！马强因没被允许上场比赛而与教练冲突负气退队。周日凌晨他穿上雨衣骑自行车到学校后门翻墙进入从通风口爬进器材室用铁棍砸开展示柜偷走了冠军奖杯。警方在他家衣柜中找到奖杯上面贴着纸条写着我应得的。马强承认我就是想让他们知道没有我这个奖杯什么都不是。" },
{ id: "g4b", text: "校外小偷潜入学校偷窃", isCorrect: false, explanation: "校外小偷怎么会知道展示柜里有冠军奖杯？怎么会知道通风口能爬进去？这些都需要对学校非常熟悉。" },
{ id: "g4c", text: "教练自导自演骗保", isCorrect: false, explanation: "冠军奖杯没有买保险。教练对奖杯的感情不像假的。" }
        ]
      }
    ]
  },
  result: { summary: "前足球队替补队员马强因不满教练没让他上场蓄意报复偷走了冠军奖杯。", fullStory: "🏆 **案件真相**\\n\\n马强曾是校足球队的替补队员在去年的市级中学生足球联赛中他因教练没让他首发当场情绪失控与教练爆发冲突后退队。\\n\\n他退队后一直无法释怀。上周五他回学校找教练想归队教练正好不在这次碰壁成了压垮他情绪的最后一根稻草。\\n\\n周日凌晨1点他穿上雨衣骑上自行车从学校后门翻墙进入。利用对学校环境的熟悉从通风口爬进器材室用建筑工地的铁棍砸开展示柜偷走了冠军奖杯。\\n\\n**关键证据链：**\\n1️⃣ 通风口百叶窗被专业拆卸马强知道通风口的构造\\n2️⃣ 43码鞋印与马强的鞋码吻合\\n3️⃣ 监控拍到的人影身高体态与马强相符\\n4️⃣ 奖杯在马强家中找到附有挑衅纸条\\n5️⃣ 马强承认了全部犯罪事实\\n\\n💡 **教训：** 愤怒和怨恨会让人做出无法挽回的事。比赛中的得失是暂时的但一旦触犯法律留下的污点是永久的。", xpReward: 35 }
},
{
  id: "detective-ghost-1",
  title: "班级群里的幽灵",
  subtitle: "是谁在冒充同学诈骗？",
  emoji: "👻",
  difficulty: "中等",
  intro: {
    narrative: ["周三晚上初三（2）班的班级群里突然热闹起来。", "一个头像和昵称都和李晓明一模一样的账号在群里发消息说妈妈在急诊需要押金能不能先转500。", "热心的班长张晴第一个转了账接着又有5个同学陆续转账。", "直到第二天早上真正的李晓明在群里发了一句大家早上好班长私信问他妈妈好点了吗李晓明回了个问号说我妈好好的啊。", "这时大家才发现被骗了。那个假李晓明的账号已经退出了群聊。6个人共计被骗了3000元。", "班主任李老师马上联系了你少年侦探社的成员希望你能查出是谁在搞鬼。"],
    briefing: "你的任务：分析微信群聊记录查看账号信息询问受骗同学找出这个班级群里的幽灵。"
  },
  scenes: [
{
      id: "scene-ghost-class",
      name: "📱 初三(2)班教室",
      description: "教室里的同学们还在议论昨晚的事情。",
      bgColor: "from-blue-100 via-indigo-50 to-sky-50",
      bgDecorations: [
{ emoji: "📚", x: 10, y: 15, size: "text-5xl" },
{ emoji: "🪟", x: 55, y: 20, size: "text-4xl" },
{ emoji: "🖥️", x: 70, y: 30, size: "text-4xl" },
{ emoji: "🌿", x: 80, y: 60, size: "text-3xl" },
{ emoji: "🗑️", x: 25, y: 60, size: "text-3xl" }
      ],
      hotspots: [
{
          id: "ghost-chat",
          label: "班级群聊天记录",
          emoji: "💬",
          x: 30,
          y: 25,
          sceneId: "scene-ghost-class",
          type: "digital",
          found: false,
          content: { title: "昨晚的群聊记录", desc: "班长张晴提供的班级群聊天记录截图。", detail: "假李晓明在晚上8:23发消息求助语气焦急。6名同学陆续转账假号一一收了钱。最后一条消息是8:50假号发的真的太感谢了明天一定还然后退群了。从头到尾没有发语音。", insight: "从不说语音说明骗子不能模仿李晓明的声音。头像和昵称可以复制但声音不行。" }
        },
{
          id: "ghost-transfer2",
          label: "转账记录",
          emoji: "💰",
          x: 45,
          y: 30,
          sceneId: "scene-ghost-class",
          type: "digital",
          found: false,
          content: { title: "受害同学的转账截图", desc: "6名同学向假微信号转账的记录。", detail: "转账金额都是500元合计3000元。收款方是一个部分隐藏的微信号头像和真正的李晓明一样。收款微信号与李晓明的微信号不同但大家都以为是李晓明的小号。", insight: "大家以为是李晓明的小号所以没怀疑。但收款微信号不是李晓明的如果能查到收款号是谁注册的就能找到骗子。" }
        },
{
          id: "ghost-victim",
          label: "受害同学",
          emoji: "😰",
          x: 55,
          y: 40,
          sceneId: "scene-ghost-class",
          type: "testimony",
          found: false,
          content: { title: "班长张晴的回忆", desc: "第一个转账的班长一脸懊悔。", detail: "我当时看到头像和名字都是李晓明没多想就转了。他平时和大家关系都不错而且他说妈妈在急诊我能不帮吗？现在想想为什么不直接打电话给李晓明确认一下？有一个同学在群里发消息说这个号是李晓明吗？但很快被刷上去了。", insight: "有人发现了不对劲但可惜被忽视了。" }
        },
{
          id: "ghost-phishing",
          label: "骗子的手法分析",
          emoji: "🔍",
          x: 65,
          y: 50,
          sceneId: "scene-ghost-class",
          type: "observation",
          found: false,
          content: { title: "骗子的时间选择", desc: "分析骗子为什么选择在晚上8点多作案。", detail: "晚上8:23这个时间点很巧妙。大多数学生在家里不在学校见面。而且晚上人心急更容易冲动转账。骗子还利用了妈妈在急诊这个紧急情况让人没时间多想。这是一个精心设计的骗局。", insight: "选择晚上是因为没法见面确认人心急容易冲动大家都在家各自看手机。这个骗子很了解学生的心理。" }
        }
      ]
    },
{
      id: "scene-ghost-lab",
      name: "💻 信息技术教室",
      description: "学校电脑机房。技术老师可以帮忙查一些网络信息。",
      bgColor: "from-gray-100 via-zinc-50 to-slate-100",
      bgDecorations: [
{ emoji: "🖥️", x: 10, y: 15, size: "text-4xl" },
{ emoji: "🖥️", x: 35, y: 25, size: "text-4xl" },
{ emoji: "🖥️", x: 60, y: 20, size: "text-4xl" },
{ emoji: "🖨️", x: 75, y: 50, size: "text-3xl" },
{ emoji: "🌱", x: 82, y: 65, size: "text-3xl" }
      ],
      hotspots: [
{
          id: "ghost-ip",
          label: "IP地址查询",
          emoji: "🌐",
          x: 25,
          y: 30,
          sceneId: "scene-ghost-lab",
          type: "digital",
          found: false,
          content: { title: "诈骗账号的登录手机", desc: "通过腾讯公司查询到的假微信号注册和登录信息。", detail: "微信号注册IP使用了代理VPN无法直接定位。但登录该微信号的手机IMEI号与一部已经在学校登记过的手机匹配IMEI号查询结果显示是一台华为P40手机在学校做过设备登记。", insight: "骗子用学校的手机作案！IMEI号唯一对应一台手机既然在学校做过登记那就能查到是谁的手机。" }
        },
{
          id: "ghost-student2",
          label: "可疑的同学",
          emoji: "👤",
          x: 45,
          y: 40,
          sceneId: "scene-ghost-lab",
          type: "testimony",
          found: false,
          content: { title: "技术老师的发现", desc: "信息技术老师回忆起一件事。", detail: "王老师说上周五下午有个学生来找我说手机坏了能不能帮他看看。型号是华为P40。他清理缓存时问我王老师用VPN会不会影响手机网速？当时没多想现在回想起来他为什么突然问VPN的事？", insight: "用VPN、华为P40、上周五来修手机这个时间线和地区信息太巧了。" }
        },
{
          id: "ghost-motive",
          label: "动机调查",
          emoji: "🎯",
          x: 60,
          y: 50,
          sceneId: "scene-ghost-lab",
          type: "digital",
          found: false,
          content: { title: "班级内部矛盾", desc: "从一个同学那里打听到的班级内部情况。", detail: "初三（2）班最近有两件事比较敏感：一是前几天班委改选原来的副班长王浩落选了；二是上周李晓明不小心把王浩新买的手机碰掉在地上屏幕摔碎了。李晓明说要赔维修费但王浩说算了但看起来一直耿耿于怀。", insight: "王浩副班长落选加手机被摔碎两件事叠加让他产生了报复的想法。" }
        }
      ]
    },
{
      id: "scene-ghost-meeting",
      name: "🏫 心理咨询室",
      description: "学校心理咨询室的角落安静而私密。",
      bgColor: "from-rose-100 via-pink-50 to-purple-50",
      bgDecorations: [
{ emoji: "🛋️", x: 15, y: 30, size: "text-4xl" },
{ emoji: "🌸", x: 50, y: 15, size: "text-4xl" },
{ emoji: "🌻", x: 75, y: 25, size: "text-4xl" },
{ emoji: "🍵", x: 70, y: 55, size: "text-3xl" },
{ emoji: "📖", x: 30, y: 50, size: "text-3xl" }
      ],
      hotspots: [
{
          id: "ghost-phone2",
          label: "王浩的手机",
          emoji: "📱",
          x: 35,
          y: 30,
          sceneId: "scene-ghost-meeting",
          type: "physical",
          found: false,
          content: { title: "王浩的华为P40手机", desc: "在班主任的配合下王浩同意交出手机进行检查。", detail: "手机IMEI号与诈骗账号绑定的IMEI号完全一致。手机中发现了多开分身应用可以同时登录多个微信号。还有VPN连接记录。在手机应用管理器中找到了一个被删除的微信号数据残留正是那个冒充李晓明的微信号。", insight: "铁证如山！王浩的手机就是作案工具。IMEI号匹配有多开分身有VPN记录有被删除的诈骗微信号残留。" }
        },
{
          id: "ghost-phone1",
          label: "真正的李晓明",
          emoji: "👦",
          x: 50,
          y: 35,
          sceneId: "scene-ghost-meeting",
          type: "testimony",
          found: false,
          content: { title: "李晓明的补充证词", desc: "真正的李晓明说了一个重要的细节。", detail: "李晓明说上周我把王浩手机摔了之后他说不用赔但表情很不好看。后来有一天我在操场上听到他打电话声音很小但我听到他说让李晓明吃个教训我当时以为他开玩笑的没当回事。现在想来他可能那时候就在计划了。", insight: "让李晓明吃个教训这句话证实了王浩的动机！他不是临时起意而是有预谋的。" }
        },
{
          id: "ghost-confession",
          label: "王浩的坦白",
          emoji: "😢",
          x: 60,
          y: 45,
          sceneId: "scene-ghost-meeting",
          type: "testimony",
          found: false,
          content: { title: "王浩终于说出了真相", desc: "面对所有证据王浩低下了头。", detail: "是我干的……我承认。班委落选我不服气手机摔了他说赔我但一直没赔我觉得所有人都看不起我。我建了个小号趁晚上大家都在的时候发了那条消息。我以为只要退了群删了号就没人能查到是我。我知道错了……", insight: "王浩承认了。他的动机混合了落选的失落和手机被摔的不甘。" }
        }
      ]
    }
  ],
  npcs: [
{
      id: "npc-zhangqing",
      name: "张晴",
      emoji: "👧",
      role: "班长/受害人",
      sceneId: "scene-ghost-class",
      dialogue: "我真的太傻了！我为什么不先打个电话问一下。李晓明平时跟我关系挺好的我本来应该知道他的微信号的。",
      secret: "张晴擦了擦眼泪说其实今天早上王浩来找过我他说他知道是谁干的了。但他没直接说是谁只说他可以帮我教训那个人。我当时觉得奇怪他怎么这么积极？",
      triggerQuestion: "问她有没有感觉谁行为反常",
      otherQuestions: [
{ question: "你转账的时候有什么异常吗？", response: "张晴没有头像和名字都是李晓明而且那个人发消息的语气也很像他。" },
{ question: "王浩最近状态怎么样？", response: "张晴想了想他最近挺沉默的上课也不太回答问题。可能因为落选班委心情不好吧。" }
      ]
    },
{
      id: "npc-wanghao",
      name: "王浩",
      emoji: "🧑",
      role: "嫌疑人",
      sceneId: "scene-ghost-lab",
      dialogue: "你们找我干嘛？我可没给那个假号转过钱。我被骗了吗？",
      secret: "面对证据王浩终于崩溃了好吧是我做的。我用手机多开分身建了个新微信号复制了李晓明的头像和昵称。晚上在群里发了那条消息。我承认我是想报复他。他摔了我手机说赔但一直拖班委落选他也不帮我说话。我就是想让他难堪一下。",
      triggerQuestion: "直接展示他手机中的多开分身和VPN记录",
      otherQuestions: [
{ question: "你昨晚8点到9点在干什么？", response: "王浩在家写作业。我爸妈可以作证。" },
{ question: "你为什么要问技术老师VPN的问题？", response: "王浩我我就是随便问问。" }
      ]
    },
{
      id: "npc-lixiaoming",
      name: "李晓明",
      emoji: "👦",
      role: "被冒充的受害者",
      sceneId: "scene-ghost-meeting",
      dialogue: "我一觉醒来发现自己成了骗子！太离谱了吧！我的微信号昨晚正常登录的没有被盗的痕迹。",
      secret: "李晓明叹气说实话我知道可能是谁。王浩的手机我摔了之后他一直很不高兴。我本来想这周凑钱赔他的但还没来得及。我没想到他会用这种方式报复我。",
      triggerQuestion: "问他是否怀疑过谁",
      otherQuestions: [
{ question: "你的微信号安全吗？", response: "李晓明安全的！我检查过了没有异地登录记录。" },
{ question: "你和王浩关系怎么样？", response: "李晓明犹豫以前挺好的但最近不太说话。可能因为手机的事吧。" }
      ]
    }
  ],
  minCluesToUnlock: 5,
  deduction: {
    title: "🧩 真相拼图",
    description: "线索已经足够多了。来揭开班级群里的幽灵真面目。",
    questions: [
{
        id: "ded-q-h1",
        question: "🔍 骗子是怎么做到头像和名字和真的一模一样的？",
        options: [
{ id: "h1a", text: "他黑进了李晓明的微信号", isCorrect: false, explanation: "李晓明检查过微信号没有异地登录记录。骗子不是盗号而是克隆了一个假号。" },
{ id: "h1b", text: "他用多开分身软件建了一个新号复制了李晓明的头像和昵称", isCorrect: true, explanation: "正确！多开分身可以让一部手机同时登录多个微信号。骗子用新号注册微信然后把头像和昵称改成和李晓明一样的。在群里发消息时看起来和真号一模一样。" },
{ id: "h1c", text: "他和李晓明共用一个微信号", isCorrect: false, explanation: "一个微信号不能同时在两个手机上登录。受害者们都在群里没人下线说明不是共号。" }
        ]
      },
{
        id: "ded-q-h2",
        question: "📱 警察通过什么找到了骗子？",
        options: [
{ id: "h2a", text: "通过转账记录找到了收款银行卡的持有人", isCorrect: false, explanation: "收款方微信号没有绑定银行卡收到的钱都在零钱里。这条线索查不到人。" },
{ id: "h2b", text: "通过手机IMEI号查到了注册设备", isCorrect: true, explanation: "正确！腾讯提供了登录诈骗微信号的手机IMEI号。学校正好有学生手机IMEI登记记录一比对就找到了王浩的手机。" },
{ id: "h2c", text: "通过IP地址定位到了王浩家", isCorrect: false, explanation: "骗子使用了VPN代理无法直接定位到真实IP。" }
        ]
      },
{
        id: "ded-q-h3",
        question: "💡 王浩作案的真实动机是什么？",
        options: [
{ id: "h3a", text: "单纯想骗钱花", isCorrect: false, explanation: "如果是想骗钱应该骗更多人更大金额。他只骗了3000元而且钱在零钱里没转走说明目的不是钱。" },
{ id: "h3b", text: "报复李晓明加发泄落选班委的不满", isCorrect: true, explanation: "正确！王浩的动机有两层：一是李晓明摔了他手机不赔；二是他落选了班委觉得大家都看不起他。骗局的目的不是钱而是让李晓明在班里抬不起头。" },
{ id: "h3c", text: "恶作剧闹着玩", isCorrect: false, explanation: "他提前准备了多开分身和VPN事后退群删号明显是有预谋的。" }
        ]
      },
{
        id: "ded-q-h4",
        question: "⚖️ 以下哪项是对王浩行为最恰当的法律评价？",
        options: [
{ id: "h4a", text: "这属于诈骗行为侵犯了他人的财产权", isCorrect: true, explanation: "正确！王浩以非法占有为目的虚构事实骗取6名同学3000元。他已满16周岁诈骗金额达到立案标准应承担法律责任。《刑法》规定已满十六周岁的人犯罪应当负刑事责任。" },
{ id: "h4b", text: "这只是同学之间的玩笑赔钱道歉就行了", isCorrect: false, explanation: "法律上这不是玩笑。以非法占有为目的虚构事实骗取他人财物金额达到3000元已构成诈骗罪的基本要件。" },
{ id: "h4c", text: "王浩太可怜了他没有错", isCorrect: false, explanation: "手机被摔和班委落选确实让人不开心但这不是用违法手段报复的理由。" }
        ]
      }
    ]
  },
  result: { summary: "王浩因手机被摔赔偿未果和班委落选心怀不满通过多开分身软件冒充李晓明在班级群发布虚假求助信息诈骗同学钱财。", fullStory: "🏆 **案件真相**\\n\\n王浩和李晓明本来是关系还不错的同学。但两件事改变了这一切：一是李晓明不小心摔碎了王浩的手机屏幕说赔却一直拖着；二是班委改选中王浩落选了而李晓明没有帮他说话。\\n\\n王浩心里越来越不平衡。他在网上看到有人用多开分身诈骗的案例决定给李晓明一个教训。\\n\\n他下载了多开分身软件注册了一个新微信号然后把头像和昵称都改成了李晓明的。周三晚上8:23他趁大家都在家看手机的时候在班级群发了那条妈妈在急诊的消息。\\n\\n**关键证据链：**\\n1️⃣ 诈骗微信号登录的IMEI号与王浩的手机匹配\\n2️⃣ 手机中发现多开分身软件和VPN连接记录\\n3️⃣ 手机中有被删除的诈骗微信号数据残留\\n4️⃣ 王浩上周五突然询问老师VPN问题\\n5️⃣ 王浩承认了全部事实\\n\\n💡 **教训：** 遇到群里的借钱消息先电话或当面核实不要急着转账。心中有不满应该通过沟通解决不要用违法手段报复。已满16周岁的人犯罪要承担刑事责任年龄不是护身符。", xpReward: 35 }
}
];

export function getDetectiveCaseById(id: string): DetectiveCaseData | undefined {
  return detectiveCases.find((c) => c.id === id);
}
