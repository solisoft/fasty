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
    console.log("Editor", name)
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

          var validation = l.j
          if (obj['_key'] && l.ju) validation = l.ju

          var hidden = ''
          if(l.t === 'hidden') hidden = 'uk-hidden'
          _html += '<div class="'+ l.c + ' ' + hidden +'">'
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