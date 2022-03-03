import from_json, to_json from require 'lapis.util'
stringy = require 'stringy'
date    = require 'date'
--------------------------------------------------------------------------------
get_nested = (arr, key)->
  keys = stringy.split(key, '.')
  arr = arr[item] for k, item in pairs keys
  arr
--------------------------------------------------------------------------------
uuid = ()->
  template ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  math.randomseed(os.clock())
  return string.gsub(template, '[xy]', (c)->
      v = (c == 'x') and math.random(0, 0xf) or math.random(8, 0xb)
      return string.format('%x', v)
  )
--------------------------------------------------------------------------------
table_merge = (t1, t2)->
  for k,v in ipairs(t2) do table.insert(t1, v)
  t1
--------------------------------------------------------------------------------
table_deep_merge = (t1, t2)->
  for k,v in pairs(t2) do
    if type(v) == 'table' then
      if type(t1[k] or false) == 'table' then
        table_deep_merge(t1[k] or {}, t2[k] or {})
      else t1[k] = v
    else t1[k] = v
  t1
--------------------------------------------------------------------------------
table_index = (tab, val)->
  for index, value in ipairs(tab) do return index if value == val
  nil
--------------------------------------------------------------------------------
check_valid_lang = (langs, lang)->
  allowed_langs = stringy.split(langs, ',')
  lang = allowed_langs[1] if table_index(allowed_langs, lang) == nil
  lang
--------------------------------------------------------------------------------
map = (tbl, f)->
  data = {}
  for k,v in pairs tbl do data[k] = f(v)
  data
--------------------------------------------------------------------------------
to_timestamp = (d)->
  d1 = date(d)
  date.diff(d1, date.epoch!)\spanseconds!
--------------------------------------------------------------------------------
time_ago = (date, parts=1, lang="fr") ->
  d = time_ago_in_words(date, parts)
  if lang == "fr"
    d = d\gsub("years", "ans")\gsub("year", "an")
    d = d\gsub("months", "mois")\gsub("month", "mois")
    d = d\gsub("days", "jours")\gsub("day", "jour")
    d = d\gsub("hours", "heures")\gsub("hour", "heure")
    -- d = d\gsub("minutes", "minutes")\gsub("minute", "minute")
    d = d\gsub("seconds", "secondes")\gsub("seconde", "seconde")
    d = d\gsub("ago", "")

    d = "Il y a " .. d
  d
--------------------------------------------------------------------------------
last_element = (str, pattern)->
  splitted = stringy.split(str, pattern)
  splitted[table.getn(splitted)]
--------------------------------------------------------------------------------
define_content_type = (slug)->
  ext = last_element(slug, '.')
  mimes_types = {
    wmv: 'video/x-ms-wmv',
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    aac: 'audio/aac',
    abw: 'application/x-abiword',
    arc: 'application/octet-stream',
    avi: 'video/x-msvideo',
    azw: 'application/vnd.amazon.ebook',
    bin: 'application/octet-stream',
    bmp: 'image/bmp',
    bz: 'application/x-bzip',
    bz2: 'application/x-bzip2',
    csh: 'application/x-csh',
    css: 'text/css',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    eot: 'application/vnd.ms-fontobject',
    epub: 'application/epub+zip',
    gif: 'image/gif',
    heic: 'image/heic',
    htm: 'text/html',
    html: 'text/html',
    ico: 'image/x-icon',
    ics: 'text/calendar',
    jar: 'application/java-archive',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    js: 'application/javascript',
    json: 'application/json',
    mid: 'audio/midi',
    midi: 'audio/midi',
    mpeg: 'video/mpeg',
    mpkg: 'application/vnd.apple.installer+xml',
    odp: 'application/vnd.oasis.opendocument.presentation',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odt: 'application/vnd.oasis.opendocument.text',
    oga: 'audio/ogg',
    ogv: 'video/ogg',
    ogx: 'application/ogg',
    otf: 'font/otf',
    png: 'image/png',
    pdf: 'application/pdf',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    rar: 'application/x-rar-compressed',
    rtf: 'application/rtf',
    sh: 'application/x-sh',
    svg: 'image/svg+xml',
    swf: 'application/x-shockwave-flash',
    tar: 'application/x-tar',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    ts: 'application/typescript',
    ttf: 'font/ttf',
    vsd: 'application/vnd.visio',
    wav: 'audio/x-wav',
    weba: 'audio/webm',
    webm: 'video/webm',
    webp: 'image/webp',
    woff: 'font/woff',
    woff2: 'font/woff2',
    xhtml: 'application/xhtml+xml',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xml: 'application/xml',
    xul: 'application/vnd.mozilla.xul+xml',
    zip: 'application/zip',
    '7z': 'application/x-7z-compressed'
  }
  page_content_type = mimes_types[ext\lower!]
  page_content_type = 'text/html' if page_content_type == nil
  page_content_type
--------------------------------------------------------------------------------
-- expose methods
{ :table_merge, :table_deep_merge, :table_index, :check_valid_lang, :map,
  :to_timestamp, :uuid, :define_content_type, :last_element, :get_nested,
  :time_ago }