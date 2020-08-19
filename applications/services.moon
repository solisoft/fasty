lapis   = require "lapis"
shell   = require 'resty.shell'
stringy = require 'stringy'
console = require 'lapis.console'

import aqls from require 'lib.aqls'
import from_json from require 'lapis.util'
import dynamic_page from require 'lib.concerns'
import respond_to from require 'lapis.application'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import install_service, install_script, deploy_site from require 'lib.service'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''

--------------------------------------------------------------------------------
define_subdomain = () =>
  sub_domain = stringy.split(@req.headers.host, '.')[1]
--------------------------------------------------------------------------------
load_settings = () =>
  define_subdomain(@)
  jwt[sub_domain] = auth_arangodb(sub_domain) if jwt[sub_domain] == nil or all_domains == nil
  all_domains = list_databases! if all_domains == nil
  if all_domains["db_#{sub_domain}"] == nil
    no_db[sub_domain] = true
  else
    global_data[sub_domain] = aql("db_#{sub_domain}", aqls.settings)[1]
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
  -- deploy site
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
      define_subdomain(@)
      dynamic_page(
        "db_#{sub_domain}",
        {
          item: { html: { json: from_json(@params.json) }},
          layout: { page_builder: @params.page_builder }
        },
        { lang: @params.lang }, global_data[sub_domain]
      )
  }
  ------------------------------------------------------------------------------
  -- console (kinda irb console in dev mode)
  [console: '/console']: console.make!