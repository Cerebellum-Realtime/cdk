import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

// Define the schema
const messageSchema = new dynamoose.Schema({
  channelId: {
    type: String,
    hashKey: true,
  },
  createdAt_messageId: {
    type: String,
    rangeKey: true,
    default: () => {
      const now = new Date();
      const uniqueId = uuidv4();
      return `${now.toISOString().padStart(20, "0")}_${uniqueId}`;
    },
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
    default: () => {
      const now = new Date();
      return `${now.toISOString()}`;
    },
  },
});

export const Message = dynamoose.model("messages", messageSchema);
