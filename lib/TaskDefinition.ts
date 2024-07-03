import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Elasticache } from "./Elasticache";

export class TaskDefinition extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    return new ecs.FargateTaskDefinition(this, "WebSocketServer-TaskDef", {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
      },
    });
  }

  addContainer(elasticache: Elasticache) {
    super("WebSocketServer-Container", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/x1a0a3q3/ws-server:latest"
      ),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [{ containerPort: 8000 }],
      environment: {
        REDIS_ENDPOINT_ADDRESS: elasticache.redisEndpointAddress,
        REDIS_ENDPOINT_PORT: elasticache.redisEndpointPort,
      },
      logging: new ecs.AwsLogDriver({
        streamPrefix: "WebSocketServer-Container",
      }),
    });
  }
}
