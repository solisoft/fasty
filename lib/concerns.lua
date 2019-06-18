local etlua = require('etlua')
local stringy = require('stringy')
local aql, document_get
do
  local _obj_0 = require('lib.arango')
  aql, document_get = _obj_0.aql, _obj_0.document_get
end
local table_deep_merge
table_deep_merge = require('lib.utils').table_deep_merge
local http_get
http_get = require('lib.http_client').http_get
local from_json, to_json, trim
do
  local _obj_0 = require('lapis.util')
  from_json, to_json, trim = _obj_0.from_json, _obj_0.to_json, _obj_0.trim
end
local splat_to_table
splat_to_table = function(splat, sep)
  if sep == nil then
    sep = '/'
  end
  local _tbl_0 = { }
  for k, v in splat:gmatch(tostring(sep) .. "?(.-)" .. tostring(sep) .. "([^" .. tostring(sep) .. "]+)" .. tostring(sep) .. "?") do
    _tbl_0[k] = v
  end
  return _tbl_0
end
local escape_pattern
escape_pattern = function(text)
  local str, _ = text:gsub('([%[%]%(%)%+%-%*%%])', '%%%1')
  return str
end
local prepare_headers
prepare_headers = function(html, data, params)
  html = html:gsub('@js', "/" .. tostring(params.lang) .. "/" .. tostring(data.layout._key) .. "/js/" .. tostring(data.layout._rev) .. ".js")
  html = html:gsub('@css', "/" .. tostring(params.lang) .. "/" .. tostring(data.layout._key) .. "/css/" .. tostring(data.layout._rev) .. ".css")
  local headers = "<title>" .. tostring(data.item.name) .. "</title>"
  if (data.item.og_title[params.lang]) then
    headers = "<title>" .. tostring(data.item.og_title[params.lang]) .. "</title>"
  end
  if (data.item.description[params.lang]) then
    headers = headers .. "<meta name='description' content='" .. tostring(data.item.description[params.lang]) .. "'>"
  end
  if (data.item.og_title[params.lang]) then
    headers = headers .. "<meta property='og:title' content='" .. tostring(data.item.og_title[params.lang]) .. "' />"
  end
  if (data.item.og_img[params.lang]) then
    headers = headers .. "<meta property='og:image' content='" .. tostring(data.item.og_img[params.lang]) .. "' />"
  end
  if (data.item.og_type[params.lang]) then
    headers = headers .. "<meta property='og:type' content='" .. tostring(data.item.og_type[params.lang]) .. "' />"
  end
  return html:gsub('@headers', headers)
end
local etlua2html
etlua2html = function(json, partial, lang)
  local template = etlua.compile(partial.item.html)
  return template({
    ['dataset'] = json,
    ['to_json'] = to_json,
    ['lang'] = lang
  })
end
local load_partial_by_slug
load_partial_by_slug = function(db_name, slug, object)
  local request = "FOR item IN " .. tostring(object) .. " FILTER item.slug == @slug RETURN { item }"
  return aql(db_name, request, {
    slug = slug
  })[1]
end
local load_page_by_slug
load_page_by_slug = function(db_name, slug, object, lang, uselayout)
  if uselayout == nil then
    uselayout = true
  end
  local request = "FOR item IN " .. tostring(object) .. " FILTER item.slug[@lang] == @slug "
  if uselayout == true then
    request = request .. 'FOR layout IN layouts FILTER layout._id == item.layout_id RETURN { item, layout }'
  else
    request = request .. 'RETURN { item }'
  end
  local page = aql(db_name, request, {
    slug = slug,
    lang = lang
  })[1]
  local publication = document_get(db_name, 'publications/' .. object .. '_' .. page.item._key)
  if publication.code ~= 404 then
    page.item = publication.data
  end
  return page
end
local load_dataset_by_slug
load_dataset_by_slug = function(db_name, slug, object, lang, uselayout)
  if uselayout == nil then
    uselayout = true
  end
  local request = "FOR item IN datasets FILTER item.type == '" .. tostring(object) .. "' FILTER item.slug == @slug "
  request = request .. 'RETURN { item }'
  local page = aql(db_name, request, {
    slug = slug
  })[1]
  local publication = document_get(db_name, 'publications/' .. object .. '_' .. page.item._key)
  if publication.code ~= 404 then
    page.item = publication.data
  end
  return page
end
local dynamic_page
dynamic_page = function(db_name, data, params, global_data, history, uselayout)
  if history == nil then
    history = { }
  end
  if uselayout == nil then
    uselayout = true
  end
  local html = to_json(data)
  if data then
    local page_partial = load_partial_by_slug(db_name, 'page', 'partials')
    if uselayout then
      html = data.layout.html:gsub('@yield', escape_pattern(etlua2html(data.item.html[params['lang']].json, page_partial, params.lang)))
      html = prepare_headers(html, data, params)
    else
      html = data.item.html
    end
  end
  return html
end
local dynamic_replace
dynamic_replace = function(db_name, html, global_data, history, params)
  local translations = global_data.trads
  local aqls = global_data.aqls
  local helpers = global_data.helpers
  html = html:gsub('{{ lang }}', params.lang)
  if helpers then
    for widget in string.gmatch(html, '{{.-}}') do
      local output = ''
      local action = ''
      local item = ''
      local keywords = { }
      local widget_no_deco, _ = widget:gsub("{{ ", ""):gsub(" }}", "")
      for i, k in pairs(stringy.split(widget_no_deco, '|')) do
        table.insert(keywords, trim(k))
      end
      if keywords[1] then
        action = keywords[1]
      end
      if keywords[2] then
        item = keywords[2]
      end
      if action == 'helper' then
        local helper = helpers[item]
        output = "{{ partial | " .. helper.partial .. " | arango | req#" .. helper.aql .. " }}"
        html = html:gsub(escape_pattern(widget), escape_pattern(output))
      end
    end
  end
  for widget in string.gmatch(html, '{{.-}}') do
    local output = ''
    local action = ''
    local item = ''
    local dataset = ''
    local args = { }
    local keywords = { }
    local widget_no_deco, _ = widget:gsub("{{ ", ""):gsub(" }}", "")
    for i, k in pairs(stringy.split(widget_no_deco, '|')) do
      table.insert(keywords, trim(k))
    end
    if keywords[1] then
      action = keywords[1]
    end
    if keywords[2] then
      item = keywords[2]
    end
    if keywords[3] then
      dataset = keywords[3]
    end
    if keywords[4] then
      args = splat_to_table(keywords[4], '#')
    end
    if action == 'page' then
      if history[widget] == nil then
        history[widget] = true
        local obj = { }
        if dataset == '' then
          obj = dynamic_page(db_name, load_page_by_slug(db_name, item, 'pages', params.lang, false), params, global_data, history, false)
        else
          obj = dynamic_page(db_name, load_dataset_by_slug(db_name, item, dataset, params.lang), params, global_data, history, false)
        end
        output = output .. dynamic_replace(db_name, obj.html, global_data, history, params)
      end
    end
    if action == 'partial' then
      if history[widget] == nil then
        history[widget] = true
        local partial = load_partial_by_slug(db_name, item, 'partials', false)
        if partial then
          local splat = { }
          if params.splat then
            splat = splat_to_table(params.splat)
          end
          local db_data = { }
          if dataset == 'arango' then
            if args['req'] then
              args['aql'] = aql(db_name, 'FOR aql IN aqls FILTER aql.slug == @slug RETURN aql.aql', {
                slug = args['req']
              })[1]
            end
            local bindvar = { }
            for k, v in pairs(splat) do
              if v:match('^%d+$') then
                v = tonumber(v)
              end
              if args['aql']:find('@' .. k) then
                bindvar[k] = v
              end
            end
            for condition in string.gmatch(args['aql'], '__IF (%w-)__') do
              if not (bindvar[condition]) then
                args['aql'] = args['aql']:gsub('__IF ' .. condition .. '__.-__END ' .. condition .. '__', '')
              else
                args['aql'] = args['aql']:gsub('__IF ' .. condition .. '__', '')
                args['aql'] = args['aql']:gsub('__END ' .. condition .. '__', '')
              end
            end
            for condition in string.gmatch(args['aql'], '__IF_NOT (%w-)__') do
              if bindvar[condition] then
                args['aql'] = args['aql']:gsub('__IF_NOT ' .. condition .. '__.-__END_NOT ' .. condition .. '__', '')
              else
                args['aql'] = args['aql']:gsub('__IF_NOT ' .. condition .. '__', '')
                args['aql'] = args['aql']:gsub('__END_NOT ' .. condition .. '__', '')
              end
            end
            db_data = {
              results = aql(db_name, args['aql'], bindvar)
            }
            db_data = table_deep_merge(db_data, {
              _params = args
            })
          end
          if dataset == 'rest' then
            db_data = from_json(http_get(args['url'], args['headers']))
          end
          if args['use_params'] then
            db_data = table_deep_merge(db_data, {
              _params = args
            })
          end
          output = etlua2html(db_data, partial, params.lang)
          output = dynamic_replace(db_name, output, global_data, history, params)
        end
      end
    end
    if action == 'riot' then
      if history[widget] == nil then
        history[widget] = true
        local component = aql(db_name, "FOR doc in components FILTER doc.slug == @slug RETURN doc", {
          ["slug"] = item
        })[1]
        output = output .. "<script src='/" .. tostring(params.lang) .. "/" .. tostring(component._key) .. "/component/" .. tostring(component._rev) .. ".tag' type='riot/tag'></script>"
        if dataset == "mount" then
          output = output .. "<script>window.onload = function() { riot.mount('" .. tostring(item) .. "') }</script>"
        end
      end
    end
    if action == 'tr' then
      output = "Missing translation <em style='color:red'>" .. tostring(item) .. "</em>"
      if not (translations[item]) then
        aql(db_name, 'INSERT { key: @key, value: {} } IN trads', {
          key = item
        })
      end
      if translations[item] and translations[item][params.lang] then
        output = translations[item][params.lang]
      end
    end
    if action == 'external' then
      output = http_get(item, { })
    end
    html = html:gsub(escape_pattern(widget), escape_pattern(output))
  end
  return html
end
return {
  splat_to_table = splat_to_table,
  load_page_by_slug = load_page_by_slug,
  dynamic_page = dynamic_page,
  escape_pattern = escape_pattern,
  dynamic_replace = dynamic_replace
}
