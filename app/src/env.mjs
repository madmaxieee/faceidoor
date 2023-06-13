import { z } from "zod";

import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    SIGNATURE_HASH_ALGORITHM: z.enum(["SHA256"]),
    FEATURE_EXTRACTOR_URL: z.string().url(),
    AUTHENTICATOR_URL: z.string().url(),
    CSRF_PREFIX: z.string(),
    PUBKEY_PREFIX: z.string(),
    // UPSTASH_URL: z.string().url(),
    // UPSTASH_TOKEN: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SIGNATURE_HASH_ALGORITHM: process.env.SIGNATURE_HASH_ALGORITHM,
    FEATURE_EXTRACTOR_URL: process.env.FEATURE_EXTRACTOR_URL,
    AUTHENTICATOR_URL: process.env.AUTHENTICATOR_URL,
    CSRF_PREFIX: process.env.CSRF_PREFIX,
    PUBKEY_PREFIX: process.env.PUBKEY_PREFIX,
    // UPSTASH_URL: process.env.UPSTASH_URL,
    // UPSTASH_TOKEN: process.env.UPSTASH_TOKEN,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
