import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ECS } from "./ECS";
import { Elasticache } from "./Elasticache";

export class LoadBalancedApplication extends Construct {
  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    elasticache: Elasticache
  ) {
    super(scope, id);

    // Create a security group for the Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      vpc,
      description: "Allow HTTP and HTTPS traffic to the Load Balancer",
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

    // Allow inbound HTTPS traffic on port 443
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from anywhere"
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from anywhere"
    );

    // Create a Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, "WebSocketServer-ALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup, // Associate the security group with the Load Balancer
    });

    // Add a listener and a default target group
    const httpListener = lb.addListener("HTTPListener", {
      port: 80,
    });

    const ecs = new ECS(this, id, vpc, albSecurityGroup, elasticache);

    const scalableTarget = ecs.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    });

    scalableTarget.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 50,
    });

    scalableTarget.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 50,
    });

    httpListener.addTargets("HTTPTargets", {
      port: 80,
      targets: [ecs.service],
      stickinessCookieDuration: cdk.Duration.minutes(1), // Enable stickiness and set cookie duration
      healthCheck: {
        path: "/", // The path where the health check endpoint is located – could implement /health path
        interval: cdk.Duration.seconds(30), // The time interval between health checks
        timeout: cdk.Duration.seconds(5), // The amount of time to wait when receiving a response from the health check
        healthyThresholdCount: 5, // The number of consecutive health check successes required before considering an unhealthy target healthy
        unhealthyThresholdCount: 2, // The number of consecutive health check failures required before considering a target unhealthy
      },
    });

    // Adding HTTPS Listener
    const httpsListener = lb.addListener("HTTPSListener", {
      port: 443,
      certificates: [
        {
          certificateArn:
            "arn:aws:acm:us-east-1:654654177904:certificate/bd431022-7729-4f08-a16b-8805872a08d6", // Verified Certificate ARN from Certificate Manger
        },
      ],
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    // Add targets to the HTTPS listener (same as HTTP)
    httpsListener.addTargets("HTTPSTargets", {
      port: 80,
      targets: [ecs.service],
      stickinessCookieDuration: cdk.Duration.minutes(1),
      healthCheck: {
        path: "/",
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 5,
        unhealthyThresholdCount: 2,
      },
    });
  }
}
