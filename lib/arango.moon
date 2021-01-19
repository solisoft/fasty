import table_merge, table_deep_merge from require 'lib.utils'
import from_json, to_json from require 'lapis.util'

jwt       = ''
db_config = {}
--------------------------------------------------------------------------------
http_request = (url, method, body, headers) ->
  http.simple { url: url, method: method, body: body, headers: headers }
--------------------------------------------------------------------------------
list_databases = () ->
  body, status_code, headers = http_request(
    db_config.url .. '_api/user/' .. db_config.login .. '/database', 'GET',
    {}, { Authorization: "bearer #{jwt}" }
  )
  from_json(body)['result']
--------------------------------------------------------------------------------
auth_arangodb = (db_name, cfg)->
  db_config = cfg
  body, status_code, headers = http_request(
    db_config.url .. '_open/auth', 'POST',
    to_json({ username: db_config.login, password: db_config.pass })
  )
  jwt = from_json(body)['jwt'] if status_code == 200
  jwt
--------------------------------------------------------------------------------
raw_aql = (db_name, stm)->
  body, status_code, headers = http_request(
    db_config.url .. "_db/#{db_name}/_api/cursor", 'POST',
    to_json(stm), { Authorization: "bearer #{jwt}" }
  )
  res       = from_json(body)
  result    = res['result']
  has_more  = res['hasMore']

  if res['error'] then
    print(status_code)
    print(to_json(stm))
    print(body)

  while has_more
    body, status_code, headers = http_request(
      db_config.url .. "_db/#{db_name}/_api/cursor/#{res["id"]}", 'PUT',
      {}, { Authorization: "bearer #{jwt}" }
    )

    more      = from_json(body)
    result    = table_merge(result,  more['result'])
    has_more  = more['hasMore']

  result = {} if result == nil
  result
--------------------------------------------------------------------------------
aql = (db_name, str, bindvars = {}, options = {})->
  raw_aql(db_name, table_deep_merge({ query: str, cache: true, bindVars: bindvars }, options))
--------------------------------------------------------------------------------
with_params = (db_name, method, handle, params)->
  body, status_code, headers = http_request(
    db_config.url .. "_db/#{db_name}/_api/document/" .. handle, method,
    to_json(params), { Authorization: "bearer #{jwt}" }
  )
  from_json(body)
--------------------------------------------------------------------------------
without_params = (db_name, method, handle)->
  body, status_code, headers = http_request(
    db_config.url .. "_db/#{db_name}/_api/document/" .. handle, method,
    {}, { Authorization: "bearer #{jwt}" }
  )
  from_json(body)
--------------------------------------------------------------------------------
document_put = (db_name, handle, params)-> with_params(db_name, 'PUT', handle, params)
--------------------------------------------------------------------------------
document_post = (db_name, handle, params)-> with_params(db_name, 'POST', handle, params)
--------------------------------------------------------------------------------
document_get = (db_name, handle)-> without_params(db_name, 'GET', handle)
--------------------------------------------------------------------------------
document_delete = (db_name, handle)-> without_params(db_name, 'DELETE', handle)
--------------------------------------------------------------------------------
transaction = (db_name, params)->
  body, status_code, headers = http_request(
    "#{db_config.url}/_db/#{db_name}/_api/transaction", method,
    to_json(params), { Authorization: "bearer #{jwt}" }
  )
  body
--------------------------------------------------------------------------------
foxx_services = (db_name)->
  body, status_code, headers = http_request(
    "#{db_config.url}/_db/#{db_name}/_api/foxx?excludeSystem=true", 'GET',
    {}, { Authorization: "bearer #{jwt}" }
  )
  body
--------------------------------------------------------------------------------
foxx_install = (db_name, mount, data)->
  body, status_code, headers = http_request(
    "#{db_config.url}/_db/#{db_name}/_api/foxx?mount=/#{mount}", 'POST',
    data, { 'Content-Type': 'application/zip', Authorization: "bearer #{jwt}" }
  )
  body
--------------------------------------------------------------------------------
foxx_upgrade = (db_name, mount, data)->
  body, status_code, headers = http_request(
    "#{db_config.url}/_db/#{db_name}/_api/foxx/service?mount=/#{mount}&force=true", 'PATCH',
    data, { 'Content-Type': 'application/zip', Authorization: "bearer #{jwt}" }
  )
  body
--------------------------------------------------------------------------------
-- expose methods
{ :auth_arangodb, :aql, :document_get, :document_put, :document_post,
  :document_delete, :transaction, :raw_aql, :list_databases,
  :foxx_services, :foxx_install, :foxx_upgrade }