import { getAllMessagesForChannel } from "./utils/getAllMessagesForChannel.js";
import { checkChannelExists } from "./utils/checkChannelExists.js";
import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const validateInput = (queryStringParameters) => {
  const { channelName } = queryStringParameters;
  if (!channelName) {
    throw new Error("Invalid input: channelName is required");
  }
  return { channelName };
};

export const handler = async (event) => {
  try {
    const { channelName } = validateInput(event.queryStringParameters);

    await checkChannelExists(channelName);

    const pastMessages = await getAllMessagesForChannel(channelName);

    return {
      statusCode: 200,
      body: JSON.stringify({ messages: pastMessages }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not get data" }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
