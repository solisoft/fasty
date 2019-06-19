etlua   = require 'etlua'
stringy = require 'stringy'

import aql, document_get from require 'lib.arango'
import table_deep_merge from require 'lib.utils'
import http_get from require 'lib.http_client'
import from_json, to_json, trim from require 'lapis.util'
--------------------------------------------------------------------------------
splat_to_table = (splat, sep = '/') -> { k, v for k, v in splat\gmatch "#{sep}?(.-)#{sep}([^#{sep}]+)#{sep}?" }
--------------------------------------------------------------------------------
escape_pattern = (text)->
  str, _ = text\gsub('([%[%]%(%)%+%-%*%%])', '%%%1')
  str
--------------------------------------------------------------------------------
prepare_headers = (html, data, params)->
  html = html\gsub('@js', "/#{params.lang}/#{data.layout._key}/js/#{data.layout._rev}.js")
  html = html\gsub('@css', "/#{params.lang}/#{data.layout._key}/css/#{data.layout._rev}.css")
  headers = "<title>#{data.item.name}</title>"
  if(data.item.og_title and data.item.og_title[params.lang])
    headers = "<title>#{data.item.og_title[params.lang]}</title>"
  if(data.item.description and data.item.description[params.lang])
    headers ..= "<meta name='description' content='#{data.item.description[params.lang]}'>"
  if(data.item.og_title and data.item.og_title[params.lang])
    headers ..= "<meta property='og:title' content='#{data.item.og_title[params.lang]}' />"
  if(data.item.og_img and data.item.og_img[params.lang])
    headers ..= "<meta property='og:image' content='#{data.item.og_img[params.lang]}' />"
  if(data.item.og_type and data.item.og_type[params.lang])
    headers ..= "<meta property='og:type' content='#{data.item.og_type[params.lang]}' />"

  html\gsub('@headers', headers)
--------------------------------------------------------------------------------
etlua2html = (json, partial, lang) ->
  template = etlua.compile(partial.item.html)
  template({ 'dataset': json, 'to_json': to_json, 'lang': lang })
--------------------------------------------------------------------------------
load_document_by_slug = (db_name, slug, object)->
  request = "FOR item IN #{object} FILTER item.slug == @slug RETURN { item }"
  aql(db_name, request, { slug: slug })[1]
--------------------------------------------------------------------------------
load_page_by_slug = (db_name, slug, lang, uselayout = true)->
  request = "FOR item IN pages FILTER item.slug[@lang] == @slug "
  if uselayout == true
    request ..= 'FOR layout IN layouts FILTER layout._id == item.layout_id RETURN { item, layout }'
  else
    request ..= 'RETURN { item }'

  page = aql(db_name, request, { slug: slug, lang: lang })[1]

  if page
    publication = document_get(db_name, 'publications/pages_' .. page.item._key)
    if publication.code ~= 404
      page.item = publication.data

  page
--------------------------------------------------------------------------------
load_dataset_by_slug = (db_name, slug, object, lang, uselayout = true)->
  request = "FOR item IN datasets FILTER item.type == '#{object}' FILTER item.slug == @slug "
  request ..= 'RETURN { item }'
  dataset = aql(db_name, request, { slug: slug })[1]

  if dataset
    publication = document_get(db_name, 'publications/' .. object .. '_' .. dataset.item._key)
    if publication.code ~= 404
      dataset.item = publication.data

  dataset
--------------------------------------------------------------------------------
-- dynamic_page : check all {{ .* }} and load layout
dynamic_page = (db_name, data, params, global_data, history = {}, uselayout = true)->
  html = to_json(data)
  if data
    page_partial = load_document_by_slug(db_name, 'page', 'partials')
    if uselayout
      html = data.layout.html\gsub(
        '@yield',
        escape_pattern(etlua2html(data.item.html[params['lang']].json, page_partial, params.lang))
      )
      html = prepare_headers(html, data, params)
    else
      html = data.item.html

    -- html = dynamic_replace(db_name, html, global_data, history, params)
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

  if redirection != nil
    html = redirection.layout.html\gsub(
      '@yield',
      "{{ spa | #{redirection.spa_name} }}"
    )
    prepare_headers(html, redirection, params)
  else
    nil
--------------------------------------------------------------------------------
prepare_bindvars = (splat, args) ->
  bindvar = {}
  for k, v in pairs(splat) do
    v = tonumber(v) if v\match('^%d+$')
    bindvar[k] = v if args['aql']\find('@' .. k)
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

  -- helpers
  if helpers
    for widget in string.gmatch(html, '{{.-}}') do

      output = ''
      action = ''
      item = ''
      keywords = {}

      widget_no_deco, _ = widget\gsub("{{ ", "")\gsub(" }}", "")
      table.insert(keywords, trim(k)) for i, k in pairs(stringy.split(widget_no_deco, '|'))

      if keywords[1] then action  = keywords[1]
      if keywords[2] then item    = keywords[2]

      -- {{ helper | shortcut }}
      -- e.g. {{ helper | hello_world }}
      if action == 'helper'
        helper = helpers[item]
        output = "{{ partial | " .. helper.partial .. " | arango | req#" .. helper.aql .. " }}"
        html = html\gsub(escape_pattern(widget), escape_pattern(output))

  for widget in string.gmatch(html, '{{.-}}') do
    output = ''
    action = ''
    item = ''
    dataset = ''
    args = {}
    keywords = {}

    widget_no_deco, _ = widget\gsub("{{ ", "")\gsub(" }}", "")
    table.insert(keywords, trim(k)) for i, k in pairs(stringy.split(widget_no_deco, '|'))

    if keywords[1] then action  = keywords[1]
    if keywords[2] then item    = keywords[2]
    if keywords[3] then dataset = keywords[3]
    if keywords[4] then args    = splat_to_table(keywords[4], '#')

    -- {{ page | slug }}
    -- e.g. {{ page | home }}
    if action == 'page'
      if history[widget] == nil -- prevent stack level too deep
        history[widget] = true
        obj = {}
        if dataset == ''
          obj = dynamic_page(
            db_name,
            load_page_by_slug(db_name, item, 'pages', params.lang, false),
            params, global_data, history, false
          )
        else
          obj = dynamic_page(
            db_name,
            load_dataset_by_slug(db_name, item, dataset, params.lang),
            params, global_data, history, false
          )

        output ..= dynamic_replace(db_name, obj.html, global_data, history, params)

    -- {{ partial | slug | <dataset> | <args> }}
    -- e.g. {{ partial | demo | arango | aql/FOR doc IN pages RETURN doc }}
    -- params splat will be used to provide data if arango dataset
    if action == 'partial'
      if history[widget] == nil -- prevent stack level too deep
        history[widget] = true
        partial = load_document_by_slug(db_name, item, 'partials', false)
        if partial
          db_data = {}
          if dataset == 'arango' then
            -- check if it's a stored procedure
            if args['req']
              args['aql'] = aql(
                db_name, 'FOR aql IN aqls FILTER aql.slug == @slug RETURN aql.aql',
                { slug: args['req'] }
              )[1]

            -- prepare the bindvar variable with variable found in the request
            bindvar = prepare_bindvars(splat, args)

            -- handle conditions __IF <bindvar> __ .... __END <bindvar>__
            for condition in string.gmatch(args['aql'], '__IF (%w-)__') do
              unless bindvar[condition] then
                args['aql'] = args['aql']\gsub('__IF ' .. condition .. '__.-__END ' ..
                              condition .. '__', '')
              else
                args['aql'] = args['aql']\gsub('__IF ' .. condition .. '__', '')
                args['aql'] = args['aql']\gsub('__END ' .. condition .. '__', '')

            -- handle conditions __IF_NOT <bindvar> __ .... __END_NOT <bindvar>__
            for condition in string.gmatch(args['aql'], '__IF_NOT (%w-)__') do
              if bindvar[condition] then
                args['aql'] = args['aql']\gsub('__IF_NOT ' ..
                              condition .. '__.-__END_NOT ' .. condition .. '__', '')
              else
                args['aql'] = args['aql']\gsub('__IF_NOT ' .. condition .. '__', '')
                args['aql'] = args['aql']\gsub('__END_NOT ' .. condition .. '__', '')

            db_data = { results: aql(db_name, args['aql'], bindvar) }
            db_data = table_deep_merge(db_data, { _params: args })

          db_data = from_json(http_get(args['url'], args['headers'])) if dataset == 'rest'
          db_data = table_deep_merge(db_data, { _params: args }) if args['use_params']
          output = etlua2html(db_data, partial, params.lang)
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
            db_name, "FOR doc in components FILTER doc.slug == @slug RETURN doc", { "slug": k }
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
          db_name, "FOR doc in spas FILTER doc.slug == @slug RETURN doc", { "slug": item }
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
        aql(db_name, aql_request.aql, prepare_bindvars(splat, args))

    -- {{ tr | slug }}
    -- e.g. {{ tr | my_text }}
    if action == 'tr'
      output = "Missing translation <em style='color:red'>#{item}</em>"
      aql(db_name, 'INSERT { key: @key, value: {} } IN trads', { key: item }) unless translations[item]
      if translations[item] and translations[item][params.lang] then
        output = translations[item][params.lang]

    -- {{ external | url }}
    output = http_get(item, {}) if action == 'external'

    html = html\gsub(escape_pattern(widget), escape_pattern(output))

  html
--------------------------------------------------------------------------------
-- expose methods
{ :splat_to_table, :load_page_by_slug, :dynamic_page, :escape_pattern,
  :dynamic_replace, :load_redirection }