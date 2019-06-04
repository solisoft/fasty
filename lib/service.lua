local http = require('lapis.nginx.http')
local aql
aql = require('lib.arango').aql
local from_json, to_json, trim
do
  local _obj_0 = require('lapis.util')
  from_json, to_json, trim = _obj_0.from_json, _obj_0.to_json, _obj_0.trim
end
local install_service
install_service = function(sub_domain, name)
  os.execute('mkdir -p install_service/' .. sub_domain .. '/' .. name .. '/APP/routes')
  os.execute('mkdir -p install_service/' .. sub_domain .. '/' .. name .. '/APP/scripts')
  local request = '\n    FOR api IN apis\n      FILTER api.name == @name\n      LET routes = (FOR route IN api_routes FILTER route.api_id == api._key RETURN route)\n      LET scripts = (FOR script IN api_scripts FILTER script.api_id == api._key RETURN script)\n      RETURN { api, routes, scripts }\n  '
  local api = aql("db_" .. tostring(sub_domain), request, {
    ['name'] = name
  })
  os.execute('rm --recursive install_service/' .. sub_domain .. '/' .. name)
  return to_json(api)
end
return {
  install_service = install_service
}
