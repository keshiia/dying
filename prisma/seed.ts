import bcrypt from 'bcryptjs'
import { PrismaClient, Role, ResourceType, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

type SeedQuestion = {
  id: string
  type: QuestionType
  prompt: string
  optionsJson: string
  answerKey: string
  explanation: string
}

type ExtraLevelPlan = {
  orderNo: number
  title: string
  topic: string
  lawRef: string
  safeAction: string
  riskyAction: string
  scenario: string
}

type ExtraUnitPlan = {
  levelSlug: 'campus' | 'network' | 'family' | 'consumer' | 'traffic' | 'drug'
  questionPrefix: 'c' | 'n' | 'f' | 's' | 't' | 'd'
  unitId: string
  levels: ExtraLevelPlan[]
}

async function main() {
  const teacherEmail = 'teacher@example.com'
  const studentEmail = 'student@example.com'

  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {},
    create: {
      email: teacherEmail,
      passwordHash: await bcrypt.hash('Teacher123!', 10),
      role: Role.TEACHER,
      nickname: '张老师',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      passwordHash: await bcrypt.hash('Student123!', 10),
      role: Role.STUDENT,
      nickname: '小法',
      grade: '高一',
    },
  })

  const class1 = await prisma.class.upsert({
    where: { joinCode: 'LEGAL8K8K' },
    update: {},
    create: {
      name: '高一(1)班',
      teacherId: teacher.id,
      joinCode: 'LEGAL8K8K',
    },
  })

  await prisma.classMember.upsert({
    where: { classId_studentId: { classId: class1.id, studentId: student.id } },
    update: {},
    create: { classId: class1.id, studentId: student.id },
  })

  const unit1 = await prisma.learningUnit.upsert({
    where: { id: 'unit-campus' },
    update: {},
    create: {
      id: 'unit-campus',
      title: '校园法律：拒绝欺凌',
      category: '校园法律',
      gradeRange: '初中-高中',
      orderNo: 1,
    },
  })

  const unit2 = await prisma.learningUnit.upsert({
    where: { id: 'unit-network' },
    update: {},
    create: {
      id: 'unit-network',
      title: '网络法律：反诈骗与信息保护',
      category: '网络法律',
      gradeRange: '初中-高中',
      orderNo: 2,
    },
  })

  const unit3 = await prisma.learningUnit.upsert({
    where: { id: 'unit-family' },
    update: {},
    create: {
      id: 'unit-family',
      title: '家庭法律：监护与隐私',
      category: '家庭法律',
      gradeRange: '初中-高中',
      orderNo: 3,
    },
  })

  const unit4 = await prisma.learningUnit.upsert({
    where: { id: 'unit-consumer' },
    update: {},
    create: {
      id: 'unit-consumer',
      title: '消费法律：网游充值与维权',
      category: '消费法律',
      gradeRange: '初中-高中',
      orderNo: 4,
    },
  })

  const unit5 = await prisma.learningUnit.upsert({
    where: { id: 'unit-traffic' },
    update: {},
    create: {
      id: 'unit-traffic',
      title: '交通安全：规则与风险',
      category: '交通安全',
      gradeRange: '初中-高中',
      orderNo: 5,
    },
  })

  const unit6 = await prisma.learningUnit.upsert({
    where: { id: 'unit-drug' },
    update: {},
    create: {
      id: 'unit-drug',
      title: '禁毒法律：认识与拒绝',
      category: '禁毒法律',
      gradeRange: '初中-高中',
      orderNo: 6,
    },
  })

  const levels = await Promise.all([
    prisma.level.upsert({
      where: { id: 'level-campus-1' },
      update: {},
      create: {
        id: 'level-campus-1',
        unitId: unit1.id,
        title: '第一关：什么是校园欺凌？',
        orderNo: 1,
        xpReward: 20,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-campus-2' },
      update: {},
      create: {
        id: 'level-campus-2',
        unitId: unit1.id,
        title: '第二关：如何求助与取证',
        orderNo: 2,
        xpReward: 25,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-campus-3' },
      update: {},
      create: {
        id: 'level-campus-3',
        unitId: unit1.id,
        title: '第三关：冲突边界与校园秩序',
        orderNo: 3,
        xpReward: 30,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-campus-4' },
      update: {},
      create: {
        id: 'level-campus-4',
        unitId: unit1.id,
        title: '第四关：肖像权与校园拍摄',
        orderNo: 4,
        xpReward: 35,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-network-1' },
      update: {},
      create: {
        id: 'level-network-1',
        unitId: unit2.id,
        title: '第一关：识别网络诈骗',
        orderNo: 1,
        xpReward: 20,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-network-2' },
      update: {},
      create: {
        id: 'level-network-2',
        unitId: unit2.id,
        title: '第二关：个人信息保护',
        orderNo: 2,
        xpReward: 25,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-network-3' },
      update: {},
      create: {
        id: 'level-network-3',
        unitId: unit2.id,
        title: '第三关：网络暴力与名誉权',
        orderNo: 3,
        xpReward: 30,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-network-4' },
      update: {},
      create: {
        id: 'level-network-4',
        unitId: unit2.id,
        title: '第四关：AI换脸、盗图与著作权',
        orderNo: 4,
        xpReward: 35,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-family-1' },
      update: {},
      create: {
        id: 'level-family-1',
        unitId: unit3.id,
        title: '第一关：监护责任与求助渠道',
        orderNo: 1,
        xpReward: 20,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-family-2' },
      update: {},
      create: {
        id: 'level-family-2',
        unitId: unit3.id,
        title: '第二关：隐私与个人信息',
        orderNo: 2,
        xpReward: 25,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-family-3' },
      update: {},
      create: {
        id: 'level-family-3',
        unitId: unit3.id,
        title: '第三关：家庭暴力与求助通道',
        orderNo: 3,
        xpReward: 30,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-family-4' },
      update: {},
      create: {
        id: 'level-family-4',
        unitId: unit3.id,
        title: '第四关：网络言论边界与家庭沟通',
        orderNo: 4,
        xpReward: 35,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-consumer-1' },
      update: {},
      create: {
        id: 'level-consumer-1',
        unitId: unit4.id,
        title: '第一关：网游充值与退款常识',
        orderNo: 1,
        xpReward: 20,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-consumer-2' },
      update: {},
      create: {
        id: 'level-consumer-2',
        unitId: unit4.id,
        title: '第二关：直播打赏与消费维权',
        orderNo: 2,
        xpReward: 25,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-consumer-3' },
      update: {},
      create: {
        id: 'level-consumer-3',
        unitId: unit4.id,
        title: '第三关：网购退换与售后沟通',
        orderNo: 3,
        xpReward: 30,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-consumer-4' },
      update: {},
      create: {
        id: 'level-consumer-4',
        unitId: unit4.id,
        title: '第四关：二手交易与平台规则',
        orderNo: 4,
        xpReward: 35,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-traffic-1' },
      update: {},
      create: {
        id: 'level-traffic-1',
        unitId: unit5.id,
        title: '第一关：未成年人驾驶的风险',
        orderNo: 1,
        xpReward: 20,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-traffic-2' },
      update: {},
      create: {
        id: 'level-traffic-2',
        unitId: unit5.id,
        title: '第二关：骑行与出行安全',
        orderNo: 2,
        xpReward: 25,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-traffic-3' },
      update: {},
      create: {
        id: 'level-traffic-3',
        unitId: unit5.id,
        title: '第三关：酒驾醉驾与同乘风险',
        orderNo: 3,
        xpReward: 30,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-traffic-4' },
      update: {},
      create: {
        id: 'level-traffic-4',
        unitId: unit5.id,
        title: '第四关：出行事故后的自护与求助',
        orderNo: 4,
        xpReward: 35,
      },
    }),

    prisma.level.upsert({
      where: { id: 'level-drug-1' },
      update: {},
      create: {
        id: 'level-drug-1',
        unitId: unit6.id,
        title: '第一关：识别毒品与套路',
        orderNo: 1,
        xpReward: 20,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-drug-2' },
      update: {},
      create: {
        id: 'level-drug-2',
        unitId: unit6.id,
        title: '第二关：拒绝技巧与法律后果',
        orderNo: 2,
        xpReward: 25,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-drug-3' },
      update: {},
      create: {
        id: 'level-drug-3',
        unitId: unit6.id,
        title: '第三关：新型毒品与“伪装”陷阱',
        orderNo: 3,
        xpReward: 30,
      },
    }),
    prisma.level.upsert({
      where: { id: 'level-drug-4' },
      update: {},
      create: {
        id: 'level-drug-4',
        unitId: unit6.id,
        title: '第四关：诱导链路识别与及时求助',
        orderNo: 4,
        xpReward: 35,
      },
    }),
  ])

  const extraUnitPlans: ExtraUnitPlan[] = [
    {
      levelSlug: 'campus',
      questionPrefix: 'c',
      unitId: unit1.id,
      levels: [
        {
          orderNo: 5,
          title: '第五关：同伴冲突中的旁观者责任',
          topic: '校园冲突围观与起哄',
          lawRef: '《未成年人保护法》',
          safeAction: '立即通知老师并劝离围观同学',
          riskyAction: '跟着起哄并拍视频传播',
          scenario: '看到同学在走廊被多人围堵辱骂',
        },
        {
          orderNo: 6,
          title: '第六关：课堂录音录像边界',
          topic: '课堂偷拍与随意传播',
          lawRef: '《民法典》人格权编',
          safeAction: '先征得同意，仅用于正当学习目的',
          riskyAction: '未经同意上传社交平台',
          scenario: '你拍到同学课堂失误画面并被怂恿发群',
        },
        {
          orderNo: 7,
          title: '第七关：宿舍矛盾与安全底线',
          topic: '宿舍矛盾升级处理',
          lawRef: '《未成年人保护法》',
          safeAction: '保持距离并向宿管老师求助',
          riskyAction: '深夜约架私下解决',
          scenario: '宿舍因物品纠纷出现持续辱骂和推搡',
        },
        {
          orderNo: 8,
          title: '第八关：网络群聊辱骂应对',
          topic: '班级群网暴与侮辱言论',
          lawRef: '《民法典》人格权编',
          safeAction: '截图取证并通过老师和平台渠道处理',
          riskyAction: '拉人对骂升级冲突',
          scenario: '班级群有人持续辱骂并制作表情包攻击同学',
        },
        {
          orderNo: 9,
          title: '第九关：证据整理与沟通表达',
          topic: '校园侵害事件证据整理',
          lawRef: '《未成年人保护法》',
          safeAction: '按时间线整理证据后向学校反映',
          riskyAction: '删除聊天记录避免麻烦',
          scenario: '你准备向老师说明被欺凌经历但证据零散',
        },
        {
          orderNo: 10,
          title: '第十关：校园综合实战复盘',
          topic: '校园安全综合决策',
          lawRef: '《未成年人保护法》',
          safeAction: '先保安全再求助并留证据',
          riskyAction: '冲动对抗并公开传播隐私',
          scenario: '你和同学同时遭遇线下冲突与线上辱骂',
        },
      ],
    },
    {
      levelSlug: 'network',
      questionPrefix: 'n',
      unitId: unit2.id,
      levels: [
        {
          orderNo: 5,
          title: '第五关：短视频评论与法律边界',
          topic: '短视频评论区恶意攻击',
          lawRef: '《民法典》人格权编',
          safeAction: '理性沟通并举报侮辱谣言内容',
          riskyAction: '恶语回击并煽动围攻',
          scenario: '你在评论区被陌生账号持续人身攻击',
        },
        {
          orderNo: 6,
          title: '第六关：社交账号安全与盗号防范',
          topic: '验证码与账号安全',
          lawRef: '《个人信息保护法》',
          safeAction: '拒绝提供验证码并开启双重验证',
          riskyAction: '把验证码发给“客服”核验',
          scenario: '有人冒充平台客服私信索要短信验证码',
        },
        {
          orderNo: 7,
          title: '第七关：AI生成内容辨识与引用',
          topic: 'AI换脸与虚假内容传播',
          lawRef: '《个人信息保护法》',
          safeAction: '停止传播并核验来源真实性',
          riskyAction: '直接转发博流量',
          scenario: '群里出现同学“AI换脸”视频并被大量转发',
        },
        {
          orderNo: 8,
          title: '第八关：网购链接钓鱼识别',
          topic: '钓鱼链接与假客服退款',
          lawRef: '《网络安全法》',
          safeAction: '走官方App核验并保留记录',
          riskyAction: '点击陌生链接输入银行卡信息',
          scenario: '你收到“订单异常退款”短信附带链接',
        },
        {
          orderNo: 9,
          title: '第九关：网络谣言止损与澄清',
          topic: '未经核实信息扩散',
          lawRef: '《治安管理处罚法》',
          safeAction: '先核实再转发，必要时公开更正',
          riskyAction: '听说就发，不核实来源',
          scenario: '同学让你转发一条“学校紧急通知”截图',
        },
        {
          orderNo: 10,
          title: '第十关：网络法治综合实战',
          topic: '网络空间综合自护',
          lawRef: '《个人信息保护法》',
          safeAction: '保护隐私并使用平台正规投诉机制',
          riskyAction: '私下交易敏感账号信息',
          scenario: '你同时遇到盗号、网暴和谣言扩散风险',
        },
      ],
    },
    {
      levelSlug: 'family',
      questionPrefix: 'f',
      unitId: unit3.id,
      levels: [
        {
          orderNo: 5,
          title: '第五关：家庭沟通中的权利边界',
          topic: '家庭沟通中的情绪冲突',
          lawRef: '《家庭教育促进法》',
          safeAction: '冷静表达诉求并寻求老师协助沟通',
          riskyAction: '摔门离家并断联',
          scenario: '你与家长因学习安排争吵升级',
        },
        {
          orderNo: 6,
          title: '第六关：手机使用约定与守法意识',
          topic: '手机使用与隐私边界',
          lawRef: '《未成年人保护法》',
          safeAction: '协商使用规则并尊重彼此隐私',
          riskyAction: '偷看并公开家人聊天记录',
          scenario: '家人因手机使用时间问题发生争执',
        },
        {
          orderNo: 7,
          title: '第七关：家务与学习冲突协商',
          topic: '家庭责任分工协商',
          lawRef: '《家庭教育促进法》',
          safeAction: '提出可执行时间表并与监护人协商',
          riskyAction: '拒绝沟通只靠情绪对抗',
          scenario: '你因家务安排与学习时间产生冲突',
        },
        {
          orderNo: 8,
          title: '第八关：家庭隐私与社交分享',
          topic: '家庭隐私信息发布',
          lawRef: '《个人信息保护法》',
          safeAction: '发布前征求同意并隐藏敏感信息',
          riskyAction: '随手晒出家庭住址与行程',
          scenario: '你想在社交平台发布家庭聚会照片',
        },
        {
          orderNo: 9,
          title: '第九关：监护支持与求助链路',
          topic: '监护失灵时的求助路径',
          lawRef: '《未成年人保护法》',
          safeAction: '联系学校、妇联或12348等正规渠道',
          riskyAction: '只在匿名论坛求助',
          scenario: '你在家中长期感到压迫且无法有效沟通',
        },
        {
          orderNo: 10,
          title: '第十关：家庭法治综合实战',
          topic: '家庭场景综合权益保护',
          lawRef: '《未成年人保护法》',
          safeAction: '稳定情绪后走正规渠道求助',
          riskyAction: '冲动离家并与陌生人线下接触',
          scenario: '你同时遇到隐私泄露、冲突升级和网络骚扰',
        },
      ],
    },
    {
      levelSlug: 'consumer',
      questionPrefix: 's',
      unitId: unit4.id,
      levels: [
        {
          orderNo: 5,
          title: '第五关：预付消费与停业退款',
          topic: '预付卡停业退费纠纷',
          lawRef: '《消费者权益保护法实施条例》',
          safeAction: '保留凭证并要求退还未消费余额',
          riskyAction: '私下转账给“代退费中介”',
          scenario: '培训机构突然停课并称“暂不退款”',
        },
        {
          orderNo: 6,
          title: '第六关：未成年人充值争议',
          topic: '未成年人网络充值',
          lawRef: '《民法典》',
          safeAction: '联系平台客服并提交监护关系与流水证据',
          riskyAction: '删除订单记录放弃维权',
          scenario: '家长发现你账号出现大额游戏充值',
        },
        {
          orderNo: 7,
          title: '第七关：票务转卖与交易陷阱',
          topic: '票务二手交易风险',
          lawRef: '《消费者权益保护法》',
          safeAction: '使用平台担保交易并核验票务真伪',
          riskyAction: '脱离平台先款后票',
          scenario: '你在社交群看到低价演唱会门票转让',
        },
        {
          orderNo: 8,
          title: '第八关：直播带货宣传辨别',
          topic: '夸大宣传与冲动消费',
          lawRef: '《广告法》',
          safeAction: '核验商品信息并理性下单',
          riskyAction: '被“限时秒杀”诱导立即转账',
          scenario: '主播宣称商品“百分百治愈”并催促下单',
        },
        {
          orderNo: 9,
          title: '第九关：消费维权证据闭环',
          topic: '订单与聊天记录取证',
          lawRef: '《消费者权益保护法》',
          safeAction: '整理订单、支付、沟通记录后正式投诉',
          riskyAction: '只电话口头投诉不留记录',
          scenario: '商家拒绝履约且客服反复推诿',
        },
        {
          orderNo: 10,
          title: '第十关：消费权益综合实战',
          topic: '消费纠纷综合处理',
          lawRef: '《消费者权益保护法》',
          safeAction: '依法维权并警惕二次诈骗',
          riskyAction: '在黑群里购买“内部维权渠道”',
          scenario: '你同时遇到退款拖延、钓鱼短信和假客服',
        },
      ],
    },
    {
      levelSlug: 'traffic',
      questionPrefix: 't',
      unitId: unit5.id,
      levels: [
        {
          orderNo: 5,
          title: '第五关：电动车骑行规范',
          topic: '电动车与自行车骑行规则',
          lawRef: '《道路交通安全法》',
          safeAction: '按规定佩戴头盔并遵守信号灯',
          riskyAction: '逆行闯灯抢行',
          scenario: '你骑车上学赶时间，路口黄灯闪烁',
        },
        {
          orderNo: 6,
          title: '第六关：夜间出行风险防范',
          topic: '夜间步行与骑行安全',
          lawRef: '《道路交通安全法》',
          safeAction: '走照明良好路段并告知家人行程',
          riskyAction: '走偏僻近路并全程戴耳机',
          scenario: '晚自习后你需要独自回家',
        },
        {
          orderNo: 7,
          title: '第七关：乘坐网约车安全细节',
          topic: '网约车乘车核验',
          lawRef: '《道路交通安全法》',
          safeAction: '核对车牌司机信息并分享行程',
          riskyAction: '不上车前核验，直接乘坐',
          scenario: '平台显示车辆与现场车辆不一致',
        },
        {
          orderNo: 8,
          title: '第八关：路口通行优先规则',
          topic: '复杂路口通行判断',
          lawRef: '《道路交通安全法》',
          safeAction: '减速观察并礼让行人',
          riskyAction: '抢秒通行',
          scenario: '无信号灯路口有行人和非机动车交织',
        },
        {
          orderNo: 9,
          title: '第九关：事故现场取证与报警',
          topic: '轻微事故后的正确处理',
          lawRef: '《道路交通安全法》',
          safeAction: '先确保安全再报警并规范取证',
          riskyAction: '争执推搡不报警',
          scenario: '骑行与车辆擦碰后双方情绪激动',
        },
        {
          orderNo: 10,
          title: '第十关：交通法治综合实战',
          topic: '交通风险综合应对',
          lawRef: '《道路交通安全法》',
          safeAction: '遵规守法并优先保护人身安全',
          riskyAction: '抱侥幸心理违规通行',
          scenario: '你在一周内连续遇到多种出行风险场景',
        },
      ],
    },
    {
      levelSlug: 'drug',
      questionPrefix: 'd',
      unitId: unit6.id,
      levels: [
        {
          orderNo: 5,
          title: '第五关：同伴诱导下的拒绝表达',
          topic: '同伴压力下拒绝不明物品',
          lawRef: '《禁毒法》',
          safeAction: '明确拒绝并迅速离开现场',
          riskyAction: '碍于面子尝试一次',
          scenario: '同伴以“提神糖”名义让你试用不明物品',
        },
        {
          orderNo: 6,
          title: '第六关：新型伪装毒品识别',
          topic: '伪装成食品饮料的新型毒品',
          lawRef: '《禁毒法》',
          safeAction: '不食用来源不明物品并及时求助',
          riskyAction: '觉得包装可爱就尝试',
          scenario: '聚会中出现来路不明的饮料和糖果',
        },
        {
          orderNo: 7,
          title: '第七关：娱乐场所风险预警',
          topic: '高风险场所自我保护',
          lawRef: '《禁毒法》',
          safeAction: '远离可疑环境并联系可信成年人',
          riskyAction: '逞强留下围观',
          scenario: '你在陌生场所看到可疑粉末和交易行为',
        },
        {
          orderNo: 8,
          title: '第八关：代收代寄风险识别',
          topic: '不明包裹代收代寄',
          lawRef: '《禁毒法》',
          safeAction: '拒绝代收代寄不明包裹',
          riskyAction: '为赚零花钱帮人转寄',
          scenario: '网友承诺高报酬让你帮忙收寄包裹',
        },
        {
          orderNo: 9,
          title: '第九关：及时求助与同伴保护',
          topic: '发现同伴疑似涉毒求助',
          lawRef: '《禁毒法》',
          safeAction: '先确保安全并尽快联系家长老师和警方',
          riskyAction: '替同伴隐瞒不报',
          scenario: '你发现同伴行为异常且疑似接触毒品',
        },
        {
          orderNo: 10,
          title: '第十关：禁毒法治综合实战',
          topic: '禁毒场景综合应对',
          lawRef: '《禁毒法》',
          safeAction: '识别风险、拒绝诱导、及时求助',
          riskyAction: '抱侥幸心理参与可疑活动',
          scenario: '你连续遭遇陌生引诱、同伴怂恿和网络交易信息',
        },
      ],
    },
  ]

  const extraLevels = await Promise.all(
    extraUnitPlans.flatMap((unitPlan) =>
      unitPlan.levels.map((level) =>
        prisma.level.upsert({
          where: { id: `level-${unitPlan.levelSlug}-${level.orderNo}` },
          update: {},
          create: {
            id: `level-${unitPlan.levelSlug}-${level.orderNo}`,
            unitId: unitPlan.unitId,
            title: level.title,
            orderNo: level.orderNo,
            xpReward: 20 + (level.orderNo - 1) * 5,
          },
        }),
      ),
    ),
  )

  const allLevels = [...levels, ...extraLevels]

  const tfOptions = JSON.stringify([
    { key: 'T', text: '对' },
    { key: 'F', text: '错' },
  ])

  function singleOptions(options: [string, string, string, string]) {
    return JSON.stringify([
      { key: 'A', text: options[0] },
      { key: 'B', text: options[1] },
      { key: 'C', text: options[2] },
      { key: 'D', text: options[3] },
    ])
  }

  function buildExtraQuestions(
    questionPrefix: ExtraUnitPlan['questionPrefix'],
    level: ExtraLevelPlan,
  ): SeedQuestion[] {
    const baseId = `q-${questionPrefix}${level.orderNo}`
    return [
      {
        id: `${baseId}-1`,
        type: QuestionType.SINGLE,
        prompt: `在“${level.topic}”场景中，更稳妥的做法是？`,
        optionsJson: singleOptions([
          level.riskyAction,
          level.safeAction,
          '先拖着不处理，看看会不会自己结束',
          '公开发布当事人隐私信息让大家评理',
        ]),
        answerKey: 'B',
        explanation: `该场景应遵循“先保安全、再求助、再取证”原则，优先选择“${level.safeAction}”。`,
      },
      {
        id: `${baseId}-2`,
        type: QuestionType.TRUE_FALSE,
        prompt: `“${level.topic}”只要没有身体伤害，就不涉及法律风险。`,
        optionsJson: tfOptions,
        answerKey: 'F',
        explanation: `错误。${level.topic}也可能涉及人格权、信息保护或其他法律责任风险。`,
      },
      {
        id: `${baseId}-3`,
        type: QuestionType.SINGLE,
        prompt: `关于${level.lawRef}相关实践，下列哪项更符合青少年自护原则？`,
        optionsJson: singleOptions([
          '为图省事，不核实信息直接照做',
          '只在匿名群求助，不联系现实中的成年人',
          '优先走学校/家庭/平台/警方等正规渠道',
          '先删证据避免麻烦',
        ]),
        answerKey: 'C',
        explanation: `涉及${level.lawRef}时，应优先采用可追踪、可协作的正规求助与处置渠道。`,
      },
      {
        id: `${baseId}-4`,
        type: QuestionType.SCENARIO,
        prompt: `情景题：${level.scenario}。你首先应该？`,
        optionsJson: singleOptions([
          '私下硬碰硬解决，不告诉任何人',
          `${level.safeAction}`,
          '围观并把过程发到社交平台',
          '拖延处理，等问题自然消失',
        ]),
        answerKey: 'B',
        explanation: `该情景应先止损并保障安全，再通过正规渠道处理，避免风险扩大。`,
      },
      {
        id: `${baseId}-5`,
        type: QuestionType.TRUE_FALSE,
        prompt: `面对“${level.topic}”，及时留存证据并寻求可信成年人帮助通常更有效。`,
        optionsJson: tfOptions,
        answerKey: 'T',
        explanation: `正确。规范取证与及时求助有助于事实认定和后续处置，是青少年普法实践中的关键能力。`,
      },
    ]
  }

  const questionBank: Record<
    string,
    SeedQuestion[]
  > = {
    'level-campus-1': [
      {
        id: 'q-c1-1',
        type: QuestionType.TRUE_FALSE,
        prompt: '同学之间偶尔开玩笑的外号，一定属于校园欺凌。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'F',
        explanation: '是否构成欺凌要看是否持续、是否造成伤害、是否存在力量不对等。',
      },
      {
        id: 'q-c1-2',
        type: QuestionType.SINGLE,
        prompt: '以下哪项更接近“校园欺凌”的典型特征？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '一次性争吵后双方和好' },
          { key: 'B', text: '持续针对同学并让其感到害怕' },
          { key: 'C', text: '课堂上提问答错被提醒' },
          { key: 'D', text: '体育课正常对抗' },
        ]),
        answerKey: 'B',
        explanation: '持续性、针对性、伤害性是重要判断要素。',
      },
      {
        id: 'q-c1-3',
        type: QuestionType.SINGLE,
        prompt: '遇到欺凌时，最推荐的第一步是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '立刻单独找欺凌者“硬刚”' },
          { key: 'B', text: '寻求可信成年人帮助并保证安全' },
          { key: 'C', text: '忍一忍就过去了' },
          { key: 'D', text: '在网上公开人肉对方' },
        ]),
        answerKey: 'B',
        explanation: '先保证人身安全，再求助学校与监护人。',
      },
      {
        id: 'q-c1-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：同学在群里长期辱骂你并传播你的照片。你更合适的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '回骂并把对方照片也发出去' },
          { key: 'B', text: '截图保存证据，向老师/家长求助' },
          { key: 'C', text: '退出所有群，不告诉任何人' },
          { key: 'D', text: '找朋友线下报复' },
        ]),
        answerKey: 'B',
        explanation: '保留证据、及时求助，必要时可向平台举报或报警。',
      },
      {
        id: 'q-c1-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '传播他人肖像或隐私照片，可能涉及侵权甚至违法。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '肖像权、隐私权受法律保护，未成年人同样适用。',
      },
    ],
    'level-campus-2': [
      {
        id: 'q-c2-1',
        type: QuestionType.SINGLE,
        prompt: '关于“取证”，更推荐的是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '把证据发到朋友圈公开' },
          { key: 'B', text: '截图/保存聊天记录并记录时间' },
          { key: 'C', text: '删掉记录避免尴尬' },
          { key: 'D', text: '只口头跟同学说' },
        ]),
        answerKey: 'B',
        explanation: '证据要完整、可核实，截图、录音等都可能有帮助。',
      },
      {
        id: 'q-c2-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到欺凌时，“先保证安全，再求助成年人”通常是更稳妥的顺序。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '安全优先，避免单独对抗升级风险。',
      },
      {
        id: 'q-c2-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你被同学威胁“别告诉老师”。你更好的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '答应对方，忍一忍' },
          { key: 'B', text: '和可信成年人沟通并说明威胁情况' },
          { key: 'C', text: '立刻在群里公开对骂' },
          { key: 'D', text: '找人线下报复' },
        ]),
        answerKey: 'B',
        explanation: '威胁本身就是风险信号，越需要及时求助并保留证据。',
      },
      {
        id: 'q-c2-4',
        type: QuestionType.SINGLE,
        prompt: '下列哪项属于“求助渠道”更优先的选择？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '陌生网友' },
          { key: 'B', text: '老师/家长/学校心理老师' },
          { key: 'C', text: '只靠自己扛' },
          { key: 'D', text: '去骂回去' },
        ]),
        answerKey: 'B',
        explanation: '优先选择现实中的可信成年人和学校制度渠道。',
      },
      {
        id: 'q-c2-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '“以暴制暴”一定能解决校园冲突。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'F',
        explanation: '以暴制暴可能升级伤害并带来新的法律风险。',
      },
    ],
    'level-campus-3': [
      {
        id: 'q-c3-1',
        type: QuestionType.SINGLE,
        prompt: '同学冲突升级时，更推荐的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '围观起哄' },
          { key: 'B', text: '尽快拉开距离并通知老师/保安' },
          { key: 'C', text: '录视频发到网上' },
          { key: 'D', text: '加入冲突“帮忙”' },
        ]),
        answerKey: 'B',
        explanation: '减少伤害是第一目标，及时通知学校管理人员。',
      },
      {
        id: 'q-c3-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '拍摄他人冲突视频并公开传播，可能侵犯隐私或名誉。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '公开传播可能造成二次伤害与侵权风险。',
      },
      {
        id: 'q-c3-3',
        type: QuestionType.SINGLE,
        prompt: '关于“校园秩序”，更正确的是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '学校规定不重要' },
          { key: 'B', text: '学校可对违反纪律行为进行教育管理' },
          { key: 'C', text: '只要没被抓到就行' },
          { key: 'D', text: '任何事情都可以私了' },
        ]),
        answerKey: 'B',
        explanation: '学校有教育管理职责，学生也应遵守校纪校规。',
      },
      {
        id: 'q-c3-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你看到同学被围堵，你能做的是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '围观拍视频' },
          { key: 'B', text: '通知老师/保安并在安全前提下劝离' },
          { key: 'C', text: '跟着起哄' },
          { key: 'D', text: '装作没看到' },
        ]),
        answerKey: 'B',
        explanation: '保护自己安全前提下，及时求助学校管理力量。',
      },
      {
        id: 'q-c3-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到校园冲突，保留证据与走正规渠道通常更有利于解决问题。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '正规渠道更可控，证据越清晰越利于处理。',
      },
    ],

    'level-campus-4': [
      {
        id: 'q-c4-1',
        type: QuestionType.SINGLE,
        prompt: '在学校拍到同学的照片，想发到社交平台，较稳妥的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '直接发，反正是同学' },
          { key: 'B', text: '先征得本人（和必要时监护人/学校）的同意再发布' },
          { key: 'C', text: '打码一半就行' },
          { key: 'D', text: '发到群里让大家转发' },
        ]),
        answerKey: 'B',
        explanation: '涉及肖像与隐私，发布前先征得同意更稳妥。',
      },
      {
        id: 'q-c4-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '把同学的“丑照”做成表情包传播，可能构成侵权。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '可能侵害肖像权、名誉权或隐私权，并造成二次伤害。',
      },
      {
        id: 'q-c4-3',
        type: QuestionType.SINGLE,
        prompt: '“我只是转发，不是我拍的”这句话一般？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '一定没责任' },
          { key: 'B', text: '也可能产生责任，应谨慎转发' },
          { key: 'C', text: '只要删掉就没事' },
          { key: 'D', text: '转发越多越安全' },
        ]),
        answerKey: 'B',
        explanation: '传播会扩大影响，可能产生侵权后果。',
      },
      {
        id: 'q-c4-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：有人把你的照片P成“搞笑图”到处发。你更推荐先做？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '马上回P对方并扩散' },
          { key: 'B', text: '截图取证，先请对方删除并向老师/家长求助' },
          { key: 'C', text: '装作没看到' },
          { key: 'D', text: '公开对骂' },
        ]),
        answerKey: 'B',
        explanation: '先取证再沟通/举报，必要时走学校与平台渠道。',
      },
      {
        id: 'q-c4-5',
        type: QuestionType.SINGLE,
        prompt: '以下哪种更不建议在公开平台发布？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '学习打卡' },
          { key: 'B', text: '精确定位到班级/宿舍的照片与位置信息' },
          { key: 'C', text: '读书笔记' },
          { key: 'D', text: '运动心得' },
        ]),
        answerKey: 'B',
        explanation: '位置信息可能带来现实安全风险，发布要谨慎。',
      },
      {
        id: 'q-c4-6',
        type: QuestionType.TRUE_FALSE,
        prompt: '如果你不同意别人使用你的照片，你可以提出删除与停止传播的要求。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '你有权主张停止侵害并寻求学校/平台/成年人帮助。',
      },
    ],

    'level-network-1': [
      {
        id: 'q-n1-1',
        type: QuestionType.SINGLE,
        prompt: '收到“中奖链接”让你填写银行卡信息，最安全的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '先填写，反正可以改' },
          { key: 'B', text: '不点链接，联系官方渠道核实' },
          { key: 'C', text: '转发给同学一起研究' },
          { key: 'D', text: '把验证码发过去看看' },
        ]),
        answerKey: 'B',
        explanation: '不要向陌生链接提供个人信息，核实应走官方渠道。',
      },
      {
        id: 'q-n1-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '“刷流水返利”属于常见诈骗套路。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '先小额返利再诱导大额转账是典型套路。',
      },
      {
        id: 'q-n1-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：网友让你帮忙收快递并转寄，承诺给你报酬。你应该？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '为了赚零花钱立刻答应' },
          { key: 'B', text: '拒绝并告诉家长/老师，避免参与违法寄递' },
          { key: 'C', text: '先做一次看看' },
          { key: 'D', text: '让同学去做' },
        ]),
        answerKey: 'B',
        explanation: '可能涉及违法寄递或帮助犯罪，应拒绝并求助成年人。',
      },
      {
        id: 'q-n1-4',
        type: QuestionType.SINGLE,
        prompt: '以下哪个信息不应该随意发到群里？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '喜欢的电影类型' },
          { key: 'B', text: '家庭住址与身份证照片' },
          { key: 'C', text: '学习计划' },
          { key: 'D', text: '运动爱好' },
        ]),
        answerKey: 'B',
        explanation: '敏感个人信息需要严格保护。',
      },
      {
        id: 'q-n1-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到诈骗，应保留聊天记录和转账凭证，必要时报警。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '证据越完整越利于止损与追查。',
      },
    ],
    'level-network-2': [
      {
        id: 'q-n2-1',
        type: QuestionType.SINGLE,
        prompt: '下列哪项更像“个人信息”？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '今天的天气' },
          { key: 'B', text: '身份证号/家庭住址/手机号' },
          { key: 'C', text: '喜欢的运动' },
          { key: 'D', text: '周末作业' },
        ]),
        answerKey: 'B',
        explanation: '能识别到个人身份或指向个人的信息要谨慎保护。',
      },
      {
        id: 'q-n2-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '把同学的电话号码发到群里，可能侵犯其个人信息权益。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '未经同意公开个人信息可能造成骚扰与风险。',
      },
      {
        id: 'q-n2-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：有人冒充老师私聊你要“验证码”。你应该？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '马上把验证码发过去' },
          { key: 'B', text: '通过电话/当面向老师核实' },
          { key: 'C', text: '转给同学看看' },
          { key: 'D', text: '发朋友圈提醒但不核实' },
        ]),
        answerKey: 'B',
        explanation: '验证码等同于“账号钥匙”，应拒绝并走官方渠道核实。',
      },
      {
        id: 'q-n2-4',
        type: QuestionType.SINGLE,
        prompt: '为了更安全，密码更推荐设置成？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '12345678' },
          { key: 'B', text: '生日+姓名拼音' },
          { key: 'C', text: '长且混合字符，并开启二次验证' },
          { key: 'D', text: '所有平台用同一个密码' },
        ]),
        answerKey: 'C',
        explanation: '密码越长越随机越好，二次验证能降低被盗风险。',
      },
      {
        id: 'q-n2-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到账号被盗，应尽快修改密码并联系平台申诉。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '越早止损越好，同时保留相关证据。',
      },
    ],
    'level-network-3': [
      {
        id: 'q-n3-1',
        type: QuestionType.TRUE_FALSE,
        prompt: '在网上辱骂、造谣他人，可能侵犯名誉权。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '言论也要守法，网络不是法外之地。',
      },
      {
        id: 'q-n3-2',
        type: QuestionType.SINGLE,
        prompt: '看到同学被网暴，你更推荐的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '跟着起哄转发' },
          { key: 'B', text: '劝阻、举报并提醒其保存证据' },
          { key: 'C', text: '截图发到更多群里' },
          { key: 'D', text: '人肉对方“反击”' },
        ]),
        answerKey: 'B',
        explanation: '减少扩散，帮助保存证据并走平台/学校/警方渠道。',
      },
      {
        id: 'q-n3-3',
        type: QuestionType.SINGLE,
        prompt: '下列哪种更像“造谣”？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '陈述事实并能提供证据' },
          { key: 'B', text: '听说的消息不核实就发布' },
          { key: 'C', text: '引用权威渠道公告' },
          { key: 'D', text: '讨论学习方法' },
        ]),
        answerKey: 'B',
        explanation: '未经核实传播信息可能造成伤害与侵权风险。',
      },
      {
        id: 'q-n3-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你发了冲动评论后后悔了，正确做法更像？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '删除并向对方道歉，避免继续扩散' },
          { key: 'B', text: '换个小号继续骂' },
          { key: 'C', text: '把对方隐私发出来“证明”' },
          { key: 'D', text: '号召更多人一起骂' },
        ]),
        answerKey: 'A',
        explanation: '及时止损、承担责任并停止伤害行为。',
      },
      {
        id: 'q-n3-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '“我只是转发，不算我的责任”这句话一定成立。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'F',
        explanation: '转发扩散也可能产生责任，应谨慎核实与传播。',
      },
    ],

    'level-network-4': [
      {
        id: 'q-n4-1',
        type: QuestionType.SINGLE,
        prompt: '看到“AI换脸视频”在群里传播，较稳妥的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '觉得好玩继续转发' },
          { key: 'B', text: '停止传播、截图取证并举报/求助' },
          { key: 'C', text: '把更多同学拉进群观看' },
          { key: 'D', text: '下载保存到网盘' },
        ]),
        answerKey: 'B',
        explanation: '此类内容可能侵权甚至违法，减少扩散并保留证据更稳妥。',
      },
      {
        id: 'q-n4-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '未经同意使用他人照片制作“换脸/表情包/恶搞图”，可能侵权。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '可能侵犯肖像权、名誉权、隐私权等。',
      },
      {
        id: 'q-n4-3',
        type: QuestionType.SINGLE,
        prompt: '同学的作文/画作/视频作品，你想用在自己账号里，较稳妥的是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '直接搬运，反正是同学' },
          { key: 'B', text: '征得作者同意并注明来源' },
          { key: 'C', text: '把作者名字删掉' },
          { key: 'D', text: '改个标题就算自己的' },
        ]),
        answerKey: 'B',
        explanation: '尊重著作权与署名权，先授权再使用。',
      },
      {
        id: 'q-n4-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你发现自己的照片被陌生号盗用做头像。你更推荐先做？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '立刻人肉对方' },
          { key: 'B', text: '截图取证，向平台申诉并求助成年人' },
          { key: 'C', text: '公开辱骂对方' },
          { key: 'D', text: '把自己更多照片发出去证明' },
        ]),
        answerKey: 'B',
        explanation: '先取证再走平台渠道，必要时寻求学校/警方帮助。',
      },
      {
        id: 'q-n4-5',
        type: QuestionType.SINGLE,
        prompt: '看到网店“盗图卖货”，较合适的是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '觉得正常，不用管' },
          { key: 'B', text: '举报平台侵权并保存证据' },
          { key: 'C', text: '帮忙传播让更多人买' },
          { key: 'D', text: '去评论区骂街但不取证' },
        ]),
        answerKey: 'B',
        explanation: '平台通常有侵权投诉机制，证据越完整越利于处理。',
      },
      {
        id: 'q-n4-6',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到“隐私被公开/被换脸”这类问题，第一步应尽量减少传播并保存证据。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '先止损和取证，再走平台/学校/法律求助通道。',
      },
    ],

    'level-family-1': [
      {
        id: 'q-f1-1',
        type: QuestionType.SINGLE,
        prompt: '遇到严重危险或紧急侵害时，最优先的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '自己扛着不说' },
          { key: 'B', text: '先确保安全并求助可信成年人/拨打 110' },
          { key: 'C', text: '立刻发到网上求助陌生人' },
          { key: 'D', text: '先和对方讲道理' },
        ]),
        answerKey: 'B',
        explanation: '安全优先，紧急情况应及时报警/求助。',
      },
      {
        id: 'q-f1-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '监护人对未成年人有照顾、保护与教育义务。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '监护职责包括保障安全、教育与合理管理。',
      },
      {
        id: 'q-f1-3',
        type: QuestionType.SINGLE,
        prompt: '下面哪个更像“可信成年人”的求助对象？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '网友陌生人' },
          { key: 'B', text: '老师/家长/学校心理老师' },
          { key: 'C', text: '只找同学' },
          { key: 'D', text: '谁都不说' },
        ]),
        answerKey: 'B',
        explanation: '优先选择现实中可提供保护与资源的人。',
      },
      {
        id: 'q-f1-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：家里出现让你害怕的情况，你可以？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '马上离家出走' },
          { key: 'B', text: '先保证安全并联系老师/亲属/报警求助' },
          { key: 'C', text: '继续忍着不说' },
          { key: 'D', text: '去网上发地址求帮助' },
        ]),
        answerKey: 'B',
        explanation: '先到安全位置，再联系可信成年人或报警，避免暴露隐私。',
      },
      {
        id: 'q-f1-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '求助时记录时间、地点和发生了什么，会更利于后续处理。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '关键信息越清楚越利于学校/警方/机构介入。',
      },
    ],
    'level-family-2': [
      {
        id: 'q-f2-1',
        type: QuestionType.TRUE_FALSE,
        prompt: '未成年人也享有隐私权与个人信息受保护的权利。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '隐私与个人信息保护并不因年龄而消失。',
      },
      {
        id: 'q-f2-2',
        type: QuestionType.SINGLE,
        prompt: '更安全的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '把身份证照片发给不熟悉的人“登记”' },
          { key: 'B', text: '只在可信正规渠道提交必要信息' },
          { key: 'C', text: '把家庭住址写在公开评论区' },
          { key: 'D', text: '把验证码发给同学帮忙登录' },
        ]),
        answerKey: 'B',
        explanation: '最小必要原则：只在正规渠道提交必要信息。',
      },
      {
        id: 'q-f2-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：亲戚未经你同意把你照片发到群里，你可以？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '公开辱骂对方' },
          { key: 'B', text: '礼貌说明不希望公开，并请求删除' },
          { key: 'C', text: '把对方隐私也发出去' },
          { key: 'D', text: '什么都不说' },
        ]),
        answerKey: 'B',
        explanation: '先沟通并提出删除请求，必要时可求助家长/老师协调。',
      },
      {
        id: 'q-f2-4',
        type: QuestionType.SINGLE,
        prompt: '下列哪项最不适合公开发布？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '学习计划' },
          { key: 'B', text: '家庭住址/学校班级精确位置' },
          { key: 'C', text: '运动爱好' },
          { key: 'D', text: '喜欢的音乐' },
        ]),
        answerKey: 'B',
        explanation: '位置与身份信息可能带来现实安全风险。',
      },
      {
        id: 'q-f2-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到隐私泄露，及时截图取证并向平台举报是可行做法。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '先取证再举报，必要时可寻求成年人帮助处理。',
      },
    ],

    'level-family-3': [
      {
        id: 'q-f3-1',
        type: QuestionType.SINGLE,
        prompt: '当你感到人身安全受到威胁时，第一优先是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '先讲道理劝对方冷静' },
          { key: 'B', text: '先到安全位置并求助可信成年人/报警' },
          { key: 'C', text: '发朋友圈求助陌生人' },
          { key: 'D', text: '躲在房间里不说' },
        ]),
        answerKey: 'B',
        explanation: '安全优先，紧急情况及时报警/求助。',
      },
      {
        id: 'q-f3-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '遭遇家庭暴力或严重伤害风险时，向老师/社区/警方求助是可行的。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '可以通过学校、社区、妇联、警方等渠道寻求帮助。',
      },
      {
        id: 'q-f3-3',
        type: QuestionType.SINGLE,
        prompt: '求助时，哪项信息更重要？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '我很生气' },
          { key: 'B', text: '发生了什么、时间地点、是否受伤、是否有证据' },
          { key: 'C', text: '对方星座' },
          { key: 'D', text: '今天吃了什么' },
        ]),
        answerKey: 'B',
        explanation: '关键信息越清楚越利于介入与保护。',
      },
      {
        id: 'q-f3-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你被要求“把家里事情发到群里证明”。更稳妥的是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '把家庭地址和照片全发出去' },
          { key: 'B', text: '不要公开隐私，私下向老师/家长/社工求助' },
          { key: 'C', text: '把别人隐私也发出去' },
          { key: 'D', text: '先给陌生人转账再说' },
        ]),
        answerKey: 'B',
        explanation: '求助不等于公开隐私，优先走可信渠道。',
      },
      {
        id: 'q-f3-5',
        type: QuestionType.SINGLE,
        prompt: '如果你需要法律咨询/帮助，下面哪个更靠谱？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '让网友给你写“万能话术”' },
          { key: 'B', text: '拨打 12348 或通过官方法律援助渠道咨询' },
          { key: 'C', text: '找陌生人代办并先交钱' },
          { key: 'D', text: '只靠“听说”' },
        ]),
        answerKey: 'B',
        explanation: '优先选择官方渠道，谨防二次诈骗。',
      },
      {
        id: 'q-f3-6',
        type: QuestionType.TRUE_FALSE,
        prompt: '求助时避免暴露精确住址、证件号、验证码等敏感信息更安全。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '保护个人信息，避免被不法分子利用。',
      },
    ],

    'level-family-4': [
      {
        id: 'q-f4-1',
        type: QuestionType.SINGLE,
        prompt: '在家庭群或朋友圈发言时，哪项更符合“边界意识”？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '随手公开家人身份证和住址' },
          { key: 'B', text: '先征得同意，不公开敏感隐私' },
          { key: 'C', text: '为了热度发布家人冲突视频' },
          { key: 'D', text: '转发未经核实的家庭谣言' },
        ]),
        answerKey: 'B',
        explanation: '尊重他人隐私和同意权，是家庭沟通与网络表达的底线。',
      },
      {
        id: 'q-f4-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '在网络上“随口造谣家人”也可能侵犯名誉权并引发法律风险。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '网络表达不是法外之地，传播不实信息有风险。',
      },
      {
        id: 'q-f4-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你和家人发生争执，朋友建议“把聊天记录发网上让大家评评理”。你更稳妥的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '全部公开，越细越好' },
          { key: 'B', text: '不公开隐私，优先线下沟通或向可信成年人求助' },
          { key: 'C', text: '把对方隐私打码一半后公开' },
          { key: 'D', text: '剪辑片段误导舆论' },
        ]),
        answerKey: 'B',
        explanation: '家庭矛盾优先通过可信渠道处理，避免“网络扩散+二次伤害”。',
      },
      {
        id: 'q-f4-4',
        type: QuestionType.SINGLE,
        prompt: '以下哪项最适合向老师或社工说明家庭求助需求？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '只说“我很难受”' },
          { key: 'B', text: '清楚说明时间、事件、风险和希望得到的帮助' },
          { key: 'C', text: '只发情绪化语音' },
          { key: 'D', text: '提供不实信息' },
        ]),
        answerKey: 'B',
        explanation: '结构化信息有助于快速评估风险并提供有效帮助。',
      },
      {
        id: 'q-f4-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '沟通冲突时，保留证据和保护隐私可以同时做到。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '证据保留用于求助，隐私保护用于减少二次风险，二者并不冲突。',
      },
    ],

    'level-consumer-1': [
      {
        id: 'q-s1-1',
        type: QuestionType.TRUE_FALSE,
        prompt: '未成年人进行大额网游充值，往往需要监护人同意。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '涉及民事行为能力与监护，建议及时与监护人沟通。',
      },
      {
        id: 'q-s1-2',
        type: QuestionType.SINGLE,
        prompt: '如果出现误充值，第一步更推荐？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '立刻删游戏当没发生' },
          { key: 'B', text: '保存订单/支付凭证并联系平台客服' },
          { key: 'C', text: '在评论区骂平台' },
          { key: 'D', text: '再充一笔试试' },
        ]),
        answerKey: 'B',
        explanation: '先保留证据，再通过官方渠道申诉处理。',
      },
      {
        id: 'q-s1-3',
        type: QuestionType.SINGLE,
        prompt: '下列哪项属于“证据”？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '支付截图/订单号' },
          { key: 'B', text: '我感觉很亏' },
          { key: 'C', text: '同学说可以退' },
          { key: 'D', text: '我不记得了' },
        ]),
        answerKey: 'A',
        explanation: '订单号、支付记录、客服沟通记录都很关键。',
      },
      {
        id: 'q-s1-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：平台客服要求你提供“验证码”。你应该？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '直接给验证码方便处理' },
          { key: 'B', text: '不给验证码，走官方App内申诉流程' },
          { key: 'C', text: '把账号密码一起给' },
          { key: 'D', text: '找“代退费”中介' },
        ]),
        answerKey: 'B',
        explanation: '验证码极其敏感，谨防二次诈骗。',
      },
      {
        id: 'q-s1-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '所谓“代退费”中介往往是诈骗，可能再次骗钱。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '优先通过官方客服与正规渠道处理。',
      },
    ],
    'level-consumer-2': [
      {
        id: 'q-s2-1',
        type: QuestionType.SINGLE,
        prompt: '直播间“冲榜打赏”让你不断充值，更稳妥的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '为了面子继续冲' },
          { key: 'B', text: '暂停消费并与监护人沟通' },
          { key: 'C', text: '借钱继续打赏' },
          { key: 'D', text: '用同学账号充值' },
        ]),
        answerKey: 'B',
        explanation: '冲动消费风险高，先止损并沟通求助。',
      },
      {
        id: 'q-s2-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '消费纠纷中，保留聊天记录、订单信息、发票/支付凭证很重要。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '证据越充分越利于维权。',
      },
      {
        id: 'q-s2-3',
        type: QuestionType.SINGLE,
        prompt: '维权时更推荐的渠道是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '在评论区辱骂商家' },
          { key: 'B', text: '联系平台客服/消费者投诉渠道' },
          { key: 'C', text: '线下围堵' },
          { key: 'D', text: '人肉对方' },
        ]),
        answerKey: 'B',
        explanation: '正规渠道更有效也更安全。',
      },
      {
        id: 'q-s2-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你在不明网站买东西，对方让你“先转账到私人账号”。你应该？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '转账更快，先付' },
          { key: 'B', text: '拒绝，选择正规平台与担保支付' },
          { key: 'C', text: '让朋友先转' },
          { key: 'D', text: '把银行卡信息发给对方' },
        ]),
        answerKey: 'B',
        explanation: '脱离平台担保转账风险极高，可能是诈骗。',
      },
      {
        id: 'q-s2-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '“退费/退款”问题可以考虑拨打 12348 了解求助渠道。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '12348 是法律服务热线，可了解一般性维权信息。',
      },
    ],

    'level-consumer-3': [
      {
        id: 'q-s3-1',
        type: QuestionType.SINGLE,
        prompt: '网购商品与宣传严重不符时，哪种做法更稳妥？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '直接在群里辱骂商家' },
          { key: 'B', text: '保留证据并通过平台发起售后/投诉' },
          { key: 'C', text: '把账号密码给“客服”代处理' },
          { key: 'D', text: '继续下单看看会不会好' },
        ]),
        answerKey: 'B',
        explanation: '先固定证据，再走平台规则处理，风险更低、成功率更高。',
      },
      {
        id: 'q-s3-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '“先私下转账再退款更快”通常存在较高诈骗风险。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '脱离平台保障交易，容易被“二次收割”。',
      },
      {
        id: 'q-s3-3',
        type: QuestionType.SINGLE,
        prompt: '下列哪项通常不是处理消费纠纷的一手证据？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '订单记录和支付凭证' },
          { key: 'B', text: '与商家沟通截图' },
          { key: 'C', text: '物流签收信息' },
          { key: 'D', text: '朋友的主观猜测' },
        ]),
        answerKey: 'D',
        explanation: '主观判断证明力弱，客观记录更关键。',
      },
      {
        id: 'q-s3-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你买到疑似“三无产品”，身体不适。更合适的下一步是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '先删除订单记录' },
          { key: 'B', text: '保留包装与票据，及时就医并向平台/监管渠道反映' },
          { key: 'C', text: '私下和商家“和解”并放弃证据' },
          { key: 'D', text: '在网上公开对方隐私' },
        ]),
        answerKey: 'B',
        explanation: '人身安全优先，其次是证据保存和正规渠道维权。',
      },
      {
        id: 'q-s3-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '遇到复杂消费争议，可以拨打 12348 了解法律咨询渠道。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '12348 可提供普法与法律服务指引。',
      },
    ],

    'level-consumer-4': [
      {
        id: 'q-s4-1',
        type: QuestionType.SINGLE,
        prompt: '二手交易中，哪种交易方式更安全？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '脱离平台私下转账' },
          { key: 'B', text: '走平台担保交易并留存记录' },
          { key: 'C', text: '把验证码发给对方' },
          { key: 'D', text: '先付款再让对方“补链接”' },
        ]),
        answerKey: 'B',
        explanation: '平台担保和留痕是降低纠纷风险的关键。',
      },
      {
        id: 'q-s4-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '对方要求你扫码“解除风控”并输入银行卡信息，通常要高度警惕。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '这是常见诈骗套路，可能导致账号和资金风险。',
      },
      {
        id: 'q-s4-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你在二手平台卖书，对方称“付不了款”发来陌生链接让你操作。你应当？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '马上点开按提示操作' },
          { key: 'B', text: '拒绝外链操作，只在平台内沟通与交易' },
          { key: 'C', text: '把账号密码给对方代操作' },
          { key: 'D', text: '让同学先试一下链接' },
        ]),
        answerKey: 'B',
        explanation: '交易环节尽量不离开平台，陌生链接风险高。',
      },
      {
        id: 'q-s4-4',
        type: QuestionType.SINGLE,
        prompt: '发生二手交易纠纷后，第一步更推荐做什么？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '删除聊天记录' },
          { key: 'B', text: '保存证据并发起平台申诉' },
          { key: 'C', text: '在群里公布对方隐私' },
          { key: 'D', text: '找陌生“维权代办”' },
        ]),
        answerKey: 'B',
        explanation: '保留证据 + 平台申诉是处理纠纷的基本路径。',
      },
      {
        id: 'q-s4-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '维权时，证据完整性（订单、聊天、支付、物流）会影响结果。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '证据越完整，越有利于还原事实与处理争议。',
      },
    ],

    'level-traffic-1': [
      {
        id: 'q-t1-1',
        type: QuestionType.TRUE_FALSE,
        prompt: '未成年人无证驾驶机动车存在很大风险，也可能违法。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '不仅危险，也可能涉及行政处罚与事故责任。',
      },
      {
        id: 'q-t1-2',
        type: QuestionType.SINGLE,
        prompt: '乘车更安全的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '坐副驾驶不系安全带' },
          { key: 'B', text: '系好安全带，不坐超员车' },
          { key: 'C', text: '坐摩托车不戴头盔' },
          { key: 'D', text: '追求刺激把头伸出窗外' },
        ]),
        answerKey: 'B',
        explanation: '安全带与拒绝超员是最基本的安全底线。',
      },
      {
        id: 'q-t1-3',
        type: QuestionType.SINGLE,
        prompt: '遇到有人酒后驾车，你更推荐？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '当作没看见' },
          { key: 'B', text: '劝阻并拒绝乘坐，必要时报警' },
          { key: 'C', text: '让他开慢点' },
          { key: 'D', text: '跟车起哄' },
        ]),
        answerKey: 'B',
        explanation: '酒驾危险且违法，应坚决拒绝。',
      },
      {
        id: 'q-t1-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：同学提议“开家里车兜风”。你应该？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '觉得帅就上车' },
          { key: 'B', text: '拒绝并提醒风险，必要时求助成年人' },
          { key: 'C', text: '让他开快点' },
          { key: 'D', text: '拍视频发网' },
        ]),
        answerKey: 'B',
        explanation: '安全与法律风险极高，拒绝是保护自己和他人。',
      },
      {
        id: 'q-t1-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '交通安全与法律责任往往和“是否造成损害”相关。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '事故责任与损害后果有关，遵规守法能避免风险。',
      },
    ],
    'level-traffic-2': [
      {
        id: 'q-t2-1',
        type: QuestionType.SINGLE,
        prompt: '骑行更推荐的做法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '闯红灯赶时间' },
          { key: 'B', text: '遵守信号灯，注意盲区' },
          { key: 'C', text: '边骑车边刷短视频' },
          { key: 'D', text: '多人并排占道' },
        ]),
        answerKey: 'B',
        explanation: '遵守交通规则，注意车辆盲区，避免分心。',
      },
      {
        id: 'q-t2-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '骑电动车/摩托车佩戴头盔能显著降低伤害风险。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '头盔是非常有效的安全防护。',
      },
      {
        id: 'q-t2-3',
        type: QuestionType.SINGLE,
        prompt: '过马路更安全的方式是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '低头看手机走' },
          { key: 'B', text: '走斑马线并观察来车' },
          { key: 'C', text: '翻护栏抄近路' },
          { key: 'D', text: '突然横穿马路' },
        ]),
        answerKey: 'B',
        explanation: '斑马线+观察来车是基本安全习惯。',
      },
      {
        id: 'q-t2-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你和同学骑车准备并排聊天，你应该？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '并排骑更热闹' },
          { key: 'B', text: '保持单列，减少占道与分心' },
          { key: 'C', text: '加速冲刺' },
          { key: 'D', text: '看谁骑得更快' },
        ]),
        answerKey: 'B',
        explanation: '单列骑行更安全，避免分心与占道。',
      },
      {
        id: 'q-t2-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '交通规则的目的之一是减少事故和伤害。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '规则不是为了刁难，而是为了安全。',
      },
    ],

    'level-traffic-3': [
      {
        id: 'q-t3-1',
        type: QuestionType.SINGLE,
        prompt: '朋友准备酒后驾车，以下哪项最合适？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '让他慢点开就行' },
          { key: 'B', text: '坚决劝阻并拒绝乘坐，必要时联系家长/报警' },
          { key: 'C', text: '拍视频发社交平台' },
          { key: 'D', text: '跟车“看着点”' },
        ]),
        answerKey: 'B',
        explanation: '醉驾风险极高，第一原则是阻止与避险。',
      },
      {
        id: 'q-t3-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '明知司机酒驾仍强行搭乘，也可能把自己置于法律与安全风险中。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '即使不是驾驶人，也可能因行为不当承担后果。',
      },
      {
        id: 'q-t3-3',
        type: QuestionType.SINGLE,
        prompt: '关于电动自行车合规出行，哪项更正确？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '改装提速更省时间' },
          { key: 'B', text: '遵守车道规则，避免闯灯和逆行' },
          { key: 'C', text: '边骑边刷短视频' },
          { key: 'D', text: '双手离把“耍酷”' },
        ]),
        answerKey: 'B',
        explanation: '守规则是降低事故风险的核心。',
      },
      {
        id: 'q-t3-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：夜间回家，同伴提议“抄近路”翻越护栏过马路。你应当？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '跟着翻越，节省时间' },
          { key: 'B', text: '拒绝并建议走人行横道或过街设施' },
          { key: 'C', text: '让同伴先试试' },
          { key: 'D', text: '边跑边过，不看来车' },
        ]),
        answerKey: 'B',
        explanation: '过街设施是最基本的安全保障。',
      },
      {
        id: 'q-t3-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '交通规则的底层目标是降低伤害、保护生命安全。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '规则并非“麻烦”，而是公共安全底线。',
      },
    ],

    'level-traffic-4': [
      {
        id: 'q-t4-1',
        type: QuestionType.SINGLE,
        prompt: '发生轻微交通碰撞后，哪种做法更合适？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '立即离开现场' },
          { key: 'B', text: '先确保安全，再联系交警并保留现场信息' },
          { key: 'C', text: '先在网上直播' },
          { key: 'D', text: '删掉行车记录避免麻烦' },
        ]),
        answerKey: 'B',
        explanation: '先安全、再处置、再留证，是事故处置基本顺序。',
      },
      {
        id: 'q-t4-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '事故现场拍照取证时，应避免妨碍交通并注意自身安全。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '取证重要，但不能以牺牲现场安全为代价。',
      },
      {
        id: 'q-t4-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：同伴受伤倒地，围观者起哄拍视频。你优先应做什么？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '继续拍视频留纪念' },
          { key: 'B', text: '立即求助120/110并组织让出救援通道' },
          { key: 'C', text: '把视频发群里找人' },
          { key: 'D', text: '先争论责任再说' },
        ]),
        answerKey: 'B',
        explanation: '人身救助优先于围观与争论。',
      },
      {
        id: 'q-t4-4',
        type: QuestionType.SINGLE,
        prompt: '关于“事故后发短视频曝光”更稳妥的说法是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '细节越全越好，包括车牌和身份证' },
          { key: 'B', text: '谨慎传播，避免泄露隐私和引发二次伤害' },
          { key: 'C', text: '先造谣吸引关注' },
          { key: 'D', text: '只要流量高就可以' },
        ]),
        answerKey: 'B',
        explanation: '事故信息传播应遵守隐私和事实边界。',
      },
      {
        id: 'q-t4-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '事故处置中，冷静沟通与合法求助通常比冲突对骂更有效。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '冲突升级只会增加风险，规范流程更能解决问题。',
      },
    ],

    'level-drug-1': [
      {
        id: 'q-d1-1',
        type: QuestionType.TRUE_FALSE,
        prompt: '“奶茶粉/邮票/跳跳糖”等也可能伪装成毒品或含有成瘾成分。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '新型毒品常伪装成日常物品，要提高警惕。',
      },
      {
        id: 'q-d1-2',
        type: QuestionType.SINGLE,
        prompt: '朋友递给你不明“饮料/糖果”让你试试，你应？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '好奇就试一口' },
          { key: 'B', text: '拒绝并远离，必要时求助成年人' },
          { key: 'C', text: '转给同学看看' },
          { key: 'D', text: '拍视频挑战' },
        ]),
        answerKey: 'B',
        explanation: '不明物品坚决不尝试，远离风险源。',
      },
      {
        id: 'q-d1-3',
        type: QuestionType.SINGLE,
        prompt: '下列哪项更像“套路诱导”？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '陌生人说“免费给你玩一下”' },
          { key: 'B', text: '老师讲禁毒课' },
          { key: 'C', text: '同学分享学习资料' },
          { key: 'D', text: '父母提醒注意安全' },
        ]),
        answerKey: 'A',
        explanation: '以“免费”“刺激”“提神”等诱导要高度警惕。',
      },
      {
        id: 'q-d1-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：你在聚会场所闻到奇怪味道并感到不适，你可以？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '继续待着忍一忍' },
          { key: 'B', text: '离开到安全处并联系可信成年人' },
          { key: 'C', text: '跟着一起“试试”' },
          { key: 'D', text: '把地址发到网上求围观' },
        ]),
        answerKey: 'B',
        explanation: '及时离开风险环境，保证安全并求助。',
      },
      {
        id: 'q-d1-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '毒品会带来健康与法律后果风险。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '一旦涉及毒品，风险非常高。',
      },
    ],
    'level-drug-2': [
      {
        id: 'q-d2-1',
        type: QuestionType.SINGLE,
        prompt: '更好的拒绝技巧是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '含糊其辞拖延' },
          { key: 'B', text: '明确拒绝并立即离开现场' },
          { key: 'C', text: '先收下再说' },
          { key: 'D', text: '为了合群勉强尝试' },
        ]),
        answerKey: 'B',
        explanation: '明确拒绝+离开，是最有效的自我保护。',
      },
      {
        id: 'q-d2-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '如果遇到疑似涉毒情况，及时求助老师/家长或报警是可行的。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '面对高风险情况，应及时求助并保护自己。',
      },
      {
        id: 'q-d2-3',
        type: QuestionType.SINGLE,
        prompt: '“帮忙保管一个小包裹/药片”并给你报酬，这可能？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '只是正常兼职' },
          { key: 'B', text: '涉及违法风险，应拒绝并求助成年人' },
          { key: 'C', text: '越神秘越好玩' },
          { key: 'D', text: '可以先试一次' },
        ]),
        answerKey: 'B',
        explanation: '不明物品保管/转交风险很高，可能触法。',
      },
      {
        id: 'q-d2-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：同学被人拉去“吸一口不算啥”。你可以？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '沉默围观' },
          { key: 'B', text: '劝阻并带离现场，通知老师/家长' },
          { key: 'C', text: '一起试试' },
          { key: 'D', text: '拍视频传播' },
        ]),
        answerKey: 'B',
        explanation: '保护安全前提下劝离并求助成年人，避免扩散。',
      },
      {
        id: 'q-d2-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '“好奇尝试一次”也可能造成严重后果。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '一次尝试也可能带来成瘾与法律风险。',
      },
    ],
    'level-drug-3': [
      {
        id: 'q-d3-1',
        type: QuestionType.SINGLE,
        prompt: '“电子烟油里加点东西更上头”这类说法，你应如何判断？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '只是玩笑，不用管' },
          { key: 'B', text: '高度警惕，拒绝接触并远离相关场景' },
          { key: 'C', text: '先尝一点再说' },
          { key: 'D', text: '帮忙转给朋友' },
        ]),
        answerKey: 'B',
        explanation: '新型毒品常以“上头”“提神”包装，必须警惕。',
      },
      {
        id: 'q-d3-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '“帮人保管不明粉末/药片”可能带来严重法律风险。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '不明物品流转风险极高，切勿参与。',
      },
      {
        id: 'q-d3-3',
        type: QuestionType.SINGLE,
        prompt: '发现同伴疑似接触毒品后，第一优先应是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '私下传播对方隐私' },
          { key: 'B', text: '先保证安全，再联系可信成年人或报警求助' },
          { key: 'C', text: '围观起哄' },
          { key: 'D', text: '装作没看见' },
        ]),
        answerKey: 'B',
        explanation: '及时求助与安全处置，比“自行处理”更可靠。',
      },
      {
        id: 'q-d3-4',
        type: QuestionType.SCENARIO,
        prompt: '情景题：陌生人递给你“提神饮料”并要求你转送给同学。你应当？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '顺手帮忙，举手之劳' },
          { key: 'B', text: '当场拒绝，不接触不转交，尽快离开并报告老师/家长' },
          { key: 'C', text: '先收下再判断' },
          { key: 'D', text: '分给同学一起试' },
        ]),
        answerKey: 'B',
        explanation: '拒绝、离开、报告是高风险情境的标准动作。',
      },
      {
        id: 'q-d3-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '禁毒教育的核心之一是“识别伪装、明确拒绝、及时求助”。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '这三步能显著降低误触高风险情境的概率。',
      },
    ],
    'level-drug-4': [
      {
        id: 'q-d4-1',
        type: QuestionType.SINGLE,
        prompt: '遇到“免费试一口就知道”的诱导时，最正确的第一反应是？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '尝一下再判断' },
          { key: 'B', text: '明确拒绝并远离现场' },
          { key: 'C', text: '录视频发平台' },
          { key: 'D', text: '转给同学“帮忙尝”' },
        ]),
        answerKey: 'B',
        explanation: '拒绝 + 离开是高风险情境的基本保护动作。',
      },
      {
        id: 'q-d4-2',
        type: QuestionType.TRUE_FALSE,
        prompt: '“帮忙送个包裹/小药片”也可能让你卷入违法风险。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '不明物品的转运、保管都可能具有法律风险。',
      },
      {
        id: 'q-d4-3',
        type: QuestionType.SCENARIO,
        prompt: '情景题：同伴被人威胁“保密，不然报复”。你更推荐？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '绝对保密，谁也不说' },
          { key: 'B', text: '保证安全后尽快联系可信成年人和警方' },
          { key: 'C', text: '私下约对方谈判' },
          { key: 'D', text: '网上曝光对方隐私' },
        ]),
        answerKey: 'B',
        explanation: '威胁情境属于高风险信号，应走正规求助链路。',
      },
      {
        id: 'q-d4-4',
        type: QuestionType.SINGLE,
        prompt: '下列哪项属于“及时求助链路”的正确顺序？',
        optionsJson: JSON.stringify([
          { key: 'A', text: '先围观传播，再考虑求助' },
          { key: 'B', text: '先保安全，再联系老师/家长，必要时报警' },
          { key: 'C', text: '先删证据，避免麻烦' },
          { key: 'D', text: '只问匿名网友' },
        ]),
        answerKey: 'B',
        explanation: '高风险场景中，安全与可信成人支持优先。',
      },
      {
        id: 'q-d4-5',
        type: QuestionType.TRUE_FALSE,
        prompt: '禁毒与自护教育的关键不是“硬刚”，而是识别风险、及时求助。',
        optionsJson: JSON.stringify([{ key: 'T', text: '对' }, { key: 'F', text: '错' }]),
        answerKey: 'T',
        explanation: '稳定处置和求助协作比冲动对抗更安全有效。',
      },
    ],
  }

  const extraQuestionBank: Record<string, SeedQuestion[]> = {}
  for (const unitPlan of extraUnitPlans) {
    for (const level of unitPlan.levels) {
      const levelId = `level-${unitPlan.levelSlug}-${level.orderNo}`
      extraQuestionBank[levelId] = buildExtraQuestions(unitPlan.questionPrefix, level)
    }
  }

  const mergedQuestionBank: Record<string, SeedQuestion[]> = {
    ...questionBank,
    ...extraQuestionBank,
  }

  for (const [levelId, questions] of Object.entries(mergedQuestionBank)) {
    await prisma.question.deleteMany({ where: { levelId } })
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      await prisma.question.create({
        data: {
          id: q.id,
          levelId,
          type: q.type,
          prompt: q.prompt,
          optionsJson: q.optionsJson,
          answerKey: q.answerKey,
          explanation: q.explanation,
          orderNo: i + 1,
        },
      })
    }
  }

  await prisma.resource.createMany({
    data: [
      {
        id: 'res-1',
        title: '未成年人保护法：校园欺凌相关要点（摘要）',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['未成年人保护', '校园欺凌', '法条摘要']),
        contentMd:
          '当你遭遇欺凌时，学校和监护人都有保护义务。你可以：\n\n- 及时向老师、家长求助\n- 保留证据（截图、录音等）\n- 必要时拨打 110 或 12348\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-5',
        title: '法律知识卡：网络诈骗“三不一要”',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法律', '反诈', '知识卡']),
        contentMd:
          '三不一要：\n\n- 不轻信：陌生“中奖/兼职/退款”先核实\n- 不转账：不向私人账号转\n- 不泄露：验证码/身份证/家庭地址不随便给\n- 一要：要保存证据并及时求助（家长/老师/110/12348）\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-6',
        title: '法律知识卡：隐私与个人信息（最小必要原则）',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['家庭法律', '个人信息保护', '知识卡']),
        contentMd:
          '最小必要原则：\n\n- 只在正规渠道提交必要信息\n- 不发身份证照片/验证码\n- 发现泄露先截图取证，再举报/求助\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-7',
        title: '法律知识卡：网游充值纠纷（先取证再申诉）',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['消费法律', '网游充值', '知识卡']),
        contentMd:
          '遇到误充值：\n\n1) 保存订单号/支付凭证/沟通记录\n2) 走官方客服与申诉通道\n3) 警惕“代退费”诈骗\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-8',
        title: '法律知识卡：交通安全（拒绝无证驾驶）',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['交通安全', '出行', '知识卡']),
        contentMd:
          '安全底线：\n\n- 不无证驾驶\n- 不坐超员车\n- 乘车系安全带/骑行戴头盔\n- 发现酒驾坚决拒绝并及时求助\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-9',
        title: '法律知识卡：禁毒（不明物品不尝试）',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['禁毒法律', '拒绝技巧', '知识卡']),
        contentMd:
          '禁毒口诀：\n\n- 不明饮料/糖果/电子烟不尝试\n- 明确拒绝，立刻离开\n- 遇到疑似情况及时求助成年人\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-10',
        title: '法律知识卡：未成年人兼职与劳动权益（避坑版）',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['劳动权益', '未成年人保护', '防骗']),
        contentMd:
          '兼职前先做三件事：\n\n1) 核实招聘主体与联系方式，拒绝“先交押金/培训费”。\n2) 明确工作内容、时间、报酬和结算方式，尽量留存书面记录。\n3) 遇到拖欠工资或人身风险，及时向家长、老师和正规渠道求助。',
        createdBy: teacher.id,
      },
      {
        id: 'res-11',
        title: '法律知识卡：校园冲突中的边界意识',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['校园安全', '冲突处理', '证据意识']),
        contentMd:
          '冲突处理中记住“四不一要”：\n\n- 不围观起哄\n- 不以暴制暴\n- 不传播隐私影像\n- 不私下报复\n- 要第一时间求助可信成年人并保留证据',
        createdBy: teacher.id,
      },
      {
        id: 'res-12',
        title: '法律知识卡：网络造谣与名誉权',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '名誉权', '隐私保护']),
        contentMd:
          '面对网络谣言可以这样做：\n\n1) 及时截图、保留链接和时间信息。\n2) 在平台内进行举报并申请删除不实内容。\n3) 视情况向学校、监护人和相关机构求助，避免线下冲突升级。',
        createdBy: teacher.id,
      },
      {
        id: 'res-13',
        title: '法律知识卡：校园网暴取证与举报步骤',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['校园安全', '网络法治', '取证']),
        contentMd:
          '遇到网暴时建议按顺序处理：\n\n1) 截图保存账号、时间、链接和上下文。\n2) 在平台内举报并申请删除不实内容。\n3) 向老师、家长说明情况，必要时报警求助。\n4) 避免“以暴制暴”导致风险升级。',
        createdBy: teacher.id,
      },
      {
        id: 'res-14',
        title: '法律知识卡：二手交易防骗清单',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['消费者权益', '防骗', '平台交易']),
        contentMd:
          '二手交易四条底线：\n\n- 不脱离平台担保交易\n- 不点陌生“付款/退款”链接\n- 不泄露验证码、银行卡敏感信息\n- 纠纷先留证据再申诉',
        createdBy: teacher.id,
      },
      {
        id: 'res-15',
        title: '法律知识卡：出行事故后的自护口诀',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['交通安全', '应急', '求助']),
        contentMd:
          '口诀：先安全、再求助、再取证。\n\n- 优先转移到安全位置\n- 及时联系 120/110 或交警\n- 合理拍照留证，避免泄露他人隐私',
        createdBy: teacher.id,
      },
      {
        id: 'res-16',
        title: '法律知识卡：识别毒品诱导常见话术',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['禁毒教育', '风险识别', '求助链路']),
        contentMd:
          '常见诱导话术包括“免费试试”“提神不成瘾”“帮忙带一下”。\n\n应对策略：\n1) 明确拒绝\n2) 立即远离\n3) 向可信成年人求助，必要时报警',
        createdBy: teacher.id,
      },
      {
        id: 'res-2',
        title: '案例：群里辱骂与传播照片的法律风险',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['网络暴力', '隐私权', '肖像权']),
        contentMd:
          '在群聊中长期辱骂、散布他人照片，可能构成侵权甚至违法。关键建议：\n\n- 不要以暴制暴\n- 先保全证据\n- 向平台举报与寻求成年人帮助\n',
        createdBy: teacher.id,
      },
      {
        id: 'res-3',
        title: '3分钟微动画：识别“中奖链接”骗局（示例）',
        type: ResourceType.VIDEO,
        tagsJson: JSON.stringify(['网络诈骗', '反诈']),
        contentUrl: 'https://www.12377.cn/',
        createdBy: teacher.id,
      },
      {
        id: 'res-4',
        title: '工具：12348法律服务热线（了解与求助）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['求助', '热线']),
        contentUrl: 'https://www.12348.gov.cn/',
        createdBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.resource.createMany({
    data: [
      {
        id: 'res-17',
        title: '法条摘要：民法典人格权中的名誉权、隐私权与肖像权',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '民法典', '人格权', '法条摘要']),
        contentMd:
          '遇到侮辱、造谣、偷拍、擅自传播照片时，可按这三步处理：\n\n1) 先保全证据：截图、链接、时间、发布账号。\n2) 先平台处置：投诉举报并申请删除侵权内容。\n3) 再寻求支持：向老师、家长说明，必要时报警或咨询 12348。\n\n关键词：名誉权、隐私权、肖像权。',
        createdBy: teacher.id,
      },
      {
        id: 'res-18',
        title: '法条摘要：未成年人保护法中的学校保护要点',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['校园安全', '未成年人保护', '法条摘要']),
        contentMd:
          '学校对未成年人负有教育与保护责任。面对校园欺凌、侮辱排挤时：\n\n- 第一时间报告班主任、德育老师或校方负责人。\n- 保留聊天记录、照片、证人信息等证据。\n- 要求学校启动处置与保护流程，避免二次伤害。\n\n重点不是“忍耐”，而是“及时报告 + 规范处置”。',
        createdBy: teacher.id,
      },
      {
        id: 'res-19',
        title: '法条摘要：个人信息保护法中的最小必要原则',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '个人信息保护', '法条摘要']),
        contentMd:
          '任何平台收集信息都应遵循“最小必要”。你可以这样判断：\n\n- 与服务无关的信息，可拒绝提供。\n- 验证码、身份证照片、人脸信息等敏感信息要谨慎。\n- 发现异常索取时，先停止操作并核验官方渠道。\n\n记住：不给不必要信息，不等于“配合度低”，而是依法保护自己。',
        createdBy: teacher.id,
      },
      {
        id: 'res-20',
        title: '法条摘要：预防未成年人犯罪法中的风险行为干预',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['校园安全', '预防未成年人犯罪法', '法条摘要']),
        contentMd:
          '法律强调“早发现、早干预、早矫治”。当出现逃学、打架、网络暴力等风险行为时：\n\n1) 先由家庭、学校共同干预。\n2) 明确行为边界与后果，避免事态升级。\n3) 对高风险情况及时引入专业机构协助。\n\n核心思路：不放任、不贴标签、重在矫治。',
        createdBy: teacher.id,
      },
      {
        id: 'res-21',
        title: '法条摘要：消费者权益保护法中的网络消费维权四步',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['消费者权益', '维权', '法条摘要']),
        contentMd:
          '网络消费发生纠纷时，建议按“留证据-先协商-再投诉-再维权”处理：\n\n1) 留证据：订单、支付记录、聊天记录、商品页面。\n2) 先协商：走平台官方客服通道。\n3) 再投诉：平台投诉、12315 等渠道。\n4) 再维权：争议较大时走司法/仲裁路径。\n\n先留证再沟通，是成功维权关键。',
        createdBy: teacher.id,
      },
      {
        id: 'res-22',
        title: '法条摘要：道路交通安全法中的骑行与乘车底线',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['交通安全', '道路交通安全法', '法条摘要']),
        contentMd:
          '青少年出行常见底线：\n\n- 骑行不逆行、不闯灯、不并排行驶。\n- 乘车系安全带，不坐无证、超员、酒驾车辆。\n- 发生事故先保障人身安全，再报警与求助。\n\n交通规则的本质是降低伤害，而不是“应付检查”。',
        createdBy: teacher.id,
      },
      {
        id: 'res-23',
        title: '法条摘要：禁毒法中的青少年拒毒与求助',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['禁毒教育', '禁毒法', '法条摘要']),
        contentMd:
          '面对“免费试试”“提神不成瘾”等诱导话术，处理原则是：\n\n1) 明确拒绝，不拖延、不试探。\n2) 立即离开高风险场景。\n3) 及时向家长、老师或警方求助。\n\n拒绝不需要解释太多，离开和求助最重要。',
        createdBy: teacher.id,
      },
      {
        id: 'res-24',
        title: '法条摘要：家庭教育促进法中的监护沟通边界',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['家庭权益', '家庭教育促进法', '法条摘要']),
        contentMd:
          '家庭教育强调“尊重、沟通、引导”。遇到冲突时：\n\n- 先说事实和感受，不做人身攻击。\n- 对隐私和设备使用制定清晰规则并协商执行。\n- 遇到持续冲突可引入班主任、心理老师等第三方支持。\n\n规则清晰 + 沟通稳定，能减少家庭冲突升级。',
        createdBy: teacher.id,
      },
      {
        id: 'res-25',
        title: '法条摘要：反电信网络诈骗法中的青少年防骗要点',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '反诈', '法条摘要']),
        contentMd:
          '高频诈骗情境包括“退款客服”“游戏代充”“兼职刷单”。防骗建议：\n\n- 不点陌生链接，不下载来路不明 App。\n- 不向私人账户转账，不共享验证码。\n- 一旦被骗，立即冻结账户并报警，完整保留证据。\n\n快核验、慢转账，是关键习惯。',
        createdBy: teacher.id,
      },
      {
        id: 'res-26',
        title: '法条摘要：治安管理处罚法中的打架斗殴与造谣风险',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['校园安全', '网络法治', '法条摘要']),
        contentMd:
          '打架斗殴、散布谣言、恶意辱骂等行为都可能触及法律责任。建议：\n\n1) 发生冲突时先脱离现场，避免升级。\n2) 对网络言论保持克制，不“跟风起哄”。\n3) 通过正规渠道反映问题，不采取报复行为。\n\n情绪上头时，先停一停，避免一步错步步错。',
        createdBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.resource.createMany({
    data: [
      {
        id: 'res-case-01',
        title: '案例：同学偷拍视频并二次传播，如何合法止损',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['校园安全', '网络法治', '肖像权']),
        contentMd:
          '情境：课间被偷拍后，视频被发到群里并配有侮辱文字。\n\n处理建议：\n1) 立即截图保留证据（账号、时间、链接、评论）。\n2) 向班主任和年级负责人报告，要求学校启动处置流程。\n3) 在平台内投诉侵权内容并申请删除。\n4) 必要时由监护人协助报警或走法律咨询渠道。\n\n关键点：先止损、再追责，避免私下冲突升级。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-02',
        title: '案例：群聊造谣“考试作弊”，名誉受损怎么办',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['网络法治', '名誉权', '证据保全']),
        contentMd:
          '情境：班级群中有人散布“作弊”谣言，导致被孤立。\n\n处理建议：\n1) 保存聊天记录与传播路径。\n2) 明确要求发布者停止传播并公开澄清。\n3) 向老师、家长说明并申请学校介入。\n4) 情节严重时由监护人咨询法律渠道。\n\n关键点：不要以辱骂回击，优先走规范渠道。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-03',
        title: '案例：游戏代充被骗后，如何提高追回概率',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '反诈', '平台交易']),
        contentMd:
          '情境：在社交平台找“低价代充”，付款后被拉黑。\n\n处理建议：\n1) 保存转账记录、聊天记录、对方账号信息。\n2) 第一时间联系支付平台尝试止付。\n3) 向平台投诉并提交证据。\n4) 必要时报警，说明被骗经过与证据清单。\n\n关键点：陌生代充高风险，优先官方渠道充值。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-04',
        title: '案例：直播打赏冲动消费，家长发现后怎么处置',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '未成年人保护', '直播平台']),
        contentMd:
          '情境：未成年人在直播平台连续打赏，金额较大。\n\n处理建议：\n1) 立即冻结相关支付与账号权限，避免继续消费。\n2) 汇总订单记录、支付流水、账号实名信息。\n3) 通过平台未成年人消费通道提交申诉。\n4) 与家长共同完善支付与设备管理规则。\n\n关键点：证据完整度决定申诉效率。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-05',
        title: '案例：电动车违规载人发生擦碰，现场如何自护',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['交通安全', '事故处置', '求助']),
        contentMd:
          '情境：放学路上电动车擦碰行人，现场情绪激动。\n\n处理建议：\n1) 先确认人员安全，必要时拨打 120。\n2) 报警并等待交警到场，不私下草率“私了”。\n3) 合理拍照记录位置、车辆、时间与环境。\n4) 及时通知家长到场协助处理。\n\n关键点：先安全后责任，避免二次风险。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-06',
        title: '案例：同伴怂恿“试一口”，如何拒绝并脱离',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['禁毒教育', '风险识别', '求助链路']),
        contentMd:
          '情境：聚会中有人递来不明电子烟，声称“没事”。\n\n处理建议：\n1) 明确拒绝，不进行“尝试验证”。\n2) 立刻离开相关场景，避免继续被劝诱。\n3) 及时向家长、老师说明情况。\n4) 若存在违法线索，协助向警方反映。\n\n关键点：拒绝不需要解释，离开是第一动作。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-07',
        title: '案例：兼职“先交培训费”，是否属于高风险招聘',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '劳动权益', '防骗']),
        contentMd:
          '情境：兼职中介要求先交押金和培训费，承诺“日结高薪”。\n\n处理建议：\n1) 核实企业主体信息和正规招聘渠道。\n2) 对“先交钱后上岗”保持高度警惕。\n3) 保留聊天记录与收款账户信息。\n4) 发现异常及时中止并向家长老师反馈。\n\n关键点：正规兼职不应以押金作为前置条件。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-08',
        title: '案例：二手交易被诱导“脱离平台支付”后被骗',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '平台交易', '反诈']),
        contentMd:
          '情境：卖家以“省手续费”为由让你私下转账。\n\n处理建议：\n1) 坚持平台内沟通与交易，不点陌生付款链接。\n2) 一旦转账异常，立即联系支付平台止付。\n3) 汇总交易证据并提交平台投诉。\n4) 情节严重及时报警。\n\n关键点：脱离平台保护是交易诈骗高发节点。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-09',
        title: '案例：家庭冲突中被公开隐私，如何建立边界',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['家庭权益', '隐私保护', '沟通规则']),
        contentMd:
          '情境：家庭争执后，个人聊天记录被公开给亲友。\n\n处理建议：\n1) 先平稳表达“事实-感受-边界”而非对抗。\n2) 共同制定隐私边界与设备使用规则。\n3) 需要时请班主任或心理老师协助沟通。\n4) 避免把家庭矛盾扩散到网络平台。\n\n关键点：边界需要被明确、被记录、被执行。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-10',
        title: '案例：收到“退款客服”电话后险些泄露验证码',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['网络法治', '反诈', '个人信息保护']),
        contentMd:
          '情境：自称平台客服来电称“商品异常需退款”，诱导报验证码。\n\n处理建议：\n1) 立即挂断，通过官方 App 客服核验。\n2) 验证码、支付密码绝不告知任何人。\n3) 若已泄露，马上修改密码并冻结支付能力。\n4) 保留通话与短信记录，必要时报警。\n\n关键点：凡涉及验证码，默认高风险。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-11',
        title: '案例：校园冲突后被要求“删证据”，该怎么做',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['校园安全', '证据保全', '纠纷处置']),
        contentMd:
          '情境：冲突后有人要求删除聊天和视频“别把事闹大”。\n\n处理建议：\n1) 先备份证据，不随意删除原始记录。\n2) 通过老师和校方正规渠道处理。\n3) 避免私下谈判导致事实失真。\n4) 保持理性表达，聚焦事实和诉求。\n\n关键点：证据完整是公平处置前提。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-12',
        title: '案例：短视频平台恶意剪辑同学片段，如何维权',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['网络法治', '肖像权', '平台举报']),
        contentMd:
          '情境：同学日常视频被恶意剪辑后引发网暴。\n\n处理建议：\n1) 完整保存原视频、剪辑视频、评论区证据。\n2) 发起平台侵权投诉并申请下架。\n3) 联系学校协同家长开展保护措施。\n4) 对持续侵权行为保留追责证据。\n\n关键点：先止传播，再谈追责，效率最高。',
        createdBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.resource.createMany({
    data: [
      {
        id: 'res-tool-01',
        title: '工具：国家法律法规数据库（法条权威查询）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '法条查询', '国家数据库']),
        contentUrl: 'https://flk.npc.gov.cn/',
        contentMd:
          '适用场景：需要核对法条原文、最新修订信息。\n使用建议：优先按法律全称检索，再查看最新公布日期与效力状态。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-02',
        title: '工具：中国法律服务网（12348）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '法律咨询', '求助渠道']),
        contentUrl: 'https://www.12348.gov.cn/pub/12348/index.html',
        contentMd:
          '适用场景：遇到校园冲突、网络侵权、消费纠纷等问题需要咨询。\n使用建议：先整理时间线和证据，再提交咨询问题，回复会更高效。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-03',
        title: '工具：全国 12315 平台（消费维权）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '消费维权', '投诉举报']),
        contentUrl: 'https://www.12315.cn/',
        contentMd:
          '适用场景：网购纠纷、虚假宣传、售后拖延等消费问题。\n使用建议：提交投诉前准备订单号、聊天记录、付款凭证和商品页面截图。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-04',
        title: '工具：12377 违法和不良信息举报中心',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '网络举报', '网暴治理']),
        contentUrl: 'https://www.12377.cn/',
        contentMd:
          '适用场景：网络暴力、造谣侮辱、未成年人有害信息传播。\n使用建议：举报时附带链接、账号、发布时间和截图，便于平台快速处置。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-05',
        title: '工具：公安机关互联网违法犯罪举报网站',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '公安举报', '网络犯罪']),
        contentUrl: 'https://cyberpolice.mps.gov.cn/wfjb/',
        contentMd:
          '适用场景：遭遇诈骗、敲诈勒索、个人信息被非法买卖等违法线索。\n使用建议：优先保留转账记录、聊天证据和对方账号信息后再提交。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-06',
        title: '工具：12321 网络不良与垃圾信息举报受理中心',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '骚扰信息', '诈骗短信']),
        contentUrl: 'https://www.12321.cn/',
        contentMd:
          '适用场景：骚扰电话、垃圾短信、钓鱼链接、诈骗信息。\n使用建议：不要回拨可疑号码，先截图和记录时间，再进行举报。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-07',
        title: '工具：中国互联网联合辟谣平台',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '辟谣核验', '信息素养']),
        contentUrl: 'https://www.piyao.org.cn/',
        contentMd:
          '适用场景：遇到“紧急通知”“健康谣言”“考试政策谣言”等不确定信息。\n使用建议：先核验再转发，避免二次传播造成风险。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-08',
        title: '工具：中国裁判文书网（以案学法）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '案例检索', '司法公开']),
        contentUrl: 'https://wenshu.court.gov.cn/',
        contentMd:
          '适用场景：想了解类似案件在司法实践中的处理思路。\n使用建议：可按关键词组合检索，如“校园欺凌 + 未成年人 + 赔偿”。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-09',
        title: '工具：中国庭审公开网（庭审学习）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '庭审公开', '法治学习']),
        contentUrl: 'https://tingshen.court.gov.cn/',
        contentMd:
          '适用场景：课堂延展学习，了解真实庭审流程与法庭秩序。\n使用建议：结合老师布置的主题观看，更容易形成完整认知。',
        createdBy: teacher.id,
      },
      {
        id: 'res-tool-10',
        title: '工具：中国执行信息公开网（执行查询）',
        type: ResourceType.ARTICLE,
        tagsJson: JSON.stringify(['权威工具', '执行信息', '司法公开']),
        contentUrl: 'https://zxgk.court.gov.cn/',
        contentMd:
          '适用场景：了解法院执行公开信息与司法执行流程。\n使用建议：用于学习司法程序时，优先关注公开说明和操作指引。',
        createdBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.resource.createMany({
    data: [
      {
        id: 'res-law-plus-01',
        title: '法条摘要：校园冲突中的人身边界与处置流程',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['校园安全', '未成年人保护', '法条摘要']),
        contentMd:
          '常见场景：\n- 推搡、围堵、起外号、在群里煽动排挤。\n- 课间冲突被拍视频并传播。\n\n正确做法：\n1) 先脱离现场，避免再次冲突。\n2) 及时向班主任/德育老师报告，并说明时间线。\n3) 通过学校正式流程申请介入处置。\n\n不要这么做：\n- 不私下“约架”或纠集同学报复。\n- 不在社交平台继续对骂放大矛盾。\n\n证据清单：\n- 聊天记录截图（含时间和账号）。\n- 现场照片/视频原件。\n- 证人姓名与可联系信息。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-02',
        title: '法条摘要：网络辱骂与造谣的止损路径',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '名誉权', '法条摘要']),
        contentMd:
          '常见场景：\n- 群聊里被辱骂、被贴标签、被恶意剪辑。\n- 未经同意发布照片并配侮辱性文字。\n\n正确做法：\n1) 固定证据：截图、链接、账号、发布时间。\n2) 在平台发起举报并申请删除侵权内容。\n3) 向老师和家长同步情况，必要时报警或咨询 12348。\n\n不要这么做：\n- 不回怼“开盒”对方隐私。\n- 不删除原始证据后再维权。\n\n证据清单：\n- 侵权内容全页截图（含评论区）。\n- 原帖链接与发布账号主页。\n- 平台投诉记录回执。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-03',
        title: '法条摘要：个人信息保护与账号安全',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '个人信息保护', '法条摘要']),
        contentMd:
          '常见场景：\n- 被要求提供身份证照片、人脸、验证码。\n- 收到“客服退款”电话诱导屏幕共享。\n\n正确做法：\n1) 仅在官方渠道提交最小必要信息。\n2) 涉及验证码、支付密码一律拒绝透露。\n3) 发现异常立刻改密、冻结支付并核验官方客服。\n\n不要这么做：\n- 不点来源不明链接，不下载陌生安装包。\n- 不将账号密码保存在聊天工具中。\n\n证据清单：\n- 可疑号码来电记录。\n- 短信/私信截图。\n- 账号异常登录提醒截图。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-04',
        title: '法条摘要：网络消费纠纷与维权步骤',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['消费者权益', '维权', '法条摘要']),
        contentMd:
          '常见场景：\n- 网购商品与描述不符、售后拖延。\n- 二手交易被诱导脱离平台转账。\n\n正确做法：\n1) 先留证据，再与平台客服协商。\n2) 协商无果走平台投诉与 12315 渠道。\n3) 金额较大或争议复杂时，请家长协助走司法路径。\n\n不要这么做：\n- 不私下扫码付款给陌生账户。\n- 不只电话沟通不留文字记录。\n\n证据清单：\n- 订单详情页和商品页面截图。\n- 支付凭证、物流信息。\n- 与商家/客服聊天记录。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-05',
        title: '法条摘要：交通事故后的未成年人自护',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['交通安全', '道路交通安全法', '法条摘要']),
        contentMd:
          '常见场景：\n- 骑行与行人或机动车发生擦碰。\n- 乘坐无证、超员或酒驾车辆。\n\n正确做法：\n1) 先确认人身安全，必要时拨打 120。\n2) 及时报警并等待交警到场处理。\n3) 通知家长到场，避免未成年人单独协商责任。\n\n不要这么做：\n- 不擅自离开现场。\n- 不在情绪激动时签署不明责任承诺。\n\n证据清单：\n- 现场全景与车辆位置照片。\n- 车牌号、时间地点记录。\n- 医疗记录与报警回执。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-06',
        title: '法条摘要：禁毒风险识别与拒绝话术',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['禁毒教育', '禁毒法', '法条摘要']),
        contentMd:
          '常见场景：\n- 聚会中被劝“试一口”“提神不成瘾”。\n- 接触来源不明电子烟、饮料或糖果。\n\n正确做法：\n1) 明确拒绝并立刻离开高风险场景。\n2) 及时联系家长、老师说明情况。\n3) 发现疑似违法线索时由成年人协助报警。\n\n不要这么做：\n- 不因“面子”勉强尝试。\n- 不替他人保管可疑物品。\n\n证据清单：\n- 可疑人员和地点信息。\n- 聊天邀约记录。\n- 相关物品照片（确保自身安全前提下）。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-07',
        title: '法条摘要：家庭沟通中的隐私边界',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['家庭权益', '家庭教育促进法', '法条摘要']),
        contentMd:
          '常见场景：\n- 聊天记录被未经同意查看或转发。\n- 因成绩、社交发生高频争执。\n\n正确做法：\n1) 用“事实-感受-请求”表达边界需求。\n2) 与监护人协商设备使用和隐私规则。\n3) 持续冲突时引入班主任或心理老师协助。\n\n不要这么做：\n- 不公开家庭矛盾到网络平台。\n- 不在冲突中进行侮辱性表达。\n\n证据清单：\n- 关键沟通记录与协商文本。\n- 规则约定截图或书面记录。\n- 需要学校协助时的时间线记录。',
        createdBy: teacher.id,
      },
      {
        id: 'res-law-plus-08',
        title: '法条摘要：电信网络诈骗快速处置',
        type: ResourceType.LAW_SUMMARY,
        tagsJson: JSON.stringify(['网络法治', '反诈', '法条摘要']),
        contentMd:
          '常见场景：\n- “退款客服”“兼职刷单”“低价代充”诱导转账。\n- 通过短信链接或屏幕共享骗取验证码。\n\n正确做法：\n1) 立即停止操作并断开可疑通话/链接。\n2) 第一时间改密、冻结支付并联系官方平台。\n3) 保留证据后报警，必要时同步 12321/12377 举报。\n\n不要这么做：\n- 不向私人账户转账。\n- 不在陌生指引下共享屏幕或远程控制。\n\n证据清单：\n- 转账记录与对方账户信息。\n- 通话录音/短信截图。\n- 平台工单和报警回执。',
        createdBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.resource.createMany({
    data: [
      {
        id: 'res-case-plus-01',
        title: '案例：被冒用头像和昵称后如何快速止损',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['网络法治', '名誉权', '个人信息保护']),
        contentMd:
          '情境：\n有人冒用你的头像和昵称在群里发言，造成同学误解，甚至引发嘲讽。\n\n处置建议：\n1) 先固定证据，保存冒用账号主页、发言记录和传播截图。\n2) 在平台发起冒用身份投诉并申请封禁或更正。\n3) 向班主任说明情况，及时澄清，避免误会继续扩大。\n4) 情节严重时由家长协助报警或咨询 12348。\n\n不要这么做：\n- 不使用小号对骂或“反向冒充”报复。\n- 不在没有证据时公开指认具体同学。\n\n证据清单：\n- 冒用账号主页截图。\n- 关键聊天记录和发布时间。\n- 平台投诉回执或工单号。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-02',
        title: '案例：作业群被恶意刷屏和辱骂的应对',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['校园安全', '网络法治', '证据保全']),
        contentMd:
          '情境：\n班级作业群有人连续刷屏、辱骂同学，影响正常学习秩序。\n\n处置建议：\n1) 第一时间截图保留关键页面和账号信息。\n2) 联系群管理人处理，必要时暂时开启群管理限制。\n3) 向老师反馈并由学校开展纪律和法治教育处置。\n4) 对持续侵害行为走平台举报和学校正式流程。\n\n不要这么做：\n- 不“群起围攻”扩大冲突。\n- 不泄露对方个人隐私进行报复。\n\n证据清单：\n- 刷屏时段完整截图。\n- 涉事账号 ID 和群名。\n- 群管理处置记录。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-03',
        title: '案例：游戏账号借给同学后被转卖',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '网络法治', '账号安全']),
        contentMd:
          '情境：\n把游戏账号借给同学后，账号被改绑并在二手平台转卖。\n\n处置建议：\n1) 立刻通过官方渠道发起账号找回并冻结异常操作。\n2) 保留借号聊天记录、交易截图和对方账号信息。\n3) 向平台客服提交完整证据链，申请介入处理。\n4) 金额较大或拒不配合时，家长协助报警处理。\n\n不要这么做：\n- 不私下索要“赎号费”。\n- 不用非法手段找回账号。\n\n证据清单：\n- 借号聊天记录。\n- 改绑通知短信或邮件。\n- 二手平台链接与交易截图。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-04',
        title: '案例：线下冲突被录制并剪辑传播',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['校园安全', '肖像权', '平台举报']),
        contentMd:
          '情境：\n课后冲突视频被恶意剪辑后上传，评论区出现攻击性言论。\n\n处置建议：\n1) 保存原视频与剪辑视频对比证据。\n2) 通过平台侵权入口申请下架并限制传播。\n3) 向学校报告，由老师组织双方在规范场景沟通。\n4) 对持续侵权行为保留证据并由监护人追责。\n\n不要这么做：\n- 不在评论区继续互骂。\n- 不自行发布对方隐私“反制”。\n\n证据清单：\n- 原视频与剪辑视频。\n- 链接、发布时间和评论区截图。\n- 平台处理结果记录。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-05',
        title: '案例：兼职群里被诱导先交押金',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '劳动权益', '防骗']),
        contentMd:
          '情境：\n兼职群发布高薪日结信息，要求先交押金和资料审核费。\n\n处置建议：\n1) 核实招聘主体信息，优先选择正规平台岗位。\n2) 对先交费再上岗的要求直接拒绝。\n3) 保存聊天记录和收款账户信息用于举报。\n4) 向老师和家长同步风险，必要时报警。\n\n不要这么做：\n- 不因“名额紧张”仓促转账。\n- 不把个人证件原件随意发给陌生人。\n\n证据清单：\n- 招聘文案截图。\n- 转账记录与收款账户。\n- 对方联系方式和群信息。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-06',
        title: '案例：二手交易到货后发现货不对板',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['消费者权益', '平台交易', '维权']),
        contentMd:
          '情境：\n收到商品后发现与描述不符，卖家拒绝退款并拉黑。\n\n处置建议：\n1) 立即拍照录像留存开箱与商品状态。\n2) 通过平台争议入口提交证据申请仲裁。\n3) 同步订单、聊天、付款记录形成完整证据链。\n4) 协商失败后走平台投诉和 12315 渠道。\n\n不要这么做：\n- 不脱离平台私下退款。\n- 不先确认收货再维权。\n\n证据清单：\n- 开箱视频和商品细节图。\n- 商品描述页截图。\n- 订单与聊天记录。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-07',
        title: '案例：校外活动中被强行劝酒',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['校园安全', '未成年人保护', '人身安全']),
        contentMd:
          '情境：\n在聚餐或生日会中被起哄劝酒，拒绝后遭言语施压。\n\n处置建议：\n1) 明确拒绝并远离高风险座位或场景。\n2) 及时联系同伴、家长或老师寻求支持。\n3) 出现人身威胁时立即报警。\n4) 活动结束后向学校反馈风险点，防止再次发生。\n\n不要这么做：\n- 不为“合群”勉强饮酒。\n- 不独自留在让你不安全的环境。\n\n证据清单：\n- 活动时间地点与参与人员信息。\n- 关键聊天邀约记录。\n- 现场可获取的照片或录音。',
        createdBy: teacher.id,
      },
      {
        id: 'res-case-plus-08',
        title: '案例：收到陌生链接后账号被盗',
        type: ResourceType.CASE,
        tagsJson: JSON.stringify(['网络法治', '反诈', '账号安全']),
        contentMd:
          '情境：\n点击陌生链接并输入账号密码后，社交账号被异地登录和冒用。\n\n处置建议：\n1) 立刻改密并开启二次验证，踢下线异常设备。\n2) 通知联系人警惕异常消息，避免二次受害。\n3) 向平台提交被盗申诉并上传证据。\n4) 涉及财产损失时及时报警并保留转账流水。\n\n不要这么做：\n- 不继续在同一设备保存明文密码。\n- 不忽视异地登录提醒。\n\n证据清单：\n- 异地登录提醒截图。\n- 链接来源和聊天记录。\n- 账号恢复和平台工单记录。',
        createdBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  })

  const targetLevel = allLevels.find((l) => l.id === 'level-campus-1')
  if (targetLevel) {
    await prisma.assignment.upsert({
      where: { id: 'as-1' },
      update: {},
      create: {
        id: 'as-1',
        classId: class1.id,
        targetType: 'LEVEL',
        targetId: targetLevel.id,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    await prisma.$disconnect()
    throw e
  })
