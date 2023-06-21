import z from "zod";

import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router handling all stage related procedures
 * @link /api/stage
 */
export const stageRouter = router({
  /**
   * Procedure for getting all stages
   * @link /api/stage
   * @method GET
   * @example
   * ```ts
   * const { stages } = await trpc.query("stage.list", {})
   * ```
   * @returns {Stage[]} List of stages
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/stage",
        tags: ["stage"],
        summary: "Get all stages",
      },
    })
    .input(z.object({
      limit: z.number().default(10),
      offset: z.number().default(0),
    }))
    .output(
      z.object({
        stages: z.array(
          z.object({
            externalID: z.string().uuid(),
            title: z.string(),
            description: z.string().nullable(),
            createdBy: z.object({
              externalID: z.string().uuid(),
              name: z.string(),
            }),
            board: z.object({
              externalID: z.string().uuid(),
              title: z.string(),
            }),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const stages = await ctx.prisma.stage.findMany({
          where: {
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
            board: true,
          },
          take: input.limit,
          skip: input.offset,
        });

        return {
          stages,
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  /**
   * Procedure for getting a single stage
   * @link /api/stage/{externalID}
   * @method GET
   * @example
   * ```ts
   * const { stage } = await trpc.query("stage.get", { 
   *  input: {
   *    externalID: "uuid"
   *  }
   * })
   * ```
   * @returns {Stage} Stage
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 404 - Not Found
   * @throws {TRPCError} 500 - Internal Server Error
   */
  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/stage/{externalID}",
        tags: ["stage"],
        summary: "Get a single stage",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(
      z.object({
        stage: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable(),
          createdBy: z.object({
            externalID: z.string().uuid(),
            name: z.string(),
          }),
          board: z.object({
            externalID: z.string().uuid(),
            title: z.string(),
          }),
          task: z.array(
            z.object({
              externalID: z.string().uuid(),
              title: z.string(),
            })
          ),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      })
  )
    .query(async ({ input, ctx }) => {
      try {
        const stage = await ctx.prisma.stage.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
            board: true,
            Task: true,
          },
        });

        return {
          stage: {
            ...stage,
            task: stage.Task,
          }
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }
  ),
  /**
   * Procedure for creating a stage
   * @link /api/stage
   * @method POST
   * @example
   * ```ts
   * const { stage } = await trpc.query("stage.create", {
   *  input: {
   *    title: "Stage Title",
   *    description: "Stage Description", 
   *    boardExternalID: "uuid"
   *  }
   * })
   * ```
   * @returns {Stage} Stage
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/stage",
        tags: ["stage"],
        summary: "Create a stage",
      },
    })
    .input(z.object({
      title: z.string(),
      description: z.string(),
      boardExternalID: z.string().uuid(),
    }))
    .output(
      z.object({
        stage: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable(),
          createdBy: z.object({
            externalID: z.string().uuid(),
            name: z.string(),
          }),
          board: z.object({
            externalID: z.string().uuid(),
            title: z.string(),
          }),
        }),
      })
  )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.prisma.board.findFirstOrThrow({
          where: {
            title: input.title,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        const stage = await ctx.prisma.stage.create({
          data: {
            title: input.title,
            description: input.description,
            createdBy: {
              connect: {
                externalID: ctx.user.externalID,
              },
            },
            board: {
              connect: {
                externalID: input.boardExternalID,
              },
            },
          },
          include: {
            createdBy: true,
            board: true,
          },
        });

        return {
          stage,
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }
  ),
  /**
   * Procedure for updating a stage
   * @link /api/stage/{externalID}
   * @method PATCH
   * @example
   * ```ts
   * const { stage } = await trpc.query("stage.update", {
   *  input: {
   *    externalID: "uuid", 
   *    title: "Stage Title",
   *    description: "Stage Description",
   *  }
   * })
   * ```
   * @returns {Stage} Stage
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 404 - Not Found
   * @throws {TRPCError} 500 - Internal Server Error
   */
  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/stage/{externalID}",
        tags: ["stage"],
        summary: "Update a stage",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
      title: z.string(),
      description: z.string(),
    }))
    .output(
      z.object({
        stage: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable(),
          createdBy: z.object({
            externalID: z.string().uuid(),
            name: z.string(),
          }),
          board: z.object({
            externalID: z.string().uuid(),
            title: z.string(),
          }),
        }),
      })
  )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.prisma.stage.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        const stage = await ctx.prisma.stage.update({
          where: {
            externalID: input.externalID,
          },
          data: {
            title: input.title,
            description: input.description,
          },
          include: {
            createdBy: true,
            board: true,
          },
        });

        return {
          stage,
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }
  ),
  /**
   * Procedure for deleting a stage
   * @link /api/stage/{externalID}
   * @method DELETE
   * @example
   * ```ts
   * const { stage } = await trpc.query("stage.delete", {
   *  input: {
   *    externalID: "uuid",
   *  }
   * })
   * ```
   * @returns 200 - OK
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 404 - Not Found
   * @throws {TRPCError} 500 - Internal Server Error
   */
  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/stage/{externalID}",
        tags: ["stage"],
        summary: "Delete a stage",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(z.object({}))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.prisma.stage.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        await ctx.prisma.stage.update({
          where: {
            externalID: input.externalID,
          },
          data: {
            deleted: true,
          },
        });

        return {};
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }
  ),
});
