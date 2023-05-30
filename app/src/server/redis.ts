import { createClient } from "redis";

const client = createClient();

// eslint-disable-next-line no-console
client.on("error", (err) => console.log("Redis Client Error", err));
// eslint-disable-next-line no-console
client.connect().then(() => console.log("Redis Client Connected"));

export default client;
