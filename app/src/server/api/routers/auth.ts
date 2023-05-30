import crypto from "crypto";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { publicProcedure, createTRPCRouter } from "@/server/api/trpc";
import redis from "@/server/redis";

const EXPIRE_TIME = 60 * 60;

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        images: z.array(z.string().url()),
      })
    )
    .mutation(({ input: { username, images }, ctx }) => {
      if (!verify(username, images)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or face features",
        });
        return {
          success: false,
        };
      }

      const token = crypto.randomUUID();
      redis.set(token, username);
      redis.expire(token, EXPIRE_TIME);
      ctx.res.setHeader(
        "Set-Cookie",
        `token=${token}; Path=/; HttpOnly; Max-Age=${EXPIRE_TIME}`
      );
      return {
        success: true,
      };
    }),
  checkCookie: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(({ input: { token } }) => {
      const username = redis.get(token);
      if (!username) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid token",
        });
        return {
          success: false,
        };
      }
      return {
        success: true,
      };
    }),
});

async function verify(username: string, images: string[]): Promise<boolean> {
  const features = await getFaceFeatures(images);
  const credentials = {
    username,
    features,
  };
  const challengeValue = crypto.randomBytes(64).toString("hex");
  return challenge(challengeValue, credentials);
}

async function challenge(
  challengeValue: string,
  credentials: {
    username: string;
    features: number[];
  }
): Promise<boolean> {
  /* eslint-disable-next-line no-console */
  console.log(challengeValue, credentials);
  return true;
}

async function getFaceFeatures(images: string[]): Promise<number[]> {
  /* eslint-disable-next-line no-console */
  console.log(images);
  return [1, 2, 3];
}
