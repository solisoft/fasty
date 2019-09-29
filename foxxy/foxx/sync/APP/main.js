/*jshint -W097, -W033, node: true, esversion: 6 */
'use strict'
const db = require('@arangodb').db
const joi = require('joi')
const _ = require('lodash')
const createRouter = require('@arangodb/foxx/router')
const router = createRouter()
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
      RETURN { id: l._id, name: l.name, html: l.html, scss: l.scss, js: l.javascript, locked_by: l.locked_by }
    )
    LET components = (
      FOR c IN components
        LET path = (FOR vertex IN ANY SHORTEST_PATH CONCAT('folders/', c.folder_key) TO @root_component GRAPH 'folderGraph' RETURN vertex.name)
        RETURN { id: c._id, name: c.name, html: c.html, locked_by: c.locked_by, path: REVERSE(path) }
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
        LET api_tests = (
          FOR at IN api_tests FILTER at.api_id == a._key
          RETURN { id: at._id, name: at.name, js: at.javascript, locked_by: at.locked_by }
        )
        RETURN {
          api: { id: a._id, name: a.name, manifest: a.manifest, code: a.code, locked_by: a.locked_by },
          api_routes, api_scripts, api_tests
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

    RETURN { layouts, components, partials, aqls, datatypes: data_types, apis, scripts, datasets: data_sets }
    `, { root_component, root_partial }).toArray()[0]
  }
  res.json(data)
})
  .description("Get Files")


// -----------------------------------------------------------------------------
// PATCH /sync
router.patch('/:token', function (req, res) {

  if (_settings.secret == req.pathParams.token) {
    var firstLine = req.body.data.split('\n')[0]
    var isLocked = firstLine.split(' ')[0].indexOf("@lock") >= 0
    var id = firstLine.split(' ')[1]
    var collection = id.split('/')[0]
    var field = firstLine.split(' ')[2]
    var content = _.slice(req.body.data.split('\n'), 1).join('\n')
    var object = db._collection(collection).document(id)

    var data = {}
    data[field.trim()] = content

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
          res.json(`Saved! ${collection} ${id} ${field}`)
        } else {
          res.json(`Error! File is locked by ${object.locked_by}`)
        }
      } else {
        db._collection(collection).update(object, data)
        save_revision(null, object, data, 10)
        res.json(`Saved! ${collection} ${id} ${field}`)
      }
    }
  } else {
    res.json({ error: true, reason: 'Bad Token' })
  }
}).body(joi.object({
  data: joi.string().required(),
  name: joi.string().required()
}), 'data')