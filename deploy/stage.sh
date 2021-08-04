#!/bin/bash

set -e

echo "Deploy to stage environment $DEPLOY_HOST"
ssh ec2-user@$DEPLOY_HOST "cd /home/ec2-user/ && rm -rf carpediem_stage_prev/carpediem_stage/node_modules/* && cp -rf carpediem_stage carpediem_stage_prev && rm -rf carpediem_stage && git clone https://$GIT_CREDS@gitlab.com/wearebolt/carpediem.git carpediem_stage && cd carpediem_stage && git checkout -t origin/development && cp ../environments/stage.env .env && npm i && ng build && pm2 restart carpediem-stage-app"
