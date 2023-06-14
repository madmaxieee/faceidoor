import crypto from "crypto";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { env } from "@/env.mjs";
import { publicProcedure, createTRPCRouter } from "@/server/api/trpc";
import redis from "@/server/redis";

const EXPIRE_TIME = 60 * 60;

const CSRF_PREFIX = env.CSRF_PREFIX;
const PUBKEY_PREFIX = env.PUBKEY_PREFIX;

const CredentialsSchema = z.object({
  username: z.string(),
  features: z.string(),
});

type Credentials = z.infer<typeof CredentialsSchema>;

const RegisterResponseSchema = z.object({
  username: z.string(),
  public_key: z.string(),
  signature: z.string(),
});

type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

const LoginResponseSchema = z.object({
  signature: z.string(),
});

type LoginResponse = z.infer<typeof LoginResponseSchema>;

const FaceFeaturesSchema = z.array(z.number().int());

type FaceFeatures = z.infer<typeof FaceFeaturesSchema>;

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        images: z.array(z.string().url()),
      })
    )
    .mutation(async ({ input: { username, images }, ctx }) => {
      if (!(await verify(username, images))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or face features",
        });
      }

      const token = crypto.randomUUID();
      await redis.set(`${CSRF_PREFIX}${token}`, username);
      await redis.expire(`${CSRF_PREFIX}${token}`, EXPIRE_TIME);
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
    .mutation(async ({ input: { username, images } }) => {
      if (!(await register(username, images))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or face features",
        });
      }

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

    const username = await redis.get(`${CSRF_PREFIX}${token}`);

    return {
      success: Boolean(username),
    };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = ctx.token;

    if (!token) {
      return {
        success: false,
      };
    }

    await redis.del(`${CSRF_PREFIX}${token}`);

    return {
      success: true,
    };
  }),
});

async function sendImage(images: string[]): Promise<string> {
  await fetch(`${env.FEATURE_EXTRACTOR_URL}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images }),
  });

  return "success";
}

async function verify(username: string, images: string[]): Promise<boolean> {
  const features = await getFaceFeatures(images);
  const featuresHash = hashFeatures(features);
  const credentials: Credentials = {
    username,
    features: featuresHash,
  };
  const challenge = genChallenge();

  const body = JSON.stringify({ ...credentials, challenge });
  const res = await fetch(`${env.AUTHENTICATOR_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  const resJson: LoginResponse = await res.json();
  LoginResponseSchema.parse(resJson);

  const { signature } = resJson;

  const public_key_str = await redis.get(`${PUBKEY_PREFIX}${username}`);
  if (!public_key_str) {
    return false;
  }

  const verified = verifyChallenge(challenge, public_key_str, signature);

  return verified;
}

async function register(username: string, images: string[]): Promise<boolean> {
  const features = await registerFaceFeatures(images);
  const featuresHash = hashFeatures(features);
  const credentials: Credentials = {
    username,
    features: featuresHash,
  };
  const challenge = genChallenge();
  const body = JSON.stringify({ ...credentials, challenge });

  const response = await fetch(`${env.AUTHENTICATOR_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  const responseJson: RegisterResponse = await response.json();
  RegisterResponseSchema.parse(responseJson);

  const {
    username: resUsername,
    public_key: public_key_str,
    signature,
  } = responseJson;
  await redis.set(`${PUBKEY_PREFIX}${resUsername}`, public_key_str);

  const verified = verifyChallenge(challenge, public_key_str, signature);

  return verified;
}

async function getFaceFeatures(images: string[]): Promise<FaceFeatures> {
  const res = await fetch(`${env.FEATURE_EXTRACTOR_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images }),
  });

  const features = await res.json();
  FaceFeaturesSchema.parse(features);

  return features;
}

async function registerFaceFeatures(images: string[]): Promise<FaceFeatures> {
  const res = await fetch(`${env.FEATURE_EXTRACTOR_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images }),
  });

  const features = await res.json();
  FaceFeaturesSchema.parse(features);

  return features;
}

function verifyChallenge(
  challenge: string,
  public_key_str: string,
  signature: string
): boolean {
  const verify = crypto.createVerify("sha256");
  verify.update(challenge, "base64");
  verify.end();
  const public_key = crypto.createPublicKey(public_key_str);
  const verified = verify.verify(public_key, signature, "base64");

  return verified;
}

function genChallenge(): string {
  return crypto.randomBytes(64).toString("base64");
}

function hashFeatures(features: number[]): string {
  const hash = crypto.createHash("sha256");
  const featuresBuffer = Buffer.from(features);
  hash.update(featuresBuffer);
  return hash.digest("hex").slice(0, 32);
}
