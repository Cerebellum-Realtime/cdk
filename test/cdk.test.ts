import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as Cdk from "../lib/CreateCerebellumStack";
import { before } from "node:test";

describe("Testing That Resources are Created...", () => {
  let template: Template;

  before(() => {
    const app = new cdk.App();
    // WHEN
    const stack = new Cdk.CerebellumStack(app, "MyTestStack");
    // THEN
    template = Template.fromStack(stack);
  });

  test("Elasticache is Created", () => {
    template.hasResourceProperties("AWS::ElastiCache::CacheCluster", {
      CacheNodeType: "cache.t3.micro",
      Engine: "redis",
    });
  });

  test("Application Load Balancer is Created", () => {
    // Check that the ALB is created with the correct properties
    template.hasResourceProperties(
      "AWS::ElasticLoadBalancingV2::LoadBalancer",
      {
        Type: "application",
        Scheme: "internet-facing",
      }
    );
  });

  test("HTTP Listener Created", () => {
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
      Port: 80,
      Protocol: "HTTP",
    });
  });

  test("HTTPS Listener Created with ARN Certificate", () => {
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
      Port: 443,
      Protocol: "HTTPS",
      Certificates: [
        {
          CertificateArn: process.env.CERTIFICATE_ARN || "",
        },
      ],
    });
  });

  test("2 Queues are Created", () => {
    const resources = template.findResources("AWS::SQS::Queue");
    const queueCount = Object.keys(resources).length;
    expect(queueCount).toBe(2);
  });

  test("API Gateway is Created", () => {
    template.hasResource("AWS::ApiGateway::RestApi", {});
  });

  test("ECS Service is Created", () => {
    template.hasResourceProperties("AWS::ECS::Service", {
      DesiredCount: Number(process.env.SCALING_MIN) || 1,
      LaunchType: "FARGATE",
    });
  });

  test("Auto-Scaling CPU Policy is Created", () => {
    template.hasResourceProperties(
      "AWS::ApplicationAutoScaling::ScalingPolicy",
      {
        PolicyType: "TargetTrackingScaling",
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 50,
          PredefinedMetricSpecification: {
            PredefinedMetricType: "ECSServiceAverageCPUUtilization",
          },
        },
      }
    );
  });

  test("Auto-Scaling Memory Policy is Created", () => {
    template.hasResourceProperties(
      "AWS::ApplicationAutoScaling::ScalingPolicy",
      {
        PolicyType: "TargetTrackingScaling",
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 50,
          PredefinedMetricSpecification: {
            PredefinedMetricType: "ECSServiceAverageMemoryUtilization",
          },
        },
      }
    );
  });
});
