import redis from "../redis";

import { authRouter } from "./routers/auth";
import { vaultRouter } from "./routers/vault";
import { exampleRouter } from "@/server/api/routers/example";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  auth: authRouter,
  vault: vaultRouter,
  reset: publicProcedure.query(async () => {
    try {
      await redis.flushAll();
    } catch (e) {
      console.error(e);
    }

    return {
      ok: true,
    };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
