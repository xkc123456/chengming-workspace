export type Member = {
  id: number;
  name: string;
  major: string;
  skills: string[];
  hours: number;
  status: "active" | "away";
  note: string;
};

export type Idea = {
  id: number;
  title: string;
  target: string;
  value: number;
  feasibility: number;
  data: number;
  innovation: number;
  fit: number;
  selected: boolean;
  aiReview?: string;
};

export type Task = {
  id: number;
  title: string;
  stage: string;
  assigneeId: number | null;
  due: string;
  priority: "高" | "中" | "低";
  status: "todo" | "doing" | "done";
  deliverable: string;
};

export type Document = {
  id: number;
  kind: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Workspace = {
  projectName: string;
  projectBrief: string;
  stage: string;
  deadline: string;
  members: Member[];
  ideas: Idea[];
  tasks: Task[];
  documents: Document[];
};

export const initialWorkspace: Workspace = {
  projectName: "城市轻户外消费行为研究",
  projectBrief: "聚焦18—30岁城市青年，研究轻户外产品的使用场景、购买决策与品牌沟通机会。",
  stage: "调研设计",
  deadline: "2026-12-18",
  members: [
    { id: 1, name: "林溪", major: "市场营销", skills: ["商业写作", "问卷设计", "路演"], hours: 10, status: "active", note: "擅长把数据转成消费者洞察" },
    { id: 2, name: "周然", major: "统计学", skills: ["SPSS", "数据清洗", "可视化"], hours: 12, status: "active", note: "负责模型与检验，需提前锁定数据格式" },
    { id: 3, name: "陈一", major: "工商管理", skills: ["访谈", "行业研究", "PPT"], hours: 8, status: "active", note: "有本地商户访谈资源" },
    { id: 4, name: "许知", major: "广告学", skills: ["内容策划", "可视化", "路演"], hours: 6, status: "away", note: "本周课程集中，适合短时高专注任务" },
  ],
  ideas: [
    { id: 1, title: "城市青年轻户外消费决策与社群影响", target: "运动户外 / 新消费", value: 9, feasibility: 8, data: 8, innovation: 8, fit: 9, selected: true },
    { id: 2, title: "高校周边即时零售的隐性需求研究", target: "零售 / 本地生活", value: 7, feasibility: 9, data: 9, innovation: 6, fit: 8, selected: false },
    { id: 3, title: "国产香氛品牌的情绪价值与复购机制", target: "美妆个护 / 品牌", value: 8, feasibility: 7, data: 7, innovation: 8, fit: 7, selected: false },
  ],
  tasks: [
    { id: 1, title: "收敛研究问题与假设", stage: "选题", assigneeId: 1, due: "2026-11-03", priority: "高", status: "done", deliverable: "研究问题树 + 3条可检验假设" },
    { id: 2, title: "完成二手资料与竞品扫描", stage: "研究", assigneeId: 3, due: "2026-11-05", priority: "高", status: "doing", deliverable: "来源可追溯的行业简报" },
    { id: 3, title: "设计问卷并开展预测试", stage: "调研", assigneeId: 1, due: "2026-11-08", priority: "高", status: "doing", deliverable: "问卷V2 + 30份预测试记录" },
    { id: 4, title: "制定抽样与配额方案", stage: "调研", assigneeId: 2, due: "2026-11-07", priority: "高", status: "todo", deliverable: "样本结构、样本量依据、质控规则" },
    { id: 5, title: "深访6名典型消费者", stage: "调研", assigneeId: 3, due: "2026-11-10", priority: "中", status: "todo", deliverable: "匿名访谈纪要与编码框架" },
    { id: 6, title: "搭建数据清洗与分析脚本", stage: "分析", assigneeId: 2, due: "2026-11-14", priority: "中", status: "todo", deliverable: "可复现清洗日志 + SPSS操作记录" },
    { id: 7, title: "制作核心发现故事板", stage: "表达", assigneeId: 4, due: "2026-11-18", priority: "低", status: "todo", deliverable: "12页展示结构与3张关键图表" },
  ],
  documents: [],
};

export const stageLabels: Record<string, string> = {
  todo: "待开始",
  doing: "进行中",
  done: "已完成",
};
