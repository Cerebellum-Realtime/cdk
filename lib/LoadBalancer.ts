import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as cdk from "aws-cdk-lib";

export class Elasticache extends Construct {
  // redisEndpointAddress: string;
  // redisEndpointPort: string;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

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
