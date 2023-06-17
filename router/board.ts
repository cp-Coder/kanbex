import z from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router handling all board related procedures
 * @link /api/board
 */
export const boardRouter = router({
  /**
   * Procedure for getting all boards
   * @link /api/board
   * @method GET
   * @example
   * ```ts
   * const { boards } = await trpc.query("board.list", {})
   * ```
   * @returns {Board[]} List of boards
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/board",
        tags: ["board"],
        summary: "Get all boards",
      },
    })
    .input(z.object({
      limit: z.number().default(10),
      offset: z.number().default(0),
    }))
    .output(
      z.object({
        boards: z.array(
          z.object({
            externalID: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            createdBy: z.object({
              externalID: z.string().uuid(),
              username: z.string(),
            }),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const boards = await ctx.prisma.board.findMany({
          where: {
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
          },
          take: input.limit,
          skip: input.offset,
        });

        return {
          boards,
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
   * Procedure for getting a board
   * @link /api/board/{externalID}
   * @method GET
   * @example
   * ```ts
   * const { board } = await trpc.query("board.get", {
   *  input: {
   *    externalID: "uuid"
   *  }
   * })
   * ```
   * @returns {Board} Board
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 404 - Not Found
   * @throws {TRPCError} 500 - Internal Server Error
   */
  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/board/{externalID}",
        tags: ["board"],
        summary: "Get a board",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(
      z.object({
        board: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string(),
          createdBy: z.object({
            externalID: z.string().uuid(),
            username: z.string(),
          }),
          stage: z.array(
            z.object({
              externalID: z.string().uuid(),
              title: z.string(),
              description: z.string(),
            })
          ),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const board = await ctx.prisma.board.findFirst({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
            Stage: true,
          },
        });

        if (!board) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Board not found",
          });
        }

        return {
          board: {
            ...board,
            stage: board.Stage,
          },
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
   * Procedure for creating a board
   * @link /api/board
   * @method POST
   * @example
   * ```ts
   * const { board } = await trpc.mutation("board.create", {
   *  input: {
   *    title: "Board Title",
   *    description: "Board Description"
   *    }
   * })
   * ```
   * @returns {Board} Board
   * @throws {TRPCError} 400 - Bad Request
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/board",
        tags: ["board"],
        summary: "Create a board",
      },
    })
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
    }))
    .output(
      z.object({
        board: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string(),
          createdBy: z.object({
            externalID: z.string().uuid(),
            username: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
        const board = await ctx.prisma.board.create({
          data: {
            title: input.title,
            description: input.description || "",
            createdBy: {
              connect: {
                externalID: ctx.user.externalID,
              },
            },
          },
          include: {
            createdBy: true,
          },
        });

        return {
          board,
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error as string,
        });
      }
    }
  ),
  /**
   * Procedure for updating a board
   * @link /api/board/{externalID}
   * @method PATCH
   * @example
   * ```ts
   * const { board } = await trpc.mutation("board.update", {
   *  input: {
   *    externalID: "uuid",
   *    title: "Board Title",
   *    description: "Board Description"
   *   }
   * })
   * ```
   * @returns {Board} Board
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error 
   */
  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/board/{externalID}",
        tags: ["board"],
        summary: "Update a board",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
      title: z.string().optional(),
      description: z.string().optional(),
    }))
    .output(
      z.object({
        board: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string(),
          createdBy: z.object({
            externalID: z.string().uuid(),
            username: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.board.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        const board = await ctx.prisma.board.update({
          where: {
            externalID: input.externalID,
          },
          data: {
            title: input.title,
            description: input.description,
          },
          include: {
            createdBy: true,
          },
        });

        return {
          board,
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error as string,
        });
      }
    }
  ),
  /**
   * Procedure for deleting a board
   * @link /api/board/{externalID}
   * @method DELETE
   * @example
   * ```ts
   * const { board } = await trpc.mutation("board.delete", {
   *  input: {
   *    externalID: "uuid",
   *  }
   * })
   * ```
   * @returns 200 - OK
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/board/{externalID}",
        tags: ["board"],
        summary: "Delete a board",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(z.object({}))
    .mutation(async ({ ctx, input }) => {
      try {
         await ctx.prisma.board.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        await ctx.prisma.board.update({
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
          message: error as string,
        });
      }
    }
  ),

});
