import { createClient } from "redis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-streams-adapter";

let redisClient;
let io;

export const initializeRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: `redis://${process.env.REDIS_ENDPOINT_ADDRESS}:${process.env.REDIS_ENDPOINT_PORT}`,
    });
    await redisClient.connect();
    io = new Server({});
    io.adapter(createAdapter(redisClient));
  }
  return { redisClient, io };
};
