This repository provides the infrastructure (as CDK) to run appium tests on aws bare metal spot instances with an autoscaling function so that a new instance is automatically setup whenever the current spot instance is taken away.

Requirements solved by this solution:
- Run appium tests in a cost efficient way on aws
- Have an instance available to run the tests most of the time

This post bases on the following resources
- https://medium.com/swlh/deploying-android-emulators-on-aws-ec2-3-3-autoscaling-bare-metal-instances-cost-optimizations-8fc4e636b81d
- https://github.com/appium/appium/tree/master/sample-code
- https://github.com/budtmo/docker-android

!!! THIS INFRASTRUCTURE WILL CREATE COSTS IN AWS EVEN IF YOU HAVE CREDITS !!!

Implementation:
- Infrastructure
    - Autoscaling group with one ec2 c5.metal instance with amazon-linux
    - A route53 entry in your configured hosted zone
    - The instance configuration: 
        - installs docker, docker-compose, awscli
        - runs the selenium grid and an emulator with `ci/appium/docker-compose.yaml` 
        - updates the route53 entry with the instance public dns name
    - An autoscaling policy to turn off the instance during the weekends
    - Security groups to ssh into the instance
    - Permissions for the instance to run
- run-grid.sh functionality:
    - Copies an apk into the instance with a hardcoded name. Beware of the volume mapping in the docker-compose. It is important if you want to modify the wdio.config
    - Opens a tunnel to the grid AND to the VNC
    - Runs the tests pointing to the selenium grid

## Getting started
- Modify `ci/appium/lib/appium-stack.ts` with: 
    - your hosted zone name or remove the capability
    - your aws ssh key
- deploy infrastructure: `cd ci/appium && npm i && cdk synth && cdk deploy`
- run tests with node 10: `npm i && ./run-grid.sh PATH_TO_MY_KEY INSTANCE_CNAME`
- to see the grid, open chrome and localhost:4444
- to see the emulator, open chrome and localhost:8060


## Further improvements
The run-grid.sh can be integrated into your CI of choice.
To scale this solution is enough to remove the fix ports of the docker-compose and scale the app component.
This way tests can be run in parallel.