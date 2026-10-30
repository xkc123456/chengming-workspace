import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { workspaceRouter } from "./workspace-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
