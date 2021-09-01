#!/usr/bin/env node
/* eslint-disable no-new */
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AppiumStack } from '../lib/appium-stack';

const app = new cdk.App();
new AppiumStack(app, 'appium-stack', {
    stackName: process.env.STACK_NAME,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
