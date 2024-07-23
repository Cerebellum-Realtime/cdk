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
import { MessageArchive } from "./MessageArchive";

export class AppServer extends Construct {
  service: ecs.FargateService;
  taskCpuArchitecture: cdk.aws_ecs.CpuArchitecture;
  operatingSystemFamily: cdk.aws_ecs.OperatingSystemFamily;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    inboundPeerSecurityGroup: ec2.IPeer,
    elasticache: Elasticache
  ) {
    super(scope, id);

    const ecrImage: string = process.env.IMAGE_URI || "";
    this.taskCpuArchitecture = ecs.CpuArchitecture.ARM64;
    this.operatingSystemFamily = ecs.OperatingSystemFamily.LINUX;

    const secret = this.newSecret("ApiKeySecret");

    const dynamodb = new DynamoDB(this, "DynamoDB", vpc);

    // Define the Dead Letter Queue (DLQ)
    const messageDLQ = new sqs.Queue(this, "MessageDeadLetterQueue", {
      retentionPeriod: cdk.Duration.days(14),
    });

    const messageQueue = new sqs.Queue(this, "MessageQueue", {
      visibilityTimeout: cdk.Duration.seconds(11),
      deadLetterQueue: {
        maxReceiveCount: 5, // After 5 failed attempts, the message will be moved to the DLQ
        queue: messageDLQ,
      },
    });

    const httpPostMessageLambda = new lambda.Function(
      this,
      "PostMessageFromHttpRequest",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "httpPostMessage.handler",
        code: lambda.Code.fromAsset("lambda"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          QUEUE_URL: messageQueue.queueUrl,
          REDIS_ENDPOINT_ADDRESS: elasticache.redisEndpointAddress,
          REDIS_ENDPOINT_PORT: elasticache.redisEndpointPort,
        },
        vpc: vpc,
      }
    );

    dynamodb.channelsTable.grantReadWriteData(httpPostMessageLambda);
    messageQueue.grantSendMessages(httpPostMessageLambda);

    const httpGetMessageLambda = new lambda.Function(
      this,
      "GetMessageFromHttpRequest",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "httpGetMessage.handler",
        code: lambda.Code.fromAsset("lambda"),
        timeout: cdk.Duration.seconds(10),
        environment: {},
        vpc: vpc,
      }
    );

    dynamodb.channelsTable.grantReadWriteData(httpGetMessageLambda);
    dynamodb.messagesTable.grantReadWriteData(httpGetMessageLambda);

    // Define the API Gateway
    const api = this.newApiGateway("ApiGateway");

    // Integrate the Lambda function with the API Gateway
    const postMessageIntegration = this.newApiLambdaIntegration(
      httpPostMessageLambda,
      {
        requestTemplates: { "application/json": '{"statusCode": 200}' },
      }
    );

    const getMessageIntegration = this.newApiLambdaIntegration(
      httpGetMessageLambda,
      {
        requestTemplates: { "application/json": '{"statusCode": 200}' },
      }
    );

    // Define a resource and method for the API
    const dataResource = api.root.addResource("data");
    dataResource.addMethod("POST", postMessageIntegration);
    dataResource.addMethod("GET", getMessageIntegration);

    const saveMessageToDatabaseLambda = new lambda.Function(
      this,
      "SaveMessageToDatabase",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: `saveMessageToDatabase.handler`,
        code: lambda.Code.fromAsset("lambda"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          DYNAMODB_MESSAGES_TABLE_NAME: dynamodb.messagesTable.tableName,
          DYNAMODB_CHANNELS_TABLE_NAME: dynamodb.channelsTable.tableName,
        },
      }
    );

    // Add the SQS messageQueue as an event source for the Lambda function
    saveMessageToDatabaseLambda.addEventSource(
      new eventsources.SqsEventSource(messageQueue)
    );

    // Grant permissions for Lambda to write to DynamoDB table
    dynamodb.messagesTable.grantReadWriteData(saveMessageToDatabaseLambda);
    dynamodb.channelsTable.grantReadWriteData(saveMessageToDatabaseLambda);

    messageQueue.grantSendMessages(dynamodb.ecsTaskRole);
    messageQueue.grantConsumeMessages(saveMessageToDatabaseLambda);
    messageDLQ.grantSendMessages(saveMessageToDatabaseLambda);

    new MessageArchive(this, "MessageArchive", dynamodb);

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

    const taskDefinition = this.newTaskDefinition(
      256,
      512,
      dynamodb.ecsTaskRole
    );

    // Grant the task role permission to read the secret (API KEY)
    secret.grantRead(taskDefinition.taskRole);

    // Add a container and redis env to the task definition
    taskDefinition.addContainer("WebSocketServer-Container", {
      image: ecs.ContainerImage.fromRegistry(ecrImage),
      cpu: 256,
      memoryLimitMiB: 512,
      portMappings: [{ containerPort: 8000 }],
      environment: {
        QUEUE_URL: messageQueue.queueUrl,
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
        desiredCount: Number(process.env.SCALING_MIN) || 1,
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

    this.#setScalableTarget();
  }

  newSecret(name: string) {
    return new secretsmanager.Secret(this, name, {
      secretName: "api-key-secret",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "apiKey",
        passwordLength: 32,
      },
    });
  }

  newApiGateway(name: string) {
    return new apigateway.RestApi(this, name, {
      restApiName: "Real-time Data API Gateway",
      description: "API Gateway For One-Way Real-time Data",
    });
  }

  newApiLambdaIntegration(
    lambda: cdk.aws_lambda.Function,
    options: cdk.aws_apigateway.LambdaIntegrationOptions
  ) {
    return new apigateway.LambdaIntegration(lambda, options);
  }

  newTaskDefinition(
    cpuLimit: number,
    memoryLimit: number,
    taskRole: cdk.aws_iam.IRole
  ) {
    return new ecs.FargateTaskDefinition(this, "WebSocketServer-TaskDef", {
      cpu: cpuLimit,
      memoryLimitMiB: memoryLimit,
      runtimePlatform: {
        operatingSystemFamily: this.operatingSystemFamily,
        cpuArchitecture: this.taskCpuArchitecture,
      },
      taskRole: taskRole, // Assign the IAM role to the task definition
    });
  }

  #setScalableTarget() {
    const scalableTarget = this.service.autoScaleTaskCount({
      minCapacity: Number(process.env.SCALING_MIN) || 1,
      maxCapacity: Number(process.env.SCALING_MAX) || 2,
    });

    scalableTarget.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 50,
    });

    scalableTarget.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 50,
    });
  }
}
