sass      = require 'sass'
lapis     = require 'lapis'
stringy   = require 'stringy'

import aql from require 'lib.arango'
import dynamic_replace, define_content_type
       define_subdomain, load_settings from require 'lib.concerns'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''

expire_at = () ->
  'Expires: ' .. os.date('%a, %d %b %Y %H:%M:%S GMT', os.time() + 60*60*24*365)

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
    print("-+-#{sub_domain}+-+")
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    print("-+-#{sub_domain}+-+")
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
    print("-+-#{sub_domain}+-+")
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    print("-+-#{sub_domain}+-+")
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
    print("-+-#{sub_domain}+-+")
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    print("-+-#{sub_domain}+-+")
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
    print("-+-#{sub_domain}+-+")
    load_settings(@, jwt, no_db, settings, global_data, sub_domain)
    print("-+-#{sub_domain}+-+")
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
      content
    else
      content, headers: { "expires": expire_at! }