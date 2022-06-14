import encode_base64 from require 'lapis.util.encoding'
import uuid from require 'lib.utils'
--------------------------------------------------------------------------------
isempty = (s)-> s == nil or s == ''
--------------------------------------------------------------------------------
settings_basic_auth = (item)->
  if not isempty(item.ba_login) and not isempty(item.ba_pass) then
    'Basic ' .. encode_base64("#{item.ba_login}:#{item.ba_pass}")
  else
    uuid!
--------------------------------------------------------------------------------
basic_auth = (app, setting, page_info)->
  if app.req.headers['authorization']
    if settings_basic_auth(setting) == app.req.headers['authorization'] or
       settings_basic_auth(page_info.folder) == app.req.headers['authorization'] or
       settings_basic_auth(page_info.page) == app.req.headers['authorization']
      app.session.basic_auth = app.req.headers['authorization']
--------------------------------------------------------------------------------
is_auth = (app, setting, page_info)->
  (
    isempty(setting.ba_login) and
    isempty(page_info.page.ba_login) and
    isempty(page_info.folder.ba_login)
  ) or
  app.session.basic_auth == settings_basic_auth(setting) or
  app.session.basic_auth == settings_basic_auth(page_info.folder) or
  app.session.basic_auth == settings_basic_auth(page_info.page)
--------------------------------------------------------------------------------
-- expose methods
{ :basic_auth, :is_auth }