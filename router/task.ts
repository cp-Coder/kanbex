import z from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router handling all task related procedures
 * @link /api/task
 */
export const taskRouter = router({
  /**
   * Procedure for getting all tasks
   * @link /api/task
   * @method GET
   * @example
   * ```ts
   * const { tasks } = await trpc.query("task.list", {})
   * ```
   * @returns {Task[]} List of tasks
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/task",
        tags: ["task"],
        summary: "Get all tasks",
      },
    })
    .input(z.object({
      limit: z.number().default(10),
      offset: z.number().default(0),
    }))
    .output(
      z.object({
        tasks: z.array(
          z.object({
            externalID: z.string().uuid(),
            title: z.string(),
            description: z.string().nullable(),
            dueDate: z.date(),
            priority: z.number().min(0).max(3),
            createdBy: z.object({
              externalID: z.string().uuid(),
              username: z.string(),
            }),
            stage: z.object({
              externalID: z.string().uuid(),
              title: z.string(),
            }),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const tasks = await ctx.prisma.task.findMany({
          where: {
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
            stage: true,
          },
          take: input.limit,
          skip: input.offset,
        });
        return {
          tasks,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get tasks",
        });
      }
    }
  ),
  /**
   * Procedure for getting a single task
   * @link /api/task/{externalID}
   * @method GET
   * @example
   * ```ts
   * const { task } = await trpc.query("task.get", 
   *  input: { 
   *    externalID: "...",
   *  }
   * })
   * ```
   * @returns {Task} Task
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 404 - Not Found
   * @throws {TRPCError} 500 - Internal Server Error
   */
  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/task/{externalID}",
        tags: ["task"],
        summary: "Get a single task",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(
      z.object({
        task: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable(),
          dueDate: z.date(),
          priority: z.number().min(0).max(3),
          createdBy: z.object({
            externalID: z.string().uuid(),
            username: z.string(),
          }),
          stage: z.object({
            externalID: z.string().uuid(),
            title: z.string(),
            board: z.object({
              externalID: z.string().uuid(),
              title: z.string(),
            }),
          }),
          updatedAt: z.date(),
          createdAt: z.date(),
        }),
      })
  )
    .query(async ({ input, ctx }) => {
      try {
        const task = await ctx.prisma.task.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
            stage: {
              include: {
                board: true,
              },
            },
          },
        });
        return {
          task,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get task",
        });
      }
    }
  ),
  /**
   * Procedure for creating a task
   * @link /api/task
   * @method POST
   * @example
   * ```ts
   * const { task } = await trpc.query("task.create", 
   *  input: { 
   *    title: "...",
   *    description: "...",
   *  }
   * })
   * ```
   * @returns {Task} Task
   * @throws {TRPCError} 400 - Bad Request
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/task",
        tags: ["task"],
        summary: "Create a task",
      },
    })
    .input(z.object({
      title: z.string(),
      description: z.string().nullable(),
      dueDate: z.date().nullable(),
      priority: z.number().min(0).max(3).default(0),
      stageExternalID: z.string().uuid(),
    }))
    .output(z.object({
      task: z.object({
        externalID: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        dueDate: z.date(),
        priority: z.number().min(0).max(3),
        createdBy: z.object({
          externalID: z.string().uuid(),
          username: z.string(),
        }),
        stage: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          board: z.object({
            externalID: z.string().uuid(),
            title: z.string(),
          }),
        }),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.prisma.stage.findFirstOrThrow({
          where: {
            title: input.title,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        const task = await ctx.prisma.task.create({
          data: {
            title: input.title,
            description: input.description,
            dueDate: input.dueDate || new Date(),
            priority: input.priority,
            createdBy: {
              connect: {
                externalID: ctx.user.externalID,
              },
            },
            stage: {
              connect: {
                externalID: input.stageExternalID,
              },
            },
          },
          include: {
            createdBy: true,
            stage: {
              include: {
                board: true,
              },
            },
          },
        });
        return {
          task,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create task",
        });
      }
    }
  ),
  /**
   * Procedure for updating a task
   * @link /api/task/{externalID}
   * @method PATCH
   * @example
   * ```ts
   * const { task } = await trpc.query("task.update", { externalID: "...", title: "..." })
   * ```
   * @returns {Task} Task
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/task/{externalID}",
        tags: ["task"],
        summary: "Update a task",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
      title: z.string().nullable(),
      description: z.string().nullable(),
      dueDate: z.date().nullable(),
      priority: z.number().min(0).max(3).nullable(),
      stageExternalID: z.string().uuid().nullable(),
    }))
    .output(z.object({
      task: z.object({
        externalID: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        dueDate: z.date(),
        priority: z.number().min(0).max(3),
        createdBy: z.object({
          externalID: z.string().uuid(),
          username: z.string(),
        }),
        stage: z.object({
          externalID: z.string().uuid(),
          title: z.string(),
          board: z.object({
            externalID: z.string().uuid(),
            title: z.string(),
          }),
        }),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const task = await ctx.prisma.task.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
          include: {
            createdBy: true,
            stage: {
              include: {
                board: true,
              },
            },
          },
        });
        await ctx.prisma.task.update({
          where: {
            externalID: input.externalID,
          },
          data: {
            title: input.title || task.title,
            description: input.description || task.description,
            dueDate: input.dueDate || task.dueDate,
            priority: input.priority || task.priority,
            stage: {
              connect: {
                externalID: input.stageExternalID || task.stage.externalID,
              },
            },
          },
        });
        return {
          task,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task",
        });
      }
    }
  ),
  /**
   * Procedure for deleting a task
   * @link /api/task/{externalID}
   * @method DELETE
   * @example
   * ```ts
   * const { task } = await trpc.query("task.delete", { externalID: "..." })
   * ```
   * @returns {Task} Task
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   */
  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/task/{externalID}",
        tags: ["task"],
        summary: "Delete a task",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(z.object({}))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.prisma.task.findFirstOrThrow({
          where: {
            externalID: input.externalID,
            deleted: false,
            createdBy: {
              externalID: ctx.user.externalID,
            },
          },
        });
        await ctx.prisma.task.update({
          where: {
            externalID: input.externalID,
          },
          data: {
            deleted: true,
          },
        });
        return {};
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
        });
      }
    }
  ),
});