#!/bin/bash
echo "########  install docker  ########"
sudo amazon-linux-extras install docker
echo "########  starting docker  ########"
sudo service docker start
sudo usermod -a -G docker ec2-user && sudo systemctl enable docker
echo "########  docker installed  ########"

echo "########  starting docker compose  ########"
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose