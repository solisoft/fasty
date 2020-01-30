# Fasty

https://fasty.ovh

A CMS built on top of OpenResty/Lapis & ArangoDB

# Installation

You need to have `docker` & `docker-compose` installed properly.

`docker-compose up --build`

For running only dev mode : `docker-compose up web --build`

For watching / compiling *.moon files : `dc exec cms moonc -w  **/*.moon`

It will launch the lapis instance + an ArangoDB one

* To access ArangoDB UI : `http://localhost:8530`
* To access Foxxy app : `http://demo.127.0.0.1.xip.io:8080/static/admin`
* To access Lapis app (dev) : `http://demo.127.0.0.1.xip.io:8080`
* To access Lapis app (prod) : `http://demo.127.0.0.1.xip.io:9090`

Install foxxy & foxx-cli as global npm modules

`sudo npm install -g foxxy`
`sudo npm install -g foxx-cli`

Create a database called `db_demo` and install services on it :

- `touch .arangodb.yml` (useless, will be removed)
- Go to the foxxy folder and run
- `foxxy upgrade settings --server fasty --database db_demo`
- `foxxy upgrade --server fasty --database db_demo`

# Upgrade ArangoDB version

- `docker-compose run --rm arangodb arangod --database.auto-upgrade`

# Links

* [ArangoDB](https://arangodb.com)
* [Lapis](https://leafo.net/lapis/)
* [OpenResty](https://openresty.org/)
* [Foxxy](https://foxxy.ovh/)

# Benchmarks

It's fast enough ;)

# License (MIT)
