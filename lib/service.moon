http    = require 'lapis.nginx.http'
stringy = require 'stringy'
sass    = require 'sass'

import map, table_index from require 'lib.utils'
import from_json, to_json, trim from require 'lapis.util'
import aql, document_get, foxx_upgrade from require 'lib.arango'
--------------------------------------------------------------------------------
write_content = (filename, content)->
  file = io.open(filename, 'w+')
  io.output(file)
  io.write(content)
  io.close(file)
--------------------------------------------------------------------------------
read_file = (filename)->
  file = io.open(filename, 'r')
  io.input(file)
  data = io.read('*all')
  io.close(file)
  data
--------------------------------------------------------------------------------
install_service = (sub_domain, name)->
  if name\match('^[%w_%-%d]+$') -- allow only [a-zA-Z0-9_-]+
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
    for k, item in pairs api.tests
      write_content("#{path}/APP/tests/#{item.name}.js", item.javascript)
    for k, item in pairs api.libs
      write_content("#{path}/APP/libs/#{item.name}.js", item.javascript)
    for k, item in pairs api.scripts
      write_content("#{path}/APP/scripts/#{item.name}.js", item.javascript)

    os.execute("cd install_service/#{sub_domain}/#{name}/APP && export PATH='$PATH:/usr/local/bin' && yarn")
    os.execute("cd install_service/#{sub_domain} && zip -rq #{name}.zip #{name}/")
    os.execute("rm --recursive install_service/#{sub_domain}/#{name}")

    foxx_upgrade(
      "db_#{sub_domain}", name, read_file("install_service/#{sub_domain}/#{name}.zip")
    )
--------------------------------------------------------------------------------
install_script = (sub_domain, name) ->
  if name\match('^[%w_%-%d]+$') -- allow only [a-zA-Z0-9_-]+
    path = "scripts/#{sub_domain}/#{name}"
    os.execute("mkdir -p #{path}")
    request = 'FOR script IN scripts FILTER script.name == @name RETURN script'
    script = aql("db_#{sub_domain}", request, { 'name': name })[1]
    write_content("#{path}/package.json", script.package)
    os.execute("export PATH='$PATH:/usr/local/bin' && cd #{path} && yarn")
    write_content("#{path}/index.js", script.code)
--------------------------------------------------------------------------------
deploy_site = (sub_domain, settings) ->
  config = require('lapis.config').get!
  db_config = require('lapis.config').get("db_#{config._name}")
  path = "dump/#{sub_domain[1]}/"
  home = from_json(settings.home)
  deploy_to = stringy.split(settings.deploy_secret, "#")

  request = 'FOR s IN settings LIMIT 1 RETURN s'
  sub_domain_settings = aql(deploy_to[1], request)[1]

  if deploy_to[2] == sub_domain_settings.secret
    os.execute("mkdir -p #{path}")
    command = "arangodump --collection layouts --collection partials --collection components --collection spas --collection redirections --collection datatypes --collection aqls --collection helpers --collection apis --collection api_libs --collection api_routes --collection api_scripts --collection api_tests --collection sripts --collection pages --collection folder_path --collection folders --collection scripts --include-system-collections true --server.database db_#{sub_domain} --server.username #{db_config.login} --server.password #{db_config.pass} --server.endpoint #{db_config.endpoint} --output-directory #{path} --overwrite true"
    command ..= " --collection datasets" if home['deploy_datasets']
    command ..= " --collection trads" if home['deploy_trads']

    os.execute(command)

    os.execute("arangorestore --include-system-collections true --server.database #{deploy_to[1]} --server.username #{db_config.login} --server.password #{db_config.pass} --server.endpoint #{db_config.endpoint}  --input-directory #{path} --overwrite true")
    os.execute("rm -Rf #{path}")

    -- Restart scripts
    -- scripts = aql(deploy_to[1], 'FOR script IN scripts RETURN script')
    -- for k, item in pairs scripts
    --   install_script(deploy_to[1], item.name)

    -- Restart apis
    apis = aql(deploy_to[1], 'FOR api IN apis RETURN api')
    for k, item in pairs apis
      install_service(deploy_to[1]\gsub('db_', ''), item.name)
--------------------------------------------------------------------------------
compile_riotjs = (sub_domain, name, tag) ->
  if name\match('^[%w_%-%d]+$') -- allow only [a-zA-Z0-9_-]+
    path = "compile_tag/#{sub_domain}/#{name}"
    os.execute("mkdir -p #{path}")
    write_content("#{path}/#{name}.riot", tag)

    command = "export PATH=\"$PATH;/usr/local/bin\" && riot --format umd #{path}/#{name}.riot --output #{path}/#{name}.js && terser --compress --mangle -o #{path}/#{name}.js #{path}/#{name}.js"
    handle = io.popen(command)
    result = handle\read("*a")
    handle\close()

    read_file("#{path}/#{name}.js")
--------------------------------------------------------------------------------
compile_tailwindcss = (sub_domain, layout_id, field) ->
  subdomain = 'db_' .. sub_domain
  layout = document_get(subdomain, "layouts/" .. layout_id)
  settings = aql(subdomain, 'FOR s IN settings LIMIT 1 RETURN s')[1]
  home_settings = from_json(settings.home)
  langs = stringy.split(settings.langs, ",")

  path = "compile_tailwind/#{subdomain}/#{layout_id}"
  os.execute("mkdir -p #{path}")

  write_content("#{path}/#{layout_id}.css", sass.compile(layout[field], 'compressed'))

  -- default config file
  config_file = "module.exports = {
    purge: ['./*.html'],
    darkMode: false,
    theme: { extend: {} },
    variants: {},
    plugins: []
  }"

  -- check if we have defined a config file
  if home_settings.tailwindcss_config
    config_file = aql(
      subdomain,
      'FOR page IN partials FILTER page.slug == @slug RETURN page.html',
      { slug: home_settings.tailwindcss_config }
    )[1]

  write_content("#{path}/tailwind.config.js", config_file) if config_file
  -- Layouts
  layouts = aql(subdomain, 'FOR doc IN layouts RETURN { html: doc.html }')
  for k, item in pairs layouts
    write_content("#{path}/layout_#{k}.html", item.html)

  -- Pages
  pages = aql(subdomain, 'FOR doc IN pages RETURN { html: doc.html, raw_html: doc.raw_html }')
  for k, item in pairs pages
    for k2, lang in pairs langs
      lang = stringy.strip(lang)
      html = ""
      if type(item["raw_html"]) == "table" and item["raw_html"][lang]
      	html = html .. item["raw_html"][lang]
      if type(item["html"]) == "table" and item["html"][lang] and item["html"][lang].html
          html = html .. item["html"][lang].html
      write_content("#{path}/page_#{k}_#{lang}.html", html)

  -- Components
  components = aql(subdomain, 'FOR doc IN components RETURN { html: doc.html }')
  for k, item in pairs components
    write_content("#{path}/component_#{k}.html", item.html)

  -- Partials
  partials = aql(subdomain, 'FOR doc IN partials RETURN { html: doc.html }')
  for k, item in pairs partials
    write_content("#{path}/partial_#{k}.html", item.html)

  command = "cd #{path} && export PATH=\"$PATH;/usr/local/bin\" && NODE_ENV=production tailwindcss build #{layout_id}.css -o #{layout_id}_compiled.css"
  handle = io.popen(command)
  result = handle\read("*a")
  handle\close()

  data = read_file("#{path}/#{layout_id}_compiled.css")
  os.execute("rm -Rf #{path}")

  data

--------------------------------------------------------------------------------
-- expose methods
{ :install_service, :install_script, :deploy_site, :compile_riotjs, :compile_tailwindcss }