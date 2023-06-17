/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */

import { TRPCError, initTRPC } from '@trpc/server';
import { OpenApiMeta } from 'trpc-openapi';
import { transformer } from './utils/transformer';
import { ZodError } from 'zod';

/**
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.meta<OpenApiMeta>().create({
  /**
   * @see https://trpc.io/docs/v10/data-transformers
   */
  transformer,
  /**
   * @see https://trpc.io/docs/v10/error-formatting
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      }
    }
  },
});

/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
export const router = t.router;

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
export const publicProcedure = t.procedure;

// const isAuthorized = t.middleware(({ ctx, next }) => {
//   if (!ctx.user) {
//     throw new TRPCError({ code: "UNAUTHORIZED"})
//   }
//   return next({
//     ctx, 
//   });
// });
// export const protectedProcedure = t.procedure.use(isAuthorized);

/**
 * @see https://trpc.io/docs/v10/middlewares
 */
export const middleware = t.middleware;

/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
export const mergeRouters = t.mergeRouters;