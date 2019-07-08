local encode_base64
encode_base64 = require("lapis.util.encoding").encode_base64
local isempty
isempty = function(s)
  return s == nil or s == ''
end
local settings_basic_auth
settings_basic_auth = function(item)
  return 'Basic ' .. encode_base64(tostring(item.ba_login) .. ":" .. tostring(item.ba_pass))
end
local basic_auth
basic_auth = function(app, setting, page_info)
  if app.req.headers["authorization"] then
    if settings_basic_auth(setting) == app.req.headers["authorization"] or settings_basic_auth(page_info.folder) == app.req.headers["authorization"] or settings_basic_auth(page_info.page) == app.req.headers["authorization"] then
      app.session.basic_auth = app.req.headers["authorization"]
    end
  end
end
local is_auth
is_auth = function(app, setting, page_info)
  return (isempty(setting.ba_login) and isempty(page_info.page.ba_login) and isempty(page_info.folder.ba_login)) or app.session.basic_auth == settings_basic_auth(setting) or app.session.basic_auth == settings_basic_auth(page_info.folder) or app.session.basic_auth == settings_basic_auth(page_info.page)
end
return {
  basic_auth = basic_auth,
  is_auth = is_auth
}
