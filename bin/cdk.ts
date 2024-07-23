#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WebSocketServerStack } from "../lib/websocket-server-ecs-stack";
import * as dotenv from "dotenv";
dotenv.config();

const app = new cdk.App();
new WebSocketServerStack(app, "WebSocketServerStack", {});
