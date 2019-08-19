local from_json, to_json
do
  local _obj_0 = require('lapis.util')
  from_json, to_json = _obj_0.from_json, _obj_0.to_json
end
local http_request
http_request = function(url, method, body, headers)
  if headers == nil then
    headers = { }
  end
  if body == nil then
    body = { }
  end
  local html, status, h = http.simple({
    url = url,
    method = method,
    body = body,
    headers = headers
  })
  return html
end
local http_get
http_get = function(url, headers)
  return http_request(url, 'GET', { }, headers)
end
local http_put
http_put = function(url, data, headers)
  return http_request(url, 'PUT', data, headers)
end
local http_patch
http_patch = function(url, data, headers)
  return http_request(url, 'PATCH', data, headers)
end
local http_post
http_post = function(url, data, headers)
  return http_request(url, 'POST', data, headers)
end
local http_delete
http_delete = function(url, headers)
  return http_request(url, 'DEL', data, headers)
end
return {
  http_request = http_request,
  http_get = http_get,
  http_put = http_put,
  http_patch = http_patch,
  http_post = http_post,
  http_delete = http_delete
}
