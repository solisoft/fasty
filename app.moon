-- fasty CMS
sass    = require 'sass'
lapis   = require 'lapis'
stringy = require 'stringy'
console = require 'lapis.console'
config  = require('lapis.config').get!

import cached from require 'lapis.cache'
import check_valid_lang from require 'lib.utils'
import basic_auth, is_auth from require 'lib.basic_auth'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import parse_query_string, from_json, to_json from require 'lapis.util'
import capture_errors, yield_error, respond_to from require 'lapis.application'
import install_service, install_script, deploy_site from require 'lib.service'
import dynamic_replace, dynamic_page, page_info
       load_page_by_slug, load_redirection from require 'lib.concerns'

jwt = {}
global_data = {}
settings = {}
no_db = {}
sub_domain = ''

--------------------------------------------------------------------------------
-- App
class extends lapis.Application
  handle_error: (err, trace) =>
    if config._name == "production" then
      print(to_json(err))
      print(to_json(trace))
      { render: "error_500", status: 500 }
    else
      super err, trace

  @enable "etlua"

  layout: false -- we don't need a layout, it will be loaded dynamically
  ------------------------------------------------------------------------------
  -- load_settings
  load_settings = () =>
    sub_domain_account(@)
    jwt[sub_domain] = auth_arangodb(sub_domain) if jwt[sub_domain] == nil or list_databases! == nil
    if list_databases!["db_#{sub_domain}"] == nil
      no_db[sub_domain] = true
    else
      global_data = aql("db_#{sub_domain}", '
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
      settings[sub_domain] = global_data.settings[1]
  ------------------------------------------------------------------------------
  -- sub_domain_account
  sub_domain_account = () =>
    sub_domain = stringy.split(@req.headers.host, '.')[1]
    sub_domain = 'demo' if sub_domain == '127'
  ------------------------------------------------------------------------------
  -- display_page()
  display_page = () =>

    @params.lang = check_valid_lang(settings[sub_domain].langs, @params.lang)
    @session.lang = @params.lang
    db_name = "db_#{sub_domain}"
    redirection = load_redirection(db_name, @params)

    html = ''
    if redirection == nil
      html = dynamic_page(
        db_name,
        load_page_by_slug(db_name, @params.slug, @params.lang),
        @params, global_data
      )
    else
      html = redirection

    html = dynamic_replace(db_name, html, global_data, {}, @params)
    infos = page_info(db_name, @params.slug, @params.lang)
    infos = { 'page': {}, 'folder': {} } if infos == nil
    basic_auth(@, settings[sub_domain], infos) -- check if website need a basic auth
    if is_auth(@, settings[sub_domain], infos)
      if html ~= 'null'
        html
      else
        status: 404, render: 'error_404'
    else
      status: 401, headers: { 'WWW-Authenticate': 'Basic realm=\"admin\"' }
  ------------------------------------------------------------------------------
  -- need_a_db
  [need_a_db: '/need_a_db']: => render: true
  ------------------------------------------------------------------------------
  -- root
  [root: '/(:lang)']: =>
    sub_domain = sub_domain_account(@)

    if @req.headers['x-forwarded-host'] then
      @req.headers['host'] = @req.headers['x-forwarded-host']
      @req.parsed_url['host'] = @req.headers['x-forwarded-host']

    if no_db[sub_domain] then redirect_to: 'need_a_db'
    else
      load_settings(@, sub_domain)
      if @params.lang then @session.lang = @params.lang

      @session.lang = check_valid_lang(settings[sub_domain].langs, @session.lang)

      home = from_json(settings[sub_domain].home)
      @params.lang = @session.lang
      @params.all = home['all']
      @params.slug = home['slug']

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
    content_type: "application/javascript", dynamic_replace("db_#{sub_domain}", js, {}, {}, @params), headers: { "expires": "Expires: " .. os.date("%a, %d %b %Y %H:%M:%S GMT", os.time() + 60*60*24*7) }
  ------------------------------------------------------------------------------
  -- js_vendors
  [js_vendors: '/:lang/:layout/vendors/:rev.js']: =>
    load_settings(@)
    js = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_js",
      { "key": "#{@params.layout}" }
    )[1]
    content_type: "application/javascript", dynamic_replace("db_#{sub_domain}", js, {}, {}, @params), headers: { "expires": "Expires: " .. os.date("%a, %d %b %Y %H:%M:%S GMT", os.time() + 60*60*24*7) }
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
    content_type: "text/css", dynamic_replace("db_#{sub_domain}", scss, {}, {}, @params), headers: { "expires": "Expires: " .. os.date("%a, %d %b %Y %H:%M:%S GMT", os.time() + 60*60*24*7) }
  ------------------------------------------------------------------------------
  -- css_vendors
  [css_vendors: '/:lang/:layout/vendors/:rev.css']: =>
    load_settings(@)
    css = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_css",
      { "key": "#{@params.layout}" }
    )[1]
    content_type: "text/css", dynamic_replace("db_#{sub_domain}", css, {}, {}, @params), headers: { "expires": "Expires: " .. os.date("%a, %d %b %Y %H:%M:%S GMT", os.time() + 60*60*24*7) }
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
    dynamic_replace("db_#{sub_domain}", html, global_data, {}, @params), headers: { "expires": "Expires: " .. os.date("%a, %d %b %Y %H:%M:%S GMT", os.time() + 60*60*24*7) }
  ------------------------------------------------------------------------------
  -- page_no_lang
  [page_no_lang: '/:all/:slug']: =>
    if @req.headers['x-forwarded-host'] then
      @req.headers['host'] = @req.headers['x-forwarded-host']
      @req.parsed_url['host'] = @req.headers['x-forwarded-host']

    sub_domain_account(@)

    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@, sub_domain)
      unless @session.lang then @session.lang = stringy.split(settings[sub_domain].langs, ',')[1]
      display_page(@)
  ------------------------------------------------------------------------------
  -- page
  [page: '/:lang/:all/:slug(/*)']: =>
    sub_domain_account(@)

    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@, sub_domain)
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
  -- install script
  [service: '/script/:name']: respond_to {
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
  [service: '/deploy']: respond_to {
    POST: =>
      load_settings(@)

      if @params.token == settings[sub_domain].token
        deploy_site(sub_domain, settings[sub_domain])
        'site deployed'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  -- console (kinda irb console)
  [console: '/console']: console.make!