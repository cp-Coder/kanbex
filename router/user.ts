import z from "zod";
import bcrypt from "bcrypt";

import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router handling all authenticated user related procedures
 * @link /api/user
 */
export const userRouter = router({
  /**
   * Procedure for getting the current user
   * @link /api/user/me
   * @method GET
   * @example
   * ```ts
   * const { user } = await trpc.query("user.me", {})
   * ```
   * @returns {User} User
   * @throws {TRPCError} 401 - Unauthorized
   */
  me: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/user/me",
        tags: ["user"],
        summary: "Get the current user",
      },
    })
    .input(z.object({}))
    .output(
      z.object({
        user: z.object({
          externalID: z.string().uuid(),
          username: z.string(),
          name: z.string(),
          email: z.string(),
        }),
      })
    )
    .query(async ({ ctx }) => {
      return {
        user: {
          externalID: ctx.user.externalID,
          username: ctx.user.username,
          name: ctx.user.name,
          email: ctx.user.email,
        },
      };
    }
  ),
  /**
   * Procedure for updating the current user
   * @link /api/user/{externalID}
   * @method PATCH
   * @example
   * ```ts
   * const { user } = await trpc.mutation("user.update", {
   *  input: {
   *    name: "Test User",
   *    email: "testing@g.com",
   *    password: "password"
   *  }
   * })
   * ```
   * @returns {User} Partial User
   * @throws {TRPCError} 401 - Unauthorized
   * @throws {TRPCError} 500 - Internal Server Error
   * @throws {TRPCError} 400 - Bad Request
   * @throws {TRPCError} 404 - Not Found
    */
  updateUser: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/{externalID}", 
        tags: ["user"],
        summary: "Update the current user",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
      name: z.string().min(3).optional(),
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
    }))
    .output(z.object({
      user: z.object({
        externalID: z.string(),
        name: z.string(),
        username: z.string(),
        email: z.string(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            externalID: ctx.user.externalID,
            deleted: false,
          }
        });
        if (!existingUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        if(input.password) {
          const hashedPassword = await bcrypt.hash(input.password, 10);
          input.password = hashedPassword;
        }
        const updatedUser = await ctx.prisma.user.update({
          where: {
            externalID: ctx.user.externalID,
          },
          data: {
            name: input.name,
            email: input.email,
            password: input.password,
          },
        });
        return {
          user: {
            externalID: updatedUser.externalID,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
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
   * Procedure for deleting the current user
   * @link /api/user/{externalID}
   * @method DELETE
   * @example
   * ```ts
   * const { user } = await trpc.mutation("user.delete", {})
   * ```
   * @returns 204 - No Content
   * @throws {TRPCError} 401 - Unauthorized
   */
  deleteUser: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/user/{externalID}",
        tags: ["user"],
        summary: "Delete the current user",
      },
    })
    .input(z.object({
      externalID: z.string().uuid(),
    }))
    .output(z.object({}))
    .mutation(async ({ ctx }) => {
      try {
        await ctx.prisma.user.update({
          where: {
            externalID: ctx.user.externalID,
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
  
