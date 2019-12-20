-- fasty CMS
sass    = require 'sass'
lapis   = require 'lapis'
stringy = require 'stringy'
console = require 'lapis.console'
config  = require('lapis.config').get!

import check_valid_lang from require 'lib.utils'
import basic_auth, is_auth from require 'lib.basic_auth'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import parse_query_string, from_json, to_json from require 'lapis.util'
import capture_errors, yield_error, respond_to from require 'lapis.application'
import install_service, install_script, deploy_site from require 'lib.service'
import dynamic_replace, dynamic_page, page_info, splat_to_table
       load_page_by_slug, load_redirection, prepare_bindvars from require 'lib.concerns'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''
expire_at = 'Expires: ' .. os.date('%a, %d %b %Y %H:%M:%S GMT', os.time() + 60*60*24*365)
--------------------------------------------------------------------------------
-- define_subdomain
define_subdomain = () =>
  sub_domain = stringy.split(@req.headers.host, '.')[1]
--------------------------------------------------------------------------------
-- load_settings
load_settings = () =>
  define_subdomain(@)
  jwt[sub_domain] = auth_arangodb(sub_domain) if jwt[sub_domain] == nil or all_domains == nil
  all_domains = list_databases! if all_domains == nil
  if all_domains["db_#{sub_domain}"] == nil
    no_db[sub_domain] = true
  else
    global_data[sub_domain] = aql("db_#{sub_domain}", '
      LET g_settings = (FOR doc IN settings LIMIT 1 RETURN doc)
      LET g_redirections = (FOR doc IN redirections RETURN doc)
      LET g_trads = (FOR doc IN trads RETURN ZIP([doc.key], [doc.value]))
      LET g_components = (
        FOR doc IN components RETURN ZIP([doc.slug], [{ _key: doc._key, _rev: doc._rev }])
      )
      LET g_aqls = (FOR doc IN aqls RETURN ZIP([doc.slug], [doc.aql]))
      LET g_helpers = (
        FOR h IN helpers
          FOR p IN partials
            FILTER h.partial_key == p._key
            FOR a IN aqls
              FILTER h.aql_key == a._key
              RETURN ZIP([h.shortcut], [{ partial: p.slug, aql: a.slug }])
      )
      RETURN { components: g_components, settings: g_settings,
        redirections: g_redirections, aqls: g_aqls,
        trads: MERGE(g_trads), helpers: MERGE(g_helpers) }
    ')[1]
    global_data[sub_domain]['partials'] = {}

    settings[sub_domain] = global_data[sub_domain].settings[1]
--------------------------------------------------------------------------------
-- App
class extends lapis.Application
  handle_error: (err, trace) =>
    if config._name == "production" then
      print(to_json(err) .. to_json(trace))
      @err = err
      display_error_page 500
    else
      super err, trace

  @enable "etlua"

  layout: false -- we don't need a layout, it will be loaded dynamically
  ----------------------------------------------------------------------------
  display_error_page = (status=500, headers= {}) =>
    error_page = from_json(settings[sub_domain].home)["error_#{status}"]
    if error_page ~= nil then
      display_page(@, error_page), status: status
    else
      render: "error_#{status}", status: status, headers: headers
  ----------------------------------------------------------------------------
  display_page = (slug=nil, status=200) =>
    slug = @params.slug if slug == nil
    @params.lang = check_valid_lang(settings[sub_domain].langs, @params.lang)
    @session.lang = @params.lang
    db_name = "db_#{sub_domain}"
    redirection = load_redirection(db_name, @params)
    current_page = load_page_by_slug(db_name, slug, @params.lang)

    html = ''
    if redirection == nil then
      html = dynamic_page(db_name, current_page, @params, global_data[sub_domain])
    else
      html = redirection

    infos = page_info(db_name, @params.slug, @params.lang)
    infos = { 'page': {}, 'folder': {} } if infos == nil

    if infos.page.og_aql and infos.page.og_aql[@params.lang] and infos.page.og_aql[@params.lang] != ''
      splat = {}
      splat = splat_to_table(@params.splat) if @params.splat

      bindvars = prepare_bindvars(splat, infos.page.og_aql[@params.lang], @params.lang)
      @params.og_data = aql(db_name, infos.page.og_aql[@params.lang], bindvars)[1]

    html = dynamic_replace(db_name, html, global_data[sub_domain], {}, @params)
    basic_auth(@, settings[sub_domain], infos) -- check if website need a basic auth
    if is_auth(@, settings[sub_domain], infos)
      if html ~= 'null' then
        html, status: status
      else
        display_error_page 404
    else
      status: 401, headers: { 'WWW-Authenticate': 'Basic realm=\"admin\"' }
  ------------------------------------------------------------------------------
  -- need_a_db
  [need_a_db: '/need_a_db']: => render: true
  ------------------------------------------------------------------------------
  -- root
  [root: '/(:lang)']: =>
    define_subdomain(@)

    if no_db[sub_domain] then redirect_to: 'need_a_db'
    else
      if @params.lang then @session.lang = @params.lang
      load_settings(@)
      @session.lang = check_valid_lang(settings[sub_domain].langs, @params.lang)
      if @params.lang and @session.lang ~= @params.lang then
        redirect_to: '/' .. @session.lang
      else
        home = from_json(settings[sub_domain].home)
        @params.lang = @session.lang
        @params.all = home['all']
        @params.slug = home['slug']

        if type(home['root_redirection']) == "string"
          redirect_to: home['root_redirection']
        else
          display_page(@)
  ------------------------------------------------------------------------------
  -- js
  [js: '/:lang/:layout/js/:rev.js']: =>
    load_settings(@)
    js = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.javascript",
      { "key": "#{@params.layout}" }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", js, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "application/javascript", content
    else
      content_type: "application/javascript", content, headers: { "expires": expire_at }
  ------------------------------------------------------------------------------
  -- js_vendors
  [js_vendors: '/:lang/:layout/vendors/:rev.js']: =>
    load_settings(@)
    js = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_js",
      { "key": "#{@params.layout}" }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", js, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "application/javascript", content
    else
      content_type: "application/javascript", content, headers: { "expires": expire_at }

  ------------------------------------------------------------------------------
  -- css
  [css: '/:lang/:layout/css/:rev.css']: =>
    load_settings(@)
    css = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.scss",
      { "key": "#{@params.layout}" }
    )[1]
    scss = sass.compile(css, 'compressed')
    content = dynamic_replace("db_#{sub_domain}", scss, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "text/css", content
    else
      content_type: "text/css", content, headers: { "expires": expire_at }
  ------------------------------------------------------------------------------
  -- css_vendors
  [css_vendors: '/:lang/:layout/vendors/:rev.css']: =>
    load_settings(@)
    css = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_css",
      { "key": "#{@params.layout}" }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", css, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "text/css", content
    else
      content_type: "text/css", content, headers: { "expires": expire_at }
  ------------------------------------------------------------------------------
  -- tag (riot)
  [component: '/:lang/:key/component/:rev.tag']: =>
    load_settings(@)
    html = ''
    for i, key in pairs(stringy.split(@params.key, '-'))
      html ..= aql(
        "db_#{sub_domain}", "FOR doc in components FILTER doc._key == @key RETURN doc.html",
        { "key": "#{key}" }
      )[1] .. "\n"
    content = dynamic_replace("db_#{sub_domain}", html, global_data, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content
    else
      content, headers: { "expires": expire_at }

  ------------------------------------------------------------------------------
  -- page_no_lang
  [page_no_lang: '/:all/:slug']: =>
    define_subdomain(@)

    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@)
      unless @session.lang then @session.lang = stringy.split(settings[sub_domain].langs, ',')[1]
      display_page(@)
  ------------------------------------------------------------------------------
  -- page
  [page: '/:lang/:all/:slug(/*)']: =>
    define_subdomain(@)

    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@)
      display_page(@)
  ------------------------------------------------------------------------------
  -- install service
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
  -- console (kinda irb console)
  [console: '/console']: console.make!