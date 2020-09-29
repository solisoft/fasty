(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    var val = aliases[name];
    return (val && name !== val) ? expandAlias(val) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("index.html", function(exports, require, module) {

});

;require.register("js/common.js", function(exports, require, module) {
var Common = {
  init: function init(){
    $.fn.serializeObject = function() {
      var o = {}
      var a = this.serializeArray()
      $.each(a, function() {
        if (o[this.name] !== undefined) {
          if (!o[this.name].push) {
            o[this.name] = [o[this.name]]
          }
          o[this.name].push(this.value || '')
        } else {
          o[this.name] = this.value || ''
        }
      })
      return o
    }
  },

  startEditor: function (name, mode, id) {
    var editor = ace.edit(name)
    editor.setTheme("ace/theme/twilight")
    editor.getSession().setMode(mode)
    editor.setOptions({ tabSize: 2, useSoftTabs: true })
    editor.getSession().setUseWrapMode(true)
    editor.getSession().setValue(unescape($("#" + id).val()))
    editor.getSession().on('change', function () { $("#" + id).val(editor.getSession().getValue()) })
  },

  checkConditions: function checkConditions(fields, formId) {
    _.each(fields, function (field) {
      if (field.if) {
        if ($('#' + field.if[0]).val() != field.if[1]) {
          $('#field_' + field.n).hide()
        } else {
          $('#field_' + field.n).show()
        }
      }
    })
  },

  buildForm: function buildForm(obj, fields, formId, back_str, callback) {

    var html = ""
    var uploads = []
    var _this = this
    var editors = []
    var values = []
    var positions = []
    var wysiwygs = []
    var html_editors = []
    var usetab = false
    var tabs = []
    var tab_last_id = ''
    var y = 0
    var _html = ''

    fields.forEach(function(l, i) {
      if (l.tab) {
        if (y > 0) html += "</div>"
        if (usetab == false) html += '<ul uk-tab>'
        if (usetab == false) tabs = []
        usetab = true
        html += '<li><a href="#">' + l.tab + '</a></li>'
        if (html != '') {
          tabs.push(_html)
          _html = ''
        }
        tab_last_id = l.id

        y = 0
      } else {
        if (l.h !== undefined) {
          _html += '<div class="uk-grid uk-grid-small uk-margin-top"><h3>'+ l.h +'</h3></div>'
        }
        else {
          if (l.r && y > 0) _html += '</div>'
          if (l.r) _html += '<div class="uk-grid uk-grid-small">'
          if (l.c && l.c.indexOf("uk-width") == -1) l.c = "uk-width-" + l.c

          var validation = l.j
          if (obj['_key'] && l.ju) validation = l.ju

          var hidden = ''
          if(l.t === 'hidden') hidden = 'uk-hidden'

          _html += '<div class="' + l.c + ' ' + hidden + '" id="field_' + l.n + '">'

          var title = l.l

          if (_.isString(validation)) {
            if (validation.indexOf('required') > 0) {
              title = "<strong>" + title + "*</strong>"
            }
          } else {
            if (validation && validation._flags.presence === "required") {
              title = "<strong>" + title + "*</strong>"
            }
          }

          if (!((l.t === "file" || l.t === "image") && obj._id === undefined))
            _html += '<label for="" class="uk-form-label">'+ title +'</label>'

          var value = obj[l.n]
          if(l.tr && obj[l.n]) value = obj[l.n][window.localStorage.getItem('foxx-locale')]
          if (value === undefined) value = ""

          //value = escape(value)
          if(l.t.match(/string/)) {
            _html += '<input type="'+(l.t.split(":").length == 2 ? l.t.split(":")[1] : "text")+'" id="'+l.n+'" class="uk-input" name="'+ l.n +'" value="" autocomplete="off"><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
            values.push([l.n, value])
          }
          if(l.t.match(/password/)) {
            _html += '<input type="password" id="'+l.n+'" class="uk-input" name="'+ l.n +'" value="" autocomplete="off"><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
          }
          if(l.t === "integer") {
            _html += '<input type="number" id="'+l.n+'" class="uk-input" name="'+ l.n +'" value="'+value+'" autocomplete="off"><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
            values.push([l.n, value])
          }
          if(l.t === "float") {
            _html += '<input type="text" id="'+l.n+'" class="uk-input" name="'+ l.n +'" value="'+value+'" autocomplete="off"><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
            values.push([l.n, value])
          }
          if(l.t === "hidden") _html += '<input type="hidden" id="'+l.n+'"  name="'+ l.n +'"  value="'+value+'"></div><div data-hint="'+ l.n +'">'
          if(l.t === "date") _html += '<div><div class="uk-inline"><span class="uk-form-icon" uk-icon="icon: calendar"></span><input type="date" id="'+l.n+'" data-date-format="YYYY/MM/DD" class="uk-input" name="'+ l.n +'"  value="'+value+'"></div><div data-hint="'+ l.n +'" class="uk-text-danger"></div></div>'
          if (l.t === "datetime") {
            value = value.replace(":00.000", "")
            _html += '<div><div class="uk-inline"><span class="uk-form-icon" uk-icon="icon: calendar"></span><input type="text" id="' + l.n + '" class="uk-input datepicker-here" data-language="en" name="' + l.n + '"  value="' + value + '" autocomplete="off"></div><div data-hint="' + l.n + '" class="uk-text-danger"></div></div>'
          }
          if(l.t === "time") _html += '<div><div class="uk-inline"><span class="uk-form-icon" uk-icon="icon: calendar"></span><input type="time" id="'+l.n+'" class="uk-input" name="'+ l.n +'"  value="'+value+'"></div><div data-hint="'+ l.n +'" class="uk-text-danger"></div></div>'
          if(l.t === "text") _html += '<textarea id="'+l.n+'" class="uk-textarea" name="'+ l.n +'" style="'+l.s+'">'+ value +'</textarea><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
            if(l.t === "wysiwyg") {
            wysiwygs.push(l.n)
            _html += '<textarea id="'+l.n+'" name="'+ l.n +'" ></textarea><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
            values.push([l.n, value])
          }
          if(l.t.match(/^code/)) {
            _html += '<input type="hidden" id="'+l.n+'" name="'+ l.n +'" value="">'
            values.push([l.n, value])
            _html += '<div id="editor_'+l.n+'" class="editor" style="'+l.s+'"></div>'
            editors.push(["editor_"+l.n, "ace/mode/" + l.t.split(":")[1], l.n])
          }
          if (l.t == 'html') {
            _html += '<input type="hidden" id="'+l.n+'" name="'+ l.n +'" value="">'
            _html += '<div id="html_editor_'+l.n+'" data-name="'+l.n+'" class="html_editor" style="'+l.s+'"></div>'
            html_editors.push([l.n, value])
          }
          if(l.t === "list") {
            _html += '<select name="'+ l.n +'" style="width:100%" class="uk-select select_list" id="'+l.n+'">'
            l.d.forEach(function(o) {
              selected = ""
              if(value === o[0]) selected="selected='selected'"
              _html += '<option value="'+ o[0] +'" '+selected+'>'+ o[1] +'</option>'
            })
            _html += '</select>'
          }
          if(l.t === "multilist") {
            _html += '<select name="'+ l.n +'" style="width:100%" class="uk-select select_mlist" multiple="multiple" id="'+l.n+'">'
            l.d.forEach(function(o) {
              selected = ""
              if(value && value.indexOf(o[0]) >= 0) selected="selected='selected'"
              _html += '<option value="'+ o[0] +'" '+selected+'>'+ o[1] +'</option>'
            })
            _html += '</select>'
          }
          if(l.t === "tags") {
            _html +='<select name="'+l.n+'" style="width:100%" class="select_tag" multiple="multiple">'
            var tags = _.filter(l.d[0], function (t) { return t != "undefined" })
            if (l.tr) tags = _.flatten(_.map(tags, function (t) { return t[window.localStorage.getItem('foxx-locale')] }))
            _.uniq(tags).forEach(function (v) {
              if(v != 'undefined' && v != '' && v != undefined) {
                selected = ""
                if(value && value.indexOf(v) >= 0) selected="selected='selected'"
                _html += '<option value="'+ v +'" '+selected+'>'+ v +'</option>'
              }
            })
            _html +='</select>'
          }

          if(l.t === "map") {
            if(value === "") value = [0,0]
            _html += '<div class="uk-text-center" id="'+l.n+'_infos"><span class="uk-label"></span></div>'
            _html += '<div id="map_'+l.n+'" class="map" style="'+l.s+'"></div>'
            _html += '<input id="'+l.n+'_lat" type="hidden" name="'+l.n+'" value="'+value[0]+'" />'
            _html += '<input id="'+l.n+'_lng" type="hidden" name="'+l.n+'" value="'+value[1]+'" />'
            positions.push([l.n, value])
          }
          if(l.t === "image" && obj._id) {
            _html += '<div id="upload-drop_'+l.n+'" class="js-upload uk-placeholder uk-text-center">'
            _html += '    <span uk-icon="icon: cloud-upload"></span>'
            _html += '    <span class="uk-text-middle">Attach images by dropping them here or</span>'
            _html += '    <div uk-form-custom>'
            _html += '        <input type="file" multiple>'
            _html += '        <span class="uk-link">selecting one</span>'
            _html += '    </div>'
            _html += '</div>'
            _html += '<progress id="progressbar_'+l.n+'" class="uk-progress" value="0" max="100" hidden></progress>'

            _html += '<images i18n="'+l.tr+'" field="'+l.n+'" id="'+obj._id+'" />'
            uploads.push([obj._key, obj._id.split('/')[0], l.n, '*.(jpg|jpeg|gif|png)', 'progressbar_'+l.n, '#upload-drop_'+l.n, l.tr])
          }
          if(l.t === "file" && obj._id) {
            _html += '<div id="upload-drop_'+l.n+'" class="js-upload uk-placeholder uk-text-center">'
            _html += '    <span uk-icon="icon: cloud-upload"></span>'
            _html += '    <span class="uk-text-middle">Attach binaries by dropping them here or</span>'
            _html += '    <div uk-form-custom>'
            _html += '        <input type="file" multiple>'
            _html += '        <span class="uk-link">selecting one</span>'
            _html += '    </div>'
            _html += '</div>'
            _html += '<progress id="progressbar_'+l.n+'" class="uk-progress" value="0" max="100" hidden></progress>'
            _html += '<files i18n="'+l.tr+'" field="'+l.n+'" id="'+obj._id+'" />'
            uploads.push([obj._key, obj._id.split('/')[0], l.n, '*.*', 'progressbar_'+l.n, '#upload-drop_'+l.n, l.tr])
          }
          if(l.t === "boolean") {
            var checked = obj[l.n] === true ? " checked='checked' " : ''
            _html += ' <input name="'+ l.n +'" '+ checked +'  class="uk-checkbox" type="checkbox" value="1"  /> '
          }

          _html += '</div>'

          if (!usetab) {
            html += _html
            _html = ''
          }

          if (l.endtab == true) {
            if (html != '') tabs.push(_html)
            _html = ''
            usetab = false
            html += '</ul><ul class="uk-switcher">{{'+tab_last_id+'}}</ul>'
          }
          y++
        }
      }
    })

    html += '</div>'

    if (tabs.length > 0) {
      var switcher = ""
      _.each(tabs, function (t) { if (t!='') switcher += "<li>" + t + "</li>" })
      html = html.replace('{{'+ tab_last_id +'}}', switcher)
    }

    html += '<hr><div class="uk-grid uk-grid-small uk-text-right"><div class="uk-width-1-1">'

    if (back_str != undefined) { html += '<a href="#' + back_str + '" class="uk-button">Back</a> ' }

    html += '<input type="submit" class="uk-button uk-button-primary" value="Save" /></div></div><hr>'

    $(formId).html(html)

    $(formId).find('select').on('change', function () { _this.checkConditions(fields, formId) })

    _this.checkConditions(fields, formId)

    values.forEach(function (v, i) { $(formId + " #" + v[0]).val(v[1]) })

    $('.datepicker-here').datepicker({
      language: 'en', timepicker: true,
      timeFormat: 'hh:ii',
      dateFormat: 'yyyy-mm-dd'
    })

    html_editors.forEach(function (e, i) {
      if(_.isString(e[1])) {
        try { e[1] = JSON.parse(e[1]) } catch(e) {}
      }
      $('#html_editor_' + e[0]).contentEditor({ value: e[1].html || '' })
      $("#" + e[0]).val(JSON.stringify(e[1]))
    })
    editors.forEach(function(e, i) { _this.startEditor(e[0], e[1], e[2]) })
    wysiwygs.forEach(function (e, i) { $("#" + e).trumbowyg(); })

    $("button").attr("type", "button") // TODO : remove once Pell accept PR
    positions.forEach(function(p, i) {
      var mymap = L.map('map_' + p[0], { dragging: true, tap: false}).setView(p[1], 6)
      L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
      }).addTo(mymap)
      mymap.scrollWheelZoom.disable()
      var marker = L.marker(p[1], { draggable: true }).addTo(mymap)
      $('#'+p[0]+'_infos span').html(p[1].join(', '))
      marker.on('dragend', function(data) {
        var coords = data.target.getLatLng()
        $('#'+p[0]+'_lat').val(coords.lat)
        $('#'+p[0]+'_lng').val(coords.lng)
        $('#'+p[0]+'_infos span').html([coords.lat, coords.lng].join(', '))
      })

      setTimeout(function() { mymap.invalidateSize(true) }, 0)
    })

    var _this = this
    uploads.forEach(function(u) {
      _this.prepare_upload(u[0], u[1], u[2], u[3], u[4], u[5], u[6])
    })

    riot.mount("images"); riot.mount("files")
    riot.update()

    if (callback !== undefined) { callback() }
  },

  checkLogin: function checkLogin() {
    this.ajax(url + "auth/whoami", "GET", "", function(d) {
      if(d.username === null) document.location.href = "login.html";
    })
  },

  saveForm: function (formID, path, objID, opts) {
    objID = objID||""
    opts = opts||{}
    var _this = this
    var json = $("#"+ formID).serializeObject()
    _.each(json, function(v, k) { if(k.split('-')[0] == "trumbowyg") delete json[k] })

    $('.select_tag, .select_mlist').each(function(i, st) {
      if(typeof json[$(st).attr("name")] === "string") {
        json[$(st).attr("name")] = [ json[$(st).attr("name")] ]
      }
    })

    $("div[data-hint]").html("")
    var selector = "#" + formID + " textarea, #"+ formID + " input, #"+ formID + " select"

    $(selector).removeClass("uk-form-danger")
    $(selector).removeClass("uk-form-success")
    $(selector).addClass("uk-form-success")

    _this.ajax(url + path + "/" + objID, "POST", JSON.stringify(json), function(d) {
      if(d.errors.length > 0) {
        d.errors.forEach(function(e) {
          $("#" + e.path).removeClass("uk-form-success")
          $("#" + e.path).addClass("uk-form-danger")
          $("div[data-hint="+e.path+"]").html("<div>"+e.message.replace(/"(.*)"/, '').trim()+"</div>")
        })
      } else {
        UIkit.notification({
          message : 'Successfully saved!',
          status  : 'success',
          timeout : 1000,
          pos     : 'bottom-right'
        });
        if(objID == "" && _.isEmpty(opts)) {
          objID = d.data._key
          if(path.split('/')[0] != 'datasets')
            path = path.split("/").length == 2 ? path.split("/")[1] : path
          route("/"+ path +"/" + objID + "/edit")
        }
        if(!_.isEmpty(opts) && opts.element_id == undefined) {
          riot.mount("#"+opts.id, _.last(formID.split("_")) + "_crud_index", opts)
        }
      }
      setTimeout(function() {
        $(selector).removeClass("uk-form-success")
      }, 300 )
    })

  },

  ajax: function(url, method, dataForm, callback, errorCallback) {
    if(typeof(errorCallback) === "undefined") errorCallback = function() {}
    $.ajax({
      url: url,
      data: dataForm || "",
      type: method,
      beforeSend: function(xhr){
        var x = localStorage.getItem('X-Session-Id')
        if(x !== null) {
          xhr.setRequestHeader('foxx-locale', localStorage.getItem('foxx-locale'))
          xhr.setRequestHeader('X-Session-Id', localStorage.getItem('X-Session-Id'))
        }
      },
      success: function(data, textStatus, request) {
        if(request.getResponseHeader('X-Session-Id'))
          localStorage.setItem('X-Session-Id',request.getResponseHeader('X-Session-Id'))
        callback(data)
      },
      statusCode: {
        401: function() { document.location.href = "/static/admin/login.html" },
        500: errorCallback(),
        503: function() {
          localStorage.removeItem('X-Session-Id')
          localStorage.removeItem('foxx-locale')
          document.location.href = "/static/admin/login.html"
        }
      }
    });
  },

  get: function(url, callback, errorCallback) {
    this.ajax(url, "GET", "", callback, errorCallback)
  },
  delete: function(url, callback, errorCallback) {
    this.ajax(url, "DELETE", "", callback, errorCallback)
  },
  post: function(url, json, callback, errorCallback) {
    this.ajax(url, "POST", json, callback, errorCallback)
  },
  patch: function(url, json, callback, errorCallback) {
    this.ajax(url, "PATCH", json, callback, errorCallback)
  },
  put: function(url, json, callback, errorCallback) {
    this.ajax(url, "PUT", json, callback, errorCallback)
  },

  array_diff: function(a, b) {
    return a.filter(function(i) {return b.indexOf(i) < 0;});
  },

  keys: function(h) {
    var keys = []
    for(var k in h) keys.push(k)
    return keys
  },

  prepare_upload: function(key, collection, field, filter, progressbar_id, drop_id, i18n) {

    var bar = document.getElementById(progressbar_id);

    UIkit.upload(drop_id, {
      url: '/file/upload/' + key + '/' + collection + '/' + field, // upload url,
      multiple: true,
      allow: filter,

      error: function () {
        console.log('error', arguments);
      },

      beforeSend: function(env) {
        env.headers = {
          'apikey': localStorage.getItem('resize_api_key'),
          'X-Session-Id': localStorage.getItem('X-Session-Id'),
          'foxx-locale': i18n == true ? localStorage.getItem('foxx-locale') : null
        }
      },

      loadStart: function (e) {
        bar.removeAttribute('hidden');
        bar.max = e.total;
        bar.value = e.loaded;
      },

      progress: function (e) {
        bar.max = e.total;
        bar.value = e.loaded;
      },

      loadEnd: function (e) {
        bar.max = e.total;
        bar.value = e.loaded;
      },

      completeAll: function () {
        bar.value = 100;
        setTimeout(function(){
          bar.setAttribute('hidden', null);
          riot.mount("images"); riot.mount("files")
          riot.update()

        }, 250);
      }

    });
  }

};

module.exports = Common;
});

require.register("js/config.js", function(exports, require, module) {
var Config = {
  ".fasty.ovh": "/_db",
  ".inseytel.com": "https://inseytel.com/_db",
  "epic20.world": "/_db"
};

module.exports = Config;
});

require.register("js/editor.js", function(exports, require, module) {
/* jshint asi: true */
(function ($) {

  $.fn.contentEditor = function (options) {

    var object_name = $(this).attr('data-name') || 'solicms'

    var self = this

    var settings = $.extend({
      widgets: [
        { id: 'h1', icon: 'fas fa-heading', title: 'h1' },
        { id: 'h2', icon: 'fas fa-heading', title: 'h2' },
        { id: 'h3', icon: 'fas fa-heading', title: 'h3' },
        { id: 'h4', icon: 'fas fa-heading', title: 'h4' },
        { id: 'h5', icon: 'fas fa-heading', title: 'h5' },
        { id: 'h6', icon: 'fas fa-heading', title: 'h6' },
        { id: 'col2', icon: 'fas fa-columns', title: '2' },
        { id: 'col3', icon: 'fas fa-columns', title: '3' },
        { id: 'col4', icon: 'fas fa-columns', title: '4' },
        { id: 'col363', icon: 'fas fa-columns', title: '3-6-3' },
        { id: 'col48', icon: 'fas fa-columns', title: '4-8' },
        { id: 'col84', icon: 'fas fa-columns', title: '8-4' },
        { id: 'text', icon: 'fas fa-align-left', title: 'text' },
        { id: 'img', icon: 'fas fa-image', title: 'img' },
        { id: 'slide', icon: 'fas fa-images', title: 'slide' },
        { id: 'code', icon: 'fas fa-code', title: 'code' },
        { id: 'video', icon: 'fas fa-video', title: 'video' },
        { id: 'html5', icon: 'fab fa-html5', title: 'html5' }
      ],
    }, options)

    var dragObj, activeObj, loopid = 0, editObj, ace_editor;

    var LSet = function (key, val) { window.localStorage.setItem(key, val) }
    var LGet = function (key) { return window.localStorage.getItem(key) }
    var LDel = function (key) { return window.localStorage.removeItem(key) }

    LDel('editor-history')

    var ipsum = function (nb) {
      var array = 'Chocolate lollipop pastry tiramisu. Chocolate cake sweet roll dragée. Cookie halvah tootsie roll cupcake candy canes pie oat cake danish chocolate cake. Cheesecake biscuit powder sweet powder. Chocolate bar lollipop jelly-o chocolate cake. Sweet roll sweet roll cupcake topping chocolate cake. Fruitcake chocolate cake jelly-o. Marzipan candy canes jujubes. Cotton candy candy canes icing sesame snaps chocolate cake toffee liquorice jelly-o. Pastry pastry bear claw toffee. Liquorice biscuit dessert chocolate bar gummies. Carrot cake danish cookie croissant toffee gingerbread sweet roll. Icing danish muffin cheesecake jelly-o sugar plum pastry cotton candy. Chocolate bar pie apple pie chocolate bar cupcake lollipop.'.split('.')
      var output = []
      for (var i = 0; i < nb; i++) {
        output.push(array[parseInt((Math.random() * 1000) % array.length)])
      }
      return output.join('. ') + '.'
    }

    var htmlEntities = function (str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    var get_widget_html = function (id, full) {
      var before
      var html
      var after

      loopid = loopid % 3

      switch (id) {
        case 'h1':
          before = '<div class="sg-row cms_row" data-type="h1"><div class="col-12 cms_col">'
          html = '<h1 data-type="h1" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h1>'
          after = '</div></div>'
          break;
        case 'h2':
          before = '<div class="sg-row cms_row" data-type="h2"><div class="col-12 cms_col">'
          html = '<h2 data-type="h2" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h2>'
          after = '</div></div>'
          break;
        case 'h3':
          before = '<div class="sg-row cms_row" data-type="h3"><div class="col-12 cms_col">'
          html = '<h3 data-type="h3" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h3>'
          after = '</div></div>'
          break;
        case 'h4':
          before = '<div class="sg-row cms_row" data-type="h4"><div class="col-12 cms_col">'
          html = '<h4 data-type="h4" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h4>'
          after = '</div></div>'
          break;
        case 'h5':
          before = '<div class="sg-row cms_row" data-type="h5"><div class="col-12 cms_col">'
          html = '<h5 data-type="h5" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h5>'
          after = '</div></div>'
          break;
        case 'h6':
          before = '<div class="sg-row cms_row" data-type="h6"><div class="col-12 cms_col">'
          html = '<h6 data-type="h6" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h6>'
          after = '</div></div>'
          break;
        case 'img':
          before = '<div class="sg-row cms_row" data-type="img"><div class="col-12 cms_col">'
          html = '<div data-type="img" class="drag drop" data-editable="true"><img src="https://via.placeholder.com/1200x600" alt=""></div>'
          after = '</div></div>'
          break;
        case 'text':
          before = '<div class="sg-row cms_row" data-type="text"><div class="col-12 cms_col">'
          html = '<div data-type="text" class="drag drop" data-editable="true"><p style="text-align: justify;">' + ipsum(5) + '</p></div>'
          after = '</div></div>'
          break;
        case 'code':
          var codes = []
          codes.push('<code class="language-html">' + htmlEntities('<h1>Some html code</h1>') + '</code>')
          codes.push('<code class="language-javascript">console.log("JS ... really ? ")</code>')
          codes.push('<code class="language-ruby">puts "I Love Ruby"</code>')
          before = '<div class="sg-row cms_row" data-type="code"><div class="col-12 cms_col">'
          html = '<div data-type="code" class="drag drop" data-editable="true"><pre>' + codes[loopid] + '</pre></div>'
          after = '</div></div>'
          break;
        case 'video':
          var ids = ['AWKEWqx8OyA', 'TmDKbUrSYxQ', 'X8zLJlU_-60']
          var data = '<div style="position:relative;padding-top:56.25%;"><iframe src="https://www.youtube.com/embed/' + ids[loopid] + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>'
          before = '<div class="sg-row cms_row" data-type="embed"><div class="col-12 cms_col">'
          html = '<div data-type="embed" class="drag drop" data-editable="true" data-html="' + data.replace(/"/g, "&quot;") + '">' + data + '</div>'
          after = '</div></div>'
          break
        case 'html5':
          before = '<div class="sg-row cms_row" data-type="embed"><div class="col-12 cms_col">'
          var data = '<p>HTML5 Code here</p>'
          html = '<div data-type="embed" class="drag drop" data-editable="true" data-html="' + data.replace(/"/g, "&quot;") + '">' + data + '</div>'
          after = '</div></div>'
          break
        case 'col2':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col2"><div class="col-6 cms_col"></div><div class="col-6 cms_col"></div></div>'
          after = ''
          break
        case 'col3':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col3"><div class="col-4 cms_col"></div><div class="col-4 cms_col"></div><div class="col-4 cms_col"></div></div>'
          after = ''
          break
        case 'col4':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col4"><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div></div>'
          after = ''
          break
        case 'col282':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col282"><div class="col-2 cms_col"></div><div class="col-8 cms_col"></div><div class="col-2 cms_col"></div><div class="col-3 cms_col"></div></div>'
          after = ''
          break
        case 'col363':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col363"><div class="col-3 cms_col"></div><div class="col-6 cms_col"></div><div class="col-3 cms_col"></div></div></div>'
          after = ''
          break
        case 'col48':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col48"><div class="col-4 cms_col"></div><div class="col-8 cms_col"></div></div></div>'
          after = ''
          break
        case 'col84':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col84"><div class="col-8 cms_col"></div><div class="col-4 cms_col"></div></div></div>'
          after = ''
          break
      }
      loopid++

      return full ? $(before + html + after) : $(html)
    }

    /*
      set_windows_events <function>
      Activate drag & drop events
    */
    var set_windows_events = function () {
      window.drag = function (event) {
        var el = $(event.target).hasClass('drag') ? $(event.target) : $(event.target).closest('.drag')
        el.addClass('dragging')
        event.stopPropagation();
        dragObj = el
        event.dataTransfer.setData('text', '');
        setTimeout(function () {
          add_drop_empty()
        }, 0)
      }

      window.drop = function (event) {
        event.stopPropagation()
        event.preventDefault()

        var el = $(event.target).hasClass('drop') ? $(event.target) : $(event.target).closest('.drop')

        if (event.dataTransfer.items) { // File drag & drop
          var isFile = false
          // Use DataTransferItemList interface to access the file(s)
          var count = event.dataTransfer.items.length
          if (count > 1) count = 1
          for (var i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
              isFile = true
              var file = event.dataTransfer.items[i].getAsFile();
              if (file.type.indexOf('image') >= 0) {
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function () {
                  base64data = reader.result;

                  var formData = new FormData();
                  formData.append("files", file)
                  formData.append("key", localStorage.getItem('resize_api_key'))

                  $.ajax({
                    xhr: function () {
                      var xhr = new window.XMLHttpRequest();
                      //Upload progress
                      xhr.upload.addEventListener('progress', function (evt) {
                        if (evt.lengthComputable) {
                          var percentComplete = evt.loaded / evt.total;
                          //Do something with upload progress
                          $(el).html(parseInt(percentComplete * 100) + '%')
                        }
                      }, false);

                      return xhr;
                    },
                    type: 'POST',
                    url: '/file/upload',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                      data = JSON.parse(data)
                      setTimeout(function () {
                        var picture = '<picture>'
                        picture += '<source media="(max-width: 480px)" srcset="/asset/r/' + data.filename + '/480.webp?_from='+ btoa(subdomain) +'" type="image/webp">'
                        picture += '<source media="(max-width: 480px)" srcset="/asset/r/' + data.filename + '/480?_from='+ btoa(subdomain) +'">'
                        picture += '<source media="(max-width: 799px)" srcset="/asset/r/' + data.filename + '/799.webp?_from='+ btoa(subdomain) +'" type="image/webp">'
                        picture += '<source media="(max-width: 799px)" srcset="/asset/r/' + data.filename + '/799?_from='+ btoa(subdomain) +'">'
                        picture += '<source media="(min-width: 800px)" srcset="/asset/o/' + data.filename + '.webp?_from='+ btoa(subdomain) +'" type="image/webp">'
                        picture += '<source media="(min-width: 800px)" srcset="/asset/o/' + data.filename + '?_from='+ btoa(subdomain) +'">'
                        picture += '<img src="/asset/o/' + data.filename + '">'
                        picture += '</picture>'
                        $(el).html(picture)
                      }, 100)
                      clear_empty_drags()
                    }
                  });
                }
              }
            }
          }

          if (!isFile) {
            $('.active').removeClass('active')
            if (dragObj.hasClass('cms_col')) {
              if (el.hasClass('cms_col')) {
                swap(dragObj, el)
              } else {
                swap(dragObj, el.children().length == 0 ? el : el.children().first())
              }
            } else {
              if (el.hasClass('cms_col')) {
                swap(dragObj.children().first(), el)
              } else {
                swap(dragObj, el)
              }
            }

            el.removeClass('drop_empty')
            if (!el.hasClass('drag')) {
              prepare_drag(el);
              prepare_drop(el)
            }
            $('.drop_empty').remove()
            clear_empty_drags()
            set_empty_rows()
          }
        }
      }

      window.drag_end = function (event) {
        event.stopPropagation()

        $('.row_editor').css('margin-left', (-99999) + 'px')
        $('.dragging').removeClass('dragging')
        $('.active').removeClass('active')
        $('.drop_empty').remove()
        clear_empty_drags()
      }

      window.allow_drop = function (event) {
        event.stopPropagation();
        event.preventDefault();

        var el = $(event.target).hasClass('drop') ? $(event.target) : $(event.target).closest('.drag')
        $('.active').removeClass('active')
        el.addClass('active')
      }
    }

    /*
      set_empty_rows <function>
      add Class .empty_row to all empty .cms_row
    */
    var set_empty_rows = function () {
      $(self).find('.cms_row').removeClass('empty_row')
      $(self).find('.cms_row').each(function (y, col) {
        if ($(col).text().trim() === '') {
          $(col).addClass('empty_row')
        }
      })
    }

    /*
      add_drop_empty <function>
      add drop DIVs when starting a drag
    */
    var add_drop_empty = function () {
      clear_empty_drags()
      var empty = '<div class="sg-row cms_row" data-type="full"><div class="col-12 cms_col"><div class="drop drop_empty row_empty"></div></div></div>'
      var drop_empty = '<div class="drop drop_empty col_empty"><div></div></div>'

      $(self).find('.edit-mode .cms_editor .sub_row .cms_col .drop').each(function (i, el) {
        if ($(el).parent().hasClass('cms_col') ||
          $(el).parent().hasClass('cms_row')) {
          $(el).after(drop_empty)
        }
      })

      $(self).find('.edit-mode .page-content > .cms_row').each(function (y, row) {
        $(row).before(empty)
      })
      $(self).find('.edit-mode .cms_col').each(function (y, col) {
        if (!$(col).hasClass('col-12')) $(col).prepend(drop_empty)
      })
      $(self).find('.edit-mode .cms_editor .page-content').append(empty)
      $(self).find('.edit-mode .drop_empty').attr('ondragover', 'allow_drop(event)')
      $(self).find('.edit-mode .drop_empty').attr('ondrop', 'drop(event)')
    }

    /*
      swap <function(from, to)>
      swap 2 widgets
    */
    var swap = function (from, to) {
      from = from[0]
      to = to[0]

      const afterTo = to.nextElementSibling
      const parent = to.parentNode

      if ($(from).data('menuitem')) {
        var html = get_widget_html($(from).data('menuitem'), false)

        if ($(to).hasClass('row_empty')) {
          var dest = $(html).hasClass('sub_row') ? $(parent).parent() : $(parent)
          dest.html(html[0].outerHTML)
        } else {
          if ($(to).hasClass('col_empty')) {
            $(to).html(html[0].outerHTML)
            $(to).removeClass("row_empty")
            $(to).removeClass("col_empty")
            $(to).addClass("drag")
          } else {
            if (!$(parent).hasClass('sg-container')) $(parent).html(html[0].outerHTML)
          }
        }

        prepare_drag($('.drag'));
        prepare_drop($('.drop'));

      } else {
        try {
          const tmp = from
          from.replaceWith(to)
          parent.insertBefore(from, afterTo)
        } catch (err) {
          parent.appendChild(tmp)
        }
        clear_empty_drags()
      }

      $(self).find('[data-type=full] .col-12').each(function(i, item) {
        if($(item).find('.sg-row').length > 0) {
          var html = $(item).html()
          $(item).parent()[0].outerHTML = html
        }
      })
    }

    /*
      prepare_drag <function(element)>
      set the element draggable
    */
    var prepare_drag = function (el) {
      el.attr('draggable', true)
      el.attr('ondragstart', 'drag(event)')
      el.attr('ondragend', 'drag_end(event)')
    }

    /*
      prepare_drop <function(element)>
      set the element dropable
    */
    var prepare_drop = function (el) {
      el.addClass('drop')
      el.attr('ondragover', 'allow_drop(event)')
      el.attr('ondrop', 'drop(event)')
    }

    /*
      clear_empty_drags <function>
      Remove empty drag elements
    */
    var clear_empty_drags = function () {
      $(self).find('.edit-mode .drop').each(function (i, el) {
        var from_col = $(el).parents()
          .map(function (i, el) {
            return el.className.split(' ')
          })
          .filter(function (i, el) {
            return el == 'cms_col'
          })
          .length >= 1

        if ($(el).find('.cms_col').length == 0 && !from_col &&
          $(el).text().trim() == '' && $(el).data('type') != 'img' && $(el).data('type') != 'embed') {
          $(el).remove()
        }
        if ($(el).hasClass('drop') && !$(el).hasClass('drag')) {
          $(el).remove()
        }
      })

      $(self).find('.edit-mode .drag').each(function (i, el) {
        var from_col = $(el).parents()
          .map(function (i, el) {
            return el.className.split(' ')
          })
          .filter(function (i, el) {
            return el == 'cms_col'
          })
          .length >= 1
        if (from_col && $(el).parent().find('.drag').length > 1 &&
          ($(el).html().trim() == '' || $(el).html().trim() == '<div></div>') &&
          !$(el).is('img')) {
          $(el).remove()
        }
      })

      $(self).find('.edit-mode .cms_row > *').each(function (i, el) {
        var from_col = $(el).parents()
          .map(function (i, el) {
            return el.className.split(' ')
          })
          .filter(function (i, el) {
            return el == 'cms_col'
          })
          .length >= 1

        if (!$(el).hasClass('cms_col') &&
          $(el).html().trim() == '' || $(el).html().trim() == '<div></div>') {
          $(el).remove()
        }
      })

      $(self).find('.edit-mode .cms_row').each(function (i, el) {
        if ($(el).html().trim() == '' ||
          $(el).html().trim() == '<div></div>' ||
          $(el).html().trim() == '<div class="col-12 cms_col"></div>') {
          $(el).remove()
        }
      })
    }

    /*
      run_export <function(base)>
      Export base element as json structure
    */
    var run_export = function (base) {
      var data = []
      $(base).find('> .cms_row').each(function (i, row) {

        if($(row).data('type') == 'full') {
          if($(row).find('div:first').hasClass('cms_col')) $(row).data('type', $(row).find("[data-type]").data('type'))
          else row = $(row).children()[0]
        }
        var data_row = { data: [], type: $(row).data('type') }

        $(row).find('> .cms_col').each(function (y, col) {
          var data_col = []
          $(col).find('[data-type]').each(function (z, widget) {
            if($(widget).data('exported') == undefined) {
              $(widget).data('exported', true)

              var data_widget = {}
              data_widget['type'] = $(widget).data('type')
              data_widget['attr'] = $(widget).data('attr')
              if ($(widget).data('type').indexOf('col') >= 0) {
                data_widget['content'] = run_export($(widget).parent())
              } else {
                data_widget['content'] = $(widget).data('html') || $(widget).html()
              }

              data_col.push(data_widget)
            }
          })

          data_row['data'].push(data_col)
        })

        data.push(data_row)
      })

      $(base).find('[data-exported]').removeAttr('data-exported')
      return data
    }

    /*
      set_content <function>
      Load HTML content into .page_content and run all useful methods for starting the editor
    */
    var set_content = function (value) {
      $(self).find('.page-content').html(value || '')

      clear_empty_drags();
      set_empty_rows()
      prepare_drag($(self).find(".drag"));
      prepare_drag($(self).find(".drop"))
      ;
      activate_events()
      remove_drag_attributes()

      $(self).find('[data-html]').each(function (i, el) { $(el).html($(el).data('html')) })
    }

    /*
      activate_events <function>
      Add jQuery events on page content
    */
    var activate_events = function () {
      // Set the active Row
      $(self).find('.edit-mode .cms_editor').on('mouseenter', '.cms_row', function () {
        $(self).find('.edit-mode .row_editor').css('margin-left', (-99999) + 'px')
        var y = (0 - $(self).find('.cms_editor').offset().top) + $(this).offset().top + $(this).height() - $(self).find('.row_editor').height()
        var x = $(this).offset().left + 16 - 100

        $(self).find('.edit-mode .row_editor').css('margin-left', x + 'px')
        $(self).find('.edit-mode .row_editor').css('margin-top', y + 'px')
        activeObj = $(this)
      })

      // Set the active Widget
      $(self).find('.edit-mode .cms_editor').on('mouseenter', '.cms_col > *', function () {
        var y = $(this).offset().top
        var x = $(this).offset().left - $(self).find('aside').width()
        activeObj = $(this)
      })

      // When you delete a row
      $(self).find('.edit-mode .cms_row_delete').on('click', function () {
        activeObj.closest('.edit-mode .sg-row').remove()
        return false
      })

      // When you click on a widget
      // It should open the editor modal with the right content / tools
      $(self).find('.edit-mode .page-content').on('click', '[data-type]', function () {
        editObj = $(this)
        raw_object = $(this.outerHTML)
        if (raw_object.data("attr")) {
          $(self).find("input[data-name=col-class]").val(raw_object.data("attr")['col-class'])
          $(self).find("input[data-name=row-class]").val(raw_object.data("attr")['row-class'])
          $(self).find("input[data-name=container-class]").val(raw_object.data("attr")['container-class'])
        } else {
          $(self).find("input[data-name=col-class]").val('')
          $(self).find("input[data-name=row-class]").val('')
          $(self).find("input[data-name=container-class]").val('')
        }
        $(self).find(".editor-code").hide()
        $(self).find(".editor-simplecode").hide()
        $(self).find(".editor-img-code").hide()
        if (raw_object.data('editable')) {
          $(self).find('.trumbowyg').hide()
          $(self).find('#ace-editor-' + object_name).hide()

          var html = $(this).html().trim()
          $(self).find('.edit-mode .cms_editor').addClass('editmode')
          if (raw_object.data('type') == 'text') {
            $('#trumbowyg-' + object_name).trumbowyg('html', html);
            $(self).find('.trumbowyg').show()
          }

          if (raw_object.data('type') == 'code') {
            $(self).find(".editor-code").show()
            $(self).find('#ace-editor-' + object_name).show()
            $(self).find("input[data-name=lang]").val(raw_object.find("code:first")[0].className.replace('language-', ''))
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            ace_editor.getSession().setValue($(this).text());
          }

          if (['embed', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(raw_object.data('type')) >= 0) {
            $(self).find(".editor-simplecode").show()
            $('#ace-editor-'+object_name).show()
            var mode = 'html'
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            var html = $(this).html()
            if (raw_object.data('type') == 'embed') html = $(this).attr('data-html').replace(/&quot;/g, '"')
            ace_editor.getSession().setValue(html);
          }

          if (['img'].indexOf(editObj.data('type')) >= 0) {
            var img_div = $(this).find('.img-div').length > 0 ? $(this).find('.img-div') : $(this).find('img').parent()
            $(self).find(".editor-simplecode").show()
            $(self).find(".editor-img-code").show()
            $('#ace-editor-'+object_name).show()
            $(self).find("input[data-name=img-width").val(img_div.attr('data-img-width'))
            $(self).find("select[data-name=img-alignment").val(img_div[0].style['text-align'])
            var mode = 'html'
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            ace_editor.getSession().setValue(img_div[0].innerHTML);
          }

        }

        return false
      })

      // Close the editor modal
      $(self).find('.edit-mode .sg-editcontent').on('click', '.fa-times-circle', function () {
        $('.edit-mode .cms_editor').removeClass('editmode')
        save_editor()

        return false
      })

      // When you click on the toolbar item
      $(self).find('.edit-mode .addwidget').on('click', function (e) {
        e.preventDefault();
        var html = get_widget_html($(this).data('id'), true)
        $(self).find('.edit-mode .page-content').append(html)
        $(self).find('.edit-mode .drag').attr('draggable', true)
        $(self).find('.edit-mode .drag').attr('ondragstart', 'drag(event)')
        $(self).find('.edit-mode .drag').attr('ondragover', 'allow_drop(event)')
        $(self).find('.edit-mode .drag').attr('ondrop', 'drop(event)')
        $(self).find('.edit-mode .drag').attr('ondragend', 'drag_end(event)')

        set_empty_rows()

        return false
      })

      $(self).find('.toggle-layout').on('click', function (e) {
        e.preventDefault()
        set_windows_events()
        $(self).find('.view-mode').toggleClass('isactive')
        $(self).find('.edit-mode').toggleClass('isactive')
        $(self).toggleClass('fullscreen')
        $('[data-exported]').removeAttr('data-exported')
        var data = {
          html: $(self).find('.edit-mode .page-content').html(),
          json: run_export($(self).find('.edit-mode .page-content'))
        }
        $('input[name="' + object_name + '"]').val(JSON.stringify(data))
        $(self).find('.page-content').html(data['html'] || '')
        remove_drag_attributes()
        $(self).find('[data-html]').each(function (i, el) {
          $(el).html($(el).attr('data-html'))
        })

        return false
      })
    }

    /*
      remove_drag_attributes <function(element)>
    */
    var remove_drag_attributes = function () {
      $(self).find('.view-mode .drag, .view-mode .drop').removeAttr('ondragend')
        .removeAttr('ondragstart')
        .removeAttr('ondragover')
        .removeAttr('ondrop')
    }


    var view_mode = '<a href="" class="toggle-layout view-mode isactive">Edit content</a>'
    view_mode += '<section class="view-mode isactive">\
                        <div class="page-content"></div></section>'

    $(self).append(view_mode)

    var items = '<aside class="edit-mode">\
                   <div class="sg-container toolbox"><h1>Page tools</h1> \
                   <div class="sg-row"></div>\
                   <div class="sg-row"><a href="" class="toggle-layout">Exit</a></div></div>\
                  </aside>'

    $(self).append(items)
    $(self).addClass('editor-cms')

    settings.widgets.forEach(function (w) {
      $(self).find(".toolbox .sg-row:first").append('\
      <div class="col-4 drag" dragdraggable="true" data-menuitem="' + w.id + '">\
        <a href="#" class="addwidget" data-id="' + w.id + '">\
          <i class="' + w.icon + '"></i>\
          <div class="small">' + w.title + '</div></a>\
      </div>')
    })

    var content = '<section class="edit-mode">\
      <div class="cms_editor">\
        <div class="row_editor">\
          <div class="cms_toolbar">\
            <ul>\
              <li><a href="#" class="cms_row_delete"><i class="fas fa-trash-alt"></i></a></li>\
            </ul>\
          </div>\
        </div>\
        <div class="sg-container page-content"></div>\
        <div class="sg-editcontent">\
          <i class="far fa-times-circle" style="float: right;padding: 10px"></i>\
          <div class="content">\
            <div id="trumbowyg-'+object_name+'"></div>\
            <div><label>Container Class</label><input type="text" data-name="container-class" class="uk-input"></div>\
            <div><label>Row Class</label><input type="text" data-name="row-class" class="uk-input"></div>\
            <div><label>Col Class</label><input type="text" data-name="col-class" class="uk-input"></div>\
            <div class="editor-code"><label>Language</label><input type="text" data-name="lang" class="uk-input"></div>\
            <div class="uk-grid"><div class="uk-width-1-2 editor-img-code"><label>Image Width</label><input type="text" data-name="img-width" class="uk-input"></div>\
            <div class="uk-width-1-2 editor-img-code"><label>Image Alignment</label>\
            <select class="uk-select" data-name="img-alignment">\
            <option>left</option><option>center</option><option>right</option></select></div></div>\
            <div class="editor-code editor-simplecode"><label>Code</label><div id="ace-editor-'+object_name+'" class="ace-editor"></div></div>\
          </div>\
        </div>\
      </div>\
    </section>'

    $(self).append(content)
    set_content(options.value)

    $('#trumbowyg-'+object_name).trumbowyg({
      btns: [
        ['viewHTML'],
        ['undo', 'redo'],
        ['formatting'],
        ['strong', 'em', 'del'],
        ['superscript', 'subscript'],
        ['link'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
        ['unorderedList', 'orderedList'],
        ['horizontalRule'],
        ['removeformat'],
        ['fullscreen']
      ],
      resetCss: true,
      svgPath: 'img/icons.svg',
      removeformatPasted: true
    }).on('tbwchange', function () {
      editObj.html($('#trumbowyg-' + object_name).trumbowyg('html'))
    });

    // Activate Ace editor
    ace_editor = ace.edit('ace-editor-'+object_name)
    ace_editor.getSession().setUseWrapMode(true)

    ace_editor.setTheme('ace/theme/twilight')
    ace_editor.session.setMode('ace/mode/html')

    var save_editor = function () {
      if (editObj) {
        var attributes = {
          'col-class': $('input[data-name=col-class]').val(),
          'row-class': $('input[data-name=row-class]').val(),
          'container-class': $('input[data-name=container-class]').val()
        }
        var content = ace_editor.getSession().getValue()
        if (editObj.data('type') == 'code') {
          var mode = 'language-' + $(self).find("input[data-name=lang]").val()
          editObj.html('<pre><code class="' + mode + '">' + htmlEntities(content) + '</code></pre>')
        }
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(editObj.data('type')) >= 0) {
          editObj.html(content)
        }
        if (['embed'].indexOf(editObj.data('type')) >= 0) {
          editObj.html(content)
          editObj.attr('data-html', content)
        }
        if (['text'].indexOf(editObj.data('type')) >= 0) {
          editObj.html($('#trumbowyg-'+object_name).trumbowyg('html'))
        }
        if(['img'].indexOf(editObj.data('type')) >= 0) {
          var width = $(self).find("input[data-name=img-width").val() ? $(self).find("input[data-name=img-width").val() : '100%'
          var alignment = $(self).find("select[data-name=img-alignment").val() ? $(self).find("select[data-name=img-alignment").val() : 'left'
          var temp = $('<div>').append($.parseHTML(content))
          temp.each(function() {
            var img = $(this).find('img')
            for(var i = 0; i < img.length; i++) {
              img[i].style.width = width
            }
          })
          editObj.html('<div class="img-div" style="text-align: ' + alignment + '" data-img-width="' + width + '">' + temp[0].innerHTML + '</div>')
        }
        editObj.attr('data-attr', JSON.stringify(attributes))

      }
    }

    return this;
  };

})(jQuery);
});

require.register("js/js.js", function(exports, require, module) {
document.removeEventListener("keydown", function() {})
document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    $('input[type=submit]:visible').click();
  }
}, false);


$(function () {

  riot.mount('rightnav')

  route('/', function(name) {
    // Here set the / mount
    riot.mount('div#app', 'loading')
  })

  route('/welcome', function(name) {riot.mount('div#app', 'welcome') })

  route('/login', function(name) {riot.mount('div#app', 'login') })
  route('/signup', function(name) {riot.mount('div#app', 'signup') })

  route('/confirm/*', function(id) {
    common.post(url+'auth/confirm', JSON.stringify({ uuid: id }), function() {
      document.location.href = "index.html"
    })
  })

  route('/logout', function(name) {
    common.post(url +"auth/logout", "", function(d) {
      localStorage.removeItem('X-Session-Id')
      document.location.href = "login.html"
    })
  })

  route('/settings', function() { riot.mount('div#app', 'settings') })

  /*@{{router}}*/


  route('/datasets/*', function(type) { riot.mount('div#app', 'datasets', { datatype: type }) })
  route('/datasets/*/new', function (type) {
    riot.mount('div#app', 'dataset_new', { datatype: type })
  })
  route('/datasets/*/*', function (type, folder_key) {
    riot.mount('div#app', 'datasets', { datatype: type, folder_key: folder_key })
  })
  route('/datasets/*/new/*', function (type, folder_key) {
    riot.mount('div#app', 'dataset_new', { datatype: type, folder_key: folder_key })
  })
  route('/datasets/*/*/edit', function(type, id) {
    riot.mount('div#app', 'dataset_edit', { datatype: type, dataset_id: id })
  })

  route(function(collection, id, action) {
    if(action != undefined) {
      /*@{{router_cia}}*/
    }
  })

  route(function(collection, action) {
    /*@{{router_ca}}*/
  })


  route.start(true)
  //riot.mount("*")

  if(document.location.host.indexOf("prod.") >= 0) $("body").css("background", "linear-gradient(150deg,#370d13 0,#283a63 100%)")
  if(document.location.host.indexOf("staging.") >= 0) $("body").css("background", "linear-gradient(150deg,#33521c 0,#283a63 100%)")
  if(document.location.host.indexOf("qa.") >= 0) $("body").css("background", "linear-gradient(150deg, rgb(61, 64, 18) 0px, rgb(37, 43, 2) 100%)")
})

});

;require.register("widgets/datasets.html.tag", function(exports, require, module) {
riot.tag2('dataset_folders', '<div> <ul class="uk-breadcrumb"> <li each="{f in path}"><a href="#datasets/{opts.slug}/{f._key}">{f.name}</a></li> <li> <a if="{path.length > 1}" onclick="{renameFolder}"><i class="far fa-edit"></i></a> <a onclick="{addFolder}"><i class="fas fa-plus"></i></a> <a if="{path.length > 1 && folders.length == 0}" onclick="{deleteFolder}"><i class="fas fa-trash"></i></a> </li> </ul> <ul class="uk-list"> <li each="{f in folders}"><a href="#datasets/{opts.slug}/{f._key}"><i class="far fa-folder"></i> {f.name}</a></li> </ul> </div>', '', '', function(opts) {
    this.folders = []
    this.folder = {}
    this.path = [ this.folder ]
    this.folder_key = this.opts.folder_key || ''
    var self = this

    var loadFolder = function(folder_key) {
      common.get(url + "/datasets/folders/" + opts.slug + "/" + folder_key, function(d) {
        self.folders = d.folders
        self.path = d.path
        self.folder = _.last(self.path)
        self.parent.setFolder(self.folder)
        self.update()
      })
    }

    this.addFolder = function(e) {
      var name = prompt("Folder's name");
      common.post(url + "/datasets/folders/" + opts.slug, JSON.stringify({ name: name, parent_id: self.folder._key }), function(d) {
        loadFolder(self.folder._key)
      })
    }.bind(this)

    this.renameFolder = function(e) {
      var name = prompt("Update Folder's name");
      common.patch(url + "/datasets/folders/" + opts.slug, JSON.stringify({ name: name, id: self.folder._key }), function(d) {
        self.path = d.path
        self.update()
      })
    }.bind(this)

    this.deleteFolder = function(e) {
      UIkit.modal.confirm('Are you sure? This action will destroy the folder and it\'s content').then(function() {
        var parent = _.last(_.initial(self.path))
        common.delete(url + "/datasets/folders/" + opts.slug + "/" + self.folder._key, function(d) {
          common.get(url + "/datasets/folders/" + opts.slug + "/" + parent._key, function(d) {
            route("/datasets/" + opts.slug + "/" + parent._key)
          })
        })
      }, function () {
        console.log('Rejected.')
      });
    }.bind(this)

    loadFolder(this.folder_key)
});

riot.tag2('dataset_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th width="20" if="{sortable}"></th> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody id="sublist"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    this.sortable = false
    this.data     = []

    var self = this

    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "dataset_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "datasets/"+opts.parent_name+"/"+ opts.parent_id + "/"+opts.model+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        var model = d.model
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(model.columns) self.cols = model.columns
        self.sortable = !!model.sortable
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "dataset_crud_edit", opts)
    }.bind(this)

    this.nextPage = function(e) {
      e.preventDefault()
      self.page += 1
      self.loadPage(self.page + 1)
    }.bind(this)

    this.previousPage = function(e) {
      e.preventDefault()
      self.page -= 1
      self.loadPage(self.page + 1)
    }.bind(this)

    this.destroy_object = function(e) {
      e.preventDefault()
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "/datasets/" + opts.parent_name + "/" + opts.model +"/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('sublist');
        if(el)
          var sortable = new Sortable(el, {
            animation: 150,
            ghostClass: 'blue-background-class',
            handle: '.fa-grip-vertical',
            onSort: function ( evt) {
              common.put(
                url + 'datasets/'+ opts.id +'/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
                function() {}
              )
            },
          });
      }
    })
});

riot.tag2('dataset_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_{opts.singular}"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "dataset_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_'+opts.singular, "datasets/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "")
    }.bind(this)

    var self = this;
    common.get(url + "/datasets/" + opts.parent_name + "/sub/" + opts.id + "/" + opts.element_id, function(d) {
      self.subdata = d.data

      common.buildForm(self.subdata, opts.fields, '#'+opts.id+'_crud_' + opts.singular)
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('dataset_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_dataset"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "dataset_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_dataset')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_dataset', "datasets/"+ opts.parent_name +"/" + opts.parent_id + "/"+ opts.id, "", opts)
    }.bind(this)
});

riot.tag2('all_datatypes', '<div class="rightnav uk-card uk-card-default uk-card-body"> <ul class="uk-nav-default uk-nav-parent-icon" uk-nav> <li class="uk-nav-header">Datasets</li> <li each="{datatypes}"><a href="#datasets/{slug}">{name}</a></li> </ul> </div>', '', '', function(opts) {
    var self = this
    this.datatypes = []
    common.get(url + "/datasets/datatypes", function(data) {
      self.datatypes = data
      self.update()
    })
});

riot.tag2('dataset_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">datasets</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing {object.singular}</h3> <virtual if="{folders.length > 0}"> <label class="uk-label">Path</label> <form onsubmit="{changePath}"> <div class="uk-grid uk-grid-small"> <div class="uk-width-3-4"> <select class="uk-select" ref="folder"> <option riot-value="{folders[0].root._key}" selected="{folders[0].root._key == dataset.folder_key}">Root</option> <option each="{f in folders}" riot-value="{f.folder._key}" selected="{f.folder._key == dataset.folder_key}">{pathName(f.path)}</option> </select> </div> <div class="uk-width-1-4"> <a onclick="{changePath}" class="uk-button uk-button-primary">Change</a> </div> </div> </form> </virtual> <form onsubmit="{save_form}" class="uk-form" id="form_dataset"> </form> <a if="{publishable}" class="uk-button uk-button-primary" onclick="{publish}">Publish</a> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false
    self.sub_models = []
    self.publishable = false
    self.folders = []

    this.changePath = function(e) {
      e.preventDefault()
      common.put(url + "/datasets/pages/" + opts.dataset_id + "/change_folder", JSON.stringify({ folder_key: self.refs.folder.value}), function(d) {
        UIkit.notification({
            message : 'Successfully updated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
      })
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_dataset", "datasets/" + opts.datatype ,opts.dataset_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/datasets/"+ opts.datatype +"/" + self.dataset._key + "/duplicate", function(data) {
          route('/datasets/'+ opts.datatype + '/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    this.pathName = function(path) {
      return _.map(path, function(p) { return p.name }).join(" > ")
    }.bind(this)

    this.publish = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.post(url + "/datasets/" + self.dataset._key + "/publish", JSON.stringify({}), function(data) {
          UIkit.notification({
            message : 'Successfully published!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      })
    }.bind(this)

    common.get(url + "/datasets/" + opts.datatype + "/" + opts.dataset_id, function(d) {
      self.publishable = d.model.publishable
      self.object = d.model
      self.dataset = d.data
      self.folders = d.folders
      self.fields = d.fields
      self.sub_models = d.model.sub_models
      var act_as_tree = d.model.act_as_tree

      if(!_.isArray(self.fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        localStorage.setItem('resize_api_key', me.resize_api_key)
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          var back_url = 'datasets/' + opts.datatype
          if(act_as_tree && self.dataset.folder_key) { back_url += '/' + self.dataset.folder_key }
          common.buildForm(self.dataset, self.fields, '#form_dataset', back_url, function() {
            $(".crud").each(function(i, c) {
              var id = $(c).attr("id")
              riot.mount("#" + id, "dataset_crud_index", { model: id,
                fields: self.sub_models[id].fields,
                key: self.sub_models[id].key,
                singular: self.sub_models[id].singular,
                columns: self.sub_models[id].columns,
                parent_id: opts.dataset_id,
                parent_name: opts.datatype })
            })
          })
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('dataset_new', '<virtual if="{can_access}"> <h3>Creating {object.singular}</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_dataset"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_dataset", "datasets/" + opts.datatype)
    }.bind(this)

    common.get(url + "/datasets/"+ opts.datatype + "/fields", function(d) {
      self.object = d.object
      common.get(url + "/auth/whoami", function(me) {
        localStorage.setItem('resize_api_key', me.resize_api_key)
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {
          var fields = d.fields
          var obj = {}
          var back_url = 'datasets/' + opts.datatype
          if(self.opts.folder_key) {
            fields.push({ r: true, c: "1-1", n: "folder_key", t: "hidden" })
            obj['folder_key'] = opts.folder_key
            back_url += '/' + opts.folder_key
          }

          common.buildForm(obj, fields, '#form_new_dataset', back_url);
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('dataset_tags', '<span each="{row in data}"> {row.tag} <span class="uk-badge uk-margin-right">{row.size}</span> </span>', '', '', function(opts) {
    var self = this
    common.get(url + "/datasets/" + opts.datatype + "/stats/" + this.opts.tag, function(d) {
      self.data = d
      self.update()
    })
});

riot.tag2('datasets', '<dataset_folders show="{loaded}" if="{act_as_tree}" folder_key="{folder_key}" slug="{opts.datatype}"></dataset_folders> <virtual if="{can_access}"> <div class="uk-float-right"> <a if="{act_as_tree}" href="#datasets/{opts.datatype}/new/{folder_key}" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New {model.singular}</a> <a if="{!act_as_tree}" href="#datasets/{opts.datatype}/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New {model.singular}</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing {opts.datatype}</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <dataset_tags if="{show_stats}" datatype="{opts.datatype}" tag="{show_stats_tag}"></dataset_tags> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}" class="{col.class}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}" no-reorder key="{row._key}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a riot-style="color: {col.colors ? col.colors[row[col.name][locale]] : \'white\'}" onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a riot-style="color: {col.colors ? col.colors[row[col.name]] : \'white\'}" onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{calc_value(row, col, locale)} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="160"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a if="{is_api}" onclick="{install}" class="uk-button uk-button-success uk-button-small"><i class="fas fa-upload"></i></a> <a if="{is_script}" onclick="{install_script}" class="uk-button uk-button-success uk-button-small"><i class="fas fa-upload"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination noselect"> <li if="{page + 1 > 1}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self        = this
    this.show_stats = false
    this.page       = 0
    this.perpage    = localStorage.getItem("perpage") || per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false
    this.folder_key = this.opts.folder_key || ''
    this.folder     = {}
    this.act_as_tree = true

    this.settings   = {}

    common.get(url + "/settings", function(settings) { self.settings = settings.data })

    this.loadPage = function(pageIndex) {
      self.loaded = false
      var querystring = "?folder=" + self.folder._key + "&is_root=" + self.folder.is_root

      common.get(url + "/datasets/" + opts.datatype + "/page/" + pageIndex + "/" + this.perpage + querystring, function(d) {
        self.data = d.data[0].data
        var model = d.model
        self.model = d.model

        self.act_as_tree = model.act_as_tree
        self.is_api = !!model.is_api
        self.is_script = !!model.is_script
        if(model.stats_for_tag) {
          self.show_stats = true
          self.show_stats_tag = model.stats_for_tag
          self.update()
        }
        self.export = !!model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(model.columns) self.cols = model.columns
        self.count = d.data[0].count
        self.sortable = !!model.sortable

        self.update()

        if(self.can_access == false) {
          common.get(url + "/auth/whoami", function(me) {
            localStorage.setItem('resize_api_key', me.resize_api_key)
            self.loaded = true
            self.can_access = model.roles === undefined || _.includes(model.roles.read, me.role)
            self.update()
          })
        }
      })
    }

    this.setFolder = function(folder) {
      self.folder = folder || {}
      self.folder_key = self.folder._key
      self.loadPage(1)
    }

    this.calc_value = function(row, col, locale) {
      value = _.get(row, col.name)
      if(col.tr) { value = value[locale] }
      if(col.truncate) { value = value.substring(0,col.truncate) }
      if(col.capitalize) { value = _.capitalize(value) }
      if(col.uppercase) { value = _.toUpper(value) }
      if(col.downcase) { value = _.toLower(value) }
      return value
    }.bind(this)

    this.filter = function(e) {
      e.preventDefault();
      if(self.refs.term.value != "") {
        $(".uk-form-icon i").attr("class", "uk-icon-spin uk-icon-spinner")
        common.get(url + "/datasets/"+ opts.datatype +"/search/"+self.refs.term.value, function(d) {
          self.data = d.data
          $(".uk-form-icon i").attr("class", "uk-icon-search")
          self.update()
        })
      }
      else {
        self.loadPage(1)
      }
    }.bind(this)

    this.edit = function(e) {
      route("/datasets/" + this.opts.datatype + "/" + e.item.row._key + "/edit")
    }.bind(this)

    this.new_dataset = function(e) {
      route("/datasets/" + this.opts.datatype + "/new")
    }.bind(this)

    this.nextPage = function(e) {
      self.page += 1
      self.loadPage(self.page + 1)
    }.bind(this)

    this.previousPage = function(e) {
      self.page -= 1
      self.loadPage(self.page + 1)
    }.bind(this)

    this.destroy_object = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "/datasets/" + opts.datatype + "/" + e.item.row._key, function() {
          self.loadPage(self.page + 1)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/datasets/" + opts.datatype + "/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
        if(data.success) {
          e.target.innerText = data.data
        }
      })
    }.bind(this)

    this.setPerPage = function(e) {
      e.preventDefault()
      var perpage = parseInt(e.srcElement.innerText)
      if(e.srcElement.innerText == 'ALL') perpage = 1000000000;
      this.perpage = perpage
      localStorage.setItem("perpage", perpage)
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/datasets/' + opts.datatype + '/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "datasets.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.install = function(e) {
      e.preventDefault()
      var url = "/service/" + e.item.row.name
      console.log(url)
      $.post(url, { token: self.settings.token }, function(data) {
        if(data == "service installed")
          UIkit.notification({
            message : 'Endpoint Deployed Successfully!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
      })
      return false
    }.bind(this)

    this.install_script = function(e) {
      e.preventDefault()
      var url = "/script/" + e.item.row.name
      console.log(url)
      $.post(url, { token: self.settings.token }, function(data) {
        if(data == "script installed")
          UIkit.notification({
            message : 'Script Launched Successfully!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
      })
      return false
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        if(el) {
          var sortable = new Sortable(el, {
            animation: 150,
            ghostClass: 'blue-background-class',
            handle: '.fa-grip-vertical',
            onSort: function ( evt) {
              var folder_key = "?folder_key=" + self.folder._key
              if(!self.act_as_tree) folder_key = ''
              common.put(
                url + 'datasets/'+ opts.datatype +'/orders/' + evt.oldIndex + "/" + evt.newIndex + folder_key, {},
                function() {}
              )
            },
          });
        }

      }
    })
});
});

require.register("widgets/loading.html.tag", function(exports, require, module) {
riot.tag2('loading', '<div class="uk-text-center"> Loading app ... <br><div uk-spinner></div> </div>', '', '', function(opts) {
    common.get(url + "auth/whoami", function(d) {
      if(d.username === null) document.location.href="login.html";
      else {

        localStorage.setItem('resize_api_key', d.resize_api_key)
        route('/welcome')
      }
    })
});

riot.tag2('welcome', '<h1 class="uk-text-center">Welcome aboard</h1> <p class="uk-text-center" style="color: white">This is a landing page ... Nothing special here, replace it by what you want !</p> <p class="uk-text-center" style="color: white">Find me in <code>app/widgets/loading.html.tag</code></p> <h2 class="uk-text-center" style="margin-top:80px"><a href="https://fasty.ovh" target="_blank">Fasty</a> is powered by powerful opensource projects</h2> <div class="uk-container uk-text-center" style="color: white;margin-top:80px"> <div class="uk-column-1-2"> <div class="uk-margin"> <a href="https://www.arangodb.com/" target="_blank"><img src="/static/admin/img/ArangoDB-logo-bg.svg" style="height:90px"></a> <br>ArangoDB </div> <div class="uk-margin"> <a href="https://openresty.org/en/" target="_blank"><img src="/static/admin/img/logo.png" style="height:90px"></a> <br>openresty </div> </div> <div class="uk-column-1-2"> <div class="uk-margin"> <a href="https://riot.js.org/" target="_blank"><img src="/static/admin/img/square.svg" style="height:90px"></a> <br>RiotJS </div> <div class="uk-margin"> <a href="https://leafo.net/lapis/" target="_blank"><img src="/static/admin/img/lapis.jpg" style="height:90px"></a> <br>LAPIS </div> </div> </div> </div>', '', '', function(opts) {
});

riot.tag2('rightnav', '<ul class="uk-navbar-nav"> <li><a onclick="{deploy}" if="{settings.deploy_secret != ⁗⁗}">Deploy</a></li> <li each="{lang in langs}" class="{lang == window.localStorage.getItem(\'foxx-locale\') ? \'uk-active\' : \'\'}"><a onclick="{changeLang}">{lang}</a></li> <li><a href="#logout"><i class="uk-icon-sign-out"></i> Logout</a></li> </ul>', '', '', function(opts) {
    this.settings   = {}
    var self = this

    common.get(url + "/settings", function(settings) {
      self.settings = settings.data
      self.langs = self.settings.langs.split(",")
      self.update()
    })

    this.changeLang = function(e) {
      window.localStorage.setItem('foxx-locale', e.item.lang)
      document.location.reload()
    }.bind(this)

    this.deploy = function(e) {
      e.preventDefault()
      if(confirm("Are you sure?")) {
        var url = "/deploy"
        $.post(url, { token: self.settings.token }, function(data) {
          if(data == "site deployed")
            UIkit.notification({
              message : 'Site Deployed Successfully!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
        })
      }
      return false
    }.bind(this)
});
});

require.register("widgets/login.html.tag", function(exports, require, module) {
riot.tag2('loading', '<div class="uk-text-center"> Loading app ... <br><div uk-spinner></div> </div>', '', '', function(opts) {
    route('/login');
});

riot.tag2('login', '<div class="uk-container uk-container-center"> <div uk-grid class="uk-grid-small uk-child-width-1-3@s uk-flex-center uk-text-center"> <div> <h1 class="uk-margin-large-top"><i class="uk-icon-sign-in"></i> Connection</h1> <form class="uk-form uk-margin-top" onsubmit="{save_form}"> <div class="uk-margin"> <input placeholder="Email" class="uk-input" id="username" name="username" value="" type="email"> </div> <div class="uk-margin"> <input type="password" class="uk-input" placeholder="Mot de passe" class="uk-input" id="password" name="password" value=""> </div> <hr> <div class="uk-margin"> <button type="submit" class="uk-button uk-button-primary">Connection</button> </div> <div class="uk-margin-small"> <div id="login_error" class="uk-alert uk-alert-danger uk-hidden uk-text-center"> Bad login or password </div> </div> </form> </div> </div> </div>', '', '', function(opts) {
    this.save_form = function(e) {
      e.preventDefault()
      common.post(url + "auth/login", JSON.stringify({ "username": $("#username").val(), "password": $("#password").val() }) , function(data) {
        if(data.success) document.location.href="index.html";
        else {
          $("#login_error").removeClass("uk-hidden")
        }
      })
    }.bind(this)
});

});

require.register("widgets/settings.html.tag", function(exports, require, module) {
riot.tag2('settings', '<h3 if="{can_access}">settings</h3> <form onsubmit="{save_form}" id="form_settings"> </form> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this;
    this.can_access = false
    this.loaded     = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_settings", "settings", _this.obj._key)
    }.bind(this)

    var _this = this;

    common.get(url + "settings/", function(d) {
      _this.obj = d.data
      common.get(url + "/auth/whoami", function(me) {
        self.update()
        self.loaded = true
        self.can_access = d.roles === undefined || _.includes(d.roles.write, me.role)
        if(self.can_access) common.buildForm(_this.obj, d.fields, '#form_settings')
        self.update()
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_tag").select2({ tags: true })
    })
});


});

require.register("widgets/uploads.html.tag", function(exports, require, module) {
riot.tag2('images', '<div class="sortable_{opts.field}" style="user-select: none;" uk-sortable="group: upload"> <virtual each="{row in data}"> <div uk-grid class="uk-grid-small" data-id="{row._key}"> <div class="uk-width-1-5"><a href="{row.url}?_from={from}" target="_blank"><img riot-src="{row.url}" alt="" style="max-width: 100%"></a></div> <div class="uk-width-3-5">{row.filename.split(\'/\')[row.filename.split(\'/\').length - 1]}<br>{prettyBytes(row.length)}</div> <div class="uk-width-1-5 uk-text-center"><a onclick="{delete_asset}" uk-icon="icon: trash"></a></div> </div> </virtual> </div>', 'images div, images span { color: white; }', '', function(opts) {
    var _this = this
    this.from = btoa(subdomain)
    this.data = []

    var use_i18n = ""
    if(opts.i18n != "undefined") use_i18n = "/" + window.localStorage.getItem("foxx-locale")

    this.load = function() {
      common.get(url + "uploads/" + opts.id + '/' + opts.field + use_i18n, function(d) {
        _this.data = d
        _this.update()
      })
    }.bind(this)

    this.load()

    $(function() {

      UIkit.util.on(".sortable_" + opts.field, 'moved', function(data) {
        var i = 0
        var ids = _.map($(".sortable_" + opts.field+" > div"), function(el) {
          return { k: "" + $(el).data("id"), c: i++ }
        })
        common.post(url+"uploads/reorder", JSON.stringify({ ids: ids, field: opts.field }), function(d) {
          if(d.success) {
            UIkit.notification({
              message : 'Successfully reordered!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
          }
        })
      })
      UIkit.util.on(".sortable_" + opts.field, 'added', function(data) {
        var i = 0
        var ids = _.map($(".sortable_" + opts.field+" > div"), function(el) {
          return { k: "" + $(el).data("id"), c: i++ }
        })
        common.post(url+"uploads/reorder", JSON.stringify({ ids: ids, field: opts.field }), function(d) {
          if(d.success) {
            eventHub.trigger("refresh_uploads")
            UIkit.notification({
              message : 'Successfully reordered!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
          }
        })
      })
    })

    eventHub.on("refresh_uploads", function() {
      _this.load()
    })

    this.delete_asset = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "uploads/" + e.item.row._key, function() {
          $('[data-id='+e.item.row._key+']').remove()
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('files', '<div class="sortable_{opts.field}" style="user-select: none;"> <virtual each="{row in data}"> <div uk-grid class="uk-grid-small" data-id="{row._key}"> <div class="uk-width-3-5">{row.filename} <a href="{row.url}?_from={from}" target="_blank"><i class="fas fa-external-link-alt"></i></a></div> <div class="uk-width-1-5 uk-text-right">{prettyBytes(row.length)}</div> <div class="uk-width-1-5 uk-text-center"><a onclick="{delete_asset}" uk-icon="icon: trash"></a></div> </div> </div>', 'files div, files span { color: white; }', '', function(opts) {
    var _this = this;
    this.from = btoa(subdomain)
    this.data = []

    var use_i18n = ""
    if(opts.i18n != "undefined") use_i18n = "/" + window.localStorage.getItem("foxx-locale")

    common.get(url + "uploads/" + opts.id + '/' + opts.field + use_i18n, function(d) {
      _this.data = d
      _this.update()
    })

    this.filename = function(row) {
      return row.path.split('/').slice(2).join('/')
    }.bind(this)

    $(function() {
      UIkit.sortable(".sortable_" + opts.field, {}) 
      UIkit.util.on(".sortable_" + opts.field, 'moved', function(data) {
        var i = 0
        var ids = _.map($(".sortable_" + opts.field+" > div"), function(el) {
          return { k: "" + $(el).data("id"), c: i++ }
        })
        common.post(url+"uploads/reorder", JSON.stringify({ ids: ids }), function(d) {
          if(d.success) {
            UIkit.notification({
              message : 'Successfully reordered!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
          }
        })
      })
    })

    this.delete_asset = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "uploads/" + e.item.row._key, function() {
          $('[data-id='+e.item.row._key+']').remove()
        })
      }, function() {})
    }.bind(this)
});
});

require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window["$"] = require("jquery");
window.jQuery = require("jquery");
window.riot = require("riot");
window.route = require("riot-route");
window.prettyBytes = require("pretty-bytes");


});})();require('___globals___');


//# sourceMappingURL=js.js.map