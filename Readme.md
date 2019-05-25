# Lapis + ArangoDB

`docker-compose up --build`

For running only dev mode : `docker-compose up web --build`

For watching / compiling *.moon files : `dc exec cms moonc -w  **/*.moon`

It will launch the lapis instance + an arangoDB one

* To access ArangoDB UI : `http://localhost:8530`
* To access Foxxy app : `http://demo.127.0.0.1.xip.io:4001`
* To access Lapis app (dev) : `http://demo.127.0.0.1.xip.io:8080`
* To access Lapis app (prod) : `http://demo.127.0.0.1.xip.io:9090`

# Installation

Install foxxy & foxx-cli as global npm modules

`sudo npm install -g foxxy`
`sudo npm install -g foxx-cli`

Create a database called `db_cms` and install services on it :

- `touch .arangodb.yml` (useless, will be removed)
- Go to the foxxy folder and run
- `foxxy upgrade settings --server fasty --database db_cms` 
- `foxxy upgrade --server fasty --database db_cms` 

# Links

* [ArangoDB](https://arangodb.com)
* [Lapis](http://leafo.net/lapis/)

# Benchmarks

I used [weighttp](https://github.com/lighttpd/weighttp) for running some tests on my laptop. I was able to run 2000req/s without micro-caching.

9000req/s with a 0.2s micro-caching enabled.

`weighttp -n 10000 -c 100 -k -t 4 http://localhost:9090`