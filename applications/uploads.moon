lapis     = require "lapis"
shell     = require "resty.shell"
stringy   = require "stringy"
google    = require "cloud_storage.google"
http      = require "lapis.nginx.http"
encoding  = require "lapis.util.encoding"

import aqls from require "lib.aqls"
import uuid, define_content_type from require "lib.utils"
import from_json, to_json from require "lapis.util"
import respond_to from require "lapis.application"
import auth_arangodb, aql, list_databases, document_post from require "lib.arango"

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''
bucket = nil
--------------------------------------------------------------------------------
watermark = (filename) ->
  w = from_json(settings[sub_domain].home).watermark
  arr = stringy.split(filename, ".")
  ext = arr[table.getn(arr)]

  if w
    shell.run "vips merge #{filename} #{w} #{filename}.out.#{ext} vertical 1 1"
    shell.run "mv #{filename}.out.#{ext} #{filename}"
--------------------------------------------------------------------------------
write_content = (file, content, do_watermark=false) ->
  path_arr = stringy.split(file, "/")
  table.remove(path_arr, table.getn(path_arr))
  path = table.concat(path_arr, "/")
  os.execute("mkdir -p #{path}")
  output = io.open(file, "w+")
  io.output(output)
  io.write(content)
  io.close(output)
  watermark file if do_watermark
--------------------------------------------------------------------------------
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
    content = storage\get_file bucket, key
    write_content key, content if content
--------------------------------------------------------------------------------
check_file = (params) ->
  db_name = "db_#{sub_domain}"
  db_name = "db_" .. encoding.decode_base64(params._from) if params._from
  upload = aql(
    db_name, "FOR u IN uploads FILTER u.uuid == @key RETURN u", { "key": params.uuid }
  )[1]
  load_original_from_cloud upload.path if upload
  upload
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
  [file_upload: '/file/upload(/:id)(/:collection)(/:field)']: respond_to {
    POST: =>
      load_settings(@)
      @params.key = @req.headers['apikey'] if @req.headers['apikey']
      if @params.key == settings[sub_domain].resize_ovh
        if file = @params.files[""] or @params.files
          arr = stringy.split(file.filename, ".")
          ext = arr[table.getn(arr)]

          date = os.date("%y/%m/%d", os.time())
          path = "static/assets/#{sub_domain}/#{date}"
          _uuid = uuid()
          filename = "#{_uuid}.#{ext}"

          shell.run("mkdir -p #{path}")
          content = file.content
          write_content "#{path}/#{filename}", content, true

          url = "/#{path}/#{filename}"
          if bucket
            if storage
              status = storage\put_file_string(bucket, "#{path}/#{filename}", content)
              url = "https://storage.googleapis.com/#{bucket}#{url}" if status == 200

          upload = {
            "uuid": _uuid, "root": path, "filename": file.filename, "path": path .. '/' .. _uuid .. "." .. ext,
            "size": #content, url: url, ext: ext
          }

          if @params.id
            upload["object_id"] = @params.collection .. "/" .. @params.id
            upload["order"] = 10000
            upload["field"] = @params.field

          document_post("db_#{sub_domain}", "uploads", upload)

          to_json({ success: true, filename: _uuid })
        else
          status: 400, 'Bad parameters'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  [file_upload_http: '/file/upload_http']: respond_to {
    POST: =>
      load_settings(@)

      if @params.key == settings[sub_domain].resize_ovh
        if url_src = @params.image
          arr = stringy.split(url_src, "/")
          ext = arr[table.getn(arr)]
          arr = stringy.split(ext, ".")
          ext = arr[table.getn(arr)]

          date = os.date("%y/%m/%d", os.time())
          path = "static/assets/#{sub_domain}/#{date}"
          _uuid = uuid()
          filename = "#{_uuid}.#{ext}"

          shell.run("mkdir -p #{path}")

          content, status_code, headers = http.simple url_src

          write_content "#{path}/#{filename}", content, true

          url = "/#{path}/#{filename}"

          if bucket
            if storage
              status = storage\put_file_string(bucket, "#{path}/#{filename}", content)
              url = "https://storage.googleapis.com/#{bucket}#{url}" if status == 200

          aql(
            "db_#{sub_domain}",
            "INSERT { uuid: @uuid, root: @path, filename: @filename, path: CONCAT(@path, '/', @uuid, '.', @ext), size: @size, url: @url, ext: @ext } INTO uploads",
            { "uuid": _uuid, "path": path, "filename": filename, "size": #content, url: url, ext: ext }
          )

          to_json({ success: true, filename: _uuid, url: url, url_src: url_src })
        else
          status: 400, 'Bad parameters'
      else
        status: 401, 'Not authorized'
  }
  ------------------------------------------------------------------------------
  -- get image
  [image: '/asset/o/:uuid[a-z%d\\-](.:format[a-z])']: =>
    load_settings(@)

    upload = check_file @params

    if upload
      ext   = @params.format or upload.ext
      _uuid = upload.uuid
      str   = ""
      res   = { "body": "", status: 0 }
      url   = "#{upload.root}/#{_uuid}.#{ext}"

      if ext != upload.ext
        res = ngx.location.capture("/#{url}")
        if res and res.status == 404
          ok, stdout, stderr, reason, status = shell.run("vips copy #{upload.path} #{url}")
          res = ngx.location.capture("/#{url}")
      else
        res = ngx.location.capture("/#{url}")

      disposition = "inline"
      disposition = "attachement; filename=\"#{upload.filename}\"" if @params.dl

      res.body, content_type: define_content_type(ext), headers: { 'Accept-Ranges': 'bytes', 'Content-Disposition': disposition }
    else
      'no asset found!', status: 404
  ------------------------------------------------------------------------------
  -- resize image
  [image_r: '/asset/r/:uuid[a-z%d\\-]/:width[%d](/:height[%d])(.:format[a-z])']: =>
    load_settings(@)

    ext = @params.format or "jpg"
    upload = check_file @params

    if upload
      height  = ""
      height  = "--height #{@params.height} --crop attention" if @params.height
      dest    = "#{upload.root}/#{upload.uuid}-#{@params.width}-#{@params.height}.#{ext}"

      res = ngx.location.capture("/#{dest}")
      if res and res.status == 404
        ok, stdout, stderr, reason, status = shell.run("vips thumbnail #{upload.path} #{dest} #{@params.width} #{height} --size down")
        res = ngx.location.capture("/#{dest}")

      disposition = "inline"
      disposition = "attachement; filename=\"#{upload.filename}\"" if @params.dl

      res.body, content_type: define_content_type(ext), headers: { 'Accept-Ranges': 'bytes', 'Content-Disposition': disposition }
    else
      'no asset found!', status: 404
  ------------------------------------------------------------------------------
  -- smart crop
  [image_sm: '/asset/sm/:uuid[a-z%d\\-]/:width[%d]/:height[%d](/:interesting)(.:format[a-z])']: =>
    load_settings(@)

    ext = @params.format or "jpg"
    upload = check_file @params

    if upload
      height = ""
      height = "--height #{@params.height} --crop attention" if @params.height

      interesting = @params.interesting or 'attention'
      dest = "#{upload.root}/#{upload.uuid}-sm-#{@params.width}-#{@params.height}-#{interesting}.#{ext}"
      res = ngx.location.capture("/" .. dest)
      if res and res.status == 404
        ok, stdout, stderr, reason, status = shell.run("vips smartcrop #{upload.path} #{dest} #{@params.width} #{@params.height} --interesting #{interesting}")
        res = ngx.location.capture("/" .. dest)

      disposition = "inline"
      disposition = "attachement; filename=\"#{upload.filename}\"" if @params.dl

      res.body, content_type: define_content_type(ext), headers: { 'Accept-Ranges': 'bytes', 'Content-Disposition': disposition }
    else
      'no asset found!', status: 404