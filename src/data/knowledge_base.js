export const KNOWLEDGE_BASE = [
  // --- 孕期 (Pregnancy) ---
  {
    id: "case_fetal_movement",
    stage: "pregnancy", // 适用阶段
    tags: ["胎动", "数胎动", "不动了", "踢我"],
    display_tag: "👣 怎么数胎动",
    solution: "数胎动是孕晚期监测宝宝健康最重要的手段。\n1. 【怎么算一次】连续动算一次，停顿几分钟后再动算另一次；打嗝不算胎动。\n2. 【时间】建议每天早、中、晚各数1小时。\n3. 【标准】每小时胎动≥3次，或12小时累计≥30次为正常。\n4. 【技巧】找个安静的地方左侧卧，双手轻抚肚皮，集中注意力。",
    warning: "如果胎动明显减少（比平时少50%）或突然剧烈躁动后停止，请立即去医院急诊，不要等待！"
  },
  {
    id: "case_morning_sickness",
    stage: "pregnancy",
    tags: ["孕吐", "恶心", "吐得厉害", "吃不下"],
    display_tag: "🤢 孕吐太难受",
    solution: "孕吐是正常的激素反应。缓解小妙招：\n1. 【少食多餐】空腹最容易恶心，身边常备苏打饼干。\n2. 【姜】喝点姜茶或含姜糖，姜是天然的止吐药。\n3. 【避开气味】远离油烟味和刺激性气味。\n4. 【补水】如果吐得太厉害，要小口喝电解质水防止脱水。",
    warning: "如果吃什么吐什么，体重下降超过5%，或尿量极少，可能是妊娠剧吐，需就医输液。"
  },

  // --- 0-1岁 (Infant) ---
  {
    id: "case_vomit_ambiguous",
    stage: "all",
    tags: ["吐奶", "溢奶", "喷射", "吃完就吐", "呕吐"],
    display_tag: "🤢 吃完就吐",
    is_ambiguous: true,
    core_question: "吃完就吐是宝宝吐奶还是孕妈孕吐？",
    related_scenarios: ["溢奶", "喷射", "拍嗝", "幽门狭窄"],
    decision_criteria: "对象=宝宝 且 喂奶后吐出 → 吐奶护理；对象=孕妈 → 孕吐缓解",
    clarify_options: [
      { text: "👶 宝宝吐奶/喷射", next_id: "case_spit_milk" },
      { text: "🤰 孕妈孕吐", next_id: "case_morning_sickness" }
    ],
    solution: "“吃完就吐”可能是宝宝吐奶，也可能是孕妈早孕反应，两者的护理方式截然不同。",
    warning: ""
  },
  {
    id: "case_spit_milk",
    stage: "infant",
    tags: [], // Tags moved to ambiguous case to force clarification
    display_tag: "",
    solution: "宝宝吐奶护理SOP：\n1. 【体位】喂奶时头部垫高，不要平躺。\n2. 【拍嗝】喂到一半和喂完后，必须竖抱拍嗝15-20分钟。\n3. 【防窒息】如果平躺时吐奶，立刻让宝宝侧身，清理口腔，防止吸入气管。",
    warning: "如果呈喷射状呕吐（喷出半米远），且精神萎靡、体重不增，必须去医院排除幽门狭窄。",
    fallback_suggestions: ["怎么区分溢奶和吐奶？", "需要拍嗝多久？"]
  },
  {
    id: "case_colic",
    stage: "infant",
    tags: ["肠绞痛", "哭闹", "黄昏闹", "一直哭"],
    display_tag: "😭 傍晚一直哭",
    core_question: "宝宝一直哭是肠绞痛还是其他急症？",
    related_scenarios: ["黄昏闹", "飞机抱", "排气操", "肠套叠"],
    decision_criteria: "傍晚定时哭闹、无发热呕吐 → 肠绞痛；哭声尖锐、果酱样便 → 就医排除肠套叠",
    solution: "这是典型的肠绞痛/黄昏闹：\n1. 【飞机抱】让宝宝趴在你的小臂上，压迫腹部缓解胀气。\n2. 【排气操】清醒时多顺时针揉肚子，做蹬腿动作。\n3. 【白噪音】开吹风机或者吸尘器的声音，能让他平静下来。",
    warning: "如果哭声尖锐、伴有果酱样大便，需立即就医排除肠套叠。",
    fallback_suggestions: ["肠绞痛多久能好？", "飞机抱怎么做？"]
  },

  // --- 疫苗/接种相关 ---
  {
    id: "case_chickenpox",
    stage: "all",
    tags: ["水痘", "水痘疫苗", "水痘接种"],
    display_tag: "💉 水痘疫苗/护理",
    solution: "水痘疫苗与护理要点：\n1. 【怎么算一针】接种本上记录的每一剂（通常为2剂程序：18月龄、4岁各一针）算一针；漏打需补种。\n2. 【接种时机】推荐18月龄打第一针，4岁打第二针。\n3. 【得了水痘护理】隔离至全部结痂；剪短指甲防抓破；高热可用对乙酰氨基酚；皮疹痒可涂炉甘石。\n4. 【就医】高热不退、皮疹化脓、精神差需就医。",
    warning: "水痘传染性强，患病期间避免接触孕妇和未接种的宝宝。"
  },

  // --- 1-3岁 (Toddler) ---
  {
    id: "case_tantrum",
    stage: "toddler",
    tags: ["发脾气", "打滚", "不听话", "打人", "扔东西"],
    display_tag: "😡 动不动发脾气",
    solution: "这是‘可怕的两岁’(Terrible Two)的正常表现，宝宝自我意识萌发但表达能力跟不上。\n1. 【冷处理】确保安全的前提下，让他哭一会儿，不要马上满足。\n2. 【共情】等平静下来，抱抱他：‘宝宝刚才很生气是不是？’\n3. 【转移注意力】用玩具或游戏转移他的执念。",
    warning: ""
  },

  // --- 模糊场景 (Ambiguous / Clarification Needed) ---
  {
    id: "case_cold_ambiguous",
    stage: "all",
    tags: ["感冒", "发烧", "流鼻涕", "咳嗽"],
    display_tag: "🤧 感冒了怎么办",
    is_ambiguous: true,
    core_question: "感冒了是谁感冒？宝宝、孕妈还是宝妈？",
    related_scenarios: ["发烧", "流鼻涕", "咳嗽", "用药", "就医"],
    decision_criteria: "对象=宝宝/孕妈/宝妈 分别对应不同护理与用药建议",
    clarify_options: [
      { text: "👶 宝宝感冒", next_id: "case_cold_baby" },
      { text: "🤰 孕妈感冒（孕期）", next_id: "case_cold_pregnant" },
      { text: "👩 宝妈感冒（产后）", next_id: "case_cold_mom" }
    ],
    solution: "感冒的处理方式因人而异，请先告诉我是谁感冒了？",
    warning: ""
  },
  
  // --- 具体感冒分支 ---
  {
    id: "case_cold_pregnant",
    stage: "pregnancy",
    tags: [],
    display_tag: "",
    solution: "孕妈感冒（孕期）：\n1. 【多休息】保证睡眠，多喝水。\n2. 【物理降温】低烧可温水擦浴，避免捂汗。\n3. 【用药】发烧难受可用对乙酰氨基酚（泰诺），孕期相对安全；避免布洛芬。\n4. 【就医】高烧超过38.5度或持续3天以上，请就医并告知医生孕周。",
    warning: "孕期用药务必遵医嘱，勿自行服用复方感冒药。",
    fallback_suggestions: ["孕期发烧能吃药吗？", "发烧多少度要去医院？"]
  },
  {
    id: "case_cold_baby",
    stage: "all",
    tags: [], // 仅通过追问触发
    display_tag: "",
    solution: "宝宝感冒护理SOP：\n1. 【观察】精神好、能吃能玩，通常不需要去医院，在家护理即可。\n2. 【清理鼻腔】用海盐水喷雾清理鼻涕，缓解鼻塞。\n3. 【加湿】保持室内湿度50-60%。\n4. 【多喝水/奶】稀释痰液，帮助排毒。",
    warning: "如果体温超过38.5度（3个月以下超过38度），或出现呼吸急促、精神差，请立即就医。",
    fallback_suggestions: ["发烧会烧坏脑子吗？", "什么时候要去医院？"]
  },
  {
    id: "case_cold_mom",
    stage: "all",
    tags: [],
    display_tag: "",
    solution: "宝妈感冒（特别是哺乳期）：\n1. 【戴口罩】接触宝宝时务必戴口罩，洗手。\n2. 【继续哺乳】普通感冒可以继续喂奶，抗体还能传给宝宝。\n3. 【用药】如果发烧难受，可以用对乙酰氨基酚（泰诺），这是哺乳期安全的。\n4. 【休息】多喝水，多睡觉。",
    warning: "如果高烧不退或症状加重，请就医并告知医生自己在哺乳期。",
    fallback_suggestions: ["哺乳期发烧能吃药吗？", "发烧多少度要去医院？"]
  },

  // --- 睡眠相关 (Sleep) ---
  {
    id: "case_wake_ambiguous",
    stage: "all",
    tags: ["半夜老是醒", "睡不好", "失眠", "频繁醒", "夜醒"],
    display_tag: "😴 半夜老是醒",
    is_ambiguous: true,
    clarify_options: [
      { text: "👶 宝宝频繁夜醒", next_id: "case_sleep_reversal" },
      { text: "🤰 孕妈失眠/尿频", next_id: "case_pregnancy_insomnia" },
      { text: "👩 宝妈产后失眠", next_id: "case_mom_insomnia" }
    ],
    solution: "睡不好太折磨人了！请先告诉我是谁睡不好？",
    warning: ""
  },
  {
    id: "case_sleep_reversal",
    stage: "infant",
    tags: [], // Tags moved to ambiguous case
    display_tag: "",
    solution: "宝宝夜醒频繁（排除饿和尿）：\n1. 【白天】拉开窗帘，多消耗体力，每次小睡不超过2小时。\n2. 【睡前】建立固定程序（洗澡-抚触-关灯）。\n3. 【接觉】半夜醒了不要马上抱，先轻拍嘘声安抚，让他学会自己接觉。",
    warning: "",
    fallback_suggestions: ["怎么建立睡前仪式？", "夜醒要不要马上抱？"]
  },
  {
    id: "case_pregnancy_insomnia",
    stage: "pregnancy",
    tags: [],
    display_tag: "",
    solution: "孕期失眠多半是因为尿频或找不到舒服姿势：\n1. 【睡姿】使用孕妇枕支撑腰腹，左侧卧位最利于胎儿供血。\n2. 【限水】睡前2小时少喝水。\n3. 【助眠】睡前喝半杯热牛奶，听听白噪音。",
    warning: ""
  },
  {
    id: "case_mom_insomnia",
    stage: "all",
    tags: [],
    display_tag: "",
    solution: "宝妈产后失眠多因激素波动、夜奶打断、焦虑：\n1. 【睡眠优先】宝宝睡时尽量跟着睡，家务可暂时放一放。\n2. 【减少刺激】睡前少看手机，避免 caffeine。\n3. 【求助】让家人轮流带娃，保证自己连续睡眠4小时以上。\n4. 【就医】持续失眠影响生活，可咨询产科或心理科。",
    warning: ""
  }
];
