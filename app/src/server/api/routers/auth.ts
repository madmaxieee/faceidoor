import crypto from "crypto";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { env } from "@/env.mjs";
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
    .mutation(async ({ input: { username, images }, ctx }) => {
      if (!verify(username, images)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or face features",
        });
      }

      const token = crypto.randomUUID();
      await redis.set(token, username);
      await redis.expire(token, EXPIRE_TIME);
      ctx.res.setHeader(
        "Set-Cookie",
        `token=${token}; Path=/; HttpOnly; Max-Age=${EXPIRE_TIME}`
      );
      return {
        success: true,
      };
    }),
  signup: publicProcedure
    .input(
      z.object({
        username: z.string(),
        images: z.array(z.string().url()),
      })
    )
    .mutation(async ({ input: { username, images }, ctx }) => {
      if (!register(username, images)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or face features",
        });
      }

      const token = crypto.randomUUID();
      await redis.set(token, username);
      await redis.expire(token, EXPIRE_TIME);
      ctx.res.setHeader(
        "Set-Cookie",
        `token=${token}; Path=/; HttpOnly; Max-Age=${EXPIRE_TIME}`
      );
      return {
        success: true,
      };
    }),

  images: publicProcedure
    .input(z.object({ images: z.array(z.string().url()) }))
    .mutation(({ input }) => sendImage(input.images)),

  checkCookie: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.token;
    if (!token) {
      return {
        success: false,
      };
    }

    const username = await redis.get(token);
    return {
      // success: Boolean(username),
      success: false,
    };
  }),
});

async function sendImage(images: string[]): Promise<string> {
  const res = await fetch(`${env.FEATURE_EXTRACTOR_URL}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images }),
  });
  console.log(await res.text());
  return "success";
}

async function verify(username: string, images: string[]): Promise<boolean> {
  const features = await getFaceFeatures(images);
  const credentials = {
    username,
    features,
  };
  const challenge = crypto.randomBytes(64).toString("hex");
  const body = JSON.stringify({ ...credentials, challenge });
  const res = await fetch(`${env.AUTHENTICATOR_URL}/challenge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
  // console.log(await res.json());
  console.log(await res.text());
  return true;
}

async function register(username: string, images: string[]): Promise<boolean> {
  const featuresVector = await getFaceFeatures(images);
  // convert features vector to string
  const features = featuresVector.join(",");
  const credentials = {
    username,
    features,
  };
  const challenge = crypto.randomBytes(64).toString("hex");
  const body = JSON.stringify({ ...credentials, challenge });

  const res = await fetch(`${env.AUTHENTICATOR_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  console.log(await res.text());

  return true;
}

async function getFaceFeatures(images: string[]): Promise<number[]> {
  // TODO: get face features from images
  /* eslint-disable-next-line no-console */
  console.log(images);
  return [1, 2, 3];
}
