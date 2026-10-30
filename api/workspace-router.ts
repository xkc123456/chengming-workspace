import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { workspaces } from "@db/schema";
import { initialWorkspace, type Workspace } from "@contracts/workspace";
import { listModels, classifyAiError } from "./ai/ai-client";

const workspaceSchema: z.ZodType<Workspace> = z.object({
  projectName: z.string(),
  projectBrief: z.string(),
  stage: z.string(),
  deadline: z.string(),
  members: z.array(z.object({ id: z.number(), name: z.string(), major: z.string(), skills: z.array(z.string()), hours: z.number(), status: z.enum(["active", "away"]), note: z.string() })),
  ideas: z.array(z.object({ id: z.number(), title: z.string(), target: z.string(), value: z.number(), feasibility: z.number(), data: z.number(), innovation: z.number(), fit: z.number(), selected: z.boolean(), aiReview: z.string().optional() })),
  tasks: z.array(z.object({ id: z.number(), title: z.string(), stage: z.string(), assigneeId: z.number().nullable(), due: z.string(), priority: z.enum(["高", "中", "低"]), status: z.enum(["todo", "doing", "done"]), deliverable: z.string() })),
  documents: z.array(z.object({ id: z.number(), kind: z.string(), title: z.string(), content: z.string(), createdAt: z.string() })),
});

const prompts: Record<string, string> = {
  direction: "你是严谨的市场研究负责人。评估选题的真实商业价值、调查可执行性、数据可得性、创新空间和答辩风险。不要只表扬，给出明确结论、关键假设、最大风险和下一步验证动作。",
  task: "你是市场调查项目的执行专家。把任务拆成今天就能开始的步骤，给出具体方法、质量检查点和可直接使用的交付物框架。必要时给出SPSS菜单路径或分析注意事项。",
  analysis: "你是统计分析与消费者洞察专家。根据用户提供的数据摘要或分析目标，推荐合适方法，解释适用前提，给出SPSS操作路径、结果解读模板与常见误用提醒。不能编造未提供的统计结果。",
  writing: "你是市场研究、市场营销与工商管理领域的写作专家。生成证据链清晰、可执行、避免空话的内容。区分事实、推断与建议，不编造引用或数据。",
  pitch: "你是研究报告展示与答辩教练。输出有主线的页面结构或追问演练，强调研究设计、样本、分析稳健性、结论边界和商业行动。",
  coach: "你是市场调查项目全流程顾问。针对用户当前情境给出笃定、可执行、有优先级的建议。覆盖选题、问卷、抽样、SPSS、商业分析、报告、PPT和答辩。不要编造事实。",
};

export const workspaceRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [row] = await db.select().from(workspaces).where(eq(workspaces.userId, ctx.user.id)).limit(1);
    if (row) return row.payload as Workspace;
    await db.insert(workspaces).values({ userId: ctx.user.id, payload: initialWorkspace });
    return initialWorkspace;
  }),
  save: authedQuery.input(workspaceSchema).mutation(async ({ ctx, input }) => {
    await getDb().insert(workspaces).values({ userId: ctx.user.id, payload: input }).onDuplicateKeyUpdate({ set: { payload: input } });
    return { ok: true };
  }),
  assist: authedQuery.input(z.object({
    mode: z.enum(["direction", "task", "analysis", "writing", "pitch", "coach"]),
    prompt: z.string().min(2).max(18000),
    context: z.string().max(18000).optional(),
  })).mutation(async ({ ctx, input }) => {
    try {
      const { defaultModelId } = await listModels();
      const provider = createOpenAICompatible({
        name: "kimi-gw",
        baseURL: process.env.KIMI_AGENTGW_BASE_URL!,
        apiKey: process.env.KIMI_AGENTGW_API_KEY!,
      });
      const result = await generateText({
        model: provider(defaultModelId),
        system: `${prompts[input.mode]}\n使用中文回答，结构清楚但避免模板化套话。若信息不足，先给可推进的方案，再列出需要补充的信息。`,
        prompt: `用户目标：\n${input.prompt}\n\n项目背景：${input.context || "未提供额外背景"}`,
        providerOptions: { "kimi-gw": { max_completion_tokens: 5000 } },
      });
      return { text: result.text };
    } catch (error) {
      const mapped = classifyAiError(error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: mapped.message, cause: mapped });
    }
  }),
});
