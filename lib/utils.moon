import from_json, to_json from require 'lapis.util'
stringy = require 'stringy'
--------------------------------------------------------------------------------
-- Merge 2 table
table_merge = (t1, t2) ->
  for k,v in ipairs(t2) do table.insert(t1, v)
  t1
--------------------------------------------------------------------------------
-- Merge 2 tables with k, v
table_deep_merge = (t1, t2) ->
  for k,v in pairs(t2) do
    if type(v) == "table" then
      if type(t1[k] or false) == "table" then
        table_deep_merge(t1[k] or {}, t2[k] or {})
      else
        t1[k] = v
    else
      t1[k] = v
  t1
--------------------------------------------------------------------------------
-- Return Index off value in table or nil if not found
table_index = (tab, val) ->
  for index, value in ipairs(tab) do
    return index if value == val
  nil
--------------------------------------------------------------------------------
-- Check valid lang
check_valid_lang = (langs, lang) ->
  allowed_lang = {}
  for k, v in pairs(stringy.split(langs, ','))
    allowed_lang[v] = true

  if allowed_lang[lang] == nil then
    lang = stringy.split(langs, ',')[1]
  lang
--------------------------------------------------------------------------------
map = (tbl, f)->
  data = {}
  for k,v in pairs tbl
    data[k] = f(v)
  data
--------------------------------------------------------------------------------
-- expose methods
{ :table_merge, :table_deep_merge, :table_index, :check_valid_lang, :map }