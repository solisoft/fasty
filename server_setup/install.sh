apt-get update -yqq
apt-get upgrade -yqq

# Docker Installation
apt install -yqq apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
apt-cache policy docker-ce
apt-get -yqq install docker-ce git-core zsh htop docker-compose

useradd -m fasty
usermod -aG docker fasty

chsh -s /bin/bash fasty

# as fasty
su fasty
git clone https://github.com/solisoft/fasty.git
mkdir  shared/

/bin/cat <<EOM >~/deploy.sh
#!/bin/sh
cd fasty
git reset --hard
rm -Rf static/admin
git pull
cp ../shared/config.moon .
cp ../shared/docker-compose.yml .
cp ../shared/nginx.conf .
rm -Rf static/admin
mv foxxy/dist static/admin
docker exec -it fasty_cms_prod_1 moonc *.moon
docker exec -it fasty_cms_prod_1 moonc **/*.moon
docker exec -it fasty_cms_prod_1 lapis build production
EOM

DB_PASS=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

/bin/cat <<EOM >~/shared/docker-compose.yml
version: '3.1'
services:
  cms_prod:
    build: .
    restart: always
    command: /bin/bash -c "cd /var/www && moonc *.moon && moonc **/*.moon && lapis server production"
    ports:
      - 9090:80
    volumes:
      - ./:/var/www
      - arangodb-uploads:/var/www/static/uploads
    depends_on:
      - arangodb
    links:
      - arangodb:arangodb
    networks:
      frontend:
        ipv4_address: 12.12.0.8

  arangodb:
    image: arangodb/arangodb:3.5.0
    restart: always
    environment:
      ARANGO_ROOT_PASSWORD: $DB_PASS
    networks:
      frontend:
        ipv4_address: 12.12.0.6
    ports:
      - 8529:8529
    volumes:
      - arangodb-data:/var/lib/arangodb3
      - arangodb-app:/var/lib/arangodb3-app
      - arangodb-uploads:/home

  nginx:
    image: nginx:1.17.3
    restart: always
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - 8000:80
    links:
      - cms_prod
    networks:
      frontend:
        ipv4_address: 12.12.0.10
volumes:
  arangodb-data:
  arangodb-app:
  arangodb-uploads:
  node_modules:

networks:
  frontend:
    ipam:
      config:
        - subnet: 12.12.0.0/24
EOM

/bin/cat <<EOM >~/shared/config.moon
config = require "lapis.config"

config "production", ->
  port 80
  num_workers 4
  code_cache "on"

config "db_production", ->
  url "http://12.12.0.6:8529/"
  name "cms"
  login "root"
  pass  "password"
EOM

mkdir install_service
mkdir scripts
