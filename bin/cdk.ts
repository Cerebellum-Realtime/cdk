#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CerebellumStack } from "../lib/CreateCerebellumStack";
import * as dotenv from "dotenv";
dotenv.config();

const app = new cdk.App();
new CerebellumStack(app, "CerebellumStack", {});
