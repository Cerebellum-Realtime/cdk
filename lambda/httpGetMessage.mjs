import { getAllMessagesForChannel } from "./utils/getAllMessagesForChannel.js";
import { checkChannelExists } from "./utils/checkChannelExists.js";
import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const validateInput = (queryStringParameters) => {
  if (!queryStringParameters || !queryStringParameters.channelName) {
    throw new Error("Invalid input: channelName query parameter is required");
  } else if (queryStringParameters.channelName) {
    return queryStringParameters.channelName;
  } else {
    throw new Error("Server error");
  }
};

export const handler = async (event) => {
  try {
    const channelName = validateInput(event.queryStringParameters);

    try {
      await checkChannelExists(channelName);
    } catch (e) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Channel ${channelName} does not exist`,
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const pastMessages = await getAllMessagesForChannel(channelName);

    return {
      statusCode: 200,
      body: JSON.stringify({ messages: pastMessages }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.log(error);
    if (
      error.message &&
      error.message === "Invalid input: channelName query parameter is required"
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
        headers: { "Content-Type": "application/json" },
      };
    } else if (
      error.message &&
      error.message === "Invalid input: channelName is required"
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
        headers: { "Content-Type": "application/json" },
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not get data" }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
