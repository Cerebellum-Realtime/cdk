import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Elasticache } from "./Elasticache";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class WebsocketServerEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "WebSocketServer-Vpc", { maxAzs: 2 });

    const cluster = new ecs.Cluster(this, "WebSocketServer-Cluster", { vpc });

    const elasticache = new Elasticache(this, id, vpc);

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "WebSocketServer-TaskDef",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
          cpuArchitecture: ecs.CpuArchitecture.ARM64,
        },
      }
    );

    // Create a security group for the Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      vpc,
      description: "Allow HTTP traffic to the Load Balancer",
      allowAllOutbound: true, // Allow outbound traffic
    });

    // Allow inbound HTTP traffic on port 80
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic from anywhere"
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic from anywhere"
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
      albSecurityGroup,
      ec2.Port.tcpRange(0, 65535), // Allow TCP traffic for ports 0-65535
      "Allow traffic from ALB to containers"
    );

    // Add a container and redis env to the task definition
    taskDefinition.addContainer("WebSocketServer-Container", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/x1a0a3q3/ws-server:latest"
      ),
      memoryLimitMiB: 1024,
      cpu: 512,
      portMappings: [{ containerPort: 8000 }],
      environment: {
        REDIS_ENDPOINT_ADDRESS: elasticache.redisEndpointAddress,
        REDIS_ENDPOINT_PORT: elasticache.redisEndpointPort,
      },
      logging: new ecs.AwsLogDriver({
        streamPrefix: "WebSocketServer-Container",
      }),
    });

    const ecsService = new ecs.FargateService(
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

    ecsService.node.addDependency(elasticache);

    // Create a Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, "WebSocketServer-ALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup, // Associate the security group with the Load Balancer
    });

    // Add a listener and a default target group
    const listener = lb.addListener("Listener", {
      port: 80,
    });

    listener.addTargets("WebSocketServer-ECSTargets", {
      port: 80,
      targets: [ecsService],
      stickinessCookieDuration: cdk.Duration.minutes(1), // Enable stickiness and set cookie duration
      healthCheck: {
        path: "/", // The path where the health check endpoint is located – could implement /health path
        interval: cdk.Duration.seconds(30), // The time interval between health checks
        timeout: cdk.Duration.seconds(5), // The amount of time to wait when receiving a response from the health check
        healthyThresholdCount: 5, // The number of consecutive health check successes required before considering an unhealthy target healthy
        unhealthyThresholdCount: 2, // The number of consecutive health check failures required before considering a target unhealthy
      },
    });
  }
}
