import { PrismaClient, User } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';  
import { env } from 'env.mjs';
import jwt from 'jsonwebtoken';
interface CreateContextOptions {
  prisma: PrismaClient;
  user: User;
}

const prisma = new PrismaClient();

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
*/
export const createContext = async(opts: CreateHTTPContextOptions) => {
  const { req, res } = opts;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return {
      req,
      res,
      prisma,
      user: null,
    }
  }
  const userExternalID = jwt.verify(token, env.JWT_SECRET) as string;
  const user = await prisma.user.findUnique({
    where: {
      externalID: userExternalID,
    },
  });
  return {
    req,
    res,
    prisma,
    user,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;