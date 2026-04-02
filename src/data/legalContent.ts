export type HomeQuizItem = {
  id: string
  question: string
  options: string[]
  answerIndex: number
  law: string
  rationale: string
  sourceLabel: string
  sourceUrl: string
}

export const legalTips = [
  {
    tip: '未成年人依法享有受教育权和人格尊严，任何组织和个人不得侵害。',
    law: '《未成年人保护法》第3条、第27条',
  },
  {
    tip: '校园欺凌不是“玩笑”，遇到持续侮辱、排挤、威胁时要及时求助。',
    law: '《未成年人保护法》第39条',
  },
  {
    tip: '个人信息受法律保护，验证码、身份证照片、家庭住址不要随意提供。',
    law: '《个人信息保护法》第4条、第10条',
  },
  {
    tip: '网络造谣、网暴、恶意传播隐私内容，可能侵犯名誉权和隐私权。',
    law: '《民法典》人格权编',
  },
  {
    tip: '网购纠纷要先留证据再维权：订单、支付记录、聊天记录都很关键。',
    law: '《消费者权益保护法》',
  },
  {
    tip: '面对“中奖链接”“退款客服”“先转账后处理”等说法，要提高警惕。',
    law: '反诈普法常识',
  },
  {
    tip: '交通规则的本质是保护生命，拒绝无证驾驶、醉驾和危险骑行。',
    law: '《道路交通安全法》',
  },
  {
    tip: '遇到高风险场景，先保证安全，再向老师、家长或警方求助。',
    law: '110 / 12348 求助渠道',
  },
]

export const legalChecklist = [
  '先保安全：优先离开高风险场景，避免冲突升级。',
  '再留证据：截图、时间、链接、聊天记录尽量完整留存。',
  '走正规渠道：平台举报、学校求助、家长沟通、必要时报警。',
  '护好隐私：不公开身份证、住址、验证码等敏感信息。',
]

export const homeQuizBank: HomeQuizItem[] = [
  {
    id: 'anti-bullying-school-duty',
    question: '同学长期被起侮辱性外号并被围堵，学校首先应怎么做？',
    options: ['先冷处理，等家长自己协调', '立即制止并通知双方监护人参与处理', '只在班会上口头提醒一次'],
    answerIndex: 1,
    law: '《未成年人保护法》第39条（2020年修订）',
    rationale:
      '学校对学生欺凌应当立即制止，并通知实施欺凌和被欺凌学生监护人参与认定和处理；严重情形还应及时报告公安和教育部门。',
    sourceLabel: '龙岗区妇联转载中国政府网法条',
    sourceUrl: 'https://www.lg.gov.cn/bmzz/fl/wqtd/fnetwqfl/content/post_8974034.html',
  },
  {
    id: 'minor-live-account',
    question: '15岁学生想注册网络直播发布者账号，平台应如何处理？',
    options: ['可以直接注册', '必须先充值认证后再注册', '不得提供直播发布者账号注册服务'],
    answerIndex: 2,
    law: '《未成年人保护法》第76条',
    rationale: '网络直播服务提供者不得为未满十六周岁的未成年人提供网络直播发布者账号注册服务。',
    sourceLabel: '龙岗区妇联转载中国政府网法条',
    sourceUrl: 'https://www.lg.gov.cn/bmzz/fl/wqtd/fnetwqfl/content/post_8974034.html',
  },
  {
    id: 'game-time-limit',
    question: '网络游戏平台可以在23:00向未成年人提供游戏服务吗？',
    options: ['可以，只要家长同意', '不可以', '可以，但每次不超过30分钟'],
    answerIndex: 1,
    law: '《未成年人保护法》第75条',
    rationale: '网络游戏服务提供者不得在每日22:00至次日8:00向未成年人提供网络游戏服务。',
    sourceLabel: '龙岗区妇联转载中国政府网法条',
    sourceUrl: 'https://www.lg.gov.cn/bmzz/fl/wqtd/fnetwqfl/content/post_8974034.html',
  },
  {
    id: 'pii-basic-scope',
    question: '在班级群公开同学身份证照片和住址，最可能侵犯哪类法定权益？',
    options: ['个人信息权益', '著作权', '专利权'],
    answerIndex: 0,
    law: '《个人信息保护法》第4条、第10条',
    rationale: '个人信息包含可识别自然人的信息，任何组织或个人不得非法收集、使用、传输、公开他人个人信息。',
    sourceLabel: '国家市场监督管理总局（法规转载）',
    sourceUrl: 'https://www.samr.gov.cn/wljys/gzzd/art/2023/art_3ef1e889c1e644d4b65b5f5c7f432386.html',
  },
  {
    id: 'under14-consent',
    question: '某App要处理13岁用户的人脸信息，合规前提是什么？',
    options: ['只要用户本人点击同意即可', '取得未成年人监护人同意并遵守特别规则', '不需要任何同意'],
    answerIndex: 1,
    law: '《个人信息保护法》第31条',
    rationale: '处理不满十四周岁未成年人个人信息，应取得父母或其他监护人同意，并制定专门处理规则。',
    sourceLabel: '国家市场监督管理总局（法规转载）',
    sourceUrl: 'https://www.samr.gov.cn/wljys/gzzd/art/2023/art_3ef1e889c1e644d4b65b5f5c7f432386.html',
  },
  {
    id: 'no-license-driving',
    question: '没有机动车驾驶证可以驾驶机动车上路吗？',
    options: ['可以，车速慢就行', '不可以，必须依法取得机动车驾驶证', '可以，白天限定路段可通行'],
    answerIndex: 1,
    law: '《道路交通安全法》第19条',
    rationale: '驾驶机动车应当依法取得机动车驾驶证，并按准驾车型驾驶。',
    sourceLabel: '贵州省市场监管局转载现行法条',
    sourceUrl: 'https://amr.guizhou.gov.cn/ztzl_85/2021naqscyhd/2022naqscyhd/202206/t20220607_74635466.html',
  },
  {
    id: 'prepaid-refund',
    question: '培训机构突然停业，消费者对未消费预付款的权利是？',
    options: ['只能等机构复业', '有权要求继续履约或退还未消费余额', '只能主张一半退款'],
    answerIndex: 1,
    law: '《消费者权益保护法实施条例》第21条、第22条',
    rationale: '收取预付款的经营者停业或迁址应提前告知，消费者可依法要求继续履约或退还未消费预付款余额。',
    sourceLabel: '中国政府网发布，南京市司法局转载',
    sourceUrl: 'https://sfj.nanjing.gov.cn/ztzl/fzxc/flfg/202404/t20240408_4204360.html',
  },
  {
    id: 'anti-drug-parent-duty',
    question: '对未成年人进行毒品危害教育，法律明确主要责任在谁？',
    options: ['学校和老师', '父母或其他监护人', '同学互相提醒即可'],
    answerIndex: 1,
    law: '《禁毒法》第18条',
    rationale: '未成年人的父母或者其他监护人应对未成年人进行毒品危害教育，防止吸食、注射毒品等违法行为。',
    sourceLabel: '深圳市政府公开法条',
    sourceUrl: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zcfg/content/post_8979670.html',
  },
]
