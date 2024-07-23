import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppServer } from "./AppServer";
import { Elasticache } from "./Elasticache";

export class LoadBalancer extends Construct {
  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    elasticache: Elasticache
  ) {
    super(scope, id);

    const albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      vpc,
      description: "Allow HTTP and HTTPS traffic to the Load Balancer",
      allowAllOutbound: true,
    });

    this.#addIngressRules(albSecurityGroup);

    const lb = new elbv2.ApplicationLoadBalancer(this, "WebSocketServer-ALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    const appServer = new AppServer(
      this,
      id,
      vpc,
      albSecurityGroup,
      elasticache
    );

    this.#addListenersAndTargets(lb, appServer);
  }

  #addIngressRules(albSecurityGroup: ec2.SecurityGroup) {
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
  }

  #addListenersAndTargets(
    lb: elbv2.ApplicationLoadBalancer,
    appServer: AppServer
  ) {
    const approvedCertificateARN: string = process.env.CERTIFICATE_ARN || "";

    const httpListener = lb.addListener("HTTPListener", {
      port: 80,
    });

    httpListener.addTargets("HTTPTargets", {
      port: 80,
      targets: [appServer.service],
      stickinessCookieDuration: cdk.Duration.minutes(1), // Enable stickiness and set cookie duration
      healthCheck: {
        path: "/", // The path where the health check endpoint is located – could implement /health path
        interval: cdk.Duration.seconds(30), // The time interval between health checks
        timeout: cdk.Duration.seconds(5), // The amount of time to wait when receiving a response from the health check
        healthyThresholdCount: 5, // The number of consecutive health check successes required before considering an unhealthy target healthy
        unhealthyThresholdCount: 2, // The number of consecutive health check failures required before considering a target unhealthy
      },
    });

    const httpsListener = lb.addListener("HTTPSListener", {
      port: 443,
      certificates: [
        {
          certificateArn: approvedCertificateARN,
        },
      ],
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    httpsListener.addTargets("HTTPSTargets", {
      port: 80,
      targets: [appServer.service],
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
