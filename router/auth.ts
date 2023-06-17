import z from "zod";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

import { publicProcedure, router } from "../trpc";
import { env } from "../env";

/**
 * Router for authentication procedures
 * @link /api/auth
 */
export const authRouter = router({
  /**
   * Procedure for registering a new user
   * @link /api/auth/register
   * @example
   * ```ts
   * const { user } = await trpc.mutation("auth.register", {
   *  input: {
   *    username: "test",
   *    name: "Test User",
   *    email: "testing@g.com",
   *    password: "password"
   *  }
   * })
   * ```
   * @returns {User} Partial User
   * @throws {TRPCError} 400 - Bad Request
   */
  register: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/register",
        tags: ["auth"],
        summary: "Register a new user",
      }
    })
    .input(z.object({
      username: z.string().min(3),
      name: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .output(z.object({
      user: z.object({
        externalID: z.string().uuid(),
        username: z.string(),
        email: z.string(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const existingUser = await ctx.prisma.user.findUnique({
          where: {
            username: input.username,
          }
        });
        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User already exists",
          });
        }
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const user = await ctx.prisma.user.create({
          data: {
            username: input.username,
            name: input.name,
            email: input.email,
            password: hashedPassword,
          }
        });
        return {
          user: {
            externalID: user.externalID,
            username: user.username,
            name: user.name,
            email: user.email,
          }
        }
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  
  /**
   * Procedure for logging in a user
   * @link /api/auth/login
   * @example
   * ```ts
   * const { user } = await trpc.mutation("auth.login", {
   *  input: {
   *    username: "test",
   *    password: "password"
   *  }
   * })
   * ```
   * @returns {string} JWT Token
   * @throws {TRPCError} 400 - Bad Request
   */
  login: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/login",
        tags: ["auth"],
        summary: "Login a user",
      }
    })
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .output(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: {
            username: input.username,
          }
        });
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid credentials",
          });
        }
        const validPassword = await bcrypt.compare(input.password, user.password);
        if (!validPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid credentials",
          });
        }
        const token = jwt.sign({
          externalID: user.externalID,
        }, env.JWT_SECRET, {
          expiresIn: "1d",
          algorithm: "HS256",
        });

        return {
          token: token,
        }
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong"
        });
      }
    }
  ),
});