import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as Cdk from "../lib/CreateCerebellumStack";

describe("Testing That Resources are Created...", () => {
  let template: Template;
  const app = new cdk.App();
  const stack = new Cdk.CerebellumStack(app, "MyTestStack");
  template = Template.fromStack(stack);

  it("Elasticache is Created", () => {
    template.hasResourceProperties("AWS::ElastiCache::CacheCluster", {
      CacheNodeType: "cache.t3.micro",
      Engine: "redis",
    });
  });

  it("Application Load Balancer is Created", () => {
    template.hasResourceProperties(
      "AWS::ElasticLoadBalancingV2::LoadBalancer",
      {
        Type: "application",
        Scheme: "internet-facing",
      }
    );
  });

  it("HTTPS Listener Created with ARN Certificate", () => {
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

  it("2 Queues are Created", () => {
    const resources = template.findResources("AWS::SQS::Queue");
    const queueCount = Object.keys(resources).length;
    expect(queueCount).toBe(2);
  });

  it("API Gateway is Created", () => {
    template.hasResource("AWS::ApiGateway::RestApi", {});
  });

  it("ECS Service is Created", () => {
    template.hasResourceProperties("AWS::ECS::Service", {
      DesiredCount: Number(process.env.SCALING_MIN) || 1,
      LaunchType: "FARGATE",
    });
  });

  it("Auto-Scaling CPU Policy is Created", () => {
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

  it("Auto-Scaling Memory Policy is Created", () => {
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
