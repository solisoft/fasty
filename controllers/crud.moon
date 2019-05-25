-- nothing here ... just a controller sample
lapis = require "lapis"
http  = require "lapis.nginx.http"

import respond_to, capture_errors from require "lapis.application"
import aql,
       document_get,
       document_put,
       document_delete,
       document_post from require "lib.arango"

class extends lapis.Application

  [cruds: "/crud/:type/:limit/:offset"]: =>
    json: aql(
      "FOR doc IN @@collection LIMIT @offset, @limit RETURN doc",
      {
        "@collection": @params.type,
        "limit": tonumber(@params.limit),
        "offset": tonumber(@params.offset)
      }
    )

  [crud: "/crud/:type/:key"]: respond_to {
    GET: =>
      -- Load an object
      json: document_get(@params.type .. "/" .. @params.key)
    PUT: =>
      -- Update an object
      json: document_put(@params.type .. "/" .. @params.key, @params)
    DELETE: =>
      -- Delete an object
      json: document_delete(@params.type .. "/" .. @params.key)
  }

  [crud: "/crud/:type"]: respond_to {
    POST: =>
      -- Create an object
      json: document_post(@params.type, @params)
  }
