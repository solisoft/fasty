local encode_base64
encode_base64 = require("lapis.util.encoding").encode_base64
local settings_basic_auth
settings_basic_auth = function(setting)
  return 'Basic ' .. encode_base64(tostring(setting.ba_login) .. ":" .. tostring(setting.ba_pass))
end
local basic_auth
basic_auth = function(app, setting)
  if app.req.headers["authorization"] then
    if settings_basic_auth(setting) == app.req.headers["authorization"] then
      app.session.basic_auth = app.req.headers["authorization"]
    end
  end
end
local is_auth
is_auth = function(app, setting)
  return setting.ba_login == '' or app.session.basic_auth == settings_basic_auth(setting)
end
return {
  basic_auth = basic_auth,
  is_auth = is_auth
}
