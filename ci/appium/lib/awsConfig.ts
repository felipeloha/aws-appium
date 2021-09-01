import * as ec2 from '@aws-cdk/aws-ec2';

export function awsLogsConfig(logGroupName: string): ec2.InitElement {
    return ec2.InitFile.fromString(
        '/etc/awslogs/awslogs.conf',
        `
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
datetime_format = %b %d %H:%M:%S
time_zone = UTC
file = /var/log/messages
log_group_name = ${logGroupName}
log_stream_name = system-messages
`,
        { mode: '000400', owner: 'root', group: 'root' },
    );
}
export function awsCliConfig(region: string): ec2.InitElement {
    return ec2.InitFile.fromString(
        '/etc/awslogs/awscli.conf',
        `
[plugins]
cwlogs = cwlogs
[default]
region = ${region}
`,
        { mode: '000400', owner: 'root', group: 'root' },
    );
}

export function updateRecordSetScript(cname: string, zoneId: string): ec2.InitElement {
    return ec2.InitFile.fromString(
        '/home/ec2-user/update-record-set.sh',
        `
#!/bin/bash
MY_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname/)
echo "updating record set with ip $MY_IP"

# Update Route 53 Record Set based on the Name tag to the current Public IP address of the Instance
aws route53 change-resource-record-sets --hosted-zone-id ${zoneId} --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"'${cname}'","Type":"CNAME","TTL":300,"ResourceRecords":[{"Value":"'$MY_IP'"}]}}]}'

echo "record set updated successfully"
`,
        { mode: '000755', owner: 'ec2-user', group: 'ec2-user' },
    );
}
