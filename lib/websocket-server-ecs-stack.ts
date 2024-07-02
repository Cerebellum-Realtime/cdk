import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Elasticache } from "./Elasticache";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class WebsocketServerEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", { maxAzs: 2 });
    
    const cluster = new ecs.Cluster(this, "MyCluster", { vpc });

    const elasticache = new Elasticache(this, id, vpc);

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "websocket-task-file",
      {
        cpu: 512,
        memoryLimitMiB: 1024,
      }
    );

    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      "serviceSecurityGroups",
      {
        vpc,
        securityGroupName: "fargate-service-sec-group",
      }
    );

    serviceSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8000),
      "Allow access to port 8000 from any IP"
    );

    taskDefinition.addContainer("MyContainer", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/q8e0a8z0/redis-test:latest"
      ),
      memoryLimitMiB: 1024,
      cpu: 512,
      portMappings: [{ containerPort: 8000 }],
      environment: {
        REDIS_ENDPOINT_ADDRESS: elasticache.redisEndpointAddress,
        REDIS_ENDPOINT_PORT: elasticache.redisEndpointPort,
      },
    });

    const service = new ecs.FargateService(this, "WebsocketFargateService", {
      cluster,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: true,
      securityGroups: [serviceSecurityGroup],
    });

    service.node.addDependency(elasticache);
  }
}
