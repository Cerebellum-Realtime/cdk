import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { DynamoDB } from "./DynamoDB";

export class MessageArchive extends Construct {
  constructor(scope: Construct, id: string, dynamodb: DynamoDB) {
    super(scope, id);

    // Define the S3 bucket where "old data" can be moved to
    const messageArchiveS3 = new s3.Bucket(
      this,
      "CerebellumMessageArchiveBucket"
    );

    const messageArchiveLambda = new lambda.Function(
      this,
      "CerebellumMessageArchiveLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "messageArchive.handler",
        code: lambda.Code.fromAsset("lambda"),
        environment: {
          MESSAGES_TABLE_NAME: dynamodb.messagesTable.tableName,
          BUCKET_NAME: messageArchiveS3.bucketName,
        },
      }
    );

    // Grant permissions
    dynamodb.messagesTable.grantReadData(messageArchiveLambda);
    dynamodb.messagesTable.grantWriteData(messageArchiveLambda);
    messageArchiveS3.grantPut(messageArchiveLambda);

    const messageArchiveCronJob = new events.Rule(
      this,
      "CerebellumMessageArchiveCronJob",
      {
        schedule: events.Schedule.cron({
          minute: "0",
          hour: "0",
          weekDay: "SUN",
        }), // Runs at midnight every Sunday
      }
    );

    messageArchiveCronJob.addTarget(
      new targets.LambdaFunction(messageArchiveLambda)
    );
  }
}
