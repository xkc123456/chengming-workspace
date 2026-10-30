import { words as w, relativeDay, type Store, type Stage } from "./model";
export function sampleStore(base = new Date()): Store {
  const iso = (offset: number, hour = "09:00") => new Date(relativeDay(offset, base) + "T" + hour + ":00").toISOString();
  const jobs: Store["jobs"] = [
    { id: "product", title: w("高级产品设计师", "Senior Product Designer"), department: w("设计", "Design"), location: w("上海 · 混合办公", "Shanghai · Hybrid"), type: "fulltime", status: "open", slots: 2, salary: "¥30–45k / 月", description: w("负责协作产品的核心体验，从用户研究、原型到设计系统，与产品和工程共同交付。", "Own core collaboration experiences from research and prototypes to the design system, alongside product and engineering."), skills: ["Figma", "Design systems", "Prototyping"], owner: w("林予", "Lin Yu"), created: iso(-16) },
    { id: "engineer", title: w("全栈工程师", "Full-stack Engineer"), department: w("研发", "Engineering"), location: w("北京 · 远程友好", "Beijing · Remote-friendly"), type: "fulltime", status: "open", slots: 3, salary: "¥35–55k / 月", description: w("构建可靠的团队协作工具，负责 React 界面、Node.js 服务和数据模型。", "Build reliable team tools across React interfaces, Node.js services and data models."), skills: ["React", "TypeScript", "Node.js"], owner: w("周可", "Zhou Ke"), created: iso(-22) },
    { id: "pm", title: w("产品经理", "Product Manager"), department: w("产品", "Product"), location: w("上海 · 办公室", "Shanghai · On-site"), type: "fulltime", status: "open", slots: 1, salary: "¥30–45k / 月", description: w("理解小团队的真实工作方式，以用户反馈定义产品路线和可验证的目标。", "Understand how small teams work and translate customer feedback into clear product goals."), skills: ["Discovery", "Analytics", "Roadmap"], owner: w("陈禾", "Chen He"), created: iso(-10) },
    { id: "marketing", title: w("内容营销经理", "Content Marketing Manager"), department: w("市场", "Marketing"), location: w("杭州 · 混合办公", "Hangzhou · Hybrid"), type: "fulltime", status: "open", slots: 1, salary: "¥20–30k / 月", description: w("用清晰、准确的内容讲述产品，负责编辑计划与客户故事。", "Tell useful product stories through a thoughtful editorial program and customer interviews."), skills: ["Writing", "Content strategy"], owner: w("林予", "Lin Yu"), created: iso(-8) },
    { id: "data", title: w("数据分析师", "Data Analyst"), department: w("研发", "Engineering"), location: w("北京 · 混合办公", "Beijing · Hybrid"), type: "fulltime", status: "open", slots: 1, salary: "¥25–40k / 月", description: w("建立可信指标，帮助团队通过分析做出更好的产品决策。", "Build trustworthy metrics and help teams make informed product decisions."), skills: ["SQL", "Python", "Experimentation"], owner: w("周可", "Zhou Ke"), created: iso(-5) },
    { id: "brand", title: w("品牌设计师", "Brand Designer"), department: w("设计", "Design"), location: w("远程", "Remote"), type: "contract", status: "paused", slots: 1, salary: "¥20–30k / 月", description: w("设计一致的品牌语言与数字传播物料。", "Create a consistent brand language across digital touchpoints."), skills: ["Typography", "Branding"], owner: w("林予", "Lin Yu"), created: iso(-28) },
  ];
  const people: [string, string, string, Stage, string, string, number][] = [
    ["许知夏", "Zoe Xu", "product", "interview", "交互设计师 · Linear Studio", "Interaction Designer · Linear Studio", -3],
    ["陈亦辰", "Ethan Chen", "engineer", "screening", "前端工程师 · Northstar", "Frontend Engineer · Northstar", -1],
    ["林沐", "Mia Lin", "product", "offer", "产品设计师 · Mono", "Product Designer · Mono", -12],
    ["周予安", "Adrian Zhou", "pm", "interview", "产品经理 · Common", "Product Manager · Common", -5],
    ["沈言", "Alex Shen", "engineer", "applied", "全栈工程师 · 独立开发", "Full-stack Engineer · Independent", 0],
    ["宋宁", "Nina Song", "marketing", "applied", "内容策划 · Paper Studio", "Content Strategist · Paper Studio", 0],
    ["顾远", "Ryan Gu", "data", "screening", "数据分析师 · Loop", "Data Analyst · Loop", -2],
    ["赵可", "Chloe Zhao", "product", "applied", "体验设计师 · Form", "Experience Designer · Form", -1],
    ["江岚", "Lena Jiang", "engineer", "interview", "软件工程师 · Orbit", "Software Engineer · Orbit", -6],
    ["陆川", "Lucas Lu", "pm", "screening", "产品负责人 · Smallteam", "Product Lead · Smallteam", -4],
    ["何清", "Clara He", "marketing", "interview", "内容编辑 · Field Notes", "Editor · Field Notes", -8],
    ["唐雨", "Iris Tang", "engineer", "offer", "全栈工程师 · Arc", "Full-stack Engineer · Arc", -17],
    ["吴亦", "Owen Wu", "data", "applied", "分析师 · Metric", "Analyst · Metric", -1],
    ["方圆", "Avery Fang", "product", "screening", "界面设计师 · Scale", "UI Designer · Scale", -4],
    ["程望", "Noah Cheng", "engineer", "applied", "工程师 · Inhouse", "Engineer · Inhouse", -2],
    ["叶舟", "Leo Ye", "pm", "hired", "产品经理 · Together", "Product Manager · Together", -24],
    ["夏禾", "Harper Xia", "marketing", "archived", "编辑 · Offprint", "Editor · Offprint", -19],
    ["许然", "Robin Xu", "data", "interview", "分析师 · North", "Analyst · North", -9],
  ];
  const candidates = people.map(([cn, en, jobId, stage, role, roleEn, days], n) => ({
    id: "c" + (n + 1), name: w(cn, en), email: en.toLowerCase().replace(" ", ".") + "@example.com", jobId, stage,
    role: w(role, roleEn), location: jobs.find((j) => j.id === jobId)!.location,
    source: (["referral", "careers", "sourced"] as const)[n % 3], skills: jobs.find((j) => j.id === jobId)!.skills,
    summary: w("虚构候选人资料。关注端到端交付与跨职能协作，项目经历和专业能力需要在面试中结合具体证据评估。", "Fictional profile. Interested in end-to-end delivery and cross-functional collaboration. Validate experience and role-related skills with evidence during interviews."),
    created: iso(days), notes: n === 0 ? [{ id: "n1", text: "作品集已收到，下一轮重点讨论设计系统的维护方式。 / Portfolio received; discuss design-system maintenance next.", at: iso(-1) }] : [],
    history: [{ stage, at: iso(days) }],
  }));
  return {
    version: 1, company: "STUDIO NORTH", jobs, candidates,
    interviews: [
      { id: "i1", candidateId: "c1", at: iso(0, "10:30"), duration: 45, interviewer: "林予 / Lin Yu", kind: "video", topic: w("作品集深聊", "Portfolio conversation") },
      { id: "i2", candidateId: "c4", at: iso(0, "14:00"), duration: 60, interviewer: "陈禾 / Chen He", kind: "onsite", topic: w("产品案例讨论", "Product case discussion") },
      { id: "i3", candidateId: "c9", at: iso(0, "16:00"), duration: 60, interviewer: "周可 / Zhou Ke", kind: "video", topic: w("系统设计面试", "System design interview") },
      { id: "i4", candidateId: "c18", at: iso(1, "11:00"), duration: 45, interviewer: "周可 / Zhou Ke", kind: "video", topic: w("数据分析实践", "Analytics discussion") },
    ],
    offers: [
      { id: "o1", candidateId: "c3", salary: 420000, currency: "CNY", start: relativeDay(21, base), status: "review", created: iso(-1) },
      { id: "o2", candidateId: "c12", salary: 540000, currency: "CNY", start: relativeDay(30, base), status: "draft", created: iso(0) },
    ],
  };
}
