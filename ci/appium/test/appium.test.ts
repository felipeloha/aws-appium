import { expect as expectCDK, haveResource, haveResourceLike, ResourcePart } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Appium from '../lib/appium-stack';

test('Stack', () => {
    const app = new cdk.App();
    const stack = new Appium.AppiumStack(app, 'MyTestStack', {
        stackName: 'appium-test-stack',
        env: {
            account: '12345',
            region: 'us-east-2',
        },
    });

    expectCDK(stack).to(
        haveResource('AWS::Logs::LogGroup', {
            RetentionInDays: 14,
        }),
    );
    expectCDK(stack).to(haveResource('AWS::Route53::RecordSet', {}));
    expectCDK(stack).to(haveResource('AWS::IAM::InstanceProfile', {}));
    expectCDK(stack).to(
        haveResourceLike(
            'AWS::IAM::Policy',
            {
                Properties: {
                    PolicyDocument: {
                        Statement: [
                            {
                                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                                Effect: 'Allow',
                                Resource: {
                                    'Fn::GetAtt': ['LogGroup246C4230', 'Arn'],
                                },
                            },
                            {
                                Action: 'route53domains:*',
                                Effect: 'Allow',
                                Resource: '*',
                            },
                            {
                                Action: 'route53:*',
                                Effect: 'Allow',
                                Resource: '*',
                            },
                            {
                                Action: ['cloudformation:DescribeStackResource', 'cloudformation:SignalResource'],
                                Effect: 'Allow',
                                Resource: {
                                    Ref: 'AWS::StackId',
                                },
                            },
                        ],
                    },
                },
            },
            ResourcePart.CompleteDefinition,
        ),
    );

    expectCDK(stack).to(
        haveResourceLike(
            'AWS::AutoScaling::AutoScalingGroup',
            {
                Metadata: {
                    'AWS::CloudFormation::Init': {
                        install: {
                            files: {
                                '/etc/awslogs/awscli.conf': {},
                                '/etc/awslogs/awslogs.conf': {},
                            },
                        },
                        start: {
                            files: {
                                '/home/ec2-user/update-record-set.sh': {},
                                '/home/ec2-user/docker-compose.yaml': {},
                                '/home/ec2-user/install-docker.sh': {},
                            },
                        },
                    },
                },
            },
            ResourcePart.CompleteDefinition,
        ),
    );

    expectCDK(stack).to(haveResource('AWS::AutoScaling::ScheduledAction', {}));
    expectCDK(stack).to(
        haveResourceLike(
            'AWS::AutoScaling::LaunchConfiguration',
            {
                Properties: {
                    InstanceType: 'c5.metal',
                    AssociatePublicIpAddress: true,
                    SpotPrice: '0.950',
                    BlockDeviceMappings: [
                        {
                            DeviceName: '/dev/xvda',
                            Ebs: { VolumeSize: 30 },
                        },
                    ],
                },
            },
            ResourcePart.CompleteDefinition,
        ),
    );
});
