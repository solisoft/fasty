# Fasty

https://fasty.ovh

A CMS built on top of openresty/lapis & arangodb

# Installation

You need to have `docker` & `docker-compose` installed properly.

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
* [Lapis](https://leafo.net/lapis/)
* [Openresty](https://openresty.org/)
* [Foxxy](https://foxxy.ovh/)

# Benchmarks

It's fast enough ;)

# License (MIT)

Copyright (C) 2018 by Leaf Corcoran

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.