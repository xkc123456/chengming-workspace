export type Locale = "cn" | "en";
export type Words = { cn: string; en: string };
export const stages = ["applied", "screening", "interview", "offer", "hired", "archived"] as const;
export type Stage = (typeof stages)[number];
export type Job = {
  id: string; title: Words; department: Words; location: Words;
  type: "fulltime" | "contract"; status: "open" | "paused"; slots: number;
  salary: string; description: Words; skills: string[]; owner: Words; created: string;
};
export type Note = { id: string; text: string; at: string };
export type Candidate = {
  id: string; name: Words; email: string; jobId: string; stage: Stage; role: Words;
  location: Words; source: "referral" | "careers" | "sourced"; skills: string[];
  summary: Words; created: string; notes: Note[]; history: { stage: Stage; at: string }[];
};
export type Interview = {
  id: string; candidateId: string; at: string; duration: number; interviewer: string;
  kind: "video" | "onsite"; topic: Words;
};
export type Offer = {
  id: string; candidateId: string; salary: number; currency: "CNY" | "USD";
  start: string; status: "draft" | "review" | "approved"; created: string;
};
export type Store = { version: 1; company: string; jobs: Job[]; candidates: Candidate[]; interviews: Interview[]; offers: Offer[] };
export const stageLabels: Record<Stage, Words> = {
  applied: { cn: "新申请", en: "Applied" }, screening: { cn: "初步沟通", en: "Screening" },
  interview: { cn: "面试中", en: "Interview" }, offer: { cn: "Offer", en: "Offer" },
  hired: { cn: "已入职", en: "Hired" }, archived: { cn: "已归档", en: "Archived" },
};
export const localKey = "people-desk:v1";
export const words = (cn: string, en = cn): Words => ({ cn, en });
export function departmentWords(store: Store, input: string): Words {
  const normalized = input.trim().toLocaleLowerCase();
  return store.jobs.find((j) => Object.values(j.department).some((label) => label.toLocaleLowerCase() === normalized))?.department ?? words(input.trim());
}
export const uid = (): string => crypto.randomUUID();
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function relativeDay(offset: number, base = new Date()) {
  const d = new Date(base); d.setDate(d.getDate() + offset); return dateKey(d);
}
export function findCandidates(store: Store, query = "", job = "all", stage = "all") {
  const q = query.trim().toLocaleLowerCase();
  return store.candidates.filter((c) => (job === "all" || c.jobId === job) && (stage === "all" || c.stage === stage) && (!q || [c.name.cn, c.name.en, c.email, ...c.skills].some((s) => s.toLocaleLowerCase().includes(q))));
}
export function changeStage(store: Store, id: string, stage: Stage, at = new Date().toISOString()): Store {
  if (!stages.includes(stage)) throw new Error("stage");
  const c = store.candidates.find((c) => c.id === id);
  if (!c) throw new Error("missing");
  if (c.stage === stage) return store;
  return { ...store, candidates: store.candidates.map((c) => c.id === id ? { ...c, stage, history: [{ stage, at }, ...c.history] } : c) };
}
export function addCandidate(store: Store, input: { name: string; email: string; jobId: string; role: string; source: Candidate["source"] }, id = uid(), at = new Date().toISOString()): Store {
  const name = input.name.trim(), email = input.email.trim().toLowerCase();
  if (!name || name.length > 80) throw new Error("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("email");
  if (!store.jobs.some((j) => j.id === input.jobId && j.status === "open")) throw new Error("job");
  if (store.candidates.some((c) => c.email.toLowerCase() === email && c.jobId === input.jobId)) throw new Error("duplicate");
  const candidate: Candidate = {
    id, name: words(name), email, jobId: input.jobId, role: words(input.role.trim() || "—"), stage: "applied",
    location: words("待补充", "Not specified"), source: input.source, skills: [],
    summary: words("尚未添加背景说明。可在沟通后补充评审记录。", "No background provided. Add a review note after your conversation."),
    created: at, notes: [], history: [{ stage: "applied", at }],
  };
  return { ...store, candidates: [candidate, ...store.candidates] };
}
export function scheduleInterview(store: Store, input: Omit<Interview, "id">, id = uid()): Store {
  const c = store.candidates.find((c) => c.id === input.candidateId);
  if (!c || ["archived", "hired"].includes(c.stage)) throw new Error("candidate");
  const start = Date.parse(input.at), end = start + input.duration * 60000;
  if (!Number.isFinite(start) || input.duration < 15 || input.duration > 180 || !input.interviewer.trim()) throw new Error("schedule");
  if (store.interviews.some((i) => (i.interviewer === input.interviewer || i.candidateId === input.candidateId) && Date.parse(i.at) < end && Date.parse(i.at) + i.duration * 60000 > start)) throw new Error("conflict");
  return { ...store, interviews: [...store.interviews, { ...input, id, at: new Date(start).toISOString() }] };
}
export function addOffer(store: Store, input: Pick<Offer, "candidateId" | "salary" | "currency" | "start">, id = uid()): Store {
  if (!store.candidates.some((c) => c.id === input.candidateId && ["interview", "offer"].includes(c.stage))) throw new Error("offerStage");
  if (store.offers.some((o) => o.candidateId === input.candidateId)) throw new Error("offerDuplicate");
  if (!Number.isFinite(input.salary) || input.salary <= 0 || input.salary > 1e8) throw new Error("salary");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start) || !Number.isFinite(Date.parse(input.start)) || new Date(input.start).toISOString().slice(0, 10) !== input.start) throw new Error("date");
  return { ...store, offers: [{ ...input, id, status: "draft", created: new Date().toISOString() }, ...store.offers] };
}
export function offerNext(store: Store, id: string): Store {
  return { ...store, offers: store.offers.map((o) => o.id === id ? { ...o, status: o.status === "draft" ? "review" : o.status === "review" ? "approved" : o.status } : o) };
}
export function addNote(store: Store, id: string, text: string, at = new Date().toISOString()): Store {
  if (!text.trim() || text.length > 2000) throw new Error("note");
  if (!store.candidates.some((c) => c.id === id)) throw new Error("missing");
  return { ...store, candidates: store.candidates.map((c) => c.id === id ? { ...c, notes: [{ id: uid(), text: text.trim(), at }, ...c.notes] } : c) };
}
export function metrics(s: Store) {
  return {
    jobs: s.jobs.filter((j) => j.status === "open").length,
    active: s.candidates.filter((c) => !["hired", "archived"].includes(c.stage)).length,
    interview: s.candidates.filter((c) => c.stage === "interview").length,
    offers: s.offers.filter((o) => o.status !== "approved").length,
  };
}
const escapeICS = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
export function calendarFile(i: Interview, name: string, now = new Date()) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//People Desk//Local Demo//EN", "BEGIN:VEVENT",
    `UID:${i.id}@people-desk.example`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(new Date(i.at))}`,
    `DTEND:${stamp(new Date(Date.parse(i.at) + i.duration * 60000))}`, `SUMMARY:${escapeICS(name + " / " + i.topic.en)}`,
    "DESCRIPTION:Local demo calendar export. No invitation has been sent.", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
export function parseStore(raw: string): Store {
  const s = JSON.parse(raw);
  const obj = (x: unknown): boolean => !!x && typeof x === "object";
  const str = (x: unknown) => typeof x === "string";
  const w = (x: any) => obj(x) && str(x.cn) && str(x.en);
  if (!obj(s) || s.version !== 1 || !str(s.company) || !["jobs", "candidates", "interviews", "offers"].every((k) => Array.isArray(s[k]))) throw new Error("storage");
  if (!s.jobs.every((j: any) => obj(j) && str(j.id) && w(j.title) && w(j.department) && w(j.location) && w(j.description) && w(j.owner) && ["open", "paused"].includes(j.status) && ["fulltime", "contract"].includes(j.type) && Number.isInteger(j.slots) && j.slots > 0 && str(j.salary) && str(j.created) && Array.isArray(j.skills) && j.skills.every(str))) throw new Error("storage");
  if (!s.candidates.every((c: any) => obj(c) && str(c.id) && w(c.name) && w(c.role) && w(c.location) && w(c.summary) && str(c.email) && s.jobs.some((j: any) => j.id === c.jobId) && stages.includes(c.stage) && ["referral", "careers", "sourced"].includes(c.source) && str(c.created) && Array.isArray(c.skills) && c.skills.every(str) && Array.isArray(c.notes) && c.notes.every((n: any) => str(n.id) && str(n.text) && str(n.at)) && Array.isArray(c.history) && c.history.every((h: any) => stages.includes(h.stage) && str(h.at)))) throw new Error("storage");
  if (!s.interviews.every((i: any) => obj(i) && str(i.id) && s.candidates.some((c: any) => c.id === i.candidateId) && Number.isFinite(Date.parse(i.at)) && Number.isFinite(i.duration) && i.duration >= 15 && i.duration <= 180 && str(i.interviewer) && w(i.topic) && ["video", "onsite"].includes(i.kind))) throw new Error("storage");
  if (!s.offers.every((o: any) => obj(o) && str(o.id) && s.candidates.some((c: any) => c.id === o.candidateId) && Number.isFinite(o.salary) && o.salary > 0 && ["CNY", "USD"].includes(o.currency) && ["draft", "review", "approved"].includes(o.status) && str(o.start) && str(o.created))) throw new Error("storage");
  for (const k of ["jobs", "candidates", "interviews", "offers"]) if (new Set(s[k].map((x: any) => x.id)).size !== s[k].length) throw new Error("storage");
  return s;
}
