import fs from "fs";

import { authenticatedProcedure, createTRPCRouter } from "@/server/api/trpc";

// read file to dataURL
const getJpegDataURL = (path: string) => {
  const image = fs.readFileSync(path);
  const data = Buffer.from(image).toString("base64");
  return `data:image/jpeg;base64,${data}`;
};

const catImage = getJpegDataURL("src/server/data/cat.jpeg");

export const vaultRouter = createTRPCRouter({
  image: authenticatedProcedure.query(() => {
    return {
      image: catImage,
    };
  }),
});
