#!/bin/sh

# This file must be created on your app folder

# /home/apps/solicms
# deploy.sh             -- the deployment file
# shared/               -- shared folder
#   config.lua          -- config file (lua format)
#   config.moon         -- config file (moon format -- need to be removed)
#   docker-compose.yml  -- docker-compose.yml file (update credentials)
#   nginx.conf          -- nginx.conf

cd solicms
git reset --hard
git pull
cp ../shared/config.* .
cp ../shared/docker-compose.yml .
cp ../shared/nginx.conf .

rm -Rf static/admin
mv foxxy/dist static/admin

docker exec -it solicms_cms_prod_1 cp -Rf /var/www/patch/lapis /usr/local/share/lua/5.1/
docker exec -it solicms_cms_prod_1 moonc *.moon
docker exec -it solicms_cms_prod_1 moonc **/*.moon
docker exec -it solicms_cms_prod_1 lapis build production
