sass      = require 'sass'
lapis     = require 'lapis'
stringy   = require 'stringy'
config    = require('lapis.config').get!
db_config = require('lapis.config').get("db_#{config._name}")

import aqls from require 'lib.aqls'
import from_json, unescape from require 'lapis.util'
import compile_riotjs from require 'lib.service'
import dynamic_replace from require 'lib.concerns'
import define_content_type from require 'lib.utils'
import auth_arangodb, aql, list_databases from require 'lib.arango'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''
git_folder = {}
last_db_connect = os.time(os.date("!*t"))

expire_at = () ->
  'Expires: ' .. os.date('%a, %d %b %Y %H:%M:%S GMT', os.time() + 60*60*24*365)
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
    site_settings = from_json(settings[sub_domain].home)
    git_folder[sub_domain] = site_settings['git_folder'] and site_settings['git_folder'] or "git/db_#{sub_domain}"

  bucket = from_json(settings[sub_domain].home).cloud_storage_bucket

class FastyAssets extends lapis.Application
  ------------------------------------------------------------------------------
  [ds: '/:lang/ds/:key/:field/:rev.:ext']: =>
    load_settings(@)
    data = aql(
      "db_#{sub_domain}",
      "FOR doc IN datasets FILTER doc._key == @key RETURN doc.@field",
      { "key": "#{@params.key}", 'field': @params.field }
    )['result'][1]
    content = dynamic_replace("db_#{sub_domain}", data, global_data[sub_domain], {}, @params)

    content_type: define_content_type(".#{@params.ext}"), content, headers: { "Service-Worker-Allowed": "/" }
  ------------------------------------------------------------------------------
  [js: '/:lang/:layout/js/:rev.js']: =>
    load_settings(@)
    content = ''

    if @params.layout\match("^[%d\\-]+$")
      content = aql(
        "db_#{sub_domain}",
        "FOR doc in layouts FILTER doc._key == @key RETURN doc.javascript",
        { 'key': "#{@params.layout}" }
      )['result'][1]
    else
      ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/layouts/#{@params.layout}/js.js")
      content = ret.body if ret.status == 200

    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: 'application/javascript', content
    else
      content_type: 'application/javascript', content, headers: { 'expires': expire_at! }
  ------------------------------------------------------------------------------
  [js_vendors: '/:lang/:layout/vendors/:rev.js']: =>
    load_settings(@)

    content = ''
    if @params.layout\match("^[%d\\-]+$")
      content = aql(
        "db_#{sub_domain}",
        "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_js",
        { 'key': "#{@params.layout}" }
      )['result'][1]
    else
      ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/layouts/#{@params.layout}/vendor.js")
      content = ret.body if ret.status == 200

    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: 'application/javascript', content
    else
      content_type: 'application/javascript', content, headers: { 'expires': expire_at! }

  ------------------------------------------------------------------------------
  [js_spa: '/:lang/:key/spa/:rev.js']: =>
    load_settings(@)

    content = ''
    if @params.key\match("^[%d\\-]+$")
      content = aql(
        "db_#{sub_domain}",
        "FOR doc in spas FILTER doc._key == @key RETURN doc.js",
        { 'key': "#{@params.key}" }
      )['result'][1]
    else
      ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/spas/#{@params.key\gsub("@", "/")}.js")
      content = ret.body if ret.status == 200

    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: 'application/javascript', content
    else
      content_type: 'application/javascript', content, headers: { 'expires': expire_at! }

  ------------------------------------------------------------------------------
  [css: '/:lang/:layout/css/:rev.css']: =>
    load_settings(@)
    content = ''

    if @params.layout\match("^[%d\\-]+$")
      layout = aql(
        "db_#{sub_domain}",
        "
          FOR doc in layouts FILTER doc._key == @key
            RETURN { scss: doc.scss, compiled_css: doc.compiled_css }
        ",
        { 'key': "#{@params.layout}" }
      )['result'][1]
      if type(layout.compiled_css) ~= "userdata"
        content = layout.compiled_css
      else
        content = sass.compile(layout.scss, 'compressed')
    else
      ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/layouts/#{@params.layout}/css.css")
      content = ret.body if ret.status == 200

    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content_type: 'text/css', content
    else
      content_type: 'text/css', content, headers: { 'expires': expire_at! }
  ------------------------------------------------------------------------------
  [css_vendors: '/:lang/:layout/vendors/:rev.css']: =>
    load_settings(@)
    content = ''
    if @params.layout\match("^[%d\\-]+$")
      content = aql(
        "db_#{sub_domain}",
        "FOR doc in layouts FILTER doc._key == @key RETURN doc.i_css",
        { 'key': "#{@params.layout}" }
      )['result'][1]
    else
      ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/layouts/#{@params.layout}/vendor.css")
      content = ret.body if ret.status == 200

    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)

    if @req.headers['x-forwarded-host'] != nil then
      content_type: 'text/css', content
    else
      content_type: 'text/css', content, headers: { 'expires': expire_at! }
  ------------------------------------------------------------------------------
  [component: '/:lang/:key/component/:rev.tag']: =>
    load_settings(@)
    content = ''
    if @params.key\match("^[%d\\-]+$")
      for i, key in pairs(stringy.split(@params.key, '-'))
        content ..= aql(
          "db_#{sub_domain}", "FOR doc in components FILTER doc._key == @key RETURN doc.html",
          { 'key': "#{key}" }
        )['result'][1] .. "\n"
    else
      ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/components/#{@params.key\gsub("@", "/")}.riot")
      content = ret.body if ret.status == 200

    content = content\gsub("%[%[ (.-) %]%]", "{{ %1 }}")
    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)
    if @req.headers['x-forwarded-host'] != nil then
      content, headers: { 'Access-Control-Allow-Origin': '*' }
    else
      content, headers: { 'expires': expire_at!, 'Access-Control-Allow-Origin': '*' }
  ------------------------------------------------------------------------------
  [componentjs: '/:lang/:key/component/:rev.js']: =>
    load_settings(@)
    content = ''
    if @params.key\match("^[%d\\-]+$")
      for i, key in pairs(stringy.split(unescape(@params.key), '|'))
        content ..= aql(
          "db_#{sub_domain}", "FOR doc in components FILTER doc._key == @key RETURN doc.javascript",
          { 'key': "#{key}" }
        )['result'][1] .. "\n"
    else
      for i, key in pairs(stringy.split(unescape(@params.key), '|'))
        ret = ngx.location.capture("/#{git_folder[sub_domain]}/app/components/#{key\gsub("@", "/")}.js")
        content ..= ret.body .. "\n" if ret.status == 200

    content = content\gsub("%[%[ (.-) %]%]", "{{ %1 }}")
    content = dynamic_replace("db_#{sub_domain}", content, global_data[sub_domain], {}, @params)

    if @req.headers['x-forwarded-host'] != nil then
      content, headers: { 'Content-Type': 'text/javascript' }
    else
      content, headers: { 'expires': expire_at!, 'Content-Type': 'text/javascript' }
