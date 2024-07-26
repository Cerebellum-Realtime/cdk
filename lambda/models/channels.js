import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

export const channelSchema = new Schema({
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
