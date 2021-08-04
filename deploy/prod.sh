#!/bin/bash

set -e

echo "Deploy to stage environment $DEPLOY_HOST"
ssh ec2-user@$DEPLOY_HOST "cd /home/ec2-user/ && rm -rf carpediem_deploy_prev/carpediem_deploy/node_modules/* && cp -rf carpediem_deploy carpediem_deploy_prev && rm -rf carpediem_deploy && git clone https://$GIT_CREDS@gitlab.com/wearebolt/carpediem.git carpediem_deploy && cd carpediem_deploy && cp ../environments/prod.env .env && npm i && ng build --prod --outputHashing=all && cp -rf * ../carpediem && pm2 restart carpediem-app"
