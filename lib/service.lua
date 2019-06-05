local http = require('lapis.nginx.http')
local map, table_index
do
  local _obj_0 = require('lib.utils')
  map, table_index = _obj_0.map, _obj_0.table_index
end
local from_json, to_json, trim
do
  local _obj_0 = require('lapis.util')
  from_json, to_json, trim = _obj_0.from_json, _obj_0.to_json, _obj_0.trim
end
local aql, foxx_services, foxx_install, foxx_upgrade
do
  local _obj_0 = require('lib.arango')
  aql, foxx_services, foxx_install, foxx_upgrade = _obj_0.aql, _obj_0.foxx_services, _obj_0.foxx_install, _obj_0.foxx_upgrade
end
local write_content
write_content = function(filename, content)
  local file = io.open(filename, 'w+')
  io.output(file)
  io.write(content)
  return io.close(file)
end
local read_zipfile
read_zipfile = function(filename)
  local file = io.open(filename, 'r')
  print(filename)
  io.input(file)
  local data = io.read('*all')
  io.close(file)
  return data
end
local install_service
install_service = function(sub_domain, name)
  local path = 'install_service/' .. sub_domain .. '/' .. name
  os.execute('mkdir -p ' .. path .. '/APP/routes')
  os.execute('mkdir -p ' .. path .. '/APP/scripts')
  os.execute('mkdir -p ' .. path .. '/APP/tests')
  local request = '\n    FOR api IN apis\n      FILTER api.name == @name\n      LET routes = (FOR route IN api_routes FILTER route.api_id == api._key RETURN route)\n      LET scripts = (FOR script IN api_scripts FILTER script.api_id == api._key RETURN script)\n      LET tests = (FOR test IN api_tests FILTER test.api_id == api._key RETURN test)\n      RETURN { api, routes, scripts, tests }\n  '
  local api = aql("db_" .. tostring(sub_domain), request, {
    ['name'] = name
  })[1]
  write_content(path .. '/APP/main.js', api.api.code)
  write_content(path .. '/APP/manifest.json', api.api.manifest)
  for k, item in pairs(api.routes) do
    write_content(path .. '/APP/routes/' .. item.name .. '.js', item.javascript)
  end
  for k, item in pairs(api.scripts) do
    write_content(path .. '/APP/scripts/' .. item.name .. '.js', item.javascript)
  end
  for k, item in pairs(api.tests) do
    write_content(path .. '/APP/tests/' .. item.name .. '.js', item.javascript)
  end
  os.execute('cd install_service/' .. sub_domain .. ' && zip -rq ' .. name .. '.zip ' .. name .. '/')
  os.execute('rm --recursive install_service/' .. sub_domain .. '/' .. name)
  local is_existing = table_index(map(from_json(foxx_services("db_" .. tostring(sub_domain))), function(item)
    return item.name
  end), name) ~= nil
  if is_existing then
    foxx_upgrade("db_" .. tostring(sub_domain), name, read_zipfile("install_service/" .. tostring(sub_domain) .. "/" .. tostring(name) .. ".zip"))
  else
    foxx_install("db_" .. tostring(sub_domain), name, read_zipfile("install_service/" .. tostring(sub_domain) .. "/" .. tostring(name) .. ".zip"))
  end
  return 'done'
end
return {
  install_service = install_service
}
