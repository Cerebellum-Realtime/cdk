import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

// Define the schema
const messageSchema = new dynamoose.Schema({
  channelName: {
    type: String,
    hashKey: true,
    required: true,
  },

  messageId: {
    type: String,
    rangeKey: true,
    default: () => {
      return uuidv4();
    },
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    index: {
      name: "createdAtIndex",
      type: "local",
    },
    required: true,
    default: () => {
      const now = new Date();
      return `${now.toISOString()}`;
    },
  },
});

export const Message = dynamoose.model(
  process.env.DYNAMODB_MESSAGES_TABLE_NAME,
  messageSchema
);
