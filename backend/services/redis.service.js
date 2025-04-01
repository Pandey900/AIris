import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST, // Redis host
  port: process.env.REDIS_PORT, // Redis port
  password: process.env.REDIS_PASSWORD, // Redis password
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});
export default redisClient;
