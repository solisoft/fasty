local sass = require('sass')
local lapis = require('lapis')
local stringy = require('stringy')
local console = require('lapis.console')
local config = require('lapis.config').get()
local cached
cached = require('lapis.cache').cached
local check_valid_lang
check_valid_lang = require('lib.utils').check_valid_lang
local install_service
install_service = require('lib.service').install_service
local basic_auth, is_auth
do
  local _obj_0 = require('lib.basic_auth')
  basic_auth, is_auth = _obj_0.basic_auth, _obj_0.is_auth
end
local hmac_sha1, encode_base64
do
  local _obj_0 = require('lapis.util.encoding')
  hmac_sha1, encode_base64 = _obj_0.hmac_sha1, _obj_0.encode_base64
end
local auth_arangodb, aql, list_databases
do
  local _obj_0 = require('lib.arango')
  auth_arangodb, aql, list_databases = _obj_0.auth_arangodb, _obj_0.aql, _obj_0.list_databases
end
local parse_query_string, from_json, to_json
do
  local _obj_0 = require('lapis.util')
  parse_query_string, from_json, to_json = _obj_0.parse_query_string, _obj_0.from_json, _obj_0.to_json
end
local capture_errors, yield_error, respond_to
do
  local _obj_0 = require('lapis.application')
  capture_errors, yield_error, respond_to = _obj_0.capture_errors, _obj_0.yield_error, _obj_0.respond_to
end
local dynamic_replace, dynamic_page, page_info, load_page_by_slug, load_redirection
do
  local _obj_0 = require('lib.concerns')
  dynamic_replace, dynamic_page, page_info, load_page_by_slug, load_redirection = _obj_0.dynamic_replace, _obj_0.dynamic_page, _obj_0.page_info, _obj_0.load_page_by_slug, _obj_0.load_redirection
end
local jwt = { }
local global_data = { }
local settings = { }
local no_db = { }
do
  local _class_0
  local load_settings
  local _parent_0 = lapis.Application
  local _base_0 = {
    handle_error = function(self, err, trace)
      if config._name == "production" then
        print(to_json(err))
        print(to_json(trace))
        return {
          render = "error_500"
        }
      else
        return _class_0.__parent.__base.handle_error(self, err, trace)
      end
    end,
    layout = false,
    [{
      need_a_db = '/need_a_db'
    }] = function(self)
      return {
        render = true
      }
    end,
    [{
      root = '/(:lang)'
    }] = function(self)
      local sub_domain = stringy.split(self.req.headers.host, '.')[1]
      if self.req.headers['x-forwarded-host'] then
        self.req.headers['host'] = self.req.headers['x-forwarded-host']
        self.req.parsed_url['host'] = self.req.headers['x-forwarded-host']
      end
      if no_db[sub_domain] then
        return {
          redirect_to = 'need_a_db'
        }
      else
        load_settings(self, sub_domain)
        if self.params.lang then
          self.session.lang = self.params.lang
        end
        self.session.lang = check_valid_lang(settings[sub_domain].langs, self.session.lang)
        local home = from_json(settings[sub_domain].home)
        return {
          redirect_to = "/" .. tostring(self.session.lang) .. "/" .. tostring(home['all']) .. "/" .. tostring(home['slug'])
        }
      end
    end,
    [{
      js = '/:lang/:layout/js/:rev.js'
    }] = function(self)
      local sub_domain = stringy.split(self.req.headers.host, '.')[1]
      load_settings(self, sub_domain)
      local js = aql("db_" .. tostring(sub_domain), "FOR doc in layouts FILTER doc._key == @key RETURN CONCAT(doc.i_js, '\n', doc.javascript)", {
        ["key"] = tostring(self.params.layout)
      })[1]
      return {
        content_type = "application/javascript"
      }, dynamic_replace("db_" .. tostring(sub_domain), js, { }, { }, self.params)
    end,
    [{
      css = '/:lang/:layout/css/:rev.css'
    }] = function(self)
      local sub_domain = stringy.split(self.req.headers.host, '.')[1]
      load_settings(self, sub_domain)
      local css = aql("db_" .. tostring(sub_domain), "FOR doc in layouts FILTER doc._key == @key RETURN { css: doc.i_css, scss: doc.scss }", {
        ["key"] = tostring(self.params.layout)
      })[1]
      local scss = sass.compile(css.scss, 'compressed')
      return {
        content_type = "text/css"
      }, dynamic_replace("db_" .. tostring(sub_domain), css.css .. "\n" .. scss, { }, { }, self.params)
    end,
    [{
      component = '/:lang/:key/component/:rev.tag'
    }] = function(self)
      local sub_domain = stringy.split(self.req.headers.host, '.')[1]
      load_settings(self, sub_domain)
      local html = ''
      for i, key in pairs(stringy.split(self.params.key, '-')) do
        html = html .. (aql("db_" .. tostring(sub_domain), "FOR doc in components FILTER doc._key == @key RETURN doc.html", {
          ["key"] = tostring(key)
        })[1] .. "\n")
      end
      return dynamic_replace("db_" .. tostring(sub_domain), html, global_data, { }, self.params)
    end,
    [{
      page_no_lang = '/:all/:slug'
    }] = function(self)
      if self.req.headers['x-forwarded-host'] then
        self.req.headers['host'] = self.req.headers['x-forwarded-host']
        self.req.parsed_url['host'] = self.req.headers['x-forwarded-host']
      end
      local sub_domain = stringy.split(self.req.headers.host, '.')[1]
      if no_db[sub_domain] then
        return {
          redirect_to = '/need_a_db'
        }
      else
        load_settings(self, sub_domain)
        if not (self.session.lang) then
          self.session.lang = stringy.split(settings[sub_domain].langs, ',')[1]
        end
        return {
          redirect_to = "/" .. tostring(self.session.lang) .. "/" .. tostring(self.params.all) .. "/" .. tostring(self.params.slug)
        }
      end
    end,
    [{
      page = '/:lang/:all/:slug(/*)'
    }] = function(self)
      local sub_domain = stringy.split(self.req.headers.host, '.')[1]
      local db_name = "db_" .. tostring(sub_domain)
      if no_db[sub_domain] then
        return {
          redirect_to = '/need_a_db'
        }
      else
        load_settings(self, sub_domain)
        self.params.lang = check_valid_lang(settings[sub_domain].langs, self.params.lang)
        self.session.lang = self.params.lang
        local redirection = load_redirection(db_name, self.params)
        local html = ''
        if redirection == nil then
          html = dynamic_page(db_name, load_page_by_slug(db_name, self.params.slug, self.params.lang), self.params, global_data)
        else
          html = redirection
        end
        html = dynamic_replace(db_name, html, global_data, { }, self.params)
        local infos = page_info(db_name, self.params.slug, self.params.lang)
        basic_auth(self, settings[sub_domain], infos)
        if is_auth(self, settings[sub_domain], infos) then
          if html ~= 'null' then
            return html
          else
            return {
              status = 404,
              render = 'error_404'
            }
          end
        else
          return {
            status = 401,
            headers = {
              ['WWW-Authenticate'] = 'Basic realm=\"admin\"'
            }
          }
        end
      end
    end,
    [{
      service = '/service/:name'
    }] = respond_to({
      POST = function(self)
        local sub_domain = stringy.split(self.req.headers.host, '.')[1]
        load_settings(self, sub_domain)
        if self.params.token == settings[sub_domain].token then
          install_service(sub_domain, self.params.name)
          return 'service installed'
        else
          return {
            status = 401
          }, 'Not authorized'
        end
      end
    }),
    [{
      console = '/console'
    }] = console.make()
  }
  _base_0.__index = _base_0
  setmetatable(_base_0, _parent_0.__base)
  _class_0 = setmetatable({
    __init = function(self, ...)
      return _class_0.__parent.__init(self, ...)
    end,
    __base = _base_0,
    __name = nil,
    __parent = _parent_0
  }, {
    __index = function(cls, name)
      local val = rawget(_base_0, name)
      if val == nil then
        local parent = rawget(cls, "__parent")
        if parent then
          return parent[name]
        end
      else
        return val
      end
    end,
    __call = function(cls, ...)
      local _self_0 = setmetatable({}, _base_0)
      cls.__init(_self_0, ...)
      return _self_0
    end
  })
  _base_0.__class = _class_0
  local self = _class_0
  self:enable("etlua")
  load_settings = function(self, sub_domain)
    if jwt[sub_domain] == nil then
      jwt[sub_domain] = auth_arangodb(sub_domain)
    end
    if list_databases()["db_" .. tostring(sub_domain)] == nil then
      no_db[sub_domain] = true
    else
      global_data = aql("db_" .. tostring(sub_domain), '\n        LET g_settings = (FOR doc IN settings LIMIT 1 RETURN doc)\n        LET g_redirections = (FOR doc IN redirections RETURN doc)\n        LET g_trads = (FOR doc IN trads RETURN ZIP([doc.key], [doc.value]))\n        LET g_components = (FOR doc IN components RETURN ZIP([doc.slug], [{ _key: doc._key, _rev: doc._rev }]))\n        LET g_aqls = (FOR doc IN aqls RETURN ZIP([doc.slug], [doc.aql]))\n        LET g_helpers = (\n          FOR h IN helpers\n            FOR p IN partials\n              FILTER h.partial_key == p._key\n              FOR a IN aqls\n                FILTER h.aql_key == a._key\n                RETURN ZIP([h.shortcut], [{ partial: p.slug, aql: a.slug }])\n        )\n        RETURN { components: g_components, settings: g_settings,\n          redirections: g_redirections, aqls: g_aqls,\n          trads: MERGE(g_trads), helpers: MERGE(g_helpers) }\n      ')[1]
      settings[sub_domain] = global_data.settings[1]
    end
  end
  if _parent_0.__inherited then
    _parent_0.__inherited(_parent_0, _class_0)
  end
  return _class_0
end
