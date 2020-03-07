-- config.moon
config = require "lapis.config"

config "development", ->
  port 8080
  measure_performance false

config "production", ->
  port 80
  num_workers 4
  code_cache "on"
  measure_performance true
  cache_ttl 10

config "test", ->
  port 8081
  measure_performance true

config "db_development", ->
  url "http://12.12.0.6:8529/"
  name "cms"
  login "root"
  pass  "password"

config "db_production", ->
  url "http://12.12.0.6:8529/"
  name "cms"
  login "root"
  pass  "password"

-- for test purpose
config "db_test", ->
  url "http://12.12.0.6:8530/"
  name "cms"
  login "root"
  pass  "password"
