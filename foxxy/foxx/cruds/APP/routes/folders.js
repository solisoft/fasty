'use strict';
const db = require('@arangodb').db;
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');

require("@arangodb/aql/cache").properties({ mode: "on" });

const router = createRouter();

module.context.use(function (req, res, next) {
  res.setHeader("Access-Control-Expose-Headers", "X-Session-Id");
  next();
});

router.tag('folders');

module.exports = router;

module.context.use(function (req, res, next) {
  res.setHeader("Access-Control-Expose-Headers", "X-Session-Id");
  next();
})

////////////////////////////////////////////////////////////////////////////////
// GET /cruds/folders/:type
router.get('/:type', function (req, res) {
  var root = db.folders.firstExample({
    is_root: true, object_type: req.pathParams.type
  })

  if (!root) {
    const doc = db.folders.save({
      name: 'Root', is_root: true,
      object_type: req.pathParams.type, parent_id: null
    })
    root = db.folders.document(doc._key)
  }

  var folders = db._query(`
    FOR v IN 1..1 OUTBOUND @parent GRAPH 'folderGraph' SORT v.name RETURN v
  `, { parent: root._id }).toArray()

  res.json({ folders, root, path: [ root ] })
})
  .description('Get Root Folder');

////////////////////////////////////////////////////////////////////////////////
// GET /cruds/folders/:type
router.get('/:type/:parent', function (req, res) {
  var root = db.folders.firstExample({
    is_root: true, object_type: req.pathParams.type
  })

  var folders = db._query(`
    FOR v IN 1..1 OUTBOUND @parent GRAPH 'folderGraph' SORT v.name
    RETURN v
  `, { parent: 'folders/' + req.pathParams.parent }).toArray()

  var path = db._query(`
    FOR vertex IN OUTBOUND SHORTEST_PATH @from TO @to GRAPH 'folderGraph'
    RETURN vertex
  `, { to: 'folders/' + req.pathParams.parent, from: root._id }).toArray()

  res.json({ folders, root, path })
})
  .description('Get Root Folder');

////////////////////////////////////////////////////////////////////////////////
// POST /cruds/folders/:type
router.post('/:type', function (req, res) {
  var folder = db.folders.save({
    name: req.body.name
  })

  db.folder_path.save({
    _from:  'folders/' + req.body.parent_id,
    _to: 'folders/' + folder._key
  })

  res.json(folder)
})
  .body(joi.object({
    name: joi.string().required(),
    parent_id: joi.string().required()
  }).required(), 'Credentials')
  .description('Create a new Folder');

////////////////////////////////////////////////////////////////////////////////
// PATCH /cruds/folders/:type
router.patch('/:type', function (req, res) {
  var root = db.folders.firstExample({
    is_root: true, object_type: req.pathParams.type
  })

  var folder = db.folders.document(req.body.id)
  db.folders.update(folder, { name: req.body.name })

  var path = db._query(`
    FOR vertex IN OUTBOUND SHORTEST_PATH @from TO @to GRAPH 'folderGraph' RETURN vertex
  `, { to: folder._id, from: root._id }).toArray()

  res.json({ path, folder })
})
  .body(joi.object({
    name: joi.string().required(),
    id: joi.string().required()
  }).required(), 'Credentials')
  .description('Update a Folder');

  ////////////////////////////////////////////////////////////////////////////////
// DELETE /cruds/folders/:type
router.delete('/:type/:key', function (req, res) {
  db.folders.removeByExample({ _key: req.pathParams.key })
  db.folder_path.removeByExample({ _from: 'folders/' + req.pathParams.key })
  db.folder_path.removeByExample({ _to: 'folders/' + req.pathParams.key })
  res.json({})
})
  .description('Destroy a Folder');
