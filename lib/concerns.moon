etlua   = require 'etlua'
stringy = require 'stringy'
import aql, document_get from require 'lib.arango'
import table_deep_merge, to_timestamp from require 'lib.utils'
import http_get from require 'lib.http_client'
import encode_with_secret from require 'lapis.util.encoding'
import from_json, to_json, trim, unescape from require 'lapis.util'
--------------------------------------------------------------------------------
splat_to_table = (splat, sep = '/') -> { k, v for k, v in splat\gmatch "#{sep}?(.-)#{sep}([^#{sep}]+)#{sep}?" }
--------------------------------------------------------------------------------
escape_pattern = (text) ->
  str, _ = tostring(text)\gsub('([%[%]%(%)%+%-%*%%])', '%%%1')
  str
--------------------------------------------------------------------------------
prepare_headers = (html, data, params)->
  jshmac = stringy.split(encode_with_secret(data.layout.i_js, ''), ".")[2]\gsub("/", "-")
  csshmac = stringy.split(encode_with_secret(data.layout.i_css, ''), ".")[2]\gsub("/", "-")
  html = html\gsub('@js_vendors', "/#{params.lang}/#{data.layout._key}/vendors/#{jshmac}.js")
  html = html\gsub('@js', "/#{params.lang}/#{data.layout._key}/js/#{data.layout._rev}.js")
  html = html\gsub('@css_vendors', "/#{params.lang}/#{data.layout._key}/vendors/#{csshmac}.css")
  html = html\gsub('@css', "/#{params.lang}/#{data.layout._key}/css/#{data.layout._rev}.css")
  headers = "<title>#{data.item.name}</title>"
  if(data.item.og_title and data.item.og_title[params.lang])
    headers = "<title>#{data.item.og_title[params.lang]}</title>"
  if(data.item.description and data.item.description[params.lang])
    headers ..= "<meta name=\"description\" content=\"#{data.item.description[params.lang]}\" />"
  if(data.item.og_title and data.item.og_title[params.lang])
    headers ..= "<meta property=\"og:title\" content=\"#{data.item.og_title[params.lang]}\" />"
  if(data.item.og_img and data.item.og_img[params.lang])
    headers ..= "<meta property=\"og:image\" content=\"#{data.item.og_img[params.lang]}\" />"
  if(data.item.og_type and data.item.og_type[params.lang])
    headers ..= "<meta property=\"og:type\" content=\"#{data.item.og_type[params.lang]}\" />"

  html\gsub('@headers', headers)
--------------------------------------------------------------------------------
etlua2html = (json, partial, params) ->
  template = etlua.compile(partial.item.html)
  template({
    'dataset': json, 'to_json': to_json,
    'lang': params.lang, 'params': params, 'to_timestamp': to_timestamp
  })
--------------------------------------------------------------------------------
load_document_by_slug = (db_name, slug, object) ->
  request = "FOR item IN #{object} FILTER item.slug == @slug RETURN { item }"
  aql(db_name, request, { slug: slug })[1]
--------------------------------------------------------------------------------
load_page_by_slug = (db_name, slug, lang, uselayout = true) ->
  request = "FOR item IN pages FILTER item.slug[@lang] == @slug "
  if uselayout == true
    request ..= 'FOR layout IN layouts FILTER layout._id == item.layout_id RETURN { item, layout }'
  else request ..= 'RETURN { item }'

  page = aql(db_name, request, { slug: slug, lang: lang })[1]

  if page
    publication = document_get(db_name, 'publications/pages_' .. page.item._key)
    if publication.code ~= 404 then page.item = publication.data

  page
--------------------------------------------------------------------------------
page_info = (db_name, slug, lang) ->
  request = "
    FOR page IN pages FILTER page.slug[@lang] == @slug
    LET root = (
      FOR folder IN folders
      FILTER folder.name == 'Root' AND folder.object_type == 'pages'
      RETURN folder
    )[0]

    FOR folder IN folders
      FILTER folder._key == (HAS(page, 'folder_key') ? page.folder_key : root._key)
      LET path = (
        FOR v, e IN ANY SHORTEST_PATH folder TO root GRAPH 'folderGraph'
        FILTER HAS(v, 'ba_login') AND v.ba_login != ''
        RETURN v
      )[0]

      RETURN { page: UNSET(page, 'html'), folder: path == null ? folder : path }"
  aql(db_name, request, { slug: slug, lang: lang })[1]
--------------------------------------------------------------------------------
load_dataset_by_slug = (db_name, slug, object, lang, uselayout = true) ->
  request = "FOR item IN datasets FILTER item.type == '#{object}' FILTER item.slug == @slug "
  request ..= 'RETURN { item }'
  dataset = aql(db_name, request, { slug: slug })[1]

  if dataset
    publication = document_get(db_name, 'publications/' .. object .. '_' .. dataset.item._key)
    if publication.code ~= 404 then dataset.item = publication.data

  dataset
--------------------------------------------------------------------------------
-- dynamic_page : check all {{ .* }} and load layout
dynamic_page = (db_name, data, params, global_data, history = {}, uselayout = true) ->
  html = to_json(data)
  if data
    page_partial = load_document_by_slug(db_name, 'page', 'partials')
    global_data.page_partial = page_partial
    if uselayout
      html = prepare_headers(data.layout.html, data, params)

      if(data.item.raw_html and type(data.item.raw_html[params['lang']]) == 'string')
        html = html\gsub('@raw_yield', escape_pattern(data.item.raw_html[params['lang']]))
      else
        html = html\gsub('@raw_yield', '')

      json = data.item.html[params['lang']].json
      if(type(json) == 'table' and next(json) ~= nil)
        html = html\gsub('@yield', escape_pattern(etlua2html(json, page_partial, params)))

    else html = etlua2html(data.item.html.json, page_partial, params)

  html
--------------------------------------------------------------------------------
load_redirection = (db_name, params) ->
  request = "
  FOR r IN redirections
    FILTER r.route == @slug
    LET spa = (FOR s IN spas FILTER s._id == r.spa_id RETURN s)[0]
    LET layout = (FOR l IN layouts FILTER l._id == r.layout_id RETURN l)[0]
    RETURN { item: r, spa_name: spa.name, layout }
  "
  redirection = aql(db_name, request, { slug: params.slug })[1]

  if redirection != nil then
    html = redirection.layout.html\gsub(
      '@yield',
      "<div class='#{redirection.item.class}'>{{ spa | #{redirection.spa_name} }}</div>"
    )
    prepare_headers(html, redirection, params)
  else nil
--------------------------------------------------------------------------------
prepare_bindvars = (splat, aql_request) ->
  bindvar = { }
  bindvar["page"] = 1 if aql_request\find('@page')
  for k, v in pairs(splat) do
    v = unescape(tostring(v))
    v = tonumber(v) if v\match('^%d+$')
    bindvar[k] = v if aql_request\find('@' .. k)
  bindvar
--------------------------------------------------------------------------------
dynamic_replace = (db_name, html, global_data, history, params) ->
  translations = global_data.trads
  aqls = global_data.aqls
  helpers = global_data.helpers
  splat = {}
  splat = splat_to_table(params.splat) if params.splat

  -- {{ lang }}
  html = html\gsub('{{ lang }}', params.lang)

  for widget in string.gmatch(html, '{{.-}}') do
    output, action, item, dataset = '', '', '', ''
    args, keywords = {}, {}

    widget_no_deco, _ = widget\gsub("{{ ", "")\gsub(" }}", "")
    table.insert(keywords, trim(k)) for i, k in pairs(stringy.split(widget_no_deco, '|'))

    action  = keywords[1] if keywords[1]
    item    = keywords[2] if keywords[2]
    dataset = keywords[3] if keywords[3]
    args    = splat_to_table(keywords[4], '#') if keywords[4]

    -- {{ settings | key }}
    -- e.g. {{ settings | chatroom_url }}
    if action == 'settings' and from_json(global_data.settings[1].home)[item]
      output = from_json(global_data.settings[1].home)[item]

    -- {{ splat | key }}
    -- e.g. {{ splat | salon }}
    if action == 'splat' and splat[item] then output = splat[item]

    -- {{ html | key | field }}
    -- {{ html | key }} data will then come from params og_data.json
    -- Using og_data reduce http calls
    if action == 'html'
      if dataset ~= ''
        request = "FOR item IN datasets FILTER item._id == @key "
        request ..= 'RETURN item'
        object = aql(db_name, request, { key: 'datasets/' .. item })[1]
        output = etlua2html(object[dataset].json, global_data.page_partial, params)
      else
        output = etlua2html(params.og_data[item], global_data.page_partial, params)

    -- {{ page | <slug or field> (| <datatype>) }}
    -- e.g. {{ page | set_a_slug_here }}
    -- e.g. {{ page | slug | posts }}
    if action == 'page'
      if history[widget] == nil -- prevent stack level too deep
        history[widget] = true
        page_html = ''
        if dataset == ''
          page_html = dynamic_page(
            db_name,
            load_page_by_slug(db_name, item, 'pages', params.lang, false),
            params, global_data, history, false
          )
        else
          if splat[item] then item = splat[item]
          page_html = dynamic_page(
            db_name,
            load_dataset_by_slug(db_name, item, dataset, params.lang),
            params, global_data, history, false
          )

        output ..= dynamic_replace(db_name, page_html, global_data, history, params)

    -- {{ helper | shortcut }}
    -- e.g. {{ helper | hello_world }}
    if action == 'helper'
      helper = helpers[item]
      output = "{{ partial | " .. helper.partial .. " | arango | req#" .. helper.aql .. " }}"
      output = dynamic_replace(db_name, output, global_data, history, params)

    -- {{ partial | slug | <dataset> | <args> }}
    -- e.g. {{ partial | demo | arango | aql/FOR doc IN pages RETURN doc }}
    -- params splat will be used to provide data if arango dataset
    if action == 'partial'
      if history[widget] == nil -- prevent stack level too deep
        history[widget] = true
        partial = load_document_by_slug(db_name, item, 'partials', false)
        if partial
          db_data = { "page": 1 }
          if dataset == 'arango'
            -- check if it's a stored procedure
            if args['req']
              args['aql'] = aql(
                db_name, 'FOR aql IN aqls FILTER aql.slug == @slug RETURN aql.aql',
                { slug: args['req'] }
              )[1]

            -- prepare the bindvar variable with variable found in the request
            bindvar = prepare_bindvars(splat, args['aql'])

            -- handle conditions __IF <bindvar> __ .... __END <bindvar>__
            for str in string.gmatch(args['aql'], '__IF (%w-)__') do
              unless bindvar[str] then
                args['aql'] = args['aql']\gsub('__IF ' .. str ..
                              '__.-__END ' .. str .. '__', '')
              else
                args['aql'] = args['aql']\gsub('__IF ' .. str .. '__', '')
                args['aql'] = args['aql']\gsub('__END ' .. str .. '__', '')

            -- handle strs __IF_NOT <bindvar> __ .... __END_NOT <bindvar>__
            for str in string.gmatch(args['aql'], '__IF_NOT (%w-)__') do
              if bindvar[str] then
                args['aql'] = args['aql']\gsub(
                  '__IF_NOT ' .. str .. '__.-__END_NOT ' .. str .. '__', ''
                )
              else
                args['aql'] = args['aql']\gsub('__IF_NOT ' .. str .. '__', '')
                args['aql'] = args['aql']\gsub('__END_NOT ' .. str .. '__', '')

            db_data = { results: aql(db_name, args['aql'], bindvar) }
            db_data = table_deep_merge(db_data, { _params: args })

          if dataset == 'rest'
            db_data = from_json(http_get(args['url'], args['headers']))
          if args['use_params']
            db_data = table_deep_merge(db_data, { _params: args })

          output = etlua2html(db_data, partial, params)
          output = dynamic_replace(db_name, output, global_data, history, params)

    -- {{ riot | slug(#slug2...) | <mount> }}
    -- e.g. {{ riot | demo | mount }}
    -- e.g. {{ riot | demo#demo2 }}
    if action == 'riot'
      if history[widget] == nil -- prevent stack level too deep
        history[widget] = true
        data = { ids: {}, revisions: {}, names: {} }
        for i, k in pairs(stringy.split(item, '#'))
          component = aql(
            db_name,
            "FOR doc in components FILTER doc.slug == @slug RETURN doc",
            { "slug": k }
          )[1]
          table.insert(data.ids, component._key)
          table.insert(data.revisions, component._rev)
          table.insert(data.names, k)

        output ..= "<script src='/#{params.lang}/#{table.concat(data.ids, "-")}/component/#{table.concat(data.revisions, "-")}.tag' type='riot/tag'></script>"

        if dataset == "mount"
          output ..= "<script>document.addEventListener('DOMContentLoaded', function() { riot.mount('#{table.concat(data.names, ", ")}') })</script>"

    -- {{ spa | slug }} -- display a single page application
    -- e.g. {{ spa | account }}
    if action == 'spa'
      if history[widget] == nil -- prevent stack level too deep
        history[widget] = true
        spa = aql(
          db_name,
          "FOR doc in spas FILTER doc.slug == @slug RETURN doc",
          { "slug": item }
        )[1]
        output = spa.html
        output ..= "<script>#{spa.js}</script>"
        output = dynamic_replace(db_name, output, global_data, history, params)

    -- {{ aql | slug }} -- Run an AQL request
    -- e.g. {{ aql | activate_account }}
    if action == 'aql'
      aql_request = aql(
        db_name, "FOR a in aqls FILTER a.slug == @slug RETURN a", { "slug": item }
      )[1]
      if aql_request
        aql(db_name, aql_request.aql, prepare_bindvars(splat, aql_request.aql))

    -- {{ tr | slug }}
    -- e.g. {{ tr | my_text }}
    if action == 'tr'
      output = "Missing translation <em style='color:red'>#{item}</em>"
      unless translations[item]
        aql(db_name, 'INSERT { key: @key, value: {} } IN trads', { key: item })
      if translations[item] and translations[item][params.lang]
        output = translations[item][params.lang]

    -- {{ external | url }}
    if action == 'external'
      output = http_get(item, {}) if action == 'external'

    -- {{ og_data | name }}
    if action == 'og_data'
      output = params.og_data[item] if params.og_data

    html = html\gsub(escape_pattern(widget), escape_pattern(output)) if output ~= ''

  html
--------------------------------------------------------------------------------
-- expose methods
{ :splat_to_table, :load_page_by_slug, :dynamic_page, :escape_pattern,
  :dynamic_replace, :load_redirection, :page_info, :prepare_bindvars }