-- fasty CMS
sass        = require 'sass'
lapis       = require 'lapis'
stringy     = require 'stringy'
shell       = require 'resty.shell'
encoding    = require 'lapis.util.encoding'
app_config  = require "lapis.config"
config      = app_config.get!
db_config   = app_config.get("db_#{config._name}")

import aqls from require 'lib.aqls'
import respond_to from require 'lapis.application'
import check_valid_lang, uuid, define_content_type, table_deep_merge from require 'lib.utils'
import basic_auth, is_auth from require 'lib.basic_auth'
import after_dispatch from require 'lapis.nginx.context'
import auth_arangodb, aql, list_databases from require 'lib.arango'
import trim, from_json, to_json, unescape from require 'lapis.util'
import dynamic_replace, dynamic_page, page_info, splat_to_table
       load_page_by_slug, load_redirection, prepare_bindvars from require 'lib.concerns'

jwt = {}
global_data = {}
all_domains = nil
settings = {}
no_db = {}
sub_domain = ''

app_config "development", -> measure_performance true

--------------------------------------------------------------------------------
define_subdomain = () =>
  sub_domain = @req.headers['x-app'] or stringy.split(@req.headers.host, '.')[1]
--------------------------------------------------------------------------------
load_settings = () =>
  jwt[sub_domain] = auth_arangodb(sub_domain, db_config) if jwt[sub_domain] == nil or all_domains == nil
  all_domains = list_databases! if all_domains == nil
  if all_domains["db_#{sub_domain}"] == nil
    no_db[sub_domain] = true
  else
    global_data[sub_domain] = aql("db_#{sub_domain}", aqls.settings)[1]
    global_data[sub_domain]['partials'] = {}

    settings[sub_domain] = global_data[sub_domain].settings[1]
--------------------------------------------------------------------------------
lua_files = (path) =>
  for file in lfs.dir(path) do
    if file ~= "." and file ~= ".." then
      f = path..'/'..file
      attr = lfs.attributes (f)
      if(type(attr) ~= "nil")
        assert(type(attr) == "table")
        if(attr.mode == "directory")
          lua_files(@, f)
        else
          if stringy.split(file, ".")[2] == "lua"
            path = stringy.split(f, ".")[1]\gsub("/", ".")
            @include path
--------------------------------------------------------------------------------
class extends lapis.Application
  @before_filter =>
    start_time = os.clock!

    define_subdomain(@)
    after_dispatch ->
      if config.measure_performance
        print to_json(ngx.ctx.performance)
        print to_json("#{(os.clock! - start_time) * 1000}ms")

  handle_error: (err, trace) =>
    if config._name == 'production' then
      print(to_json(err) .. to_json(trace))
      @err = err
      display_error_page(@, 500)
    else
      super err, trace

  @enable 'etlua'

  @include 'applications.uploads'
  @include 'applications.services'
  @include 'applications.assets'

  lua_files(@, "git")

  layout: false -- we don't need a layout, it will be loaded dynamically
  ------------------------------------------------------------------------------
  display_error_page = (status=500, headers={}) =>
    error_page = from_json(settings[sub_domain].home)["error_#{status}"]
    if error_page ~= nil then
      display_page(@, error_page, 404)
    else
      render: "error_#{status}" , status: status, headers: headers
  ------------------------------------------------------------------------------
  display_page = (slug=nil, status=200) =>
    db_name           = "db_#{sub_domain}"
    asset = ngx.location.capture("/git/#{db_name}/public/#{@req.parsed_url.path}")
    if asset.status == 200
      content_type: define_content_type(@req.parsed_url.path), status: 200, asset.body
    else
      slug              = @params.slug if slug == nil
      slug              = unescape(slug)
      @params.lang      = check_valid_lang(settings[sub_domain].langs, @params.lang)
      @session.lang     = @params.lang
      redirection       = load_redirection(db_name, @params)
      current_page      = load_page_by_slug(db_name, slug, @params.lang)

      used_lang         = @params.lang

      infos = page_info(db_name, @params.slug, @params.lang)

      if current_page == nil then
        used_lang = stringy.split(settings[sub_domain].langs, ',')[1]
        infos = page_info(db_name, @params.slug, used_lang)
        current_page = load_page_by_slug(db_name, slug, used_lang)

      page_content_type = define_content_type(slug)

      html = ''

      if @params.splat and table.getn(stringy.split(@params.splat, '/')) % 2 == 1
        @params.splat = "slug/#{@params.splat}"

      if infos == nil
        infos = { 'page': {}, 'folder': {} }
      else
        current_page.item = table_deep_merge(current_page.item, infos.page)

      if infos.page.og_aql and infos.page.og_aql[@params.lang] and infos.page.og_aql[@params.lang] != ''
        splat = {}
        splat = splat_to_table(@params.splat) if @params.splat
        bindvars = prepare_bindvars(splat, infos.page.og_aql[@params.lang], @params.lang)
        @params.og_data = aql(db_name, infos.page.og_aql[@params.lang], bindvars)[1]

      if redirection == nil then
        params_lang = @params.lang
        @params.lang = used_lang

        html = dynamic_page(db_name, current_page, @params, global_data[sub_domain])
        @params.lang = params_lang
      else
        html = redirection

      html = dynamic_replace(db_name, html, global_data[sub_domain], {}, @params)
      basic_auth(@, settings[sub_domain], infos) -- check if website need a basic auth
      if is_auth(@, settings[sub_domain], infos)
        if html ~= 'null' and trim(html) != '' then
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
    if no_db[sub_domain] then redirect_to: 'need_a_db'
    else
      load_settings(@)
      lang = @params.lang or stringy.split(settings[sub_domain].langs, ',')[1]
      @session.lang = check_valid_lang(settings[sub_domain].langs, lang)

      if @params.lang and @params.lang ~= @session.lang
        @params.all   = '-'
        @params.slug  = @params.lang
        @params.lang  = @session.lang

      @session.lang = check_valid_lang(settings[sub_domain].langs, lang)

      if @params.slug
        display_page(@)
      else
        home          = from_json(settings[sub_domain].home)
        @params.lang  = @session.lang
        @params.all   = home['all']
        @params.slug  = home['slug']
        @params.splat = home['splat'] if home['splat']

        if type(home['root_redirection']) == 'string'
          redirect_to: home['root_redirection']
        else
          display_page(@)
  ------------------------------------------------------------------------------
  [page_no_lang: '/:all/:slug']: =>
    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else

      load_settings(@)
      @params.lang = check_valid_lang(settings[sub_domain].langs, @params.all)
      unless @session.lang
        @session.lang = stringy.split(settings[sub_domain].langs, ',')[1]
      display_page(@)
  ------------------------------------------------------------------------------
  [page: '/:lang/:all/:slug(/*)']: =>
    if no_db[sub_domain] then redirect_to: '/need_a_db'
    else
      load_settings(@)
      display_page(@)
--