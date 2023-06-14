import fs from "fs";

import { authenticatedProcedure, createTRPCRouter } from "@/server/api/trpc";

const DATA_DIR = "src/server/data";

// read file to dataURL
const getWebpDataURL = (path: string) => {
  const image = fs.readFileSync(path);
  const data = Buffer.from(image).toString("base64");
  return `data:image/webp;base64,${data}`;
};

// read webp files from src/server/data
const webpFiles = fs.readdirSync(DATA_DIR).filter((file) => {
  return file.endsWith(".webp");
});

const webpDataURLs = webpFiles.map((file) =>
  getWebpDataURL(`${DATA_DIR}/${file}`)
);

export const vaultRouter = createTRPCRouter({
  image: authenticatedProcedure.query(() => {
    const image = webpDataURLs[Math.floor(Math.random() * webpDataURLs.length)];
    return {
      image: image,
    };
  }),
});
