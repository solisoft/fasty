cjson = require 'cjson.safe'

import table_merge, table_deep_merge from require 'lib.utils'

from_json = (str) -> cjson.decode(str)
to_json   = (obj) -> cjson.encode(obj)

jwt       = ""
db_config = {}
--------------------------------------------------------------------------------
http_request = (url, method, body, headers)->
  http.simple { url: url, method: method, body: body, headers: headers }
--------------------------------------------------------------------------------
api_url = (db_name, path)->
  "#{db_config.url}/_db/#{db_name}/_api#{path}"
--------------------------------------------------------------------------------
api_run = (db_name, path, method, params={}, headers={})->
  body, status_code, h = http_request(
    api_url(db_name, path), method,
    to_json(params), table_merge({ Authorization: "bearer #{jwt}" }, headers)
  )

  from_json(body), status_code, h
--------------------------------------------------------------------------------
list_databases = ()->
  body = http_request(
    "#{db_config.url}_api/user/#{db_config.login}/database", "GET",
    {}, { Authorization: "bearer #{jwt}" }
  )
  from_json(body)['result']
--------------------------------------------------------------------------------
auth_arangodb = (db_name, cfg)->
  db_config = cfg
  body, status_code = http_request(
    "#{db_config.url}_open/auth", "POST",
    to_json({ username: db_config.login, password: db_config.pass })
  )
  jwt = from_json(body)['jwt'] if status_code == 200
  jwt
--------------------------------------------------------------------------------
raw_aql = (db_name, stm)->
  body, status_code = api_run(db_name, '/cursor', 'POST', stm)
  result    = body['result']
  has_more  = body['hasMore']

  if body['error'] then
    print(status_code)
    print(to_json(stm))
    print(to_json(body))

  while has_more
    body      = api_run(db_name, "/cursor/#{body["id"]}", 'PUT')
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
  api_run(db_name, "/document/#{handle}", method, params)
--------------------------------------------------------------------------------
without_params = (db_name, method, handle)->
  api_run(db_name, "/document/#{handle}", method)
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
  api_run(db_name, '/transaction', 'POST', params)
--------------------------------------------------------------------------------
-- stream_transaction(db_name, 'POST', "begin", { some: params })  -- Begin
-- stream_transaction(db_name, 'PUT', 1234)  -- Commit
-- stream_transaction(db_name, 'DELETE', 1234)  -- Abort
stream_transaction = (db_name, method, id, params={})->
  api_run(db_name, "/transaction/#{id}", method, params)
--------------------------------------------------------------------------------
-- create_index(
--    db_name, "ttl",
--    { "type" : "ttl", "expireAfter" : 3600, "fields" : [ "createdAt" ] }
-- )
create_index = (db_name, type, params)->
  api_run(db_name, "/index##{type}", 'POST', params)
--------------------------------------------------------------------------------
delete_index = (db_name, id)->
  api_run(db_name, "/index/#{id}", 'DELETE')
--------------------------------------------------------------------------------
get_index = (db_name, id)->
  api_run(db_name, "/index/#{id}", 'GET')
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