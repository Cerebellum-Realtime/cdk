import dynamoose from "dynamoose";

export const channelSchema = new dynamoose.Schema({
  channelName: {
    type: String,
    hashKey: true,
    required: true,
  },
});

export const Channel = dynamoose.model(
  process.env.DYNAMODB_CHANNELS_TABLE_NAME,
  channelSchema
);
