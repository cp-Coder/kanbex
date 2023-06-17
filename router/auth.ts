import zod from "zod";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

import { publicProcedure, router } from "../trpc";
import { env } from "../env.mjs";
import { User } from "@prisma/client";

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
        path: "/register",
        tags: ["auth"],
        summary: "Register a new user",
      }
    })
    .input(zod.object({
      username: zod.string().min(3),
      name: zod.string().min(3),
      email: zod.string().email(),
      password: zod.string().min(8),
    }))
    .output(zod.object({
      user: zod.object({
        externalID: zod.string(),
        username: zod.string(),
        email: zod.string(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
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
          email: user.email,
        }
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
        path: "/login",
        tags: ["auth"],
        summary: "Login a user",
      }
    })
    .input(zod.object({
      username: zod.string(),
      password: zod.string(),
    }))
    .output(zod.object({
      token: zod.string(),
    }))
    .mutation(async ({ input, ctx }) => {
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
    }
  ),
});