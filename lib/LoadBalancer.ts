import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppServer } from "./AppServer";
import { Elasticache } from "./Elasticache";

export class LoadBalancer extends Construct {
  vpc: ec2.IVpc;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    elasticache: Elasticache
  ) {
    super(scope, id);

    this.vpc = vpc;

    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      "CerebellumALBSecurityGroup",
      {
        vpc,
        description: "Allow HTTPS traffic only to the Load Balancer",
        allowAllOutbound: true,
      }
    );

    this.#addIngressRules(albSecurityGroup);

    const lb = new elbv2.ApplicationLoadBalancer(this, "Cerebellum-ALB", {
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
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from anywhere with proper SSL/TLS credentials"
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from anywhere with proper SSL/TLS credentials"
    );
  }

  #addListenersAndTargets(
    lb: elbv2.ApplicationLoadBalancer,
    appServer: AppServer
  ) {
    const approvedCertificateARN: string = process.env.CERTIFICATE_ARN || "";

    const httpsListener = lb.addListener("CerebellumHTTPSListener", {
      port: 443,
      certificates: [
        {
          certificateArn: approvedCertificateARN,
        },
      ],
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    httpsListener.addTargets("CerebellumHTTPSTargets", {
      port: 80,
      targets: [appServer.service],
      stickinessCookieDuration: cdk.Duration.minutes(1),
      healthCheck: {
        path: "/",
        port: "3000",
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 5,
        unhealthyThresholdCount: 2,
      },
      loadBalancingAlgorithmType:
        elbv2.TargetGroupLoadBalancingAlgorithmType.LEAST_OUTSTANDING_REQUESTS,
    });
  }
}
