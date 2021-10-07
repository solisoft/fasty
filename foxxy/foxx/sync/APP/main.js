/*jshint -W097, -W033, node: true, esversion: 6 */
'use strict'
const db = require('@arangodb').db
const joi = require('joi')
const _ = require('lodash')
const request = require('@arangodb/request');
const createRouter = require('@arangodb/foxx/router')
const router = createRouter()
const queues = require('@arangodb/foxx/queues');
const queue = queues.create('compiler');

module.context.use(router)
const _settings = db._collection('settings').firstExample()

var save_revision = function (uid, object, data, max) {
  db.revisions.save({
    data: data, object_id: object._id, c_at: (+new Date()), user_key: uid
  })
  db._query(`
  LET rev_ids = (
    FOR doc IN revisions FILTER doc.object_id == @id
    SORT doc.c_at LIMIT @max, 100 RETURN doc._key
  )
  FOR id IN rev_ids
  REMOVE { _key: id } IN revisions
  `, { id: object._id, max: max })
}

var restart_services = function (collection, id, _settings) {
  var h_settings = JSON.parse(_settings.home)
  console.log(_settings)
  var object = db._collection(collection).document(id)

  if (object.api_id) {
    object = db.apis.document(object.api_id)
    collection = "apis"
  }

  if (collection == "apis" && h_settings.base_url) {
    console.log(object.name)
    request({
      method: "POST",
      url: h_settings.base_url + "/service/" + object.name,
      form: {
        token: _settings.token
      }
    })
  } else console.log("Missing base_url in settings")

  if (collection == "scripts" && h_settings.base_url) {
    request({
      method: "POST",
      url: h_settings.base_url + "/script/" + object.name,
      form: {
        token: _settings.token
      }
    })
  } else console.log("Missing base_url in settings")

  if (collection == "components" && h_settings.base_url && object.kind == "riot4") {
    queue.push(
      {mount: '/sync', name: 'riot'},
      {
        token: _settings.secret, name: object.slug, id: id,
        url: h_settings.base_url
      }
    );
  }
}

var compile_tailwindcss = function () {
  const _settings = db.settings.firstExample({})
  var h_settings = JSON.parse(_settings.home)
  const url = h_settings.base_url
  if(url)
    _.each(db.layouts.all().toArray(), function (layout) {
      if(layout.scss.indexOf("@tailwind")>= 0)
        queue.push(
          {mount: '/sync', name: 'tailwindcss'},
          {
            token: _settings.secret,
            id: layout._key, field: "scss",
            url: h_settings.base_url
          }
        );
    })
}

// -----------------------------------------------------------------------------
// GET /sync
router.get('/:token', function (req, res) {
  var data = {}
  var root_component = db.folders.firstExample({ is_root: true, object_type: 'components' })
  var root_partial = db.folders.firstExample({ is_root: true, object_type: 'partials' })

  if (_settings.secret == req.pathParams.token) {
    data = db._query(`
    LET layouts = (
      FOR l IN layouts
      RETURN { id: l._id, name: l.name, html: l.html, scss: l.scss, js: l.javascript, i_js: l.i_js, i_css: l.i_css, locked_by: l.locked_by }
    )
    LET components = (
      FOR c IN components
        LET path = (FOR vertex IN ANY SHORTEST_PATH CONCAT('folders/', c.folder_key) TO @root_component GRAPH 'folderGraph' RETURN vertex.name)
        RETURN { id: c._id, name: c.name, html: c.html, locked_by: c.locked_by, path: REVERSE(path) }
    )
    LET spas = (
      FOR spa IN spas
      RETURN { id: spa._id, name: spa.name, html: spa.html, js: spa.js, locked_by: spa.locked_by }
    )
    LET pages = (
      FOR page IN pages
      RETURN { id: page._id, name: page.name, raw_html: page.raw_html, locked_by: page.locked_by }
    )
    LET partials = (
      FOR p IN partials
        LET path = (FOR vertex IN ANY SHORTEST_PATH CONCAT('folders/', p.folder_key) TO @root_partial GRAPH 'folderGraph' RETURN vertex.name)
        RETURN { id: p._id, name: p.slug, html: p.html, locked_by: p.locked_by, path: REVERSE(path) }
    )
    LET aqls = (FOR a IN aqls RETURN { id: a._id, name: a.slug, aql: a.aql, locked_by: a.locked_by })
    LET data_types = (
      FOR d IN datatypes
      RETURN { id: d._id, name: d.name, slug: d.slug, json: d.javascript, locked_by: d.locked_by }
    )
    LET apis = (
      FOR a IN apis
        LET api_routes = (
          FOR ar IN api_routes FILTER ar.api_id == a._key
          RETURN { id: ar._id, name: ar.name, js: ar.javascript, locked_by: ar.locked_by }
        )
        LET api_scripts = (
          FOR as IN api_scripts FILTER as.api_id == a._key
          RETURN { id: as._id, name: as.name, js: as.javascript, locked_by: as.locked_by }
        )
        LET api_libs = (
          FOR al IN api_libs FILTER al.api_id == a._key
          RETURN { id: al._id, name: al.name, js: al.javascript, locked_by: al.locked_by }
        )
        LET api_tests = (
          FOR at IN api_tests FILTER at.api_id == a._key
          RETURN { id: at._id, name: at.name, js: at.javascript, locked_by: at.locked_by }
        )
        RETURN {
          api: { id: a._id, name: a.name, manifest: a.manifest, code: a.code, locked_by: a.locked_by },
          api_routes, api_scripts, api_tests, api_libs
        }
    )
    LET scripts = (
      FOR s IN scripts
      RETURN { id: s._id, name: s.name, code: s.code, package: s.package, locked_by: s.locked_by }
    )
    LET data_sets = (
      FOR dt IN datatypes
        FILTER dt.synchronizable == true
        FOR ds IN datasets
          FILTER ds.type == dt.slug
          RETURN UNSET(ds, ['_rev', 'order'])
    )

    RETURN {
      pages, layouts, components, spas, partials, aqls, datatypes: data_types,
      apis, scripts, datasets: data_sets
    }
    `, { root_component, root_partial }).toArray()[0]
  }
  res.json(data)
})
  .description("Get Files")

// -----------------------------------------------------------------------------
// PATCH /:token
router.patch('/:token', function (req, res) {

  if (_settings.secret == req.pathParams.token) {

    var firstLine = req.body.data.split('\n')[0].trim()
    var isLocked = firstLine.split(' ')[0].indexOf("@lock") >= 0
    var id = firstLine.split(' ')[1]
    var collection = id.split('/')[0]
    var field = firstLine.split(' ')[2]
    var content = _.slice(req.body.data.split('\n'), 1).join('\n')
    var object = db._collection(collection).document(id)

    var data = {}
    var is_i18n = false
    var lang = "en"
    if (field.indexOf("#") > 0) {
      is_i18n = true
      lang = field.split("#")[1]
      field = field.split("#")[0]
      data[field] = object[field]
      data[field][lang] = content
    } else {
      data[field.trim()] = content
    }

    db.sync_history.save({
      date: (+new Date()), lang,
      collection, field, content, id, locked_by: object.locked_by, user: req.body.name
    })

    if (isLocked) {
      if (object.locked_by == null || object.locked_by == req.body.name) {
        data.locked_by = req.body.name
        db._collection(collection).update(object, data)
        save_revision(null, object, data, 10)
        res.json(`Saved! ${collection} ${id} ${field}`)
      } else {
        res.json(`Error! File is locked by ${object.locked_by}`)
      }
    } else {
      if (object.locked_by != null) {
        if (object.locked_by == req.body.name) {
          data.locked_by = null
          db._collection(collection).update(object, data)
          save_revision(null, object, data, 10)
          restart_services(collection, object._id, _settings)

          res.json(`Saved! ${collection} ${id} ${field}`)
        } else {
          res.json(`Error! File is locked by ${object.locked_by}`)
        }
      } else {
        db._collection(collection).update(object, data)
        save_revision(null, object, data, 10)
        restart_services(collection, object._id, _settings)

        res.json(`Saved! ${collection} ${id} ${field}`)
      }
      var h_settings = JSON.parse(_settings.home)
      if (h_settings.url_reset) request({ method: "GET", url: h_settings.url_reset })
      compile_tailwindcss()
    }
  } else {
    res.json({ error: true, reason: 'Bad Token' })
  }
}).body(joi.object({
  data: joi.string().required(),
  name: joi.string().required()
}), 'data')

// -----------------------------------------------------------------------------
// POST /:token
router.post('/:token', function (req, res) {
  console.log("Create a new object")
  console.log(req.body.type)
  if (_settings.secret == req.pathParams.token) {
    var obj = null
    if (req.body.type == "api") {
      obj = db.apis.save({
        name: req.body.name,
        manifest: JSON.stringify({}),
        package: JSON.stringify({}),
        code: "//"
      })

      db.api_scripts.save({
        api_id: obj._id,
        name: "setup",
        javascript: "//"
      })
    }

    if (req.body.type == "api_route") {
      api = db.apis.byExample({ name: req.body.name.split("#")[0] })[0]

      obj = db.apis.save({
        name: req.body.name.split("#")[1],
        api_id: api._key,
        parent_id: api._key,
        javascript: "//"
      })
    }

    if (req.body.type == "page") {
      obj = db.pages.save({
        name: req.body.name,
        slug: req.body.name,
        layout_id: db.layouts.all()[0]._id // TODO : Need to be settable
      })
    }

    if (req.body.type == "component") {
      obj = db.components.save({
        name: req.body.name,
        slug: req.body.name,
        html: "<!-- Nothing here -->"
      })
    }

    if (req.body.type == "spa") {
      obj = db.components.save({
        name: req.body.name,
        js: "//",
        html: "<!-- Nothing here -->"
      })
    }

    if (req.body.type == "partial") {
      obj = db.partials.save({
        name: req.body.name,
        slug: req.body.name,
        html: "<!-- Nothing here -->"
      })
    }

    if (req.body.type == "layout") {

    }

    if (req.body.type == "aql") {
      obj = db.partials.save({
        aql: "FOR doc IN datasets RETURN doc",
        slug: req.body.name,
        options: ""
      })
    }

    if (req.body.type == "helper") {

    }

    if (req.body.type == "script") {
      obj = db.scripts.save({
        name: req.body.name,
        package: "{}",
        code: "// Node JS app"
      })
    }
    res.json(obj)
  } else {
    res.json({ error: true, reason: 'Bad Token' })
  }
}).body(joi.object({
  type: joi.string().required(),
  name: joi.string().required(),
  aql: joi.any(),
  partial: joi.any()
}), 'data')