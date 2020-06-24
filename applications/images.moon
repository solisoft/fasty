lapis   = require "lapis"
shell   = require "resty.shell"
stringy = require "stringy"
google  = require "cloud_storage.google"

import aqls from require "lib.aqls"
import uuid from require "lib.utils"
import from_json, to_json from require "lapis.util"
import respond_to from require "lapis.application"
import auth_arangodb, aql, list_databases from require "lib.arango"

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''
bucket = nil
--------------------------------------------------------------------------------
-- Upload to google cloud storage
cloud_storage = () ->
  certificate = nil
  storage = nil
  if io.open("certs/#{sub_domain}.json", "r")
    certificate = "certs/#{sub_domain}.json"
  else
    if io.open("certs/default.json", "r")
      certificate = "certs/default.json"

  if certificate
    storage = google.CloudStorage\from_json_key_file(certificate)

  storage

storage = cloud_storage!
--------------------------------------------------------------------------------
load_original_from_cloud = (key) ->
  res = ngx.location.capture("/" .. key)
  if bucket and res.status == 404
    output = io.open key, "w+"
    content = storage\get_file bucket, key
    io.output output
    io.write content
    io.close
--------------------------------------------------------------------------------
storage_exist = (key) ->
  storage\head_file(bucket, key) == 200
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
  bucket = from_json(settings[sub_domain].home).cloud_storage_bucket

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
          content = file.content
          output = io.open "#{path}/#{filename}", "w+"
          io.output output
          io.write content
          io.close

          home_settings = from_json(settings[sub_domain].home)
          url = "/#{path}/#{filename}"
          if bucket
            if storage
              status = storage\put_file_string(bucket, "#{path}/#{filename}", content)
              url = "https://storage.googleapis.com/#{bucket}#{url}" if status == 200

          aql(
            "db_#{sub_domain}",
            "INSERT { uuid: @uuid, root: @path, filename: @filename, path: CONCAT(@path, '/', @uuid, '.', @ext), size: @size, url: @url, ext: @ext } INTO uploads",
            { "uuid": _uuid, "path": path, "filename": file.filename, "size": #file.content, url: url, ext: ext }
          )

          to_json({ success: true, filename: _uuid })
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
          content = encoding.decode_64(@params.image)
          io.output output
          io.write content
          io.close

          url = "/#{path}/#{filename}"
          if bucket
            if storage
              status = storage\put_file_string(bucket, "#{path}/#{filename}", content)
              url = "https://storage.googleapis.com/#{bucket}#{url}" if status == 200

          aql(
            "db_#{sub_domain}",
            "INSERT { uuid: @uuid, root: @path, filename: @filename, path: CONCAT(@path, '/', @uuid, '.', @ext), size: @size, url: @url, ext: @ext } INTO uploads",
            { "uuid": _uuid, "path": path, "filename": @params.filename, "size": #file.content, "url": url, "ext": ext }
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
    load_settings(@)

    upload = aql(
      "db_#{sub_domain}", "FOR u IN uploads FILTER u.uuid == @key RETURN u",
      { "key": @params.uuid }
    )[1]

    ext = @params.format or upload.ext
    _uuid = upload.uuid

    str = ""
    res = { "body": "", status: 0 }
    url = "#{upload.root}/#{_uuid}.#{ext}"

    load_original_from_cloud upload.path

    if ext != upload.ext
      res = ngx.location.capture("/#{url}")
      if res and res.status == 404
        ok, stdout, stderr, reason, status = shell.run("vips copy #{upload.path} #{url}")
        res = ngx.location.capture("/#{url}")
    else
      res = ngx.location.capture("/#{url}")

    res.body, content_type: "image"
  ------------------------------------------------------------------------------
  -- resize image
  [image_r: '/image/r/:uuid[a-z%d\\-]/:width[%d](/:height[%d])(.:format[a-z])']: =>
    load_settings(@)

    ext = @params.format or "jpg"
    upload = aql(
      "db_#{sub_domain}", "FOR u IN uploads FILTER u.uuid == @key RETURN u",
      { "key": @params.uuid }
    )[1]
    _uuid = upload.uuid

    load_original_from_cloud upload.path

    height = ""
    height = "--height #{@params.height} --crop attention" if @params.height

    dest = "#{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext}"

    res = ngx.location.capture("/#{dest}")
    if res and res.status == 404
      ok, stdout, stderr, reason, status = shell.run("vips thumbnail #{upload.path} #{dest} #{@params.width} #{height} --size down")
      res = ngx.location.capture("/#{dest}")

    res.body, content_type: "image"
  ------------------------------------------------------------------------------
  -- smart crop
  [image_sm: '/image/sm/:uuid[a-z%d\\-]/:width[%d]/:height[%d](/:interesting)(.:format[a-z])']: =>
    load_settings(@)

    ext = @params.format or "jpg"
    upload = aql(
      "db_#{sub_domain}", "FOR u IN uploads FILTER u.uuid == @key RETURN u",
      { "key": @params.uuid }
    )[1]
    _uuid = upload.uuid

    load_original_from_cloud upload.path

    height = ""
    height = "--height #{@params.height} --crop attention" if @params.height

    interesting = @params.interesting or 'attention'
    dest = "#{upload.root}/#{_uuid}-sm-#{@params.width}-#{@params.height}-#{interesting}.#{ext}"
    res = ngx.location.capture("/" .. dest)
    if res and res.status == 404
      ok, stdout, stderr, reason, status = shell.run("vips smartcrop #{upload.path} #{dest} #{@params.width} #{@params.height} --interesting #{interesting}")
      res = ngx.location.capture("/" .. dest)

    res.body, content_type: "image"