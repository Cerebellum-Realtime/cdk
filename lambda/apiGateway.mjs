import dynamoose from "dynamoose";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "redis";
import { Emitter } from "@socket.io/redis-emitter";

const sqs = new SQSClient();
const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const channelSchema = new dynamoose.Schema({
  channelName: {
    type: String,
    hashKey: true,
  },
  channelId: {
    type: String,
    required: true,
  },
});

const Channel = dynamoose.model("channels", channelSchema);

// Function to send a message to the SQS queue
const sendMessageToQueue = async (channelId, message) => {
  // Use the queue URL from an environment variable or configuration

  const now = new Date();

  // we create messageId and createdAt time
  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({
      channelId,
      createdAt_messageId: `${now.toISOString().padStart(20, "0")}_${uuidv4()}`,
      content: `${message} => From Lambda API`,
      createdAt: now.toISOString(),
    }),
  };

  try {
    const result = await sqs.send(new SendMessageCommand(params));
    console.log("Message sent:", result.MessageId);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const getChannel = async (channelName) => {
  const channel = await Channel.query("channelName").eq(channelName).exec();
  if (channel.length === 0) {
    throw new Error(`No channel found matching name: ${channelName}`);
  }
  return channel[0].channelId;
};

export const handler = async (event) => {
  console.log("Received event:", event);

  const { channelName, content } = JSON.parse(event.body);

  const channelId = await getChannel(channelName);

  const client = createClient({
    url: `redis://${process.env.REDIS_ENDPOINT_ADDRESS}:${process.env.REDIS_ENDPOINT_PORT}`,
  });
  // redis[s]://[[username][:password]@][host][:port][/db-number]
  await client.connect();
  // createClient({
  //   url: 'redis://alice:foobared@awesome.redis.server:6380'
  // });

  // aus-el-1t8dsx62mrm34.393px0.0001.use2.cache.amazonaws.com
  // 6379
  const emitter = new Emitter(client);
  console.log(client);
  console.log("This is the channel info", channelName, channelId);
  console.log("emitter: ", emitter);

  emitter.to(channelName).emit(`message:receive:${channelName}`, {
    channelName,
    message: content,
    sendDescription: "sent directly via lambda",
  });

  setTimeout(async () => {
    try {
      await sendMessageToQueue(channelId, content);
      await client.disconnect();
      return { statusCode: 200, body: "Message processing completed" };
    } catch (error) {
      await client.disconnect();

      return { statusCode: 500, body: "Error Sending Message to redis" };
    }
  }, 10000);

  // const client = createClient({
  //   url: `redis://${process.env.REDIS_ENDPOINT_ADDRESS}:${process.env.REDIS_ENDPOINT_PORT}`,
  // });

  // await client.connect();

  // return new Promise((resolve, reject) => {
  //   client.on("error", (err) => {
  //     console.error(`Error: ${err}`);
  //     client.quit();
  //     reject(err);
  //   });

  //   client.on("connect", () => {
  //     client.publish("team_2", "hello from lambda 3", (err, reply) => {
  //       if (err) {
  //         console.error(`Publish error: ${err}`);
  //         client.quit();
  //         reject(err);
  //       } else {
  //         console.log(`Message sent to Redis channel: ${channel}`);
  //         client.quit();
  //         resolve(reply);
  //       }
  //     });
  //   });
  // });
};
