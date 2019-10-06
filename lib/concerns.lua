local etlua = require('etlua')
local stringy = require('stringy')
local aql, document_get
do
  local _obj_0 = require('lib.arango')
  aql, document_get = _obj_0.aql, _obj_0.document_get
end
local table_deep_merge, to_timestamp
do
  local _obj_0 = require('lib.utils')
  table_deep_merge, to_timestamp = _obj_0.table_deep_merge, _obj_0.to_timestamp
end
local http_get
http_get = require('lib.http_client').http_get
local encode_with_secret
encode_with_secret = require('lapis.util.encoding').encode_with_secret
local from_json, to_json, trim, unescape
do
  local _obj_0 = require('lapis.util')
  from_json, to_json, trim, unescape = _obj_0.from_json, _obj_0.to_json, _obj_0.trim, _obj_0.unescape
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
  local str, _ = tostring(text):gsub('([%[%]%(%)%+%-%*%%])', '%%%1')
  return str
end
local prepare_headers
prepare_headers = function(html, data, params)
  local jshmac = stringy.split(encode_with_secret(data.layout.i_js, ''), ".")[2]:gsub("/", "-")
  local csshmac = stringy.split(encode_with_secret(data.layout.i_css, ''), ".")[2]:gsub("/", "-")
  html = html:gsub('@js_vendors', "/" .. tostring(params.lang) .. "/" .. tostring(data.layout._key) .. "/vendors/" .. tostring(jshmac) .. ".js")
  html = html:gsub('@js', "/" .. tostring(params.lang) .. "/" .. tostring(data.layout._key) .. "/js/" .. tostring(data.layout._rev) .. ".js")
  html = html:gsub('@css_vendors', "/" .. tostring(params.lang) .. "/" .. tostring(data.layout._key) .. "/vendors/" .. tostring(csshmac) .. ".css")
  html = html:gsub('@css', "/" .. tostring(params.lang) .. "/" .. tostring(data.layout._key) .. "/css/" .. tostring(data.layout._rev) .. ".css")
  local headers = "<title>" .. tostring(data.item.name) .. "</title>"
  if (data.item.og_title and data.item.og_title[params.lang]) then
    headers = "<title>" .. tostring(data.item.og_title[params.lang]) .. "</title>"
  end
  if (data.item.description and data.item.description[params.lang]) then
    headers = headers .. "<meta name=\"description\" content=\"" .. tostring(data.item.description[params.lang]) .. "\" />"
  end
  if (data.item.og_title and data.item.og_title[params.lang]) then
    headers = headers .. "<meta property=\"og:title\" content=\"" .. tostring(data.item.og_title[params.lang]) .. "\" />"
  end
  if (data.item.og_img and data.item.og_img[params.lang]) then
    headers = headers .. "<meta property=\"og:image\" content=\"" .. tostring(data.item.og_img[params.lang]) .. "\" />"
  end
  if (data.item.og_type and data.item.og_type[params.lang]) then
    headers = headers .. "<meta property=\"og:type\" content=\"" .. tostring(data.item.og_type[params.lang]) .. "\" />"
  end
  if (data.item.canonical and data.item.canonical[params.lang]) then
    headers = headers .. "<link rel=\"canonical\" href=\"" .. tostring(data.item.canonical[params.lang]) .. "\" />"
  end
  return html:gsub('@headers', headers)
end
local etlua2html
etlua2html = function(json, partial, params, global_data)
  local template = global_data.partials[partial.item._key]
  if template == nil then
    template = etlua.compile(partial.item.html)
    global_data.partials[partial.item._key] = template
  end
  local success, data = pcall(template, {
    ['dataset'] = json,
    ['to_json'] = to_json,
    ['lang'] = params.lang,
    ['params'] = params,
    ['to_timestamp'] = to_timestamp
  })
  return data
end
local load_document_by_slug
load_document_by_slug = function(db_name, slug, object)
  local request = "FOR item IN " .. tostring(object) .. " FILTER item.slug == @slug RETURN { item }"
  return aql(db_name, request, {
    slug = slug
  })[1]
end
local load_page_by_slug
load_page_by_slug = function(db_name, slug, lang, uselayout)
  if uselayout == nil then
    uselayout = true
  end
  local request = "FOR item IN pages FILTER item.slug[@lang] == @slug "
  if uselayout == true then
    request = request .. 'FOR layout IN layouts FILTER layout._id == item.layout_id RETURN { item, layout }'
  else
    request = request .. 'RETURN { item }'
  end
  local page = aql(db_name, request, {
    slug = slug,
    lang = lang
  })[1]
  if page then
    local publication = document_get(db_name, 'publications/pages_' .. page.item._key)
    if publication.code ~= 404 then
      page.item = publication.data
    end
  end
  return page
end
local page_info
page_info = function(db_name, slug, lang)
  local request = "\n    FOR page IN pages FILTER page.slug[@lang] == @slug\n    LET root = (\n      FOR folder IN folders\n      FILTER folder.name == 'Root' AND folder.object_type == 'pages'\n      RETURN folder\n    )[0]\n\n    FOR folder IN folders\n      FILTER folder._key == (HAS(page, 'folder_key') ? page.folder_key : root._key)\n      LET path = (\n        FOR v, e IN ANY SHORTEST_PATH folder TO root GRAPH 'folderGraph'\n        FILTER HAS(v, 'ba_login') AND v.ba_login != ''\n        RETURN v\n      )[0]\n\n      RETURN { page: UNSET(page, 'html'), folder: path == null ? folder : path }"
  return aql(db_name, request, {
    slug = slug,
    lang = lang
  })[1]
end
local load_dataset_by_slug
load_dataset_by_slug = function(db_name, slug, object, lang, uselayout)
  if uselayout == nil then
    uselayout = true
  end
  local request = "FOR item IN datasets FILTER item.type == '" .. tostring(object) .. "' FILTER item.slug == @slug "
  request = request .. 'RETURN { item }'
  local dataset = aql(db_name, request, {
    slug = slug
  })[1]
  if dataset then
    local publication = document_get(db_name, 'publications/' .. object .. '_' .. dataset.item._key)
    if publication.code ~= 404 then
      dataset.item = publication.data
    end
  end
  return dataset
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
    local page_partial = load_document_by_slug(db_name, 'page', 'partials')
    global_data.page_partial = page_partial
    if uselayout then
      html = prepare_headers(data.layout.html, data, params)
      if (data.item.raw_html and type(data.item.raw_html[params['lang']]) == 'string') then
        html = html:gsub('@raw_yield', escape_pattern(data.item.raw_html[params['lang']]))
      else
        html = html:gsub('@raw_yield', '')
      end
      local json = data.item.html[params['lang']].json
      if (type(json) == 'table' and next(json) ~= nil) then
        html = html:gsub('@yield', escape_pattern(etlua2html(json, page_partial, params, global_data)))
      end
    else
      html = etlua2html(data.item.html.json, page_partial, params, global_data)
    end
    html = html:gsub('@yield', '')
    html = html:gsub('@raw_yield', '')
  end
  return html
end
local load_redirection
load_redirection = function(db_name, params)
  local request = "\n  FOR r IN redirections\n    FILTER r.route == @slug\n    LET spa = (FOR s IN spas FILTER s._id == r.spa_id RETURN s)[0]\n    LET layout = (FOR l IN layouts FILTER l._id == r.layout_id RETURN l)[0]\n    RETURN { item: r, spa_name: spa.name, layout }\n  "
  local redirection = aql(db_name, request, {
    slug = params.slug
  })[1]
  if redirection ~= nil then
    local html = redirection.layout.html:gsub('@yield', "<div class='" .. tostring(redirection.item.class) .. "'>{{ spa | " .. tostring(redirection.spa_name) .. " }}</div>")
    return prepare_headers(html, redirection, params)
  else
    return nil
  end
end
local prepare_bindvars
prepare_bindvars = function(splat, aql_request)
  local bindvar = { }
  if aql_request:find('@page') then
    bindvar["page"] = 1
  end
  for k, v in pairs(splat) do
    v = unescape(tostring(v))
    if v:match('^%d+$') then
      v = tonumber(v)
    end
    if aql_request:find('@' .. k) then
      bindvar[k] = v
    end
  end
  return bindvar
end
local dynamic_replace
dynamic_replace = function(db_name, html, global_data, history, params)
  local translations = global_data.trads
  local aqls = global_data.aqls
  local helpers = global_data.helpers
  local splat = { }
  if params.splat then
    splat = splat_to_table(params.splat)
  end
  html = html:gsub('{{ lang }}', params.lang)
  for widget in string.gmatch(html, '{{.-}}') do
    local output, action, item, dataset = '', '', '', ''
    local args, keywords = { }, { }
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
    if action == 'settings' and from_json(global_data.settings[1].home)[item] then
      output = from_json(global_data.settings[1].home)[item]
    end
    if action == 'splat' and splat[item] then
      output = splat[item]
    end
    if action == 'html' then
      if dataset ~= '' then
        local request = "FOR item IN datasets FILTER item._id == @key "
        request = request .. 'RETURN item'
        local object = aql(db_name, request, {
          key = 'datasets/' .. item
        })[1]
        output = etlua2html(object[dataset].json, global_data.page_partial, params, global_data)
      else
        output = etlua2html(params.og_data[item], global_data.page_partial, params, global_data)
      end
    end
    if action == 'page' then
      if history[widget] == nil then
        history[widget] = true
        local page_html = ''
        if dataset == '' then
          page_html = dynamic_page(db_name, load_page_by_slug(db_name, item, 'pages', params.lang, false), params, global_data, history, false)
        else
          if splat[item] then
            item = splat[item]
          end
          page_html = dynamic_page(db_name, load_dataset_by_slug(db_name, item, dataset, params.lang), params, global_data, history, false)
        end
        output = output .. dynamic_replace(db_name, page_html, global_data, history, params)
      end
    end
    if action == 'helper' then
      local helper = helpers[item]
      if dataset ~= '' then
        dataset = '#' .. dataset
      end
      output = "{{ partial | " .. helper.partial .. " | arango | req#" .. helper.aql .. dataset .. " }}"
      output = dynamic_replace(db_name, output, global_data, history, params)
    end
    if action == 'partial' then
      local partial = load_document_by_slug(db_name, item, 'partials', false)
      if partial then
        local db_data = {
          ["page"] = 1
        }
        if dataset == 'arango' then
          if args['req'] then
            args['aql'] = aql(db_name, 'FOR aql IN aqls FILTER aql.slug == @slug RETURN aql.aql', {
              slug = args['req']
            })[1]
          end
          local bindvar = prepare_bindvars(table_deep_merge(splat, args), args['aql'])
          for str in string.gmatch(args['aql'], '__IF (%w-)__') do
            if not (bindvar[str]) then
              args['aql'] = args['aql']:gsub('__IF ' .. str .. '__.-__END ' .. str .. '__', '')
            else
              args['aql'] = args['aql']:gsub('__IF ' .. str .. '__', '')
              args['aql'] = args['aql']:gsub('__END ' .. str .. '__', '')
            end
          end
          for str in string.gmatch(args['aql'], '__IF_NOT (%w-)__') do
            if bindvar[str] then
              args['aql'] = args['aql']:gsub('__IF_NOT ' .. str .. '__.-__END_NOT ' .. str .. '__', '')
            else
              args['aql'] = args['aql']:gsub('__IF_NOT ' .. str .. '__', '')
              args['aql'] = args['aql']:gsub('__END_NOT ' .. str .. '__', '')
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
        partial.item.html = dynamic_replace(db_name, partial.item.html, global_data, history, params)
        if dataset ~= 'do_not_eval' then
          output = etlua2html(db_data, partial, params, global_data)
        else
          output = partial.item.html
        end
        output = dynamic_replace(db_name, output, global_data, history, params)
      end
    end
    if action == 'riot' then
      if history[widget] == nil then
        history[widget] = true
        local data = {
          ids = { },
          revisions = { },
          names = { }
        }
        for i, k in pairs(stringy.split(item, '#')) do
          local component = aql(db_name, "FOR doc in components FILTER doc.slug == @slug RETURN doc", {
            ["slug"] = k
          })[1]
          table.insert(data.ids, component._key)
          table.insert(data.revisions, component._rev)
          table.insert(data.names, k)
        end
        output = output .. "<script src='/" .. tostring(params.lang) .. "/" .. tostring(table.concat(data.ids, "-")) .. "/component/" .. tostring(table.concat(data.revisions, "-")) .. ".tag' type='riot/tag'></script>"
        if dataset == "mount" then
          output = output .. "<script>"
          output = output .. "document.addEventListener('DOMContentLoaded', function() { riot.mount('" .. tostring(table.concat(data.names, ", ")) .. "') });"
          output = output .. "document.addEventListener('turbolinks:load', function() { riot.mount('" .. tostring(table.concat(data.names, ", ")) .. "') });"
          output = output .. "</script>"
        end
      end
    end
    if action == 'spa' then
      if history[widget] == nil then
        history[widget] = true
        local spa = aql(db_name, "FOR doc in spas FILTER doc.slug == @slug RETURN doc", {
          ["slug"] = item
        })[1]
        output = spa.html
        output = output .. "<script>" .. tostring(spa.js) .. "</script>"
        output = dynamic_replace(db_name, output, global_data, history, params)
      end
    end
    if action == 'aql' then
      local aql_request = aql(db_name, "FOR a in aqls FILTER a.slug == @slug RETURN a", {
        ["slug"] = item
      })[1]
      if aql_request then
        aql(db_name, aql_request.aql, prepare_bindvars(splat, aql_request.aql))
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
      if action == 'external' then
        output = http_get(item, { })
      end
    end
    if action == 'og_data' then
      if params.og_data then
        output = params.og_data[item]
      end
    end
    if action == 'dataset' then
      item = stringy.split(item, "=")
      local request = "FOR item IN datasets FILTER item.@field == @value RETURN item"
      local object = aql(db_name, request, {
        field = item[1],
        value = item[2]
      })[1]
      if object then
        output = object[dataset]
      else
        output = ' '
      end
    end
    if output ~= '' then
      html = html:gsub(escape_pattern(widget), escape_pattern(output))
    end
  end
  return html
end
return {
  splat_to_table = splat_to_table,
  load_page_by_slug = load_page_by_slug,
  dynamic_page = dynamic_page,
  escape_pattern = escape_pattern,
  dynamic_replace = dynamic_replace,
  load_redirection = load_redirection,
  page_info = page_info,
  prepare_bindvars = prepare_bindvars
}
