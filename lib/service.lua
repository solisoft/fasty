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
local aql, foxx_upgrade
do
  local _obj_0 = require('lib.arango')
  aql, foxx_upgrade = _obj_0.aql, _obj_0.foxx_upgrade
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
  io.input(file)
  local data = io.read('*all')
  io.close(file)
  return data
end
local install_service
install_service = function(sub_domain, name)
  local path = "install_service/" .. tostring(sub_domain) .. "/" .. tostring(name)
  os.execute("mkdir -p " .. tostring(path) .. "/APP/routes")
  os.execute("mkdir " .. tostring(path) .. "/APP/scripts")
  os.execute("mkdir " .. tostring(path) .. "/APP/tests")
  os.execute("mkdir " .. tostring(path) .. "/APP/libs")
  local request = 'FOR api IN apis FILTER api.name == @name\n    LET routes = (FOR r IN api_routes FILTER r.api_id == api._key RETURN r)\n    LET scripts = (FOR s IN api_scripts FILTER s.api_id == api._key RETURN s)\n    LET tests = (FOR t IN api_tests FILTER t.api_id == api._key RETURN t)\n    LET libs = (FOR l IN api_libs FILTER l.api_id == api._key RETURN l)\n    RETURN { api, routes, scripts, tests, libs }'
  local api = aql("db_" .. tostring(sub_domain), request, {
    ['name'] = name
  })[1]
  write_content(tostring(path) .. "/APP/main.js", api.api.code)
  write_content(tostring(path) .. "/APP/package.json", api.api.package)
  write_content(tostring(path) .. "/APP/manifest.json", api.api.manifest)
  for k, item in pairs(api.routes) do
    write_content(tostring(path) .. "/APP/routes/" .. tostring(item.name) .. ".js", item.javascript)
  end
  for k, item in pairs(api.libs) do
    write_content(tostring(path) .. "/APP/libs/" .. tostring(item.name) .. ".js", item.javascript)
  end
  for k, item in pairs(api.scripts) do
    write_content(tostring(path) .. "/APP/scripts/" .. tostring(item.name) .. ".js", item.javascript)
  end
  for k, item in pairs(api.tests) do
    write_content(tostring(path) .. "/APP/tests/" .. tostring(item.name) .. ".js", item.javascript)
  end
  os.execute("cd install_service/" .. tostring(sub_domain) .. "/" .. tostring(name) .. "/APP && /usr/bin/npm i")
  os.execute("cd install_service/" .. tostring(sub_domain) .. " && zip -rq " .. tostring(name) .. ".zip " .. tostring(name) .. "/")
  os.execute("rm --recursive install_service/" .. tostring(sub_domain) .. "/" .. tostring(name))
  return foxx_upgrade("db_" .. tostring(sub_domain), name, read_zipfile("install_service/" .. tostring(sub_domain) .. "/" .. tostring(name) .. ".zip"))
end
local deploy_site
deploy_site = function(sub_domain, settings)
  local config = require('lapis.config').get()
  local db_config = require('lapis.config').get("db_" .. tostring(config._name))
  local path = "dump/" .. tostring(sub_domain) .. "/"
  os.execute("mkdir -p " .. tostring(path))
  os.execute("arangodump --collection layouts --collection partials --collection components --collection spas --collection redirections --collection datatypes --collection aqls --collection helpers --collection apis --collection sripts --collection pages --collection trads --collection datasets --include-system-collections true --server.database db_" .. tostring(sub_domain) .. " --server.username " .. tostring(db_config.login) .. " --server.password " .. tostring(db_config.pass) .. " --server.endpoint http+tcp://172.31.0.6:8529 --output-directory " .. tostring(path) .. " --overwrite true")
  os.execute("arangorestore --include-system-collections true --server.database " .. tostring(settings.deploy_secret) .. " --server.username " .. tostring(db_config.login) .. " --server.password " .. tostring(db_config.pass) .. " --server.endpoint http+tcp://172.31.0.6:8529 --input-directory " .. tostring(path) .. " --overwrite true")
  return os.execute("rm -Rf " .. tostring(path))
end
local install_script
install_script = function(sub_domain, name)
  local path = "scripts/" .. tostring(sub_domain) .. "/" .. tostring(name)
  os.execute("mkdir -p " .. tostring(path))
  local request = 'FOR script IN scripts FILTER script.name == @name RETURN script'
  local script = aql("db_" .. tostring(sub_domain), request, {
    ['name'] = name
  })[1]
  write_content(tostring(path) .. "/package.json", script.package)
  os.execute("export PATH='$PATH:/usr/local/bin' && cd " .. tostring(path) .. " && yarn")
  return write_content(tostring(path) .. "/index.js", script.code)
end
return {
  install_service = install_service,
  install_script = install_script,
  deploy_site = deploy_site
}
