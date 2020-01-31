http = require 'lapis.nginx.http'
import map, table_index from require 'lib.utils'
import from_json, to_json, trim from require 'lapis.util'
import aql, foxx_upgrade from require 'lib.arango'
--------------------------------------------------------------------------------
write_content = (filename, content)->
  file = io.open(filename, 'w+')
  io.output(file)
  io.write(content)
  io.close(file)
--------------------------------------------------------------------------------
read_zipfile = (filename)->
  file = io.open(filename, 'r')
  io.input(file)
  data = io.read('*all')
  io.close(file)
  data
--------------------------------------------------------------------------------
install_service = (sub_domain, name)->
  path = "install_service/#{sub_domain}/#{name}"
  os.execute("mkdir -p #{path}/APP/routes")
  os.execute("mkdir #{path}/APP/scripts")
  os.execute("mkdir #{path}/APP/tests")
  os.execute("mkdir #{path}/APP/libs")

  request = 'FOR api IN apis FILTER api.name == @name
    LET routes = (FOR r IN api_routes FILTER r.api_id == api._key RETURN r)
    LET scripts = (FOR s IN api_scripts FILTER s.api_id == api._key RETURN s)
    LET tests = (FOR t IN api_tests FILTER t.api_id == api._key RETURN t)
    LET libs = (FOR l IN api_libs FILTER l.api_id == api._key RETURN l)
    RETURN { api, routes, scripts, tests, libs }'
  api = aql("db_#{sub_domain}", request, { 'name': name })[1]

  write_content("#{path}/APP/main.js", api.api.code)
  write_content("#{path}/APP/package.json", api.api.package)
  write_content("#{path}/APP/manifest.json", api.api.manifest)

  for k, item in pairs api.routes
    write_content("#{path}/APP/routes/#{item.name}.js", item.javascript)

  for k, item in pairs api.libs
    write_content("#{path}/APP/libs/#{item.name}.js", item.javascript)

  for k, item in pairs api.scripts
    write_content("#{path}/APP/scripts/#{item.name}.js", item.javascript)

  for k, item in pairs api.tests
    write_content("#{path}/APP/tests/#{item.name}.js", item.javascript)

  os.execute("cd install_service/#{sub_domain}/#{name}/APP && export PATH='$PATH:/usr/local/bin' && yarn")
  os.execute("cd install_service/#{sub_domain} && zip -rq #{name}.zip #{name}/")
  os.execute("rm --recursive install_service/#{sub_domain}/#{name}")

  foxx_upgrade(
    "db_#{sub_domain}", name, read_zipfile("install_service/#{sub_domain}/#{name}.zip")
  )
--------------------------------------------------------------------------------
deploy_site = (sub_domain, settings) ->
  config = require('lapis.config').get!
  db_config = require('lapis.config').get("db_#{config._name}")
  path = "dump/#{sub_domain}/"
  os.execute("mkdir -p #{path}")
  home = from_json(settings.home)

  command = "arangodump --collection layouts --collection partials --collection components --collection spas --collection redirections --collection datatypes --collection aqls --collection helpers --collection apis --collection api_libs --collection api_routes --collection api_scripts --collection api_tests --collection sripts --collection pages --collection trads --collection uploads --collection folder_path --collection folders --include-system-collections true --server.database db_#{sub_domain} --server.username #{db_config.login} --server.password #{db_config.pass} --server.endpoint #{db_config.endpoint} --output-directory #{path} --overwrite true"
  command ..= " --collection datasets" if home['deploy_datasets']

  os.execute(command)

  os.execute("arangorestore --include-system-collections true --server.database #{settings.deploy_secret} --server.username #{db_config.login} --server.password #{db_config.pass} --server.endpoint #{db_config.endpoint}  --input-directory #{path} --overwrite true")
  os.execute("rm -Rf #{path}")
--------------------------------------------------------------------------------
install_script = (sub_domain, name) ->
  path = "scripts/#{sub_domain}/#{name}"
  os.execute("mkdir -p #{path}")
  request = 'FOR script IN scripts FILTER script.name == @name RETURN script'
  script = aql("db_#{sub_domain}", request, { 'name': name })[1]
  write_content("#{path}/package.json", script.package)
  os.execute("export PATH='$PATH:/usr/local/bin' && cd #{path} && yarn")
  write_content("#{path}/index.js", script.code)
--------------------------------------------------------------------------------
-- expose methods
{ :install_service, :install_script, :deploy_site }