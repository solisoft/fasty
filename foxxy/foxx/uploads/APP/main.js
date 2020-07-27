'use strict';
const db = require('@arangodb').db
const joi = require('joi')
const _ = require('lodash')
const createRouter = require('@arangodb/foxx/router')
const router = createRouter()
const querystring = require('querystring')
const crypt = require('@arangodb/crypto')
const fs = require("fs")
const sessionsMiddleware = require('@arangodb/foxx/sessions')
const jwtStorage = require('@arangodb/foxx/sessions/storages/jwt')
const request = require('@arangodb/request')
const _settings = db._collection('settings').firstExample()
const sessions = sessionsMiddleware({
  storage: jwtStorage({ secret: _settings.jwt_secret, ttl: 60 * 60 * 24 * 365 }),
  ttl: 60 * 60 * 24 * 365, // one year in seconds
  transport: 'header'
})
module.context.use(sessions)
module.context.use(router)

module.context.use(function (req, res, next) {
  if (!req.session.uid) res.throw('unauthorized')
  res.setHeader("Access-Control-Expose-Headers", "X-Session-Id")
  next()
})

// -----------------------------------------------------------------------------
// GET /uploads/:key/:type/:field
router.get('/:key/:type/:field', function (req, res) {
    var obj = {
      field: req.pathParams.field,
      object_id: req.pathParams.key + '/' + req.pathParams.type
    }
    var uploads = db._query(`
    FOR u IN uploads
      FILTER u.field == @field
      FILTER u.object_id == @object_id
      SORT u.pos
      RETURN u
  `, obj).toArray()
    res.send(uploads)
  })
  .header('foxx-locale')
  .header('X-Session-Id')
  .description("Get all files for a specific id and field")
// -----------------------------------------------------------------------------
// GET /uploads/:key/:type/:field/:lang
router.get('/:key/:type/:field/:lang', function (req, res) {
    var obj = {
      field: req.pathParams.field,
      object_id: req.pathParams.key + '/' + req.pathParams.type
    }

    if (req.pathParams.lang) obj['lang'] = req.pathParams.lang
    res.send(db.uploads.byExample(obj).toArray())
  })
  .header('foxx-locale')
  .header('X-Session-Id')
  .description("Get all files for a specific id and field")
// -----------------------------------------------------------------------------
// POST /uploads/reorder
router.post('/reorder', function (req, res) {
    db._query(
      `FOR data IN @data UPDATE { _key: data.k, pos: data.c, field: @field } IN uploads`,
      { data: req.body.ids, field: req.body.field }
    )
    res.send({ success: true })
  })
  .header('X-Session-Id')
  .body(joi.object({
    ids: joi.array().required(),
    field: joi.string().required()
  }), 'data')
  .description("Reorder elements")
// -----------------------------------------------------------------------------
// DELETE /uploads/:key
router.delete('/:key', function (req, res) {
    let upload = db.uploads.document(req.pathParams.key)
    // Remove file
    try {
      fs.remove(upload.path)
    } catch (e) {
      // Maybe the file is not there anymore
    }

    // Delete document
    db.uploads.remove(req.pathParams.key)
    res.send({
      success: true
    })
  })
  .header('X-Session-Id')
  .description("Delete an upload")