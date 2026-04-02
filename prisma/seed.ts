import bcrypt from 'bcryptjs'
import { PrismaClient, Role, ResourceType, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

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
  ])

  const questionBank: Record<
    string,
    Array<{ id: string; type: QuestionType; prompt: string; optionsJson: string; answerKey: string; explanation: string }>
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
  }

  for (const [levelId, questions] of Object.entries(questionBank)) {
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

  const targetLevel = levels.find((l) => l.id === 'level-campus-1')
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
