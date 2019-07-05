import from_json, to_json from require 'lapis.util'
http  = require 'lapis.nginx.http'
--------------------------------------------------------------------------------
http_request = (url, method, body, headers) ->
  headers = {} if headers == nil
  body    = {} if body == nil
  html, status, h = http.simple {
    url: url, method: method, body: body, headers: headers
  }
  html
--------------------------------------------------------------------------------
http_get = (url, headers) -> http_request(url, 'GET', {}, headers)
--------------------------------------------------------------------------------
http_put = (url, data, headers) -> http_request(url, 'PUT', data, headers)
--------------------------------------------------------------------------------
http_patch = (url, data, headers) -> http_request(url, 'PATCH', data, headers)
--------------------------------------------------------------------------------
http_post = (url, data, headers) -> http_request(url, 'POST', data, headers)
--------------------------------------------------------------------------------
http_delete = (url, headers) -> http_request(url, 'DEL', data, headers)
--------------------------------------------------------------------------------
-- expose methods
{ :http_request, :http_get, :http_put, :http_patch, :http_post, :http_delete }