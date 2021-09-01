#!/usr/local/bin/bash

KEY_PATH=$1
IP=$2

scp -i $KEY_PATH apps/ApiDemos-debug.apk ec2-user@$IP:/home/ec2-user/apks
ssh -i $KEY_PATH -L 6080:localhost:6080 -L 4444:localhost:4444 ec2-user@$IP &
npm run android.app.grid