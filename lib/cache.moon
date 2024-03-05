import slugify from require 'lapis.util'
import aql, document_get from require 'lib.arango'
import encode_with_secret from require 'lapis.util.encoding'
--------------------------------------------------------------------------------
write_cache = (filename, content, db_name, ttl) ->
  aql(
    db_name,
    "INSERT
      { _key: @key, value: @value, expire_date: DATE_ADD(DATE_NOW(), @ttl, 'seconds') }
      INTO cache",
    { key: slugify(db_name .. "-" .. filename), value: content, ttl: tonumber(ttl) }
  )
--------------------------------------------------------------------------------
read_cache = (db_name, filename) ->
  cache = { status: 404 }
  document = document_get(db_name, "cache/" .. slugify(db_name .. "-" .. filename))
  cache = { status: 200, body: document.value } unless document.error
  cache
--------------------------------------------------------------------------------
-- expose methods
{ :write_cache, :read_cache }