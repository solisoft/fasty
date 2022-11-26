lapis     = require 'lapis'
shell     = require 'resty.shell'
stringy   = require 'stringy'
console   = require 'lapis.console'
config    = require('lapis.config').get!
db_config = require('lapis.config').get("db_#{config._name}")

import aqls from require 'lib.aqls'
import validate from require 'lapis.validate'
import respond_to from require 'lapis.application'
import from_json, to_json from require 'lapis.util'
import dynamic_page, dynamic_replace from require 'lib.concerns'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import install_service, install_script, deploy_site, compile_riotjs, compile_tailwindcss from require 'lib.service'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''
last_db_connect = os.time(os.date("!*t"))

--------------------------------------------------------------------------------
define_subdomain = () =>
  sub_domain = @req.headers['x-app'] or stringy.split(@req.headers.host, '.')[1]
--------------------------------------------------------------------------------
load_settings = () =>
  define_subdomain(@)
  if (os.time(os.date("!*t")) - last_db_connect) > (config.db_ttl and config.db_ttl or 10)
    jwt[sub_domain] = nil
    last_db_connect = os.time(os.date("!*t"))

  jwt[sub_domain] = auth_arangodb(sub_domain, db_config) if jwt[sub_domain] == nil or all_domains == nil
  all_domains = list_databases! if all_domains == nil
  if all_domains["db_#{sub_domain}"] == nil
    no_db[sub_domain] = true
  else
    global_data[sub_domain] = aql("db_#{sub_domain}", aqls.settings)['result'][1]
    global_data[sub_domain]['partials'] = {}

    settings[sub_domain] = global_data[sub_domain].settings[1]

class FastyServices extends lapis.Application
  ------------------------------------------------------------------------------
  [service: '/service/:name']: respond_to {
    POST: =>
      load_settings(@)
      if @params.token == settings[sub_domain].token
        install_service(sub_domain, @params.name)
        'service installed'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  -- install script server side
  [script: '/script/:name']: respond_to {
    POST: =>
      load_settings(@)
      if @params.token == settings[sub_domain].token
        install_script(sub_domain, @params.name)
        'script installed'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  -- deploy site to next stage
  [deploy: '/deploy']: respond_to {
    POST: =>
      load_settings(@)
      if @params.token == settings[sub_domain].token
        deploy_site(sub_domain, settings[sub_domain])
        'site deployed'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  -- reset variables for specific sub domain
  [reset_all: '/admin/reset_all']: =>
    define_subdomain(@)

    jwt[sub_domain] = nil
    global_data[sub_domain] = nil
    all_domains = nil
    settings[sub_domain] = nil
    'ok'
  ------------------------------------------------------------------------------
  -- json 2 html
  -- build HTML content based on structured data provided by the html widget
  [build_html: '/build_html']: respond_to {
    POST: =>
      load_settings(@)
      dynamic_page(
        "db_#{sub_domain}",
        {
          item: { html: { json: from_json(@params.json) }},
          layout: { page_builder: @params.page_builder }
        },
        { lang: @params.lang }, global_data[sub_domain], {}, false
      )
  }
  ------------------------------------------------------------------------------
  -- riotjs compiler
  [riotjs: '/riotjs']: respond_to {
    POST: =>
      load_settings(@)
      is_valid = validate(
        { 'name': @params.name }, {{ 'name', matches_pattern: '^[%w%-_]+$' }}
      )
      if is_valid == nil and (config._name == 'development' or @params.token == settings[sub_domain].secret)
        compile_riotjs(sub_domain, @params.name, @params.id)
  }
  ------------------------------------------------------------------------------
  -- tailwindcss compiler
  [tailwindcss: '/tailwindcss']: respond_to {
    POST: =>
      load_settings(@)
      is_valid = validate(
        { 'id': @params.id, 'field': @params.field },
        {
          { 'id', matches_pattern: '^[%d]+$' },
          { 'field', matches_pattern: '^[%w%-_]+$' }
        }
      )
      if is_valid == nil and @params.token == settings[sub_domain].secret
        compile_tailwindcss(sub_domain, @params.id, @params.field)
  }
  ------------------------------------------------------------------------------
  -- console (kinda irb console in dev mode)
  [console: '/console']: console.make!