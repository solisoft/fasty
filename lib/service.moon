http = require 'lapis.nginx.http'

import map, table_index from require 'lib.utils'
import from_json, to_json, trim from require 'lapis.util'
import aql, foxx_services, foxx_install, foxx_upgrade from require 'lib.arango'

--------------------------------------------------------------------------------
write_content = (filename, content)->
  file = io.open(filename, 'w+')
  io.output(file)
  io.write(content)
  io.close(file)
--------------------------------------------------------------------------------
read_zipfile = (filename)->
  file = io.open(filename, 'r')
  print(filename)
  io.input(file)
  data = io.read('*all')
  io.close(file)
  data
--------------------------------------------------------------------------------
install_service = (sub_domain, name)->
  path = 'install_service/' .. sub_domain .. '/' .. name
  os.execute('mkdir -p ' .. path .. '/APP/routes')
  os.execute('mkdir -p ' .. path .. '/APP/scripts')
  os.execute('mkdir -p ' .. path .. '/APP/tests')

  request = '
    FOR api IN apis
      FILTER api.name == @name
      LET routes = (FOR route IN api_routes FILTER route.api_id == api._key RETURN route)
      LET scripts = (FOR script IN api_scripts FILTER script.api_id == api._key RETURN script)
      LET tests = (FOR test IN api_tests FILTER test.api_id == api._key RETURN test)
      RETURN { api, routes, scripts, tests }
  '
  api = aql("db_#{sub_domain}", request, { 'name': name })[1]

  write_content("#{path}/APP/main.js", api.api.code)
  write_content("#{path}/APP/manifest.json", api.api.manifest)

  for k, item in pairs api.routes
    write_content("#{path}/APP/routes/#{item.name}.js", item.javascript)

  for k, item in pairs api.scripts
    write_content("#{path}/APP/scripts/#{item.name}.js", item.javascript)

  for k, item in pairs api.tests
    write_content("#{path}/APP/tests/#{item.name}.js", item.javascript)

  -- Install the service
  os.execute("cd install_service/#{sub_domain} && zip -rq #{name} .zip #{name}/")
  os.execute("rm --recursive install_service/#{sub_domain}/#{name}")
  is_existing = table_index(
    map(from_json(foxx_services("db_#{sub_domain}")), (item)-> item.name),
    name
  ) != nil

  if is_existing
    foxx_upgrade(
      "db_#{sub_domain}", name,
      read_zipfile("install_service/#{sub_domain}/#{name}.zip")
    )
  else
    foxx_install(
      "db_#{sub_domain}", name,
      read_zipfile("install_service/#{sub_domain}/#{name}.zip")
    )
  'done'
--------------------------------------------------------------------------------
-- expose methods
{ :install_service }