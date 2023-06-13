import { createClient } from "redis";

const client = createClient();

client.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await client.connect();
})();

export default client;
