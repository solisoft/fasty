sass      = require 'sass'
lapis     = require 'lapis'
stringy   = require 'stringy'

import aqls from require 'lib.aqls'
import from_json from require 'lapis.util'
import define_content_type from require 'lib.utils'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import dynamic_replace, define_subdomain, load_settings from require 'lib.concerns'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''

expire_at = () ->
  'Expires: ' .. os.date('%a, %d %b %Y %H:%M:%S GMT', os.time() + 60*60*24*365)
--------------------------------------------------------------------------------
define_subdomain = () =>
  sub_domain = @req.headers['x-app'] or stringy.split(@req.headers.host, '.')[1]
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
  bucket = from_json(settings[sub_domain].home).cloud_storage_bucket

class FastyAssets extends lapis.Application
  ------------------------------------------------------------------------------
  [ds: '/:lang/ds/:key/:field/:rev.:ext']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    data = aql(
      "db_#{sub_domain}",
      "FOR doc IN datasets FILTER doc._key == @key RETURN doc.@field",
      { "key": "#{@params.key}", 'field': @params.field }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", data, {}, {}, @params)

    content_type: define_content_type(".#{@params.ext}"), content, headers: { "Service-Worker-Allowed": "/" }
  ------------------------------------------------------------------------------
  [js: '/:lang/:layout/js/:rev.js']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    js = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.javascript",
      { "key": "#{@params.layout}" }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", js, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "application/javascript", content
    else
      content_type: "application/javascript", content, headers: { "expires": expire_at! }
  ------------------------------------------------------------------------------
  [js_vendors: '/:lang/:layout/vendors/:rev.js']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    js = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_js",
      { "key": "#{@params.layout}" }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", js, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "application/javascript", content
    else
      content_type: "application/javascript", content, headers: { "expires": expire_at! }

  ------------------------------------------------------------------------------
  [css: '/:lang/:layout/css/:rev.css']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
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
      content_type: "text/css", content, headers: { "expires": expire_at! }
  ------------------------------------------------------------------------------
  [css_vendors: '/:lang/:layout/vendors/:rev.css']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    css = aql(
      "db_#{sub_domain}",
      "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_css",
      { "key": "#{@params.layout}" }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", css, {}, {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: "text/css", content
    else
      content_type: "text/css", content, headers: { "expires": expire_at! }
  ------------------------------------------------------------------------------
  [component: '/:lang/:key/component/:rev.tag']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    html = ''
    for i, key in pairs(stringy.split(@params.key, '-'))
      html ..= aql(
        "db_#{sub_domain}", "FOR doc in components FILTER doc._key == @key RETURN doc.html",
        { "key": "#{key}" }
      )[1] .. "\n"
    content = dynamic_replace("db_#{sub_domain}", html, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content, headers: { "Access-Control-Allow-Origin": "*" }
    else
      content, headers: { "expires": expire_at!, headers: { "Access-Control-Allow-Origin": "*" } }
--  ------------------------------------------------------------------------------
  [componentjs: '/:lang/:key/component/:rev.js']: =>
    sub_domain = define_subdomain(@)
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    html = ''
    for i, key in pairs(stringy.split(@params.key, '-'))
      html ..= aql(
        "db_#{sub_domain}", "FOR doc in components FILTER doc._key == @key RETURN doc.javascript",
        { "key": "#{key}" }
      )[1] .. "\n"
    content = dynamic_replace("db_#{sub_domain}", html, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content, headers: { "Content-Type": "text/javascript" }
    else
      content, headers: { "expires": expire_at!, "Content-Type": "text/javascript" }
--