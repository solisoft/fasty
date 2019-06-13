local table_merge
table_merge = require('lib.utils').table_merge
local from_json, to_json
do
  local _obj_0 = require('lapis.util')
  from_json, to_json = _obj_0.from_json, _obj_0.to_json
end
local http = require('lapis.nginx.http')
local config = require('lapis.config').get()
local jwt = ''
local db_config = { }
local http_request
http_request = function(url, method, body, headers)
  return http.simple({
    url = url,
    method = method,
    body = body,
    headers = headers
  })
end
local list_databases
list_databases = function()
  db_config = require('lapis.config').get("db_" .. tostring(config._name))
  local body, status_code, headers = http_request(db_config.url .. '_api/user/' .. db_config.login .. '/database', 'GET', { }, {
    Authorization = "bearer " .. tostring(jwt)
  })
  return from_json(body)['result']
end
local auth_arangodb
auth_arangodb = function(db_name)
  db_config = require('lapis.config').get("db_" .. tostring(config._name))
  local body, status_code, headers = http_request(db_config.url .. '_open/auth', 'POST', to_json({
    username = db_config.login,
    password = db_config.pass
  }))
  if status_code == 200 then
    jwt = from_json(body)['jwt']
  end
  return jwt
end
local raw_aql
raw_aql = function(db_name, stm)
  local body, status_code, headers = http_request(db_config.url .. "_db/" .. tostring(db_name) .. "/_api/cursor", 'POST', to_json(stm), {
    Authorization = "bearer " .. tostring(jwt)
  })
  local res = from_json(body)
  local result = res['result']
  local has_more = res['hasMore']
  if res['error'] then
    print(to_json(stm))
    print(body)
  end
  while has_more do
    body, status_code, headers = http_request(db_config.url .. "_db/" .. tostring(db_name) .. "/_api/cursor/" .. tostring(res["id"]), 'PUT', { }, {
      Authorization = "bearer " .. tostring(jwt)
    })
    local more = from_json(body)
    result = table_merge(result, more['result'])
    has_more = more['hasMore']
  end
  if result == nil then
    result = { }
  end
  return result
end
local aql
aql = function(db_name, str, bindvars)
  if bindvars == nil then
    bindvars = { }
  end
  return raw_aql(db_name, {
    query = str,
    cache = true,
    bindVars = bindvars
  })
end
local with_params
with_params = function(db_name, method, handle, params)
  local body, status_code, headers = http_request(db_config.url .. "_db/" .. tostring(db_name) .. "/_api/document/" .. handle, method, to_json(params), {
    Authorization = "bearer " .. tostring(jwt)
  })
  return from_json(body)
end
local without_params
without_params = function(db_name, method, handle)
  local body, status_code, headers = http_request(db_config.url .. "_db/" .. tostring(db_name) .. "/_api/document/" .. handle, method, { }, {
    Authorization = "bearer " .. tostring(jwt)
  })
  return from_json(body)
end
local document_put
document_put = function(db_name, handle, params)
  return with_params(db_name, 'PUT', handle, params)
end
local document_post
document_post = function(db_name, collection, params)
  return with_params(db_name, 'POST', collection, params)
end
local document_get
document_get = function(db_name, handle)
  return without_params(db_name, 'GET', handle)
end
local document_delete
document_delete = function(db_name, handle)
  return without_params(db_name, 'DELETE', handle)
end
local transaction
transaction = function(db_name, params)
  local body, status_code, headers = http_request(tostring(db_config.url) .. "/_db/" .. tostring(db_name) .. "/_api/transaction", method, to_json(params), {
    Authorization = "bearer " .. tostring(jwt)
  })
  return body
end
local foxx_services
foxx_services = function(db_name)
  local body, status_code, headers = http_request(tostring(db_config.url) .. "/_db/" .. tostring(db_name) .. "/_api/foxx?excludeSystem=true", 'GET', { }, {
    Authorization = "bearer " .. tostring(jwt)
  })
  return body
end
local foxx_install
foxx_install = function(db_name, mount, data)
  local body, status_code, headers = http_request(tostring(db_config.url) .. "/_db/" .. tostring(db_name) .. "/_api/foxx?mount=/" .. tostring(mount), 'POST', data, {
    ['Content-Type'] = 'application/zip',
    Authorization = "bearer " .. tostring(jwt)
  })
  print(to_json(body))
  return body
end
local foxx_upgrade
foxx_upgrade = function(db_name, mount, data)
  local body, status_code, headers = http_request(tostring(db_config.url) .. "/_db/" .. tostring(db_name) .. "/_api/foxx/service?mount=/" .. tostring(mount) .. "&force=true", 'PATCH', data, {
    ['Content-Type'] = 'application/zip',
    Authorization = "bearer " .. tostring(jwt)
  })
  return body
end
return {
  auth_arangodb = auth_arangodb,
  aql = aql,
  document_get = document_get,
  document_put = document_put,
  document_post = document_post,
  document_delete = document_delete,
  transaction = transaction,
  raw_aql = raw_aql,
  list_databases = list_databases,
  foxx_services = foxx_services,
  foxx_install = foxx_install,
  foxx_upgrade = foxx_upgrade
}
