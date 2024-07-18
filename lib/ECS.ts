import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Elasticache } from "./Elasticache";
import { DynamoDB } from "./DynamoDB";
import path = require("path");
import { MessageDataArchive } from "./MessageDataArchive";

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

    /** EDIT THESE VARIABLES PER YOUR REQUIREMENTS HERE, THE REST OF THE CODE REMAINS THE SAME **/
    const ecrImage = "public.ecr.aws/q8e0a8z0/avery-ws-server:latest";
    const taskCpuArchitecture = ecs.CpuArchitecture.ARM64;
    /** END **/

    const secret = new secretsmanager.Secret(this, "ApiKeySecret", {
      secretName: "api-key-secret",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "apiKey",
        passwordLength: 32,
      },
    });

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

    const postMessage = new lambda.Function(this, "postMessage", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "postMessage.handler",
      code: lambda.Code.fromAsset("lambda"),
      timeout: cdk.Duration.seconds(10),
      environment: {
        QUEUE_URL: queue.queueUrl,
        REDIS_ENDPOINT_ADDRESS: elasticache.redisEndpointAddress,
        REDIS_ENDPOINT_PORT: elasticache.redisEndpointPort,
      },
      vpc: vpc,
    });

    dynamodb.channelsTable.grantReadWriteData(postMessage);
    queue.grantSendMessages(postMessage);

    const getMessage = new lambda.Function(this, "getMessage", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getMessage.handler",
      code: lambda.Code.fromAsset("lambda"),
      timeout: cdk.Duration.seconds(10),
      environment: {},
      vpc: vpc,
    });
    
    dynamodb.channelsTable.grantReadWriteData(getMessage);
    dynamodb.messagesTable.grantReadWriteData(getMessage);

    // Define the API Gateway
    const api = new apigateway.RestApi(this, "ApiGateway", {
      restApiName: "Real-time Data API Gateway",
      description: "API Gateway For One-Way Real-time Data",
    });

    // Integrate the Lambda function with the API Gateway
    const postMessageIntegration = new apigateway.LambdaIntegration(
      postMessage,
      {
        requestTemplates: { "application/json": '{"statusCode": 200}' },
      }
    );

    const getMessageIntegration = new apigateway.LambdaIntegration(getMessage, {
      requestTemplates: { "application/json": '{"statusCode": 200}' },
    });

    // Define a resource and method for the API
    const dataResource = api.root.addResource("data");
    dataResource.addMethod("POST", postMessageIntegration);
    dataResource.addMethod("GET", getMessageIntegration);

    /*
      Routes for api gateway
        - GET 
          - GET data from the database
          - Maybe do one route that pagiantes
        - POST (incoming webhook)
          - this would post data to the server
          - Call the lambda that will send it to the elasticache
            - woudl use socket.io emitter to do this
            - need to pass in redis information
          - This lambda would throw it in the queue
          -> emit -> queue -> lambda -> database]
                                ->>>> DLQ (if it can't save to database)
        - PUT
          - pass in message ID
            - upate the message based on message ID
        - Register webhooks for channels
          - we would need a dynamoDB table to store the webhooks saved per channel
          - Then we check when messages are sent to the q
    */

    const messageLambda = new lambda.Function(this, "MessageDataToDynamoFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: `index.handler`, //change index to your lamda name
      code: lambda.Code.fromAsset("lambda"),
      timeout: cdk.Duration.seconds(10),
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

    new MessageDataArchive(this, "MessageDataArchive", dynamodb);

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "WebSocketServer-TaskDef",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
          cpuArchitecture: taskCpuArchitecture,
        },
        taskRole: dynamodb.ecsTaskRole, // Assign the IAM role to the task definition
      }
    );

    // Grant the task role permission to read the secret (API KEY)
    secret.grantRead(taskDefinition.taskRole);

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
      secrets: {
        API_KEY: ecs.Secret.fromSecretsManager(secret, "apiKey"),
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

    new cdk.CfnOutput(this, "ApiKeySecretArnOutput", {
      value: secret.secretArn,
      description: "The ARN of the API key secret",
      exportName: "ApiKeySecretArn",
    });
  }
}
