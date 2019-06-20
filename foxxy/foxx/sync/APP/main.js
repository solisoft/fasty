'use strict';
const db = require('@arangodb').db;
const joi = require('joi')
const _ = require('lodash')
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
module.context.use(router);
const _settings = db._collection('settings').firstExample()

// -----------------------------------------------------------------------------
// GET /sync
router.get('/:token', function (req, res) {
  var data = {}
  if (_settings.secret == req.pathParams.token) {
    data = db._query(`
      LET layouts = (
        FOR l IN layouts
        RETURN { id: l._id, name: l.name, html: l.html, scss: l.scss, js: l.javascript }
      )
      LET components = (
        FOR c IN components RETURN { id: c._id, name: c.name, html: c.html }
      )
      LET partials = (FOR p IN partials RETURN { id: p._id, name: p.slug, html: p.html })
      LET aqls = (FOR a IN aqls RETURN { id: a._id, name: a.slug, aql: a.aql })
      LET datatypes = (
        FOR d IN datatypes
        RETURN { id: d._id, name: d.name, slug: d.slug, json: d.javascript }
      )
      LET apis = (
        FOR a IN apis
          LET api_routes = (
            FOR ar IN api_routes FILTER ar.api_id == a._key
            RETURN { id: ar._id, name: ar.name, js: ar.javascript }
          )
          LET api_scripts = (
            FOR as IN api_scripts FILTER as.api_id == a._key
            RETURN { id: as._id, name: as.name, js: as.javascript }
          )
          LET api_tests = (
            FOR at IN api_tests FILTER at.api_id == a._key
            RETURN { id: at._id, name: at.name, js: at.javascript }
          )
          RETURN {
            api: { id: a._id, name: a.name, manifest: a.manifest, code: a.code },
            api_routes, api_scripts, api_tests
          }
      )

      RETURN { layouts, components, partials, aqls, datatypes, apis}
    `).toArray()[0]
  }
  res.json(data)
})
  .description("Get Files")


// -----------------------------------------------------------------------------
// PATCH /sync
router.patch('/:token', function (req, res) {

  if (_settings.secret == req.pathParams.token) {
    var firstLine = req.body.data.split('\n')[0];
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
        data['locked_by'] = req.body.name
        db._collection(collection).update(object, data)
        res.json(`Saved! ${collection} ${id} ${field}`)
      } else {
        res.json(`Error! File is locked by ${req.body.name}`)
      }
    } else {
      if (object.locked_by != null) {
        if (object.locked_by == req.body.name) {
          data['locked_by'] = null
          db._collection(collection).update(object, data)
          res.json(`Saved! ${collection} ${id} ${field}`)
        } else {
          res.json(`Error! File is locked by ${req.body.name}`)
        }
      } else {
        db._collection(collection).update(object, data)
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