import encode_base64 from require "lapis.util.encoding"

-- settings_basic_auth
settings_basic_auth = (setting) ->
  'Basic ' .. encode_base64("#{setting.ba_login}:#{setting.ba_pass}")

-- basic_auth
basic_auth = (app, setting) ->
  if app.req.headers["authorization"]
    if settings_basic_auth(setting) == app.req.headers["authorization"]
      app.session.basic_auth = app.req.headers["authorization"]

-- is_auth
is_auth = (app, setting) ->
  setting.ba_login == '' or app.session.basic_auth == settings_basic_auth(setting)

-- expose methods
{ :basic_auth, :is_auth }