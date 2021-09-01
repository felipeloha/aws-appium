import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as route53 from '@aws-cdk/aws-route53';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import { awsCliConfig, awsLogsConfig, updateRecordSetScript } from './awsConfig';
import fs = require('fs');

// TODO modify to your domain
export const domain = 'mydomain.com';

export class AppiumStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const { logGroup, vpc, region, cnameRecord, hostedZone } = this.createBaseResources();
        const role = this.createRole(logGroup);
        const ec2SecurityGroup = this.createSecurityGroup(vpc);

        const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc,
            instanceType: new ec2.InstanceType('c5.metal'),
            machineImage: ec2.MachineImage.latestAmazonLinux({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                storage: ec2.AmazonLinuxStorage.EBS,
            }),
            role,
            minCapacity: 0,
            desiredCapacity: 1,
            associatePublicIpAddress: true,
            keyName: 'my_key',
            spotPrice: '0.950',
            autoScalingGroupName: 'appium-autoscaling-group',
            securityGroup: ec2SecurityGroup,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            init: ec2.CloudFormationInit.fromConfigSets({
                configSets: {
                    default: ['install', 'start'],
                },
                configs: {
                    install: new ec2.InitConfig([
                        awsCliConfig(region),
                        awsLogsConfig(logGroup.logGroupName),
                        ec2.InitCommand.shellCommand(
                            'echo "##############installing amazon cloud watch agent################"',
                        ),
                        ec2.InitCommand.shellCommand('sudo sudo yum update -y'),
                        ec2.InitCommand.shellCommand('sudo yum -y install awslogs'),
                        ec2.InitCommand.shellCommand('sudo yum -y install amazon-cloudwatch-agent'),
                        ec2.InitCommand.shellCommand('sudo systemctl start awslogsd'),
                        ec2.InitCommand.shellCommand('sudo systemctl status awslogsd'),
                        ec2.InitCommand.shellCommand('echo "##############install finished################"'),
                    ]),
                    start: new ec2.InitConfig([
                        updateRecordSetScript(cnameRecord.domainName, hostedZone.hostedZoneId),
                        ec2.InitFile.fromString(
                            '/home/ec2-user/docker-compose.yaml',
                            fs.readFileSync('./docker-compose.yaml', 'utf8'),
                            {
                                mode: '000755',
                                owner: 'ec2-user',
                                group: 'ec2-user',
                            },
                        ),
                        ec2.InitFile.fromString(
                            '/home/ec2-user/install-docker.sh',
                            fs.readFileSync('./install-docker.sh', 'utf8'),
                            {
                                mode: '000755',
                                owner: 'root',
                                group: 'root',
                            },
                        ),
                        ec2.InitCommand.shellCommand('mkdir /home/ec2-user/apks'),
                        ec2.InitCommand.shellCommand('sudo chown -R ec2-user:ec2-user /home/ec2-user/*'),
                        ec2.InitCommand.shellCommand('sudo /home/ec2-user/install-docker.sh'),
                        ec2.InitCommand.shellCommand('sudo docker-compose -f /home/ec2-user/docker-compose.yaml up -d'),
                        ec2.InitCommand.shellCommand('echo "########  starting docker compose started ########"'),
                        ec2.InitCommand.shellCommand('chmod +x /home/ec2-user/update-record-set.sh'),
                        ec2.InitCommand.shellCommand('/home/ec2-user/update-record-set.sh'),
                    ]),
                },
            }),
            initOptions: {
                configSets: ['default'],
            },
            signals: autoscaling.Signals.waitForAll({
                timeout: cdk.Duration.minutes(5),
            }),
            blockDevices: [
                {
                    deviceName: '/dev/xvda',
                    volume: autoscaling.BlockDeviceVolume.ebs(30),
                },
            ],
        });
        autoScalingGroup.node.addDependency(cnameRecord);
        cdk.Tags.of(autoScalingGroup).add('Name', `appium-autoscaling`);

        autoScalingGroup.scaleOnSchedule('TurnOffOnTheWeekends', {
            schedule: autoscaling.Schedule.cron({ weekDay: 'FRI', hour: '23', minute: '59' }),
            desiredCapacity: 0,
        });
        autoScalingGroup.scaleOnSchedule('TurnOnForTheWeek', {
            schedule: autoscaling.Schedule.cron({ weekDay: 'MON', hour: '06', minute: '00' }),
            desiredCapacity: 1,
        });
    }

    private createSecurityGroup(vpc: ec2.IVpc) {
        const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ec2SecurityGroup', {
            vpc,
            securityGroupName: `appium-ec2-sg`,
            description: 'Enable  SSH access',
        });
        cdk.Tags.of(ec2SecurityGroup).add('Name', `appium-ec2-sg`);
        ec2SecurityGroup.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(22), `appium ingress 22`);
        return ec2SecurityGroup;
    }

    private createRole(logGroup: logs.LogGroup) {
        const role = new iam.Role(this, 'EC2InstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        });
        role.addToPolicy(
            new iam.PolicyStatement({
                resources: [logGroup.logGroupArn],
                actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            }),
        );
        role.addToPolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: ['route53domains:*'],
            }),
        );
        role.addToPolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: ['route53:*'],
            }),
        );
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
        return role;
    }

    private createBaseResources() {
        const region = cdk.Stack.of(this).region;
        const hostedZone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domain });
        const vpc = ec2.Vpc.fromLookup(this, 'vpc', { isDefault: true });

        const cnameRecord = new route53.CnameRecord(this, 'CNAME', {
            zone: hostedZone,
            domainName: 'https://test.com',
            recordName: 'appium',
        });
        cdk.Tags.of(cnameRecord).add('Name', `appium-cname`);

        const logGroup = new logs.LogGroup(this, 'LogGroup', {
            retention: logs.RetentionDays.TWO_WEEKS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            logGroupName: `appium-log`,
        });
        cdk.Tags.of(logGroup).add('Name', `appium-log`);
        return { logGroup, vpc, region, cnameRecord, hostedZone };
    }
}
