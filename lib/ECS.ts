import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";
import { Elasticache } from "./Elasticache";
import { DynamoDB } from "./DynamoDB";
import path = require("path");

export class ECS extends Construct {
  service: ecs.FargateService;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    inboundPeerSecurityGroup: ec2.IPeer,
    elasticache: Elasticache
  ) {
    super(scope, id);

    const dynamodb = new DynamoDB(this, "DynamoDB", vpc);

    // Define the Dead Letter Queue (DLQ)
    const dlq = new sqs.Queue(this, "MyDLQ", {
      retentionPeriod: cdk.Duration.days(14),
    });

    const queue = new sqs.Queue(this, "EventQueueQueue", {
      visibilityTimeout: cdk.Duration.seconds(5),
      deadLetterQueue: {
        maxReceiveCount: 5, // After 5 failed attempts, the message will be moved to the DLQ
        queue: dlq,
      },
    });

    const messageLambda = new lambda.Function(this, "MessageDataToDynamoFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: `index.handler`, //change index to your lamda name
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")), // assuming your Lambda code is in the 'lambda' directory
      environment: {
        DYNAMODB_MESSAGES_TABLE_NAME: dynamodb.messagesTable.tableName,
        DYNAMODB_CHANNELS_TABLE_NAME: dynamodb.channelsTable.tableName,
      },
    });

    // Add the SQS queue as an event source for the Lambda function
    messageLambda.addEventSource(new eventsources.SqsEventSource(queue));

    // Grant permissions for Lambda to write to DynamoDB table
    dynamodb.messagesTable.grantReadWriteData(messageLambda);
    dynamodb.channelsTable.grantReadWriteData(messageLambda);

    queue.grantSendMessages(dynamodb.ecsTaskRole);
    queue.grantConsumeMessages(messageLambda);
    dlq.grantSendMessages(messageLambda);

    // Define the S3 bucket where "old data" can be moved to
    const dataArchive = new s3.Bucket(this, "DataArchive");

    const offloadDataFn = new lambda.Function(this, "ArchiveDataFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "messageArchive.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        MESSAGES_TABLE_NAME: dynamodb.messagesTable.tableName,
        BUCKET_NAME: dataArchive.bucketName,
      },
    });

    // Grant permissions
    dynamodb.messagesTable.grantReadData(offloadDataFn);
    dynamodb.messagesTable.grantWriteData(offloadDataFn);
    dataArchive.grantPut(offloadDataFn);

    const rule = new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.cron({
        minute: "0",
        hour: "0",
        weekDay: "SUN",
      }), // Runs at midnight every Sunday
    });

    rule.addTarget(new targets.LambdaFunction(offloadDataFn));

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "WebSocketServer-TaskDef",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
        },
        taskRole: dynamodb.ecsTaskRole, // Assign the IAM role to the task definition
      }
    );

    // Create a security group for the container
    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      "ContainerFromALBSecurityGroup",
      {
        vpc,
        description: "Allow HTTP traffic from ALB to Containers",
        allowAllOutbound: true, // Allow outbound traffic
      }
    );

    // Allow inbound HTTP traffic from ALB on any port
    ecsSecurityGroup.addIngressRule(
      inboundPeerSecurityGroup,
      ec2.Port.tcpRange(0, 65535), // Allow TCP traffic for ports 0-65535
      "Allow traffic from ALB to containers"
    );

    const ecrImage = "public.ecr.aws/b5g1w6x4/austin-ws-server:latest";
    // "public.ecr.aws/x1a0a3q3/ws-server:latest";

    // Add a container and redis env to the task definition
    taskDefinition.addContainer("WebSocketServer-Container", {
      image: ecs.ContainerImage.fromRegistry(ecrImage),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [{ containerPort: 8000 }],
      environment: {
        QUEUE_URL: queue.queueUrl,
        REDIS_ENDPOINT_ADDRESS: elasticache.redisEndpointAddress,
        REDIS_ENDPOINT_PORT: elasticache.redisEndpointPort,
        DYNAMODB_MESSAGES_TABLE_NAME: dynamodb.messagesTable.tableName,
        DYNAMODB_CHANNELS_TABLE_NAME: dynamodb.channelsTable.tableName,
      },
      logging: new ecs.AwsLogDriver({
        streamPrefix: "WebSocketServer-Container",
      }),
    });

    const cluster = new ecs.Cluster(this, "WebSocketServer-Cluster", { vpc });

    this.service = new ecs.FargateService(
      this,
      "WebSocketServer-FargateService",
      {
        cluster,
        taskDefinition,
        desiredCount: 2,
        assignPublicIp: false,
        securityGroups: [ecsSecurityGroup],
      }
    );

    this.service.node.addDependency(elasticache);
  }
}
