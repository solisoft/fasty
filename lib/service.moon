http = require 'lapis.nginx.http'

import aql from require 'lib.arango'
import from_json, to_json, trim from require 'lapis.util'

install_service = (sub_domain, name)->
  os.execute('mkdir -p install_service/' .. sub_domain .. '/' .. name .. '/APP/routes')
  os.execute('mkdir -p install_service/' .. sub_domain .. '/' .. name .. '/APP/scripts')

  request = '
    FOR api IN apis
      FILTER api.name == @name
      LET routes = (FOR route IN api_routes FILTER route.api_id == api._key RETURN route)
      LET scripts = (FOR script IN api_scripts FILTER script.api_id == api._key RETURN script)
      RETURN { api, routes, scripts }
  '
  api = aql("db_#{sub_domain}", request, { 'name': name })

  os.execute('rm --recursive install_service/' .. sub_domain .. '/' .. name)
  to_json(api)

-- expose methods
{ :install_service }