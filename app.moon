-- fasty CMS
sass    = require 'sass'
lapis   = require 'lapis'
stringy = require 'stringy'
console = require 'lapis.console'
config  = require('lapis.config').get!
shell   = require 'resty.shell'

import aqls from require 'lib.aqls'
import check_valid_lang, uuid from require 'lib.utils'
import basic_auth, is_auth from require 'lib.basic_auth'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import parse_query_string, from_json, to_json from require 'lapis.util'
import capture_errors, yield_error, respond_to from require 'lapis.application'
import install_service, install_script, deploy_site from require 'lib.service'
import dynamic_replace, dynamic_page, page_info, splat_to_table, define_content_type
       load_page_by_slug, load_redirection, prepare_bindvars from require 'lib.concerns'

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
--------------------------------------------------------------------------------
-- App
class extends lapis.Application
  handle_error: (err, trace) =>
    if config._name == "production" then
      print(to_json(err) .. to_json(trace))
      @err = err
      display_error_page(@, 500)
    else
      super err, trace

  @enable "etlua"

  layout: false -- we don't need a layout, it will be loaded dynamically
  expire_at = () =>
   'Expires: ' .. os.date('%a, %d %b %Y %H:%M:%S GMT', os.time() + 60*60*24*365)

  ----------------------------------------------------------------------------
  display_error_page = (status=500, headers={}) =>
    error_page = from_json(settings[sub_domain].home)["error_#{status}"]
    if error_page ~= nil then
      display_page(@, error_page), status: status
    else
      render: "error_#{status}" , status: status, headers: headers
  ----------------------------------------------------------------------------
  display_page = (slug=nil, status=200) =>
    slug              = @params.slug if slug == nil
    @params.lang      = check_valid_lang(settings[sub_domain].langs, @params.lang)
    @session.lang     = @params.lang
    db_name           = "db_#{sub_domain}"
    redirection       = load_redirection(db_name, @params)
    current_page      = load_page_by_slug(db_name, slug, @params.lang)

    page_content_type = define_content_type(@params.slug)

    html = ''

    if redirection == nil then
      html = dynamic_page(db_name, current_page, @params, global_data[sub_domain])
    else
      html = redirection

    infos = page_info(db_name, @params.slug, @params.lang)
    infos = { 'page': {}, 'folder': {} } if infos == nil

    @params.splat = "slug/#{@params.splat}" if @params.splat and table.getn(stringy.split(@params.splat, "/")) % 2 == 1

    if infos.page.og_aql and infos.page.og_aql[@params.lang] and infos.page.og_aql[@params.lang] != ''
      splat = {}
      splat = splat_to_table(@params.splat) if @params.splat
      bindvars = prepare_bindvars(splat, infos.page.og_aql[@params.lang], @params.lang)
      @params.og_data = aql(db_name, infos.page.og_aql[@params.lang], bindvars)[1]

    html = dynamic_replace(db_name, html, global_data[sub_domain], {}, @params)
    basic_auth(@, settings[sub_domain], infos) -- check if website need a basic auth
    if is_auth(@, settings[sub_domain], infos)
      if html ~= 'null' then
        content_type: page_content_type, html, status: status
      else
        display_error_page(@, 404)
    else
      status: 401, headers: { 'WWW-Authenticate': 'Basic realm=\"admin\"' }
  ------------------------------------------------------------------------------
  [need_a_db: '/need_a_db']: => render: true
  ------------------------------------------------------------------------------
  [robots: '/robots.txt']: =>
    if no_db[sub_domain] then redirect_to: 'need_a_db'
    else
      load_settings(@)
      @params.lang  = @session.lang
      @params.all   = '-'
      @params.slug  = 'robots'
      display_page(@)
  ------------------------------------------------------------------------------
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
        home          = from_json(settings[sub_domain].home)
        @params.lang  = @session.lang
        @params.all   = home['all']
        @params.slug  = home['slug']
        @params.splat = home['splat'] if home['splat']

        if type(home['root_redirection']) == "string"
          redirect_to: home['root_redirection']
        else
          display_page(@)
  ------------------------------------------------------------------------------
  [ds: '/:lang/ds/:key/:field/:rev.:ext']: =>
    load_settings(@)
    data = aql(
      "db_#{sub_domain}",
      "FOR doc IN datasets FILTER doc._key == @key RETURN doc.@field",
      { "key": "#{@params.key}", 'field': @params.field }
    )[1]
    content = dynamic_replace("db_#{sub_domain}", data, {}, {}, @params)

    content_type: define_content_type(".#{@params.ext}"), content, headers: { "Service-Worker-Allowed": "/" }
  ------------------------------------------------------------------------------
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
      content_type: "application/javascript", content, headers: { "expires": expire_at! }
  ------------------------------------------------------------------------------
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
      content_type: "application/javascript", content, headers: { "expires": expire_at! }

  ------------------------------------------------------------------------------
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
      content_type: "text/css", content, headers: { "expires": expire_at! }
  ------------------------------------------------------------------------------
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
      content_type: "text/css", content, headers: { "expires": expire_at! }
  ------------------------------------------------------------------------------
  [component: '/:lang/:key/component/:rev.tag']: =>
    load_settings(@)
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

  ------------------------------------------------------------------------------
  [page_no_lang: '/:all/:slug']: =>
    define_subdomain(@)

    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@)
      @params.lang = check_valid_lang(settings[sub_domain].langs, @params.all)
      unless @session.lang then @session.lang = stringy.split(settings[sub_domain].langs, ',')[1]
      display_page(@)
  ------------------------------------------------------------------------------
  [page: '/:lang/:all/:slug(/*)']: =>
    define_subdomain(@)

    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@)
      display_page(@)
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
  -- image upload
  [image_upload: '/image/upload']: respond_to {
    POST: =>
      define_subdomain(@)
      auth_arangodb(sub_domain)

      if file = @params.image
        arr = stringy.split(file.filename, ".")
        ext = arr[table.getn(arr)]

        date = os.date("%y/%m/%d", os.time())
        path = "static/assets/#{sub_domain}/#{date}"
        _uuid = uuid()
        filename = "#{_uuid}.#{ext}"

        os.execute("mkdir -p #{path}")

        print file.filename
        output = io.open "#{path}/#{filename}", "w+"
        io.output output
        io.write file.content
        io.close

        print(to_json({ "uuid": _uuid, "path": path, "filename": filename, "size": #file.content }))

        aql(
          "db_#{sub_domain}",
          "INSERT { uuid: @uuid, root: @path, filename: @filename, path: CONCAT(@path, '/', @filename), size: @size } INTO uploads",
          { "uuid": _uuid, "path": path, "filename": filename, "size": #file.content }
        )

        'ok'
      else
        'no file provided'
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
    if @params.format != upload.ext
      if io.open("#{upload.root}/#{_uuid}.#{ext}" ,"r") == nil
        ok, stdout, stderr, reason, status = shell.run("vips copy #{upload.path} #{upload.root}/#{_uuid}.#{ext}")

      file = io.open("#{upload.root}/#{_uuid}.#{ext}", "rb")
      str = file\read("*a")
    else
      file = io.open(upload.path, "rb")
      str = file\read("*a")

    str, content_type: "image"
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

    if io.open("#{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext}", "r") == nil
      ok, stdout, stderr, reason, status = shell.run("vips thumbnail #{upload.path} #{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext} #{@params.width} #{height} --size down")

    file = io.open("#{upload.root}/#{_uuid}-#{@params.width}-#{@params.height}.#{ext}", "rb")
    str = file\read("*a")

    str, content_type: "image"
  ------------------------------------------------------------------------------
  -- console (kinda irb console in dev mode)
  [console: '/console']: console.make!
