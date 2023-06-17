import { router } from "../trpc"
import { authRouter } from "./auth";
import { boardRouter } from "./board";
import { userRouter } from "./user";
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  board: boardRouter,
})

export type AppRouter = typeof appRouter;