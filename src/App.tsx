import { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router";
import { LayoutDashboard, Lightbulb, UsersRound, ListChecks, FlaskConical, Sparkles, Plus, ArrowUpRight, Download, Menu, X, Check, ChevronRight, FileText, BarChart3, Presentation, BookOpen, Send, Trash2, WandSparkles, CircleAlert, LogOut, Clock3, Target, Database, Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { initialWorkspace, stageLabels, type Idea, type Member, type Task, type Workspace } from "@contracts/workspace";

type View = "overview" | "ideas" | "team" | "tasks" | "studio" | "coach";
type AiMode = "direction" | "task" | "analysis" | "writing" | "pitch" | "coach";
const nav = [
  { id: "overview" as View, label: "项目总览", icon: LayoutDashboard },
  { id: "ideas" as View, label: "方向决策", icon: Lightbulb },
  { id: "team" as View, label: "成员与分工", icon: UsersRound },
  { id: "tasks" as View, label: "任务推进", icon: ListChecks },
  { id: "studio" as View, label: "研究工坊", icon: FlaskConical },
  { id: "coach" as View, label: "智能顾问", icon: Sparkles },
];
const stages = ["选题", "研究", "调研", "分析", "报告", "路演"];
const scoreOf = (idea: Idea) => Math.round((idea.value * .25 + idea.feasibility * .25 + idea.data * .2 + idea.innovation * .15 + idea.fit * .15) * 10);
const nextId = (items: { id: number }[]) => Math.max(0, ...items.map(i => i.id)) + 1;

export function App() { return <Routes><Route path="/login" element={<Login />} /><Route path="/" element={<Home />} /><Route path="*" element={<NotFound />} /></Routes>; }

function Home() {
  const { user, isLoading: authLoading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: LOGIN_PATH });
  const query = trpc.workspace.get.useQuery(undefined, { enabled: !!user, retry: 1 });
  const saveMutation = trpc.workspace.save.useMutation();
  const assist = trpc.workspace.assist.useMutation();
  const [data, setData] = useState<Workspace | null>(null);
  const [view, setView] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<"idea" | "member" | "task" | null>(null);
  const [toast, setToast] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [aiResult, setAiResult] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const hydrated = useRef(false);
  useEffect(() => { if (query.data && !hydrated.current) { setData(query.data); hydrated.current = true; } }, [query.data]);
  useEffect(() => {
    if (!data || !hydrated.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => saveMutation.mutate(data, { onSuccess: () => setSaveState("saved"), onError: () => setSaveState("error") }), 500);
    return () => window.clearTimeout(timer);
  }, [data]);
  useEffect(() => { document.title = "澄明 · 市场研究项目工作台"; document.documentElement.lang = "zh-CN"; }, []);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 3000); };
  const update = (patch: Partial<Workspace>) => setData(prev => prev ? { ...prev, ...patch } : prev);
  const go = (next: View) => { setView(next); setMobileNav(false); setAiResult(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const runAi = async (mode: AiMode, prompt: string, context = "") => {
    setAiResult("");
    try { const result = await assist.mutateAsync({ mode, prompt, context }); setAiResult(result.text); return result.text; }
    catch (error) { const message = error instanceof Error ? error.message : "服务暂时不可用，请稍后重试"; setAiResult(`暂时无法生成：${message}`); return ""; }
  };
  const saveDocument = (kind: string, title: string, content: string) => {
    if (!data || !content) return;
    update({ documents: [{ id: nextId(data.documents), kind, title, content, createdAt: new Date().toISOString() }, ...data.documents] }); notify("已保存到项目档案");
  };
  const exportProject = () => {
    if (!data) return;
    const md = `# ${data.projectName}\n\n${data.projectBrief}\n\n## 当前方向\n${data.ideas.filter(i => i.selected).map(i => `- ${i.title}（${i.target}，综合 ${scoreOf(i)} 分）`).join("\n")}\n\n## 任务清单\n${data.tasks.map(t => `- [${t.status === "done" ? "x" : " "}] ${t.title}｜${t.due}｜${t.deliverable}`).join("\n")}\n\n## 项目档案\n${data.documents.map(d => `### ${d.title}\n${d.content}`).join("\n\n")}`;
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${data.projectName}-项目档案.md`; a.click(); URL.revokeObjectURL(url); notify("项目档案已导出");
  };
  if (authLoading || query.isLoading || !data) return <Loading />;
  if (query.isError) return <div className="fatal"><CircleAlert /><h1>项目暂时无法读取</h1><p>请检查网络后重新加载，已保存的数据不会丢失。</p><button className="btn primary" onClick={() => query.refetch()}>重新加载</button></div>;
  const selectedIdea = data.ideas.find(i => i.selected);
  const activeMembers = data.members.filter(m => m.status === "active");
  const completed = data.tasks.filter(t => t.status === "done").length;
  const progress = data.tasks.length ? Math.round(completed / data.tasks.length * 100) : 0;
  return <div className="app-shell">
    {mobileNav && <button className="nav-scrim" aria-label="关闭导航" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark">澄</span><span><b>澄明</b><small>ClarSight</small></span><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="关闭导航"><X size={20} /></button></div>
      <div className="project-chip"><span>当前项目</span><b>{data.projectName}</b><small>{data.stage} · {activeMembers.length} 位成员</small></div>
      <nav>{nav.map(item => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => go(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === "tasks" && <em>{data.tasks.filter(t => t.status !== "done").length}</em>}<ChevronRight size={14} className="nav-arrow" /></button>)}</nav>
      <div className="sidebar-bottom"><div className="method-note"><BookOpen size={16} /><p>先验证问题，再投入执行。<br />每个结论都要回到证据。</p></div><div className="user-row"><span className="avatar">{user?.name?.slice(0, 1) || "研"}</span><span><b>{user?.name || "项目成员"}</b><small>云端工作区</small></span><button onClick={logout} aria-label="退出登录"><LogOut size={17} /></button></div></div>
    </aside>
    <main className="main-shell">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)} aria-label="打开导航"><Menu size={21} /></button><div className="workspace-title">澄明项目工作台</div><div className="top-actions"><span className={`save-state ${saveState}`}><i />{saveState === "saving" ? "正在保存" : saveState === "error" ? "保存失败" : "已同步"}</span><button className="btn ghost export-btn" onClick={exportProject}><Download size={16} />导出档案</button></div></header>
      <div className="content">
        {view === "overview" && <Overview data={data} selectedIdea={selectedIdea} progress={progress} go={go} onTask={setActiveTask} />}
        {view === "ideas" && <Ideas data={data} update={update} onAdd={() => setModal("idea")} runAi={runAi} aiResult={aiResult} aiLoading={assist.isPending} saveDocument={saveDocument} />}
        {view === "team" && <Team data={data} update={update} onAdd={() => setModal("member")} notify={notify} />}
        {view === "tasks" && <Tasks data={data} update={update} onAdd={() => setModal("task")} onAssist={task => { setActiveTask(task); runAi("task", `请帮我完成任务「${task.title}」。交付物：${task.deliverable}。当前阶段：${task.stage}。`, `${data.projectName}\n${data.projectBrief}`); }} activeTask={activeTask} aiResult={aiResult} aiLoading={assist.isPending} closeAssist={() => { setActiveTask(null); setAiResult(""); }} saveDocument={saveDocument} />}
        {view === "studio" && <Studio data={data} runAi={runAi} aiResult={aiResult} aiLoading={assist.isPending} setAiResult={setAiResult} saveDocument={saveDocument} />}
        {view === "coach" && <Coach data={data} runAi={runAi} aiResult={aiResult} aiLoading={assist.isPending} saveDocument={saveDocument} go={go} />}
      </div>
      <footer className="app-footer"><span>澄明 · 把调查做成证据，把证据变成行动</span><span>数据与文档已保存至云端工作区</span></footer>
    </main>
    {modal === "idea" && <IdeaForm data={data} close={() => setModal(null)} save={idea => { update({ ideas: [...data.ideas, idea] }); setModal(null); notify("新方向已加入比较"); }} />}
    {modal === "member" && <MemberForm data={data} close={() => setModal(null)} save={member => { update({ members: [...data.members, member] }); setModal(null); notify("成员信息已保存"); }} />}
    {modal === "task" && <TaskForm data={data} close={() => setModal(null)} save={task => { update({ tasks: [...data.tasks, task] }); setModal(null); notify("任务已创建"); }} />}
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
  </div>;
}

function Loading() { return <div className="loading"><span className="brand-mark">澄</span><div><b>正在整理项目工作区</b><i /></div></div>; }
function PageHead({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="page-head page-head-simple"><h1>{title}</h1>{action}</div>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><Search size={26} /><b>{title}</b><p>{text}</p></div>; }
function AiPanel({ text, loading, onSave }: { text: string; loading: boolean; onSave?: () => void }) { if (!text && !loading) return null; return <section className="ai-panel"><div className="ai-panel-head"><span><Sparkles size={16} />智能分析</span>{text && onSave && <button className="btn ghost" onClick={onSave}><Plus size={15} />存入档案</button>}</div>{loading ? <div className="thinking"><i /><i /><i /><span>正在梳理证据、约束与下一步</span></div> : <div className="ai-copy">{text.split("\n").map((line, i) => line ? <p key={i}>{line}</p> : <br key={i} />)}</div>}</section>; }

function Overview({ data, selectedIdea, progress, go, onTask }: { data: Workspace; selectedIdea?: Idea; progress: number; go: (v: View) => void; onTask: (t: Task) => void }) {
  const upcoming = [...data.tasks].filter(t => t.status !== "done").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  const active = data.members.filter(m => m.status === "active");
  const hours = active.reduce((s, m) => s + m.hours, 0);
  return <>
    <PageHead title="项目总览" action={<button className="btn primary" onClick={() => go("tasks")}><Plus size={17} />推进任务</button>} />
    <section className="project-hero"><div className="hero-main"><div className="hero-meta"><span>{data.stage}</span><span>截止 {data.deadline}</span></div><h2>{data.projectName}</h2><p>{data.projectBrief}</p><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><div className="hero-stats"><span><b>{progress}%</b>任务完成</span><span><b>{active.length}</b>在位成员</span><span><b>{hours}h</b>每周可用</span><span><b>{data.documents.length}</b>项目档案</span></div></div><div className="hero-direction"><Target size={22} /><span>当前主攻方向</span><b>{selectedIdea?.title || "尚未确定方向"}</b>{selectedIdea && <strong>{scoreOf(selectedIdea)}<small>/100</small></strong>}<button onClick={() => go("ideas")}>查看决策依据<ArrowUpRight size={15} /></button></div></section>
    <div className="overview-grid"><section className="panel span-2"><div className="panel-head"><div><p className="eyebrow">NEXT ACTIONS</p><h2>近期关键动作</h2></div><button className="text-link" onClick={() => go("tasks")}>全部任务<ArrowUpRight size={15} /></button></div>{upcoming.length ? <div className="action-list">{upcoming.map(task => <button key={task.id} className="action-row" onClick={() => onTask(task)}><span className={`priority ${task.priority}`}>{task.priority}</span><span><b>{task.title}</b><small>{task.deliverable}</small></span><time>{task.due.slice(5)}</time><span className={`status ${task.status}`}>{stageLabels[task.status]}</span></button>)}</div> : <Empty title="任务已全部完成" text="可以进入报告检查或答辩演练。" />}</section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">WORKFLOW</p><h2>研究流程</h2></div></div><div className="stage-flow">{stages.map((s, i) => <div key={s} className={data.stage.includes(s) ? "current" : i < stages.indexOf(data.stage) ? "past" : ""}><span>{i + 1}</span><b>{s}</b><small>{["锁定值得研究的问题", "建立证据与分析框架", "获取真实可靠的一手数据", "让统计结果回答问题", "形成结论与商业行动", "讲清价值并经受追问"][i]}</small></div>)}</div></section>
    <section className="panel quality-panel"><div className="panel-head"><div><p className="eyebrow">QUALITY GATE</p><h2>本轮质量闸门</h2></div></div><ul className="check-list"><li><Check size={16} />研究问题能被数据回答，而非只有话题热度</li><li><Check size={16} />样本来源、配额和剔除规则可以解释</li><li><Check size={16} />每个分析方法都有前提检验与稳健性说明</li><li><Check size={16} />每条建议都对应具体发现和行动主体</li></ul><button className="btn secondary full" onClick={() => go("studio")}>进入研究工坊<FlaskConical size={16} /></button></section></div>
  </>;
}

function Ideas({ data, update, onAdd, runAi, aiResult, aiLoading, saveDocument }: { data: Workspace; update: (p: Partial<Workspace>) => void; onAdd: () => void; runAi: (m: AiMode, p: string, c?: string) => Promise<string>; aiResult: string; aiLoading: boolean; saveDocument: (k: string, t: string, c: string) => void }) {
  const [activeId, setActiveId] = useState(data.ideas[0]?.id || 0);
  const active = data.ideas.find(i => i.id === activeId) || data.ideas[0];
  const patch = (key: keyof Idea, value: number) => update({ ideas: data.ideas.map(i => i.id === active?.id ? { ...i, [key]: value } : i) });
  const choose = (id: number) => update({ ideas: data.ideas.map(i => ({ ...i, selected: i.id === id })) });
  return <><PageHead title="方向决策" action={<button className="btn primary" onClick={onAdd}><Plus size={17} />新增方向</button>} />
    {active ? <div className="ideas-layout"><section className="idea-index">{[...data.ideas].sort((a, b) => scoreOf(b) - scoreOf(a)).map((idea, idx) => <button key={idea.id} className={idea.id === active.id ? "idea-row active" : "idea-row"} onClick={() => setActiveId(idea.id)}><span className="rank">0{idx + 1}</span><span><b>{idea.title}</b><small>{idea.target}</small></span>{idea.selected && <em>主攻</em>}<strong>{scoreOf(idea)}</strong></button>)}</section><section className="panel score-panel"><div className="score-title"><div><p className="eyebrow">SCORING CANVAS</p><h2>{active.title}</h2><p>{active.target}</p></div><div className="big-score">{scoreOf(active)}<small>综合分</small></div></div><div className="sliders">{([["value", "问题价值", "是否解决真实且重要的问题"], ["feasibility", "执行可行性", "时间、资源与触达对象是否可控"], ["data", "数据可得性", "能否获得足量且可信的一手数据"], ["innovation", "创新空间", "是否有新视角、新场景或新机制"], ["fit", "团队适配", "技能与资源能否支撑做出深度"]] as const).map(([key, label, hint]) => <label key={key}><span><b>{label}</b><small>{hint}</small></span><input type="range" min="1" max="10" value={active[key]} onChange={e => patch(key, Number(e.target.value))} /><strong>{active[key]}</strong></label>)}</div><div className="score-actions"><button className="btn secondary" disabled={aiLoading} onClick={() => runAi("direction", `评估这个方向：${active.title}，领域：${active.target}。当前评分：价值${active.value}、可行性${active.feasibility}、数据${active.data}、创新${active.innovation}、适配${active.fit}。请给出是否值得投入、最优研究问题、数据获取方案、最大风险。`, `${data.projectBrief}\n成员技能：${data.members.map(m => `${m.name}:${m.skills.join("/")}`).join("；")}`)}><WandSparkles size={16} />深度评估</button><button className="btn primary" onClick={() => choose(active.id)}><Target size={16} />{active.selected ? "当前主攻方向" : "定为主攻方向"}</button></div></section></div> : <Empty title="还没有候选方向" text="新增一个方向，开始建立可比较的决策依据。" />}
    <AiPanel text={aiResult} loading={aiLoading} onSave={() => active && saveDocument("选题评估", active.title, aiResult)} />
    <section className="decision-guide"><span>决策提示</span><p>综合分只用于收敛讨论，不替代事实验证。优先做一次小样本触达测试：能否找到受访者、能否问出差异、能否形成行动建议。</p></section>
  </>;
}

function Team({ data, update, onAdd, notify }: { data: Workspace; update: (p: Partial<Workspace>) => void; onAdd: () => void; notify: (s: string) => void }) {
  const active = data.members.filter(m => m.status === "active");
  const autoAssign = () => {
    const workload = new Map(active.map(m => [m.id, data.tasks.filter(t => t.assigneeId === m.id && t.status !== "done").reduce((s, t) => s + (t.priority === "高" ? 3 : t.priority === "中" ? 2 : 1), 0)]));
    const tasks = data.tasks.map(task => {
      if (task.status === "done") return task;
      const keywords = `${task.title}${task.deliverable}${task.stage}`;
      const candidates = active.map(m => {
        const skill = m.skills.some(s => keywords.toLowerCase().includes(s.toLowerCase()) || (s === "SPSS" && /数据|分析|清洗/.test(keywords)) || (s === "PPT" && /展示|故事板|路演/.test(keywords)) || (s === "商业写作" && /报告|结论|建议|问题/.test(keywords)) || (s === "访谈" && /访谈|调研|问卷/.test(keywords))) ? 5 : 0;
        return { id: m.id, score: skill + m.hours / 4 - (workload.get(m.id) || 0) };
      }).sort((a, b) => b.score - a.score);
      if (candidates[0]) workload.set(candidates[0].id, (workload.get(candidates[0].id) || 0) + 1);
      return { ...task, assigneeId: candidates[0]?.id ?? null };
    });
    update({ tasks }); notify("已按技能、可用时间与当前负载重新分配");
  };
  const workloadFor = (id: number) => data.tasks.filter(t => t.assigneeId === id && t.status !== "done");
  return <><PageHead title="成员与分工" action={<div className="head-actions"><button className="btn secondary" onClick={autoAssign}><WandSparkles size={16} />智能平衡分工</button><button className="btn primary" onClick={onAdd}><Plus size={17} />添加成员</button></div>} />
    <div className="team-summary"><span><b>{active.length}</b>在位成员</span><span><b>{active.reduce((s, m) => s + m.hours, 0)}h</b>每周总容量</span><span><b>{data.tasks.filter(t => !t.assigneeId && t.status !== "done").length}</b>未分配任务</span><p>容量用于安排节奏，不用于评价个人。</p></div>
    <div className="member-grid">{data.members.map(member => { const tasks = workloadFor(member.id); const load = Math.min(100, Math.round(tasks.length * 22)); return <article className={`member-card ${member.status}`} key={member.id}><div className="member-top"><span className="avatar">{member.name.slice(0, 1)}</span><div><h2>{member.name}</h2><p>{member.major}</p></div><button className={`status-toggle ${member.status}`} onClick={() => update({ members: data.members.map(m => m.id === member.id ? { ...m, status: m.status === "active" ? "away" : "active" } : m) })}>{member.status === "active" ? "在位" : "暂离"}</button></div><div className="skill-list">{member.skills.map(s => <span key={s}>{s}</span>)}</div><p className="member-note">{member.note || "可补充擅长场景与协作偏好"}</p><div className="capacity"><span>本周可用 <b>{member.hours} 小时</b></span><span>{tasks.length} 项未完成任务</span><div><i style={{ width: `${load}%` }} /></div></div><div className="member-footer"><label>每周小时<input type="number" min="0" max="40" value={member.hours} onChange={e => update({ members: data.members.map(m => m.id === member.id ? { ...m, hours: Number(e.target.value) } : m) })} /></label><button className="icon-btn danger" aria-label={`移除${member.name}`} onClick={() => { if (confirm(`移除${member.name}？其任务会转为未分配。`)) update({ members: data.members.filter(m => m.id !== member.id), tasks: data.tasks.map(t => t.assigneeId === member.id ? { ...t, assigneeId: null } : t) }); }}><Trash2 size={16} /></button></div></article>; })}</div>
  </>;
}

function Tasks({ data, update, onAdd, onAssist, activeTask, aiResult, aiLoading, closeAssist, saveDocument }: { data: Workspace; update: (p: Partial<Workspace>) => void; onAdd: () => void; onAssist: (t: Task) => void; activeTask: Task | null; aiResult: string; aiLoading: boolean; closeAssist: () => void; saveDocument: (k: string, t: string, c: string) => void }) {
  const [filter, setFilter] = useState("全部");
  const tasks = data.tasks.filter(t => filter === "全部" || t.stage === filter);
  return <><PageHead title="任务推进" action={<button className="btn primary" onClick={onAdd}><Plus size={17} />新建任务</button>} />
    <div className="filter-tabs">{["全部", ...stages].map(s => <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}<span>{s === "全部" ? data.tasks.length : data.tasks.filter(t => t.stage === s).length}</span></button>)}</div>
    <div className="task-board">{(["todo", "doing", "done"] as const).map(status => <section className="task-column" key={status}><header><span className={`status-dot ${status}`} /><h2>{stageLabels[status]}</h2><em>{tasks.filter(t => t.status === status).length}</em></header>{tasks.filter(t => t.status === status).map(task => <article className="task-card" key={task.id}><div className="task-meta"><span>{task.stage}</span><span className={`priority ${task.priority}`}>{task.priority}优先</span></div><h3>{task.title}</h3><p>{task.deliverable}</p><div className="task-due"><Clock3 size={14} />{task.due}</div><label className="assignee"><span className="avatar">{data.members.find(m => m.id === task.assigneeId)?.name.slice(0, 1) || "?"}</span><select value={task.assigneeId ?? ""} onChange={e => update({ tasks: data.tasks.map(t => t.id === task.id ? { ...t, assigneeId: e.target.value ? Number(e.target.value) : null } : t) })}><option value="">未分配</option>{data.members.filter(m => m.status === "active").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><div className="task-actions"><button onClick={() => onAssist(task)}><Sparkles size={14} />执行支持</button><select aria-label="更新任务状态" value={task.status} onChange={e => update({ tasks: data.tasks.map(t => t.id === task.id ? { ...t, status: e.target.value as Task["status"] } : t) })}><option value="todo">待开始</option><option value="doing">进行中</option><option value="done">已完成</option></select></div></article>)}{!tasks.some(t => t.status === status) && <div className="column-empty">暂无任务</div>}</section>)}</div>
    {activeTask && <section className="task-assist"><div className="panel-head"><div><p className="eyebrow">TASK COPILOT</p><h2>{activeTask.title}</h2><p>目标交付：{activeTask.deliverable}</p></div><button className="icon-btn" onClick={closeAssist}><X size={19} /></button></div><AiPanel text={aiResult} loading={aiLoading} onSave={() => saveDocument("任务方案", activeTask.title, aiResult)} /></section>}
  </>;
}

type CsvStats = { headers: string[]; rows: string[][]; numeric: { name: string; mean: string; min: string; max: string; missing: number }[] };
function Studio({ data, runAi, aiResult, aiLoading, setAiResult, saveDocument }: { data: Workspace; runAi: (m: AiMode, p: string, c?: string) => Promise<string>; aiResult: string; aiLoading: boolean; setAiResult: (s: string) => void; saveDocument: (k: string, t: string, c: string) => void }) {
  const [tab, setTab] = useState<"analysis" | "writing" | "pitch">("analysis");
  const [prompt, setPrompt] = useState("请根据这份数据摘要，建议后续分析顺序，并给出SPSS操作路径。重点解释哪些结论现在还不能下。");
  const [kind, setKind] = useState("报告核心章节");
  const [stats, setStats] = useState<CsvStats | null>(null);
  const [fileName, setFileName] = useState("");
  const switchTab = (next: typeof tab) => { setTab(next); setAiResult(""); setPrompt(next === "analysis" ? "请根据这份数据摘要，建议后续分析顺序，并给出SPSS操作路径。重点解释哪些结论现在还不能下。" : next === "writing" ? "围绕当前研究方向，写出报告的研究设计章节，包含研究问题、定性探索、定量验证和混合证据如何互相印证。" : "为当前项目设计12页展示故事板。每页给出标题、核心信息、建议图表和一句讲解词，并附8个高概率追问。"); };
  const parseCsv = async (file: File) => {
    const text = await file.text(); const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim()).slice(0, 1001);
    const parseLine = (line: string) => { const out: string[] = []; let cell = "", quote = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (quote && line[i + 1] === '"') { cell += '"'; i++; } else quote = !quote; } else if (ch === "," && !quote) { out.push(cell.trim()); cell = ""; } else cell += ch; } out.push(cell.trim()); return out; };
    if (lines.length < 2) return;
    const headers = parseLine(lines[0]); const rows = lines.slice(1).map(parseLine);
    const numeric = headers.map((name, idx) => { const values = rows.map(r => Number(r[idx])).filter(Number.isFinite); return values.length >= Math.max(2, rows.length * .5) ? { name, mean: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2), min: Math.min(...values).toFixed(2), max: Math.max(...values).toFixed(2), missing: rows.length - values.length } : null }).filter(Boolean) as CsvStats["numeric"];
    setStats({ headers, rows: rows.slice(0, 5), numeric }); setFileName(file.name);
  };
  const dataSummary = stats ? `文件${fileName}，读取样本${stats.rows.length > 5 ? "超过5行（预览仅显示前5行）" : stats.rows.length}。字段：${stats.headers.join("、")}。数值字段摘要：${stats.numeric.map(n => `${n.name} 均值${n.mean} 最小${n.min} 最大${n.max} 非数值/缺失${n.missing}`).join("；")}` : "尚未上传数据，请基于研究目标给出分析计划。";
  const submit = () => runAi(tab === "analysis" ? "analysis" : tab === "writing" ? "writing" : "pitch", prompt, `${data.projectName}\n${data.projectBrief}\n${tab === "analysis" ? dataSummary : `内容类型：${kind}`}`);
  const docKind = tab === "analysis" ? "分析方案" : tab === "writing" ? kind : "路演故事板";
  return <><PageHead title="研究工坊" />
    <div className="studio-tabs"><button className={tab === "analysis" ? "active" : ""} onClick={() => switchTab("analysis")}><BarChart3 size={18} /><span>数据分析<small>摘要诊断 · SPSS路径</small></span></button><button className={tab === "writing" ? "active" : ""} onClick={() => switchTab("writing")}><FileText size={18} /><span>商业写作<small>报告 · 洞察 · 策略</small></span></button><button className={tab === "pitch" ? "active" : ""} onClick={() => switchTab("pitch")}><Presentation size={18} /><span>展示答辩<small>故事板 · 追问演练</small></span></button></div>
    <div className="studio-layout"><section className="panel studio-input"><div className="panel-head"><div><p className="eyebrow">INPUT / CONTEXT</p><h2>{tab === "analysis" ? "数据与研究目标" : tab === "writing" ? "写作任务" : "展示任务"}</h2></div></div>
      {tab === "analysis" && <div className="csv-box"><label><Database size={22} /><b>{fileName || "上传 CSV 数据"}</b><span>{fileName ? "已读取字段与数值摘要，原始文件不会上传" : "仅在本机读取前1000行，用于生成统计摘要"}</span><input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && parseCsv(e.target.files[0])} /></label>{stats && <div className="stats-preview"><b>{stats.headers.length} 个字段 · {stats.numeric.length} 个数值字段</b><div>{stats.numeric.slice(0, 6).map(n => <span key={n.name}><b>{n.name}</b><small>均值 {n.mean}｜范围 {n.min}—{n.max}</small></span>)}</div></div>}</div>}
      {tab === "writing" && <label className="field"><span>内容类型</span><select value={kind} onChange={e => setKind(e.target.value)}>{["报告核心章节", "消费者洞察", "市场营销策略", "问卷与访谈提纲", "摘要与结论", "AI使用说明草稿"].map(k => <option key={k}>{k}</option>)}</select></label>}
      <label className="field"><span>{tab === "analysis" ? "希望解决的问题" : "具体需求与素材"}</span><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={8} /></label><button className="btn primary full" disabled={aiLoading || prompt.trim().length < 2} onClick={submit}><Sparkles size={17} />{aiLoading ? "正在生成" : "开始生成"}</button><p className="privacy-note">生成内容需要结合真实材料复核；统计结果与引用不会被自动补造。</p>
    </section><section className="studio-output"><AiPanel text={aiResult} loading={aiLoading} onSave={() => saveDocument(docKind, `${data.projectName} · ${docKind}`, aiResult)} />{!aiResult && !aiLoading && <div className="output-placeholder"><FlaskConical size={32} /><h2>在这里得到可执行的成果</h2><p>{tab === "analysis" ? "输出分析顺序、方法前提、SPSS菜单路径与结果解读模板。" : tab === "writing" ? "输出有论证结构的正文、洞察或策略，而非泛泛的概念堆砌。" : "输出逐页故事线、视觉建议和评委追问准备。"}</p></div>}</section></div>
  </>;
}

function Coach({ data, runAi, aiResult, aiLoading, saveDocument, go }: { data: Workspace; runAi: (m: AiMode, p: string, c?: string) => Promise<string>; aiResult: string; aiLoading: boolean; saveDocument: (k: string, t: string, c: string) => void; go: (v: View) => void }) {
  const [prompt, setPrompt] = useState("");
  const context = `${data.projectName}\n${data.projectBrief}\n当前阶段：${data.stage}\n当前方向：${data.ideas.find(i => i.selected)?.title}\n任务：${data.tasks.map(t => `${t.title}/${t.status}`).join("；")}`;
  const ask = (text: string) => { setPrompt(text); runAi("coach", text, context); };
  const quick = ["帮我检查当前研究设计是否闭环，指出最薄弱的三个环节", "我们的问卷应该如何做预测试和信效度检验？给出具体步骤", "把当前方向拆成研究问题、假设、变量和分析方法对应表", "模拟评委连续追问样本代表性与结论外推边界"];
  return <><PageHead title="智能顾问" />
    <div className="coach-layout"><section className="coach-main"><div className="quick-prompts">{quick.map(q => <button key={q} onClick={() => ask(q)}>{q}<ArrowUpRight size={15} /></button>)}</div><div className="ask-box"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="例如：我们想做购买意愿的影响因素分析，应该选回归、结构方程还是聚类？请按研究问题给建议。" rows={5} /><div><span>回答将结合当前项目背景</span><button className="btn primary" disabled={aiLoading || prompt.trim().length < 2} onClick={() => runAi("coach", prompt, context)}><Send size={16} />{aiLoading ? "思考中" : "发送问题"}</button></div></div><AiPanel text={aiResult} loading={aiLoading} onSave={() => saveDocument("顾问记录", prompt.slice(0, 60), aiResult)} /></section>
    <aside className="document-panel"><div className="panel-head"><div><p className="eyebrow">PROJECT FILES</p><h2>项目档案</h2></div><span>{data.documents.length}</span></div>{data.documents.length ? <div className="document-list">{data.documents.map(doc => <details key={doc.id}><summary><FileText size={16} /><span><b>{doc.title}</b><small>{doc.kind} · {new Date(doc.createdAt).toLocaleDateString("zh-CN")}</small></span></summary><div>{doc.content}</div></details>)}</div> : <div className="doc-empty"><FileText size={26} /><p>保存的选题评估、分析方案、写作与答辩材料会出现在这里。</p></div>}<button className="btn secondary full" onClick={() => go("studio")}>创建新内容<Plus size={16} /></button></aside></div>
  </>;
}

function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { const el = ref.current!; el.showModal(); return () => el.close(); }, []); return <dialog ref={ref} className="modal" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={close} aria-label="关闭"><X size={20} /></button></div>{children}</dialog>; }
function IdeaForm({ data, close, save }: { data: Workspace; close: () => void; save: (i: Idea) => void }) { const [title, setTitle] = useState(""); const [target, setTarget] = useState(""); return <Modal title="新增候选方向" close={close}><form onSubmit={e => { e.preventDefault(); save({ id: nextId(data.ideas), title, target, value: 7, feasibility: 7, data: 7, innovation: 7, fit: 7, selected: false }); }}><label className="field"><span>方向名称</span><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：校园咖啡订阅需求与价格敏感度" /></label><label className="field"><span>企业或行业领域</span><input required value={target} onChange={e => setTarget(e.target.value)} placeholder="例如：餐饮 / 本地生活" /></label><button className="btn primary full" type="submit">加入比较</button></form></Modal>; }
function MemberForm({ data, close, save }: { data: Workspace; close: () => void; save: (m: Member) => void }) { const [name, setName] = useState(""); const [major, setMajor] = useState(""); const [skills, setSkills] = useState(""); const [hours, setHours] = useState(8); const [note, setNote] = useState(""); return <Modal title="添加项目成员" close={close}><form onSubmit={e => { e.preventDefault(); save({ id: nextId(data.members), name, major, skills: skills.split(/[、,，]/).map(s => s.trim()).filter(Boolean), hours, status: "active", note }); }}><div className="form-grid"><label className="field"><span>姓名</span><input required value={name} onChange={e => setName(e.target.value)} /></label><label className="field"><span>专业</span><input required value={major} onChange={e => setMajor(e.target.value)} /></label></div><label className="field"><span>技能（用顿号分隔）</span><input required value={skills} onChange={e => setSkills(e.target.value)} placeholder="SPSS、问卷设计、PPT" /></label><label className="field"><span>每周可用小时</span><input type="number" min="0" max="40" value={hours} onChange={e => setHours(Number(e.target.value))} /></label><label className="field"><span>资源与协作备注</span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="例如：能触达本地商户，适合访谈与执行协调" /></label><button className="btn primary full" type="submit">保存成员</button></form></Modal>; }
function TaskForm({ data, close, save }: { data: Workspace; close: () => void; save: (t: Task) => void }) { const [title, setTitle] = useState(""); const [stage, setStage] = useState("研究"); const [assigneeId, setAssigneeId] = useState(""); const [due, setDue] = useState(data.deadline); const [priority, setPriority] = useState<Task["priority"]>("中"); const [deliverable, setDeliverable] = useState(""); return <Modal title="新建任务" close={close}><form onSubmit={e => { e.preventDefault(); save({ id: nextId(data.tasks), title, stage, assigneeId: assigneeId ? Number(assigneeId) : null, due, priority, status: "todo", deliverable }); }}><label className="field"><span>任务名称</span><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：完成预测试信效度检验" /></label><div className="form-grid"><label className="field"><span>研究阶段</span><select value={stage} onChange={e => setStage(e.target.value)}>{stages.map(s => <option key={s}>{s}</option>)}</select></label><label className="field"><span>优先级</span><select value={priority} onChange={e => setPriority(e.target.value as Task["priority"])}><option>高</option><option>中</option><option>低</option></select></label></div><div className="form-grid"><label className="field"><span>负责人</span><select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}><option value="">暂不分配</option>{data.members.filter(m => m.status === "active").map(m => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label><label className="field"><span>截止日期</span><input type="date" required value={due} onChange={e => setDue(e.target.value)} /></label></div><label className="field"><span>验收交付物</span><textarea required value={deliverable} onChange={e => setDeliverable(e.target.value)} placeholder="写清楚完成后要提交什么，以及应包含哪些内容" /></label><button className="btn primary full" type="submit">创建任务</button></form></Modal>; }
