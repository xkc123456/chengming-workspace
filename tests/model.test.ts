import { describe, it, expect } from "vitest";
import { sampleStore } from "../src/sample";
import { addCandidate, addNote, addOffer, calendarFile, changeStage, departmentWords, findCandidates, metrics, offerNext, parseStore, scheduleInterview, words } from "../src/model";
const base = () => sampleStore(new Date("2026-09-23T08:00:00"));

describe("coherent fixture", () => {
  it("reuses bilingual departments from either language", () => {
    expect(departmentWords(base(), " 研发 ")).toEqual(words("研发", "Engineering"));
    expect(departmentWords(base(), "engineering")).toEqual(words("研发", "Engineering"));
    expect(departmentWords(base(), "Support")).toEqual(words("Support"));
  });
  it("loads valid schema and foreign keys", () => {
    const s = base();
    expect(parseStore(JSON.stringify(s))).toEqual(s);
    expect(s.jobs).toHaveLength(6);
    expect(s.candidates).toHaveLength(18);
  });
  it("derives dashboard numbers", () => expect(metrics(base())).toEqual({ jobs: 5, active: 16, interview: 5, offers: 2 }));
  it("searches bilingual name", () => {
    expect(findCandidates(base(), "zoe")).toHaveLength(1);
    expect(findCandidates(base(), "知夏")).toHaveLength(1);
  });
  it("combines job and stage filters", () => expect(findCandidates(base(), "", "product", "screening").map((c) => c.id)).toEqual(["c14"]));
  it("supports empty results and empty query", () => {
    expect(findCandidates(base(), "not found")).toHaveLength(0);
    expect(findCandidates(base(), "   ")).toHaveLength(18);
  });
});

describe("candidate workflow", () => {
  const input = { name: " Demo Person ", email: "DEMO@example.com", jobId: "product", role: "Engineer", source: "referral" as const };
  it("normalizes and prepends a candidate", () => {
    const s = addCandidate(base(), input, "new", "2026-09-23T01:00Z");
    expect(s.candidates[0].name.cn).toBe("Demo Person");
    expect(s.candidates[0].email).toBe("demo@example.com");
    expect(s.candidates[0].stage).toBe("applied");
  });
  it("rejects same-email same-job duplicate", () => {
    const s = addCandidate(base(), input);
    expect(() => addCandidate(s, input)).toThrow("duplicate");
  });
  it("allows same person to apply to a different job", () => {
    const s = addCandidate(base(), input);
    expect(addCandidate(s, { ...input, jobId: "engineer" }).candidates).toHaveLength(20);
  });
  it.each([["name", ""], ["email", "bad"], ["jobId", "brand"]])("validates %s", (k, v) => expect(() => addCandidate(base(), { ...input, [k]: v })).toThrow());
  it("stage transition appends history without mutating source", () => {
    const s = base();
    const next = changeStage(s, "c5", "interview");
    expect(next.candidates.find((c) => c.id === "c5")?.history).toHaveLength(2);
    expect(s.candidates.find((c) => c.id === "c5")?.stage).toBe("applied");
  });
  it("same stage is a no-op", () => expect(changeStage(base(), "c1", "interview")).toBe(base()));
  it("rejects unknown candidate", () => expect(() => changeStage(base(), "x", "hired")).toThrow("missing"));
  it("saves trimmed review note", () => expect(addNote(base(), "c1", " New note ").candidates[0].notes[0].text).toBe("New note"));
  it("rejects empty or overlong note", () => {
    expect(() => addNote(base(), "c1", " ")).toThrow("note");
    expect(() => addNote(base(), "c1", "x".repeat(2001))).toThrow("note");
  });
});

describe("scheduling", () => {
  const input = { candidateId: "c5", at: "2026-09-23T10:30", duration: 45, interviewer: "林予 / Lin Yu", kind: "video" as const, topic: words("讨论", "Discussion") };
  it("rejects interviewer overlap", () => expect(() => scheduleInterview(base(), input)).toThrow("conflict"));
  it("rejects candidate overlap with another interviewer", () => expect(() => scheduleInterview(base(), { ...input, candidateId: "c1", interviewer: "other" })).toThrow("conflict"));
  it("allows adjacent time slots", () => expect(scheduleInterview(base(), { ...input, at: "2026-09-23T11:15" }).interviews).toHaveLength(5));
  it("allows separate interviewers and candidates in parallel", () => expect(scheduleInterview(base(), { ...input, interviewer: "other" }).interviews).toHaveLength(5));
  it("rejects invalid time and duration", () => {
    expect(() => scheduleInterview(base(), { ...input, at: "bad" })).toThrow("schedule");
    expect(() => scheduleInterview(base(), { ...input, duration: 0 })).toThrow("schedule");
  });
  it("rejects archived/hired candidates", () => expect(() => scheduleInterview(base(), { ...input, candidateId: "c16" })).toThrow("candidate"));
  it("exports escaped UTC calendar without attendees", () => {
    const result = calendarFile(base().interviews[0], "Name, Person\nLine");
    expect(result).toContain("Name\\, Person\\nLine");
    expect(result).toContain("DTSTART:");
    expect(result).not.toContain("ATTENDEE");
    expect(result).toContain("END:VCALENDAR");
  });
});

describe("offers and persistence", () => {
  const offer = { candidateId: "c1", salary: 400000, currency: "CNY" as const, start: "2026-10-01" };
  it("creates a draft then supports local review and approval", () => {
    let s = addOffer(base(), offer, "o3");
    expect(s.offers[0].status).toBe("draft");
    s = offerNext(s, "o3");
    expect(s.offers[0].status).toBe("review");
    s = offerNext(s, "o3");
    expect(s.offers[0].status).toBe("approved");
  });
  it("prevents duplicate offer", () => expect(() => addOffer(base(), { ...offer, candidateId: "c3" })).toThrow("offerDuplicate"));
  it("requires eligible pipeline stage", () => expect(() => addOffer(base(), { ...offer, candidateId: "c5" })).toThrow("offerStage"));
  it.each([0, -5, NaN, Infinity])("rejects invalid salary %s", (salary) => expect(() => addOffer(base(), { ...offer, salary })).toThrow("salary"));
  it.each(["bad", "2026-02-31", "2026-13-01", "2026-02-29"])("rejects invalid date %s", (start) => expect(() => addOffer(base(), { ...offer, start })).toThrow("date"));
  it("rejects unsupported schema", () => expect(() => parseStore('{"version":2}')).toThrow());
  it("rejects duplicate IDs", () => {
    const s = base(); s.candidates.push(s.candidates[0]); expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
  it("rejects dangling references", () => {
    const s = base(); s.candidates[0].jobId = "missing"; expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
  it("rejects malformed nested state", () => {
    const s = base(); (s.candidates[0] as any).history = null; expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
});
