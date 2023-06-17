import zod from "zod"
import { publicProcedure, router } from "../trpc"
export const appRouter = router({
  hello: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/hello",
      }
    })
    .input(zod.object({}))
    .output(zod.object({
      hello: zod.string()
    }))
    .query(() => {
      return {
        hello: "Hello world"
    }
  }) 
})

export type AppRouter = typeof appRouter;