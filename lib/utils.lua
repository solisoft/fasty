local from_json, to_json
do
  local _obj_0 = require('lapis.util')
  from_json, to_json = _obj_0.from_json, _obj_0.to_json
end
local stringy = require('stringy')
local date = require('date')
local table_merge
table_merge = function(t1, t2)
  for k, v in ipairs(t2) do
    table.insert(t1, v)
  end
  return t1
end
local table_deep_merge
table_deep_merge = function(t1, t2)
  for k, v in pairs(t2) do
    if type(v) == "table" then
      if type(t1[k] or false) == "table" then
        table_deep_merge(t1[k] or { }, t2[k] or { })
      else
        t1[k] = v
      end
    else
      t1[k] = v
    end
  end
  return t1
end
local table_index
table_index = function(tab, val)
  for index, value in ipairs(tab) do
    if value == val then
      return index
    end
  end
  return nil
end
local check_valid_lang
check_valid_lang = function(langs, lang)
  local allowed_lang = { }
  for k, v in pairs(stringy.split(langs, ',')) do
    allowed_lang[v] = true
  end
  if allowed_lang[lang] == nil then
    lang = stringy.split(langs, ',')[1]
  end
  return lang
end
local map
map = function(tbl, f)
  local data = { }
  for k, v in pairs(tbl) do
    data[k] = f(v)
  end
  return data
end
local to_timestamp
to_timestamp = function(d)
  local d1 = date(d)
  return date.diff(d1, date.epoch()):spanseconds()
end
return {
  table_merge = table_merge,
  table_deep_merge = table_deep_merge,
  table_index = table_index,
  check_valid_lang = check_valid_lang,
  map = map,
  to_timestamp = to_timestamp
}
