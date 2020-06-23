import from_json, to_json from require 'lapis.util'
stringy = require 'stringy'
date    = require 'date'
--------------------------------------------------------------------------------
uuid = () ->
  template ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  math.randomseed(os.clock())
  return string.gsub(template, '[xy]', (c) ->
      v = (c == 'x') and math.random(0, 0xf) or math.random(8, 0xb)
      return string.format('%x', v)
  )
--------------------------------------------------------------------------------
table_merge = (t1, t2) ->
  for k,v in ipairs(t2) do table.insert(t1, v)
  t1
--------------------------------------------------------------------------------
table_deep_merge = (t1, t2) ->
  for k,v in pairs(t2) do
    if type(v) == "table" then
      if type(t1[k] or false) == "table" then
        table_deep_merge(t1[k] or {}, t2[k] or {})
      else t1[k] = v
    else t1[k] = v
  t1
--------------------------------------------------------------------------------
table_index = (tab, val) ->
  for index, value in ipairs(tab) do return index if value == val
  nil
--------------------------------------------------------------------------------
check_valid_lang = (langs, lang) ->
  allowed_langs = stringy.split(langs, ',')
  lang = allowed_langs[1] if table_index(allowed_langs, lang) == nil
  lang
--------------------------------------------------------------------------------
map = (tbl, f)->
  data = {}
  for k,v in pairs tbl do data[k] = f(v)
  data
--------------------------------------------------------------------------------
to_timestamp = (d) ->
  d1 = date(d)
  date.diff(d1, date.epoch!)\spanseconds!
--------------------------------------------------------------------------------
-- expose methods
{ :table_merge, :table_deep_merge, :table_index, :check_valid_lang, :map, :to_timestamp, :uuid }