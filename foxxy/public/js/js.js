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
    return aliases[name] ? expandAlias(aliases[name]) : name;
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
  startEditor: function(name, mode, id) {
    var editor = ace.edit(name)
    editor.getSession().setMode(mode)
    editor.setOptions({
      maxLines: Infinity,
      //enableEmmet: mode == "ace/mode/html",
      theme: 'ace/theme/twilight',
      tabSize: 2, useSoftTabs: true
    })
    editor.getSession().setUseWrapMode(true)
    editor.getSession().setValue(unescape($("#"+id).val()))
    editor.getSession().on('change', function(){ $("#"+id).val(editor.getSession().getValue()); })

    return editor;
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

          var hidden = ''
          if(l.t === 'hidden') hidden = 'uk-hidden'
          _html += '<div class="'+ l.c + ' ' + hidden +'">'
          var title = l.l
          if (_.isString(l.j)) {
            if (l.j.indexOf('required') > 0) {
              title = "<strong>" + title + "*</strong>"
            }
          } else {
            if (l.j && l.j._flags.presence === "required") {
              title = "<strong>" + title + "*</strong>"
            }
          }
          if(!((l.t === "file" || l.t === "image") && obj._id === undefined))
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
          if(l.t === "time") _html += '<div><div class="uk-inline"><span class="uk-form-icon" uk-icon="icon: calendar"></span><input type="time" id="'+l.n+'" class="uk-input" name="'+ l.n +'"  value="'+value+'"></div><div data-hint="'+ l.n +'" class="uk-text-danger"></div></div>'
          if(l.t === "text") _html += '<textarea id="'+l.n+'" class="uk-textarea" name="'+ l.n +'" style="'+l.s+'">'+ value +'</textarea><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
            if(l.t === "wysiwyg") {
            wysiwygs.push(l.n)
            _html += '<div id="wysiwyg_'+l.n+'"></div><input type="hidden" id="'+l.n+'" name="'+ l.n +'" value="" /><div data-hint="'+ l.n +'" class="uk-text-danger"></div>'
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
            var tags = l.d[0]
            if(l.tr) tags = _.flatten(_.compact(_.map(l.d[0], function(t) { return t[window.localStorage.getItem('foxx-locale')]})))
            tags = _.filter(tags, function(t) { return t != "undefined" })
            _.uniq(tags).forEach(function(v) {
              if(v != 'undefined' || v != '') {
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

    if (back_str != undefined) {
      html += '<a href="#'+ back_str +'" class="uk-button">Back</a> '
    }
    html += '<input type="submit" class="uk-button uk-button-primary" value="Save" /></div></div><hr>'
    $(formId).html(html)

    values.forEach(function(v, i) {
      $(formId+" #" + v[0]).val(v[1])
    })
    html_editors.forEach(function (e, i) {
      $('#html_editor_' + e[0]).contentEditor({ value: e[1].html || '' })
      $("#" + e[0]).val(JSON.stringify(e[1]))
    })
    editors.forEach(function(e, i) {
      _this.startEditor(e[0], e[1], e[2])
    })
    wysiwygs.forEach(function(e, i) {
      const editor = pell.init({
        element: document.getElementById("wysiwyg_"+e),
        onChange: function(html) { $("#"+e).val(html) }
      })
      editor.content.innerHTML = $("#"+e).val()
    })
    $("button").attr("type", "button") // TODO : remove once Pell accept PR
    positions.forEach(function(p, i) {
      var mymap = L.map('map_' + p[0], { dragging: true, tap: false}).setView(p[1], 6)
      L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',

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
    })
    var _this = this
    uploads.forEach(function(u) {
      _this.prepare_upload(u[0], u[1], u[2], u[3], u[4], u[5], u[6])
    })

    riot.mount("images"); riot.mount("files")
    riot.update()
    if(callback !== undefined) {
      callback()
    }
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
        if(!_.isEmpty(opts)) {
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
        401: function() { document.location.href = "login.html" },
        500: errorCallback(),
        503: function() {
          localStorage.removeItem('X-Session-Id')
          localStorage.removeItem('foxx-locale')
          document.location.href = "login.html"
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
      url: url + '/uploads/' + key + '/' + collection + '/' + field, // upload url,
      multiple: true,

      allow: filter,

      error: function () {
        console.log('error', arguments);
      },

      beforeSend: function(env) {
        env.headers = {
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

require.register("js/editor.js", function(exports, require, module) {
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
    }, options);

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
          break
        case 'h2':
          before = '<div class="sg-row cms_row" data-type="h2"><div class="col-12 cms_col">'
          html = '<h2 data-type="h2" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h2>'
          after = '</div></div>'
          break
        case 'h3':
          before = '<div class="sg-row cms_row" data-type="h3"><div class="col-12 cms_col">'
          html = '<h3 data-type="h3" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h3>'
          after = '</div></div>'
          break
        case 'h4':
          before = '<div class="sg-row cms_row" data-type="h4"><div class="col-12 cms_col">'
          html = '<h4 data-type="h4" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h4>'
          after = '</div></div>'
          break
        case 'h5':
          before = '<div class="sg-row cms_row" data-type="h5"><div class="col-12 cms_col">'
          html = '<h5 data-type="h5" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h5>'
          after = '</div></div>'
          break
        case 'h6':
          before = '<div class="sg-row cms_row" data-type="h6"><div class="col-12 cms_col">'
          html = '<h6 data-type="h6" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h6>'
          after = '</div></div>'
          break
        case 'img':
          before = '<div class="sg-row cms_row" data-type="img"><div class="col-12 cms_col">'
          html = '<div data-type="img" class="drag drop" data-editable="true"><img src="https://via.placeholder.com/1200x600" alt=""></div>'
          after = '</div></div>'
          break
        case 'text':
          before = '<div class="sg-row cms_row" data-type="text"><div class="col-12 cms_col">'
          html = '<div data-type="text" class="drag drop" data-editable="true"><p style="text-align: justify;">' + ipsum(5) + '</p></div>'
          after = '</div></div>'
          break
        case 'code':
          var codes = []
          codes.push('<code class="html">' + htmlEntities('<h1>Some html code</h1>') + '</code>')
          codes.push('<code class="javascript">console.log("JS ... really ? ")</code>')
          codes.push('<code class="ruby">puts "I Love Ruby"</code>')
          before = '<div class="sg-row cms_row" data-type="code"><div class="col-12 cms_col">'
          html = '<div data-type="code" class="drag drop" data-editable="true"><pre>' + codes[loopid] + '</pre></div>'
          after = '</div></div>'
          break
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
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col2"><div class="col-6 cms_col"></div><div class="col-6 cms_col"></div></div>'
          after = ''
          break
        case 'col3':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col3"><div class="col-4 cms_col"></div><div class="col-4 cms_col"></div><div class="col-4 cms_col"></div></div>'
          after = ''
          break
        case 'col4':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col4"><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div></div>'
          after = ''
          break
        case 'col282':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col282"><div class="col-2 cms_col"></div><div class="col-8 cms_col"></div><div class="col-2 cms_col"></div><div class="col-3 cms_col"></div></div>'
          after = ''
          break
        case 'col363':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col363"><div class="col-3 cms_col"></div><div class="col-6 cms_col"></div><div class="col-3 cms_col"></div></div></div>'
          after = ''
          break
        case 'col48':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col48"><div class="col-4 cms_col"></div><div class="col-8 cms_col"></div></div></div>'
          after = ''
          break
        case 'col84':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag drop" data-type="col84"><div class="col-8 cms_col"></div><div class="col-4 cms_col"></div></div></div>'
          after = ''
          break
      }
      loopid++

      return full ? $(before + html + after) : $(html)
    }

    var highlight = function () {
      $('pre code').each(function (i, block) {
        hljs.highlightBlock(block)
      })
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
                    url: 'https://resize.ovh/upload_base64',
                    data: {
                      key: localStorage.getItem('resize_api_key'),
                      image: base64data,
                      filename: file.name
                    },
                    success: function (data) {
                      setTimeout(function () {
                        $(el).html('<div data-type="img" class="drag drop" data-editable="true"><img src="https://resize.ovh/o/' + data.filename + '"></div>')
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
            $('.dragging').removeClass('dragging')
            save_content()
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
      save_content <function>
      Save content to localStorage
    */
    var save_content = function () {
      var history = JSON.parse(LGet('editor-history') || '[]')
      history.push($(self).find('.edit-mode .page-content').html())
      history.splice(0, history.length - 10);
      LSet('editor-history', JSON.stringify(history))
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
        highlight()
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

      save_content()
    }

    /*
      run_export <function(base)>
      Export base element as json structure
      (saved to localstorage for now)
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
            widget = $(widget.outerHTML) // force refresh
            if($(widget).data('exported') == undefined) {
              $(widget).data('exported', true)

              var data_widget = {}
              data_widget['type'] = $(widget).data('type')
              data_widget['attr'] = $(widget).data('attr')
              if ($(widget).data('type').indexOf('col') >= 0) {
                data_widget['content'] = run_export($(widget).parent())
              } else {
                data_widget['content'] = $(widget).html()
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
      highlight();
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
        $(self).find('.edit-mode .row_editor').css('margin-left', (-99999) + 'px')
        save_content()
        return false
      })

      // When you click on a widget
      // It should open the editor modal with the right content / tools
      $(self).find('.edit-mode .page-content').on('click', '[data-type]', function () {
        editObj = $(this)
        raw_object = $(this.outerHTML)
        if (raw_object.data("attr")) {
          $(self).find("input[data-name=row-class]").val(raw_object.data("attr")['row-class'])
          $(self).find("input[data-name=container-class]").val(raw_object.data("attr")['container-class'])
        } else {
          $(self).find("input[data-name=row-class]").val('')
          $(self).find("input[data-name=container-class]").val('')
        }
        $(self).find(".editor-code").hide()
        $(self).find(".editor-simplecode").hide()
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
            var mode = 'html'
            if (raw_object.find('code').hasClass('ruby')) mode = 'ruby';
            if (raw_object.find('code').hasClass('css')) mode = 'css';
            if (raw_object.find('code').hasClass('javascript')) mode = 'javascript';
            if (raw_object.find('code').hasClass('json')) mode = 'json';
            $(self).find("input[data-name=lang]").val(mode)

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
            $(self).find(".editor-simplecode").show()
            $('#ace-editor-'+object_name).show()
            var mode = 'html'
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            ace_editor.getSession().setValue(editObj.html());
          }

        }

        return false
      })

      // Close the editor modal
      $(self).find('.edit-mode .sg-editcontent').on('click', '.fa-times-circle', function () {
        save_editor()
        save_content()
        $('.edit-mode .cms_editor').removeClass('editmode')
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

        $(".fullscreen").scrollTop($(".fullscreen").prop('scrollHeight'));
        save_content()

        set_empty_rows()
        highlight()

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
            <div class="editor-code"><label>Row Class</label><input type="text" data-name="lang" class="uk-input"></div>\
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
          'row-class': $('input[data-name=row-class]').val(),
          'container-class': $('input[data-name=container-class]').val()
        }
        var content = ace_editor.getSession().getValue()
        if (editObj.data('type') == 'code') {
          var mode = $(self).find("input[data-name=lang]").val()
          editObj.html('<pre><code class="' + mode + '">' + htmlEntities(content) + '</code></pre>')
        }
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img'].indexOf(editObj.data('type')) >= 0) {
          editObj.html(content)
        }
        if (['embed'].indexOf(editObj.data('type')) >= 0) {
          editObj.html(content)
          editObj.attr('data-html', content)
        }
        if (['text'].indexOf(editObj.data('type')) >= 0) {
          editObj.html($('#trumbowyg-'+object_name).trumbowyg('html'))
        }
        editObj.attr('data-attr', JSON.stringify(attributes))
        highlight()
      }
    }

    //$("body").on("keyup", "input[data-name=lang], input[data-name=row-class], input[data-name=container-class]", function () { save_editor() })

    ace_editor.getSession().on('change', function () {
      //save_editor()
    })

    return this;
  };

})(jQuery);
});

require.register("js/js.js", function(exports, require, module) {
document.removeEventListener("keydown", function() {})
document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    $('input[type=submit]').click();
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

  route('/layouts', function() { riot.mount('div#app', 'layouts') })
  route('/pages', function () { riot.mount('div#app', 'pages') })
  route('/pages/*', function (folder_key) {
    riot.mount('div#app', 'pages', { folder_key: folder_key })
  })
  route('/partials', function() { riot.mount('div#app', 'partials') })
  route('/components', function() { riot.mount('div#app', 'components') })
  route('/spas', function() { riot.mount('div#app', 'spas') })
  route('/redirections', function() { riot.mount('div#app', 'redirections') })
  route('/trads', function() { riot.mount('div#app', 'trads') })
  route('/settings', function() { riot.mount('div#app', 'settings') })
  route('/datatypes', function() { riot.mount('div#app', 'datatypes') })
  route('/users', function() { riot.mount('div#app', 'users') })
  route('/aqls', function() { riot.mount('div#app', 'aqls') })
  route('/helpers', function() { riot.mount('div#app', 'helpers') })
  route('/apis', function() { riot.mount('div#app', 'apis') })
  /*@{{router}}*/


  route('/datasets/*', function(type) { riot.mount('div#app', 'datasets', { datatype: type }) })
  route('/datasets/*/*', function (type, folder_key) {
    riot.mount('div#app', 'datasets', { datatype: type, folder_key: folder_key })
  })
  route('/datasets/*/new', function (type) {
    riot.mount('div#app', 'dataset_new', { datatype: type })
  })
  route('/datasets/*/new/*', function (type, folder_key) {
    riot.mount('div#app', 'dataset_new', { datatype: type, folder_key: folder_key })
  })
  route('/datasets/*/*/edit', function(type, id) {
    riot.mount('div#app', 'dataset_edit', { datatype: type, dataset_id: id })
  })

  route(function(collection, id, action) {
    if(action != undefined) {
      if(collection == "layouts") {
        if(action == "edit") { riot.mount('div#app', 'layout_edit', { layout_id: id }) }
      }
      if(collection == "pages") {
        if(action == "edit") { riot.mount('div#app', 'page_edit', { page_id: id }) }
        if(action == "new") { riot.mount('div#app', 'page_new', { folder_key: id }) }
      }
      if(collection == "partials") {
        if(action == "edit") { riot.mount('div#app', 'partial_edit', { partial_id: id }) }
      }
      if(collection == "components") {
        if(action == "edit") { riot.mount('div#app', 'component_edit', { component_id: id }) }
      }
      if(collection == "spas") {
        if(action == "edit") { riot.mount('div#app', 'spa_edit', { spa_id: id }) }
      }
      if(collection == "redirections") {
        if(action == "edit") { riot.mount('div#app', 'redirection_edit', { redirection_id: id }) }
      }
      if(collection == "trads") {
        if(action == "edit") { riot.mount('div#app', 'trad_edit', { trad_id: id }) }
      }
      if(collection == "datatypes") {
        if(action == "edit") { riot.mount('div#app', 'datatype_edit', { datatype_id: id }) }
      }
      if(collection == "users") {
        if(action == "edit") { riot.mount('div#app', 'user_edit', { user_id: id }) }
      }
      if(collection == "aqls") {
        if(action == "edit") { riot.mount('div#app', 'aql_edit', { aql_id: id }) }
      }
      if(collection == "helpers") {
        if(action == "edit") { riot.mount('div#app', 'helper_edit', { helper_id: id }) }
      }
      if(collection == "apis") {
        if(action == "edit") { riot.mount('div#app', 'api_edit', { api_id: id }) }
      }
      /*@{{router_cia}}*/
    }
  })

  route(function(collection, action) {
    if(collection == "layouts" && action == "new") riot.mount('div#app', 'layout_new')
    if(collection == "pages" && action == "new") riot.mount('div#app', 'page_new')
    if(collection == "partials" && action == "new") riot.mount('div#app', 'partial_new')
    if(collection == "components" && action == "new") riot.mount('div#app', 'component_new')
    if(collection == "spas" && action == "new") riot.mount('div#app', 'spa_new')
    if(collection == "redirections" && action == "new") riot.mount('div#app', 'redirection_new')
    if(collection == "trads" && action == "new") riot.mount('div#app', 'trad_new')
    if(collection == "datatypes" && action == "new") riot.mount('div#app', 'datatype_new')
    if(collection == "users" && action == "new") riot.mount('div#app', 'user_new')
    if(collection == "aqls" && action == "new") riot.mount('div#app', 'aql_new')
    if(collection == "helpers" && action == "new") riot.mount('div#app', 'helper_new')
    if(collection == "apis" && action == "new") riot.mount('div#app', 'api_new')
    /*@{{router_ca}}*/
  })


  route.start(true)
  //riot.mount("*")
})

});

;require.register("widgets/apis.html.tag", function(exports, require, module) {
riot.tag2('api_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "api_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/" + opts.parent_name + "/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "api_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('api_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_api"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "api_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_api', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.api = d.data

      common.buildForm(self.api, opts.fields, '#'+opts.id+'_crud_api')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('api_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_api"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "api_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_api')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_api', "cruds/sub/apis/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('api_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">apis</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing api</h3> <form onsubmit="{save_form}" class="uk-form" id="form_api"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_api", "cruds/apis",opts.api_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/apis/" + self.api._key + "/duplicate", function(data) {
          route('/apis/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/apis/" + opts.api_id, function(d) {
      self.api = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.api, fields, '#form_api', 'apis', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "api_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.api_id,
              parent_name: "apis" })
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

riot.tag2('api_new', '<virtual if="{can_access}"> <h3>Creating api</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_api"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_api", "cruds/apis")
    }.bind(this)

    common.get(url + "/cruds/apis/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_api', 'apis');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('apis', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#apis/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New api</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing apis</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="110"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="160"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{install}" class="uk-button uk-button-success uk-button-small"><i class="fas fa-upload"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'apis .handle,[data-is="apis"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false
    this.settings   = {}

    common.get(url + "/settings", function(settings) {
      self.settings = settings.data
    })

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/apis/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/apis/search/"+self.refs.term.value, function(d) {
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
      route("/apis/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/apis/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/apis/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
        if(data.success) {
          e.target.innerText = data.data
        }
      })
      return false
    }.bind(this)

    this.install = function(e) {
      e.preventDefault()
      var url = "/service/" + e.item.row.name
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

    this.setPerPage = function(e) {
      e.preventDefault()
      var perpage = parseInt(e.srcElement.innerText)
      if(e.srcElement.innerText == 'ALL') perpage = 1000000000;
      this.perpage = perpage
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/apis/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "apis.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/apis/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/aqls.html.tag", function(exports, require, module) {
riot.tag2('aql_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "aql_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "aql_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('aql_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_aql"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "aql_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_aql', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.aql = d.data

      common.buildForm(self.aql, opts.fields, '#'+opts.id+'_crud_aql')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('aql_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_aql"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "aql_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_aql')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_aql', "cruds/sub/aqls/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('aql_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">aqls</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing aql</h3> <form onsubmit="{save_form}" class="uk-form" id="form_aql"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_aql", "cruds/aqls",opts.aql_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/aqls/" + self.aql._key + "/duplicate", function(data) {
          route('/aqls/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/aqls/" + opts.aql_id, function(d) {
      self.aql = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.aql, fields, '#form_aql', 'aqls', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "aql_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.aql_id,
              parent_name: "aqls" })
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

riot.tag2('aql_new', '<virtual if="{can_access}"> <h3>Creating aql</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_aql"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_aql", "cruds/aqls")
    }.bind(this)

    common.get(url + "/cruds/aqls/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_aql', 'aqls');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('aqls', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#aqls/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New aql</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing aqls</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'aqls .handle,[data-is="aqls"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/aqls/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/aqls/search/"+self.refs.term.value, function(d) {
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
      route("/aqls/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/aqls/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/aqls/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/aqls/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "aqls.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/aqls/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/components.html.tag", function(exports, require, module) {
riot.tag2('component_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "component_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "component_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('component_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_component"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "component_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_component', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.component = d.data

      common.buildForm(self.component, opts.fields, '#'+opts.id+'_crud_component')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('component_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_component"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "component_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_component')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_component', "cruds/sub/components/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('component_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">components</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing component</h3> <form onsubmit="{save_form}" class="uk-form" id="form_component"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_component", "cruds/components",opts.component_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/components/" + self.component._key + "/duplicate", function(data) {
          route('/components/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/components/" + opts.component_id, function(d) {
      self.component = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.component, fields, '#form_component', 'components', function() {
            $(".crud").each(function(i, c) {
              var id = $(c).attr("id")
              riot.mount("#" + id, "component_crud_index", { model: id,
                fields: self.sub_models[id].fields,
                key: self.sub_models[id].key,
                singular: self.sub_models[id].singular,
                columns: self.sub_models[id].columns,
                parent_id: opts.component_id,
                parent_name: "components" })
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

riot.tag2('component_new', '<virtual if="{can_access}"> <h3>Creating component</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_component"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_component", "cruds/components")
    }.bind(this)

    common.get(url + "/cruds/components/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_component', 'components');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('components', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#components/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New component</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing components</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'components .handle,[data-is="components"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/components/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/components/search/"+self.refs.term.value, function(d) {
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
      route("/components/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/components/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/components/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/components/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "components.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/components/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/datasets.html.tag", function(exports, require, module) {
riot.tag2('dataset_folders', '<div> <ul class="uk-breadcrumb"> <li each="{f in path}"><a href="#datasets/{opts.slug}/{f._key}">{f.name}</a></li> <li> <a if="{path.length > 1}" onclick="{renameFolder}"><i class="far fa-edit"></i></a> <a onclick="{addFolder}"><i class="fas fa-plus"></i></a> <a if="{path.length > 1 && folders.length == 0}" onclick="{deleteFolder}"><i class="fas fa-trash"></i></a> </li> </ul> <ul class="uk-list"> <li each="{f in folders}"><a href="#datasets/{opts.slug}/{f._key}"><i class="far fa-folder"></i> {f.name}</a></li> </ul> </div>', '', '', function(opts) {
    this.folders = []
    this.folder = {}
    this.path = [ this.folder ]
    this.folder_key = this.opts.folder_key || ''
    var self = this

    var loadFolder = function(folder_key) {
      common.get(url + "/cruds/folders/datasets_" + opts.slug + "/" + folder_key, function(d) {
        self.folders = d.folders
        self.path = d.path
        self.folder = _.last(self.path)
        self.parent.setFolder(self.folder)
        self.update()
      })
    }

    this.addFolder = function(e) {
      var name = prompt("Folder's name");
      common.post(url + "/cruds/folders/datasets_" + opts.slug, JSON.stringify({ name: name, parent_id: self.folder._key }), function(d) {
        loadFolder(self.folder._key)
      })
    }.bind(this)

    this.renameFolder = function(e) {
      var name = prompt("Update Folder's name");
      common.patch(url + "/cruds/folders/datasets_" + opts.slug, JSON.stringify({ name: name, id: self.folder._key }), function(d) {
        self.path = d.path
        self.update()
      })
    }.bind(this)

    this.deleteFolder = function(e) {
      UIkit.modal.confirm('Are you sure? This action will destroy the folder and it\'s content').then(function() {
        var parent = _.last(_.initial(self.path))
        common.delete(url + "/cruds/folders/datasets_" + opts.slug + "/" + self.folder._key, function(d) {
          common.get(url + "/cruds/folders/datasets_" + opts.slug + "/" + parent._key, function(d) {
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
        common.delete(url + "/datasets/datasets/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('sublist');
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

riot.tag2('dataset_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">datasets</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing {opts.datatype}</h3> <form onsubmit="{save_form}" class="uk-form" id="form_dataset"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false
    self.sub_models = []
    console.log("edit")
    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_dataset", "datasets/" + opts.datatype ,opts.dataset_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/datasets/"+ opts.datatype +"/" + self.dataset._key + "/duplicate", function(data) {
          route('/datasets/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/datasets/" + opts.datatype + "/" + opts.dataset_id, function(d) {
      self.dataset = d.data
      console.log(d.data)
      self.fields = d.fields
      self.sub_models = d.model.sub_models
      var act_as_tree = d.model.act_as_tree

      if(!_.isArray(self.fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
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

riot.tag2('dataset_new', '<virtual if="{can_access}"> <h3>Creating {opts.datatype}</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_dataset"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_dataset", "datasets/" + opts.datatype)
    }.bind(this)

    common.get(url + "/datasets/"+ opts.datatype + "/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
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

riot.tag2('datasets', '<dataset_folders show="{loaded}" if="{act_as_tree}" folder_key="{folder_key}" slug="{opts.datatype}"></dataset_folders> <virtual if="{can_access}"> <div class="uk-float-right"> <a if="{act_as_tree}" href="#datasets/{opts.datatype}/new/{folder_key}" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i></a> <a if="{!act_as_tree}" href="#datasets/{opts.datatype}/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i></a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing {opts.datatype}</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}" class="{col.class}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}" no-reorder> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{calc_value(row, col, locale)} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination noselect"> <li if="{page + 1 > 1}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false
    this.folder_key = this.opts.folder_key || ''
    this.folder     = {}
    this.act_as_tree = true

    this.loadPage = function(pageIndex) {
      self.loaded = false
      var querystring = "?folder=" + self.folder._key + "&is_root=" + self.folder.is_root

      common.get(url + "/datasets/" + opts.datatype + "/page/" + pageIndex + "/" + this.perpage + querystring, function(d) {
        self.data = d.data[0].data
        var model = d.model
        self.act_as_tree = model.act_as_tree

        self.export = !!model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(model.columns) self.cols = model.columns
        self.count = d.data[0].count
        self.sortable = !!model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = model.roles === undefined || _.includes(model.roles.read, me.role)
          self.update()
        })
      })
    }

    this.setFolder = function(folder) {
      self.folder = folder
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

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'datasets/'+ opts.datatype +'/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/datatypes.html.tag", function(exports, require, module) {

riot.tag2('datatype_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">datatypes</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing datatype</h3> <form onsubmit="{save_form}" class="uk-form" id="form_datatype"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> <dataset_helper></dataset_helper> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_datatype", "cruds/datatypes",opts.datatype_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/datatypes/" + self.datatype._key + "/duplicate", function(data) {
          route('/datatypes/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/datatypes/" + opts.datatype_id, function(d) {
      self.datatype = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models

      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.datatype, fields, '#form_datatype', 'datatypes', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "datatype_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.datatype_id,
              parent_name: "datatypes" })
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

riot.tag2('datatype_new', '<virtual if="{can_access}"> <h3>Creating datatype</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_datatype"> </form> <dataset_helper></dataset_helper> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_datatype", "cruds/datatypes")
    }.bind(this)

    common.get(url + "/cruds/datatypes/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_datatype', 'datatypes');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('datatypes', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#datatypes/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New datatype</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing datatypes</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'datatypes .handle,[data-is="datatypes"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/datatypes/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/datatypes/search/"+self.refs.term.value, function(d) {
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
      route("/datatypes/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/datatypes/" + e.item.row._key, function() {
          self.loadPage(self.page + 1)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/datatypes/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/datatypes/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "datatypes.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/datatypes/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});



riot.tag2('dataset_helper', '<hr> <h4>Data definition sample</h4> <pre><code class="json">\\{\n    "model": [\n      \\{ "r": true, "c": "1-1", "n": "title", "t": "string", "j": "joi.string().required()", "l": "Title", "tr": true \\},\n      \\{ "r": true, "c": "1-1", "n": "color", "t": "string:color", "j": "joi.string().required()", "l": "Pick a color"\\},\n      \\{ "r": true, "c": "1-1", "n": "position", "t": "integer", "j": "joi.number().integer()", "l": "Position" \\},\n      \\{ "r": true, "c": "1-1", "n": "online", "t": "boolean", "j": "joi.number().integer()", "l": "Online?" \\},\n      \\{ "r": true, "c": "1-1", "n": "published_at", "t": "date", "j": "joi.date().format(\'YYYY-MM-DD\').raw().required()", "l": "Published_at" \\},\n      \\{ "r": true, "c": "1-1", "n": "time", "t": "time", "j": "joi.string()", "l": "Time" \\},\n      \\{ "r": true, "c": "1-1", "n": "desc", "t": "text", "j": "joi.string()", "l": "Description" \\},\n      \\{\n        "r": true, "c": "1-1", "n": "author_key", "t": "list", "j": "joi.string()", "l": "User",\n        "d": "d": "FOR doc IN datasets FILTER doc.type == \'authors\' RETURN [doc._key, CONCAT(doc.ln, \' \', doc.fn)]"\n      \\},\n      \\{ "r": true, "c": "1-1", "n": "image", "t": "image", "j": "joi.string()", "l": "Pictures" \\},\n      \\{ "r": true, "c": "1-1", "n": "file", "t": "file", "j": "joi.string()", "l": "Files" \\},\n      \\{\n        "r": true, "c": "1-1", "n": "tags", "t": "tags", "j": "joi.array()", "l": "Tags",\n        "d": "LET tags = (FOR doc IN datasets FILTER doc.type==\'books\' AND doc.tags != NULL RETURN doc.tags) RETURN UNIQUE(FLATTEN(tags))"\n      \\},\n      \\{ "r": true, "c": "1-1", "n": "items", "t": "multilist", "j": "joi.array()", "l": "Multi List of tags", "d": "AQL request" \\},\n      \\{ "r": true, "c": "1-1", "n": "position", "t": "map", "j": "joi.array()", "l": "Coordinates" \\},\n      \\{ "r": true, "c": "1-1", "n": "html", "t": "code:html", "j": "joi.any()", "l": "Some HTML" \\},\n      \\{ "r": true, "c": "1-1", "n": "scss", "t": "code:scss", "j": "joi.any()", "l": "Some SCSS" \\},\n      \\{ "r": true, "c": "1-1", "n": "javascript", "t": "code:javascript", "j": "joi.any()", "l": "Some JS" \\},\n      \\{ "r": true, "c": "1-1", "n": "json", "t": "code:json", "j": "joi.any()", "l": "Some Json" \\},\n      \\{ "r": true, "c": "1-1", "n": "content", "t": "html", "j": "joi.any()", "l": "Content Editor" \\}\n    ],\n    "columns": [\n      \\{ "name": "title", "tr": true, "class": "uk-text-right", "toggle": true,\n        "values": \\{ "true": "online", "false": "offline" \\},\n        "truncate": 20, "uppercase": true, "lowercase": true\n      \\}\n    ],\n    "slug": ["title"],\n    "sort": "SORT doc.order ASC",\n    "search": ["title", "barcode", "desc"],\n    "includes": \\{\n      "conditions": "FOR c IN customers FILTER c._key == doc.customer_key",\n      "merges": ", customer: c "\n    \\},\n    "timestamps": true\n  \\}\n  </code></pre>', 'dataset_helper pre { padding: 0; border: none; border-radius: 4px; }', '', function(opts) {
    this.on('updated', function() {
      document.querySelectorAll('pre code').forEach(function(block) {
        hljs.highlightBlock(block);
      });
    })
});
});

require.register("widgets/helpers.html.tag", function(exports, require, module) {
riot.tag2('helper_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "helper_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "helper_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('helper_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_helper"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "helper_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_helper', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.helper = d.data

      common.buildForm(self.helper, opts.fields, '#'+opts.id+'_crud_helper')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('helper_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_helper"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "helper_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_helper')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_helper', "cruds/sub/helpers/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('helper_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">helpers</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing helper</h3> <form onsubmit="{save_form}" class="uk-form" id="form_helper"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_helper", "cruds/helpers",opts.helper_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/helpers/" + self.helper._key + "/duplicate", function(data) {
          route('/helpers/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/helpers/" + opts.helper_id, function(d) {
      self.helper = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.helper, fields, '#form_helper', 'helpers', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "helper_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.helper_id,
              parent_name: "helpers" })
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

riot.tag2('helper_new', '<virtual if="{can_access}"> <h3>Creating helper</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_helper"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_helper", "cruds/helpers")
    }.bind(this)

    common.get(url + "/cruds/helpers/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_helper', 'helpers');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('helpers', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#helpers/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New helper</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing helpers</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'helpers .handle,[data-is="helpers"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/helpers/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/helpers/search/"+self.refs.term.value, function(d) {
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
      route("/helpers/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/helpers/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/helpers/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/helpers/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "helpers.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/helpers/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/layouts.html.tag", function(exports, require, module) {
riot.tag2('layout_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "layout_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "layout_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('layout_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_layout"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "layout_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_layout', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.layout = d.data

      common.buildForm(self.layout, opts.fields, '#'+opts.id+'_crud_layout')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('layout_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_layout"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "layout_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_layout')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_layout', "cruds/sub/layouts/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('layout_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">layouts</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing layout</h3> <form onsubmit="{save_form}" class="uk-form" id="form_layout"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_layout", "cruds/layouts",opts.layout_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/layouts/" + self.layout._key + "/duplicate", function(data) {
          route('/layouts/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/layouts/" + opts.layout_id, function(d) {
      self.layout = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.layout, fields, '#form_layout', 'layouts', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "layout_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.layout_id,
              parent_name: "layouts" })
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

riot.tag2('layout_new', '<virtual if="{can_access}"> <h3>Creating layout</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_layout"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_layout", "cruds/layouts")
    }.bind(this)

    common.get(url + "/cruds/layouts/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_layout', 'layouts');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('layouts', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#layouts/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New layout</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing layouts</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'layouts .handle,[data-is="layouts"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/layouts/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/layouts/search/"+self.refs.term.value, function(d) {
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
      route("/layouts/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/layouts/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/layouts/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/layouts/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "layouts.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/layouts/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
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

riot.tag2('welcome', '<h1>Welcome aboard</h1> <p>This is a landing page ... Nothing special here, replace it by what you want !</p> <p>Find me in <code>app/widgets/loading.html.tag</code></p>', '', '', function(opts) {
});

riot.tag2('rightnav', '<ul class="uk-navbar-nav"> <li each="{lang in langs}" class="{lang == window.localStorage.getItem(\'foxx-locale\') ? \'uk-active\' : \'\'}"><a onclick="{changeLang}">{lang}</a></li> <li><a href="#logout"><i class="uk-icon-sign-out"></i> Logout</a></li> </ul>', '', '', function(opts) {
    this.langs = ['en', 'fr']
    this.changeLang = function(e) {
      window.localStorage.setItem('foxx-locale', e.item.lang)
      document.location.reload()
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

require.register("widgets/pages.html.tag", function(exports, require, module) {
riot.tag2('page_folders', '<div> <ul class="uk-breadcrumb"> <li each="{f in path}"><a href="#pages/{f._key}">{f.name}</a></li> <li> <a if="{path.length > 1}" onclick="{renameFolder}"><i class="far fa-edit"></i></a> <a onclick="{addFolder}"><i class="fas fa-plus"></i></a> <a if="{path.length > 1 && folders.length == 0}" onclick="{deleteFolder}"><i class="fas fa-trash"></i></a> </li> </ul> <ul class="uk-list"> <li each="{f in folders}"><a href="#pages/{f._key}"><i class="far fa-folder"></i> {f.name}</a></li> </ul> </div>', '', '', function(opts) {
    this.folders = []
    this.folder = {}
    this.path = [ this.folder ]
    this.folder_key = this.opts.folder_key || '';
    var self = this

    var loadFolder = function(folder_key) {
      common.get(url + '/cruds/folders/pages/' + folder_key, function(d) {
        self.folders = d.folders
        self.path = d.path
        self.folder = _.last(self.path)
        self.parent.setFolder(self.folder)
        self.update()
      })
    }

    this.addFolder = function(e) {
      var name = prompt("Folder's name");
      common.post(url + "/cruds/folders/pages", JSON.stringify({ name: name, parent_id: self.folder._key }), function(d) {
        loadFolder(self.folder._key)
      })
    }.bind(this)

    this.renameFolder = function(e) {
      var name = prompt("Update Folder's name");
      common.patch(url + "/cruds/folders/pages", JSON.stringify({ name: name, id: self.folder._key }), function(d) {
        self.path = d.path
        self.update()
      })
    }.bind(this)

    this.deleteFolder = function(e) {
      UIkit.modal.confirm('Are you sure? This action will destroy the folder and it\'s content')
        .then(function() {
          var parent = _.last(_.initial(self.path));
          common.delete(url + "/cruds/folders/pages/" + self.folder._key, function(d) {
            common.get(url + "/cruds/folders/pages/" + parent._key, function(d) {
              self.folders = d.folders
              self.path = d.path
              loadFolder(parent._key)
              self.update()
            })
          })
      }, function () {
        console.log('Rejected.')
      });
    }.bind(this)

    loadFolder(this.folder_key)
});

riot.tag2('page_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "page_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "page_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('page_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_page"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "page_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_page', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.page = d.data

      common.buildForm(self.page, opts.fields, '#'+opts.id+'_crud_page')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('page_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_page"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "page_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_page')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_page', "cruds/sub/pages/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('page_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">pages</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing page</h3> <form onsubmit="{save_form}" class="uk-form" id="form_page"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_page", "cruds/pages",opts.page_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/pages/" + self.page._key + "/duplicate", function(data) {
          route('/pages/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/pages/" + opts.page_id, function(d) {
      self.page = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields
      var act_as_tree = d.fields.act_as_tree

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        localStorage.setItem('resize_api_key', me.resize_api_key)
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        var back_url = 'pages'
        if(act_as_tree) { back_url = 'pages/' + self.page.folder_key }
        if(self.can_access)
          common.buildForm(self.page, fields, '#form_page', back_url, function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "page_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.page_id,
              parent_name: back_url })
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

riot.tag2('page_new', '<virtual if="{can_access}"> <h3>Creating page</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_page"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_page", "cruds/pages")
    }.bind(this)

    common.get(url + "/cruds/pages/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          var obj = {}
          if(!_.isArray(fields)) fields = fields.model
          var back_url = 'pages'
          if(self.opts.folder_key) {
            fields.push({ r: true, c: "1-1", n: "folder_key", t: "hidden" })
            obj['folder_key'] = opts.folder_key
            back_url = 'pages/' + opts.folder_key
          }
          common.buildForm(obj, fields, '#form_new_page', back_url);
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('pages', '<page_folders show="{loaded}" folder_key="{folder_key}"></page_folders> <virtual if="{can_access}"> <div class="uk-float-right"> <a if="{act_as_tree}" href="#pages/{folder._key}/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New page</a> <a if="{!act_as_tree}" href="#pages/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New page</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing pages</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'pages .handle,[data-is="pages"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false
    this.folder     = {}
    this.folder_key = this.opts.folder_key || ''
    this.act_as_tree = true

    this.loadPage = function(pageIndex) {
      self.loaded = false
      var querystring = "?folder=" + self.folder._key + "&is_root=" + self.folder.is_root
      common.get(url + "/cruds/pages/page/"+pageIndex+"/"+this.perpage + querystring, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }

    this.setFolder = function(folder) {
      self.folder = folder
      self.act_as_tree = folder !== ''
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
        common.get(url + "/cruds/pages/search/"+self.refs.term.value, function(d) {
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
      route("/pages/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/pages/" + e.item.row._key, function() {
          self.loadPage(self.page + 1)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/pages/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/pages/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "pages.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/pages/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/partials.html.tag", function(exports, require, module) {
riot.tag2('partial_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "partial_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "partial_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('partial_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_partial"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "partial_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_partial', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.partial = d.data

      common.buildForm(self.partial, opts.fields, '#'+opts.id+'_crud_partial')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('partial_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_partial"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "partial_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_partial')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_partial', "cruds/sub/partials/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('partial_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">partials</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing partial</h3> <form onsubmit="{save_form}" class="uk-form" id="form_partial"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_partial", "cruds/partials",opts.partial_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/partials/" + self.partial._key + "/duplicate", function(data) {
          route('/partials/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/partials/" + opts.partial_id, function(d) {
      self.partial = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.partial, fields, '#form_partial', 'partials', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "partial_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.partial_id,
              parent_name: "partials" })
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

riot.tag2('partial_new', '<virtual if="{can_access}"> <h3>Creating partial</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_partial"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_partial", "cruds/partials")
    }.bind(this)

    common.get(url + "/cruds/partials/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_partial', 'partials');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('partials', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#partials/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New partial</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing partials</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'partials .handle,[data-is="partials"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/partials/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/partials/search/"+self.refs.term.value, function(d) {
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
      route("/partials/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/partials/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/partials/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/partials/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "partials.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/partials/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/redirections.html.tag", function(exports, require, module) {
riot.tag2('redirection_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "redirection_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "redirection_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('redirection_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_redirection"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "redirection_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_redirection', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.redirection = d.data

      common.buildForm(self.redirection, opts.fields, '#'+opts.id+'_crud_redirection')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('redirection_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_redirection"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "redirection_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_redirection')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_redirection', "cruds/sub/redirections/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('redirection_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">redirections</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing redirection</h3> <form onsubmit="{save_form}" class="uk-form" id="form_redirection"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_page", "cruds/pages",opts.page_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/pages/" + self.page._key + "/duplicate", function(data) {
          route('/pages/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/pages/" + opts.page_id, function(d) {
      self.page = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.page, fields, '#form_page', 'pages', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "page_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.page_id,
              parent_name: "pages" })
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

riot.tag2('redirection_new', '<virtual if="{can_access}"> <h3>Creating redirection</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_redirection"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_redirection", "cruds/redirections")
    }.bind(this)

    common.get(url + "/cruds/redirections/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_redirection', 'redirections');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('redirections', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#redirections/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New redirection</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing redirections</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'redirections .handle,[data-is="redirections"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/redirections/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/redirections/search/"+self.refs.term.value, function(d) {
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
      route("/redirections/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/redirections/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/redirections/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/redirections/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "redirections.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/redirections/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
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

require.register("widgets/spas.html.tag", function(exports, require, module) {
riot.tag2('spa_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "spa_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "spa_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('spa_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_spa"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "spa_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_spa', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.spa = d.data

      common.buildForm(self.spa, opts.fields, '#'+opts.id+'_crud_spa')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('spa_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_spa"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "spa_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_spa')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_spa', "cruds/sub/spas/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('spa_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">spas</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing spa</h3> <form onsubmit="{save_form}" class="uk-form" id="form_spa"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_spa", "cruds/spas",opts.spa_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/spas/" + self.spa._key + "/duplicate", function(data) {
          route('/spas/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/spas/" + opts.spa_id, function(d) {
      self.spa = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.spa, fields, '#form_spa', 'spas', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "spa_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.spa_id,
              parent_name: "spas" })
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

riot.tag2('spa_new', '<virtual if="{can_access}"> <h3>Creating spa</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_spa"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_spa", "cruds/spas")
    }.bind(this)

    common.get(url + "/cruds/spas/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_spa', 'spas');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('spas', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#spas/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New spa</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing spas</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'spas .handle,[data-is="spas"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/spas/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/spas/search/"+self.refs.term.value, function(d) {
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
      route("/spas/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/spas/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/spas/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/spas/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "spas.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/spas/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/trads.html.tag", function(exports, require, module) {
riot.tag2('trad_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "trad_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "trad_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('trad_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_trad"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "trad_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_trad', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.trad = d.data

      common.buildForm(self.trad, opts.fields, '#'+opts.id+'_crud_trad')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('trad_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_trad"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "trad_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_trad')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_trad', "cruds/sub/trads/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('trad_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">trads</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing trad</h3> <form onsubmit="{save_form}" class="uk-form" id="form_trad"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_trad", "cruds/trads",opts.trad_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/trads/" + self.trad._key + "/duplicate", function(data) {
          route('/trads/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/trads/" + opts.trad_id, function(d) {
      self.trad = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.trad, fields, '#form_trad', 'trads', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "trad_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.trad_id,
              parent_name: "trads" })
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

riot.tag2('trad_new', '<virtual if="{can_access}"> <h3>Creating trad</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_trad"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_trad", "cruds/trads")
    }.bind(this)

    common.get(url + "/cruds/trads/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_trad', 'trads');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('trads', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#trads/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New trad</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing trads</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'trads .handle,[data-is="trads"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/trads/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/trads/search/"+self.refs.term.value, function(d) {
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
      route("/trads/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/trads/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/trads/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/trads/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "trads.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/trads/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
});


});

require.register("widgets/uploads.html.tag", function(exports, require, module) {
riot.tag2('images', '<div class="sortable_{opts.field}" style="user-select: none;"> <virtual each="{row in data}"> <div uk-grid class="uk-grid-small" data-id="{row._key}"> <div class="uk-width-1-5"><img riot-src="{row.url}" alt="" style="max-width: 100%"></div> <div class="uk-width-3-5">{row.filename.split(\'/\')[row.filename.split(\'/\').length - 1]}<br>{prettyBytes(row.length)}</div> <div class="uk-width-1-5 uk-text-center"><a onclick="{delete_asset}" uk-icon="icon: trash"></a></div> </div> </virtual> </div>', 'images div, images span { color: white; }', '', function(opts) {
    var _this = this
    this.data = []

    var use_i18n = ""
    if(opts.i18n != "undefined") use_i18n = "/" + window.localStorage.getItem("foxx-locale")
    common.get(url + "uploads/" + opts.id + '/' + opts.field + use_i18n, function(d) {
      _this.data = d
      _this.update()
    })

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

riot.tag2('files', '<div class="sortable_{opts.field}" style="user-select: none;"> <virtual each="{row in data}"> <div uk-grid class="uk-grid-small" data-id="{row._key}"> <div class="uk-width-3-5">{row.filename} <a href="{row.url}" target="_blank"><i class="fas fa-external-link-alt"></i></a></div> <div class="uk-width-1-5 uk-text-right">{prettyBytes(row.length)}</div> <div class="uk-width-1-5 uk-text-center"><a onclick="{delete_asset}" uk-icon="icon: trash"></a></div> </div> </div>', 'files div, files span { color: white; }', '', function(opts) {
    var _this = this;
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

require.register("widgets/users.html.tag", function(exports, require, module) {
riot.tag2('user_crud_index', '<a href="#" class="uk-button uk-button-small uk-button-default" onclick="{new_item}"> <i class="fas fa-plus"></i> New {opts.singular} </a> <table class="uk-table uk-table-striped" if="{data.length > 0}"> <thead> <tr> <th each="{col in cols}"> {col.name == undefined ? col : col.label === undefined ? col.name : col.label} </th> <th width="70"></th> </tr> </thead> <tbody> <tr each="{row in data}"> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.tr == true}">{_.get(row,col.name)[locale]}</virtual> <virtual if="{col.tr != true}">{_.get(row,col.name)}</virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul>', '', '', function(opts) {
    var self = this
    this.data = []
    this.new_item = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "user_crud_new", opts)
    }.bind(this)

    this.loadPage = function(pageIndex) {
      common.get(url + "/cruds/sub/"+opts.parent_id+"/"+opts.id+"/"+opts.key+"/page/"+pageIndex+"/"+per_page, function(d) {
        self.data = d.data[0].data
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(opts.columns) self.cols = opts.columns
        self.count = d.data[0].count
        self.update()
      })
    }
    this.loadPage(1)

    this.edit = function(e) {
      e.preventDefault()
      opts.element_id = e.item.row._key
      riot.mount("#"+opts.id, "user_crud_edit", opts)
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
        common.delete(url + "/cruds/" + opts.id + "/" + e.item.row._key, function() {
          self.loadPage(1)
        })
      }, function() {})
    }.bind(this)
});

riot.tag2('user_crud_edit', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_user"> </form>', '', '', function(opts) {
    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "user_crud_index", opts)
    }.bind(this)

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_user', "cruds/sub/"+opts.parent_name+"/"+ opts.id+"/"+opts.element_id, "", opts)
    }.bind(this)

    var self = this;
    common.get(url + "/cruds/" + opts.id + "/" + opts.element_id, function(d) {
      self.user = d.data

      common.buildForm(self.user, opts.fields, '#'+opts.id+'_crud_user')
    })
    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('user_crud_new', '<a href="#" class="uk-button uk-button-link" onclick="{goback}">Back to {opts.id}</a> <form onsubmit="{save_form}" class="uk-form" id="{opts.id}_crud_user"> </form>', '', '', function(opts) {
    var self = this
    this.crud = {}
    this.crud[opts.key] = opts.parent_id

    this.goback = function(e) {
      e.preventDefault()
      riot.mount("#"+opts.id, "user_crud_index", opts)
    }.bind(this)

    this.on('mount', function() {
      common.buildForm(self.crud, opts.fields, '#'+opts.id+'_crud_user')
    })

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm(opts.id+'_crud_user', "cruds/sub/users/"+ opts.id, "", opts)
    }.bind(this)

});

riot.tag2('user_edit', '<virtual if="{can_access}"> <ul uk-tab> <li><a href="#">users</a></li> <li each="{i, k in sub_models}"><a href="#">{k}</a></li> </ul> <ul class="uk-switcher uk-margin"> <li> <h3>Editing user</h3> <form onsubmit="{save_form}" class="uk-form" id="form_user"> </form> <a class="uk-button uk-button-secondary" onclick="{duplicate}">Duplicate</a> </li> <li each="{i, k in sub_models}"> <div id="{k}" class="crud"></div> </li> </ul> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual> <script>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_user", "cruds/users",opts.user_id)
    }.bind(this)

    this.duplicate = function(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/users/" + self.user._key + "/duplicate", function(data) {
          route('/users/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }.bind(this)

    common.get(url + "/cruds/users/" + opts.user_id, function(d) {
      self.user = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.user, fields, '#form_user', 'users', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "user_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.user_id,
              parent_name: "users" })
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

riot.tag2('user_new', '<virtual if="{can_access}"> <h3>Creating user</h3> <form onsubmit="{save_form}" class="uk-form" id="form_new_user"> </form> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', '', '', function(opts) {
    var self = this
    self.can_access = false
    self.loaded = false

    this.save_form = function(e) {
      e.preventDefault()
      common.saveForm("form_new_user", "cruds/users")
    }.bind(this)

    common.get(url + "/cruds/users/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {

          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_user', 'users');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
});

riot.tag2('users', '<virtual if="{can_access}"> <div class="uk-float-right"> <a href="#users/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New user</a> <a if="{export}" onclick="{export_data}" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a> </div> <h3>Listing users</h3> <form onsubmit="{filter}" class="uk-margin-top"> <div class="uk-inline uk-width-1-1"> <span class="uk-form-icon" uk-icon="icon: search"></span> <input type="text" ref="term" id="term" class="uk-input" autocomplete="off"> </div> </form> <table class="uk-table uk-table-striped"> <thead> <tr> <th if="{sortable}" width="20"></th> <th each="{col in cols}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th> <th width="70"></th> </tr> </thead> <tbody id="list"> <tr each="{row in data}"> <td if="{sortable}"><i class="fas fa-grip-vertical handle"></i></td> <td each="{col in cols}" class="{col.class}"> <virtual if="{col.toggle == true}"> <virtual if="{col.tr == true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual> <virtual if="{col.tr != true}"><a onclick="{toggleField}" data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name)}</a></virtual> </virtual> <virtual if="{col.toggle != true}"> <virtual if="{col.type == ⁗image⁗}"> <img riot-src="{_.get(row,col.name)[locale]} " style="height:25px"> </virtual> <virtual if="{col.type != ⁗image⁗}"> {calc_value(row, col, locale)} </virtual> </virtual> </td> <td class="uk-text-center" width="110"> <a onclick="{edit}" class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a> <a onclick="{destroy_object}" class="uk-button uk-button-danger uk-button-small"><i class="fas fa-trash-alt"></i></a> </td> </tr> </tbody> </table> <ul class="uk-pagination"> <li if="{page > 0}"><a onclick="{previousPage}"><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li> <li if="{(page + 1) * perpage < count}" class="uk-margin-auto-left"><a onclick="{nextPage}">Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li> </ul> Per Page : {perpage > 100000 ? \'ALL\' : perpage} <a onclick="{setPerPage}" class="uk-label">25</a> <a onclick="{setPerPage}" class="uk-label">50</a> <a onclick="{setPerPage}" class="uk-label">100</a> <a onclick="{setPerPage}" class="uk-label">500</a> <a onclick="{setPerPage}" class="uk-label">1000</a> <a onclick="{setPerPage}" class="uk-label">ALL</a> </virtual> <virtual if="{!can_access && loaded}"> Sorry, you can\'t access this page... </virtual>', 'users .handle,[data-is="users"] .handle{ cursor: move; }', '', function(opts) {

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/users/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

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
        common.get(url + "/cruds/users/search/"+self.refs.term.value, function(d) {
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
      route("/users/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/users/" + e.item.row._key, function() {
          self.loadPage(self.page)
        })
      }, function() {})
    }.bind(this)

    this.toggleField = function(e) {
      e.preventDefault()
      common.patch(url + "/cruds/users/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      this.loadPage(1)
    }.bind(this)

    this.export_data = function(e) {
      common.get(url + '/cruds/users/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "users.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }.bind(this)

    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function ( evt) {
            common.put(
              url + 'cruds/users/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
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