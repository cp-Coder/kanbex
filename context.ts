import { PrismaClient, User } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';  
import { env } from 'env.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
interface CreateContextOptions {
  prisma: PrismaClient;
  user: User;
}

type JWTPayload = JwtPayload & {
  externalID: string;
};

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
  const jsonObj = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  console.log(jsonObj)
  const user = await prisma.user.findUnique({
    where: {
      externalID: jsonObj.externalID,
    },
  });
  console.log(user)
  return {
    req,
    res,
    prisma,
    user,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;