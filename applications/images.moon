lapis   = require "lapis"
shell   = require 'resty.shell'
stringy = require 'stringy'

import aqls from require 'lib.aqls'
import uuid from require 'lib.utils'
import to_json from require 'lapis.util'
import respond_to from require 'lapis.application'
import auth_arangodb, aql, list_databases from require 'lib.arango'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''

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
    global_data[sub_domain] = aql("db_#{sub_domain}", aqls.settings)[1]
    global_data[sub_domain]['partials'] = {}

    settings[sub_domain] = global_data[sub_domain].settings[1]

class FastyImages extends lapis.Application
    ------------------------------------------------------------------------------
  -- image upload
  [image_upload: '/image/upload']: respond_to {
    POST: =>
      load_settings(@)

      if @params.key == settings[sub_domain].resize_ovh
        if file = @params.image
          arr = stringy.split(file.filename, ".")
          ext = arr[table.getn(arr)]

          date = os.date("%y/%m/%d", os.time())
          path = "static/assets/#{sub_domain}/#{date}"
          _uuid = uuid()
          filename = "#{_uuid}.#{ext}"

          os.execute("mkdir -p #{path}")

          output = io.open "#{path}/#{filename}", "w+"
          io.output output
          io.write file.content
          io.close

          aql(
            "db_#{sub_domain}",
            "INSERT { uuid: @uuid, root: @path, filename: @filename, path: CONCAT(@path, '/', @filename), size: @size } INTO uploads",
            { "uuid": _uuid, "path": path, "filename": file.filename, "size": #file.content }
          )

          to_json({ success: true, filenae: _uuid })
        else
          status: 400, 'Bad parameters'
      else
        status: 401, 'Not authorized'
  }
    ------------------------------------------------------------------------------
  -- image upload base64
  [image_upload_base64: '/image/upload_base64']: respond_to {
    POST: =>
      load_settings(@)

      if @params.key == settings[sub_domain].resize_ovh
        if file = @params.image
          arr = stringy.split(@params.filename, ".")
          ext = arr[table.getn(arr)]

          date = os.date("%y/%m/%d", os.time())
          path = "static/assets/#{sub_domain}/#{date}"
          _uuid = uuid()
          filename = "#{_uuid}.#{ext}"

          os.execute("mkdir -p #{path}")

          output = io.open "#{path}/#{filename}", "w+"
          io.output output
          io.write encoding.decode_64(@params.image)
          io.close

          aql(
            "db_#{sub_domain}",
            "INSERT { uuid: @uuid, root: @path, filename: @filename, path: CONCAT(@path, '/', @filename), size: @size } INTO uploads",
            { "uuid": _uuid, "path": path, "filename": @params.filename, "size": #file.content }
          )

          to_json({ success: true, filenae: _uuid })
        else
          status: 400, 'Bad parameters'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  -- get image
  [image: '/image/o/:uuid[a-z%d\\-](.:format[a-z])']: =>
    define_subdomain(@)
    auth_arangodb(sub_domain)

    upload = aql(
      "db_#{sub_domain}",
      "FOR u IN uploads FILTER u.uuid == @key RETURN u",
      { "key": @params.uuid }
    )[1]

    ext = @params.format or upload.ext
    _uuid = upload.uuid

    str = ""
    res = { "body": "", status: 0 }
    if @params.format != upload.ext
      res = ngx.location.capture("/#{upload.root}/#{_uuid}.#{ext}")
      if res and res.status == 404
        ok, stdout, stderr, reason, status = shell.run("vips copy #{upload.path} #{upload.root}/#{_uuid}.#{ext}")
        res = ngx.location.capture("/#{upload.root}/#{_uuid}.#{ext}")

    else
      res = ngx.location.capture("/" .. upload.path)

    res.body, content_type: "image"
  ------------------------------------------------------------------------------
  -- resize image
  [image_r: '/image/r/:uuid[a-z%d\\-]/:width[%d](/:height[%d])(.:format[a-z])']: =>
    define_subdomain(@)
    auth_arangodb(sub_domain)

    ext = @params.format or "jpg"
    upload = aql(
      "db_#{sub_domain}",
      "FOR u IN uploads FILTER u.uuid == @key RETURN u",
      { "key": @params.uuid }
    )[1]
    _uuid = upload.uuid

    height = ""
    height = "--height #{@params.height} --crop attention" if @params.height

    res = ngx.location.capture("/#{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext}")
    if res and res.status == 404
      ok, stdout, stderr, reason, status = shell.run("vips thumbnail #{upload.path} #{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext} #{@params.width} #{height} --size down")
      res = ngx.location.capture("/#{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext}")

    res.body, content_type: "image"
  ------------------------------------------------------------------------------
  -- smart crop
  [image_sm: '/image/sm/:uuid[a-z%d\\-]/:width[%d]/:height[%d](/:interesting)(.:format[a-z])']: =>
    define_subdomain(@)
    auth_arangodb(sub_domain)

    ext = @params.format or "jpg"
    upload = aql(
      "db_#{sub_domain}",
      "FOR u IN uploads FILTER u.uuid == @key RETURN u",
      { "key": @params.uuid }
    )[1]
    _uuid = upload.uuid

    height = ""
    height = "--height #{@params.height} --crop attention" if @params.height

    interesting = @params.interesting or 'attention'
    dest = "#{upload.root}/#{_uuid}-sm-#{@params.width}-#{@params.height}-#{interestingentrop}.#{ext}"
    res = ngx.location.capture("/" .. dest)
    if res and res.status == 404
      ok, stdout, stderr, reason, status = shell.run("vips smartcrop #{upload.path} #{dest} #{@params.width} #{@params.height} --interesting #{interesting}")
      res = ngx.location.capture("/" .. dest)

    res.body, content_type: "image"