'use strict';

const db = require('@arangodb').db;
const joi = require('joi');
const _ = require('lodash');
const createRouter = require('@arangodb/foxx/router');
const sessionsMiddleware = require('@arangodb/foxx/sessions');
const jwtStorage = require('@arangodb/foxx/sessions/storages/jwt');
require('@arangodb/aql/cache').properties({ mode: 'on' });

const router = createRouter();
const _settings = db.settings.firstExample();

const sessions = sessionsMiddleware({
  storage: jwtStorage({ secret: _settings.jwt_secret, ttl: 60 * 60 * 24 * 365 }),
  ttl: 60 * 60 * 24 * 365, // one year in seconds
  transport: 'header'
});

module.context.use(sessions);
module.context.use(router);

var save_activity = function(object_id, action, user_key) {
  db.activities.save({
    date: +new Date(),
    object_id,
    action,
    user_key
  })
}

var typeCast = function(type, value) {
  var value = unescape(value)
  if (type == "integer") value = parseInt(value)
  if (type == "float") value = parseFloat(value)
  if (type == "html") value = JSON.parse(value)
  return value
}

var models = function () {
  return db._query(`
    LET ds = (FOR doc IN datatypes SORT doc.name RETURN ZIP([doc.slug], [doc]))
    RETURN MERGE(ds)
  `).toArray()[0]
}

var list = function (aql, locale) {
  let bindvars = {}
  if (aql.indexOf('@lang') > 0) { bindvars.lang = locale; }

  return db._query(aql, bindvars).toArray()
}

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

var fieldsToData = function(fields, body, headers) {
  var data = {}
  _.each(fields, function(f) {
    if (f.tr != true) {
      if (_.isArray(body[f.n])) {
        data[f.n] = _.map(body[f.n], function(v) { return typeCast(f.t,v) })
      } else {
        if (body[f.n] === undefined) {
          if (f.t == "boolean") data[f.n] = false
          else data[f.n] = null
        } else {
          if (f.t == "boolean") data[f.n] = true
          else data[f.n] = typeCast(f.t, body[f.n])
        }
      }
    } else {
      data[f.n] = {}
      if (_.isArray(body[f.n])) {
        data[f.n][headers['foxx-locale']] = _.map(
          body[f.n], function(v) { return typeCast(f.t,v) }
        )
      } else {
        data[f.n][headers['foxx-locale']] = unescape(body[f.n])
      }
    }
  })
  return data
}

// Comment this block if you want to avoid authorization
module.context.use(function (req, res, next) {
  if (!req.session.uid) res.throw('unauthorized')
  res.setHeader("Access-Control-Expose-Headers", "X-Session-Id")
  next();
});

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/datatypes
router.get('/datatypes', function (req, res) {
  res.send(db._query(`FOR doc IN datatypes SORT doc.name RETURN { name: doc.name, slug: doc.slug }`))
})
.header('X-Session-Id')
.description('Returns all datatypes');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/page/:page/:perpage
router.get('/:service/page/:page/:perpage', function (req, res) {
  let model = JSON.parse(models()[req.pathParams.service].javascript)
  const locale = req.headers['foxx-locale']
  let order = model.sort || 'SORT doc._key DESC'
  if (model.sortable) order = 'SORT doc.order ASC'

  let includes = ''
  let include_merge = ''
  if (model.includes) {
    includes = model.includes.conditions
    include_merge = model.includes.merges
  }

  let folder = ''
  let folder_params = {}
  if (req.queryParams.folder && req.queryParams.is_root != 'true') {
    folder = 'FILTER doc.folder_key == @folder'
    folder_params = { folder: req.queryParams.folder }
  }

  if (req.queryParams.is_root == 'true') {
    folder = 'FILTER !HAS(doc, "folder_key") || doc.folder_key == @folder'
    folder_params = { folder: req.queryParams.folder }
  }

  var fields = ["_id", "_key"]
  fields.push(_.map(model.columns, function(d) { return d.name }))
  var bindVars = _.merge({
    "datatype": req.pathParams.service,
    "offset": (req.pathParams.page - 1) * parseInt(req.pathParams.perpage),
    "perpage": parseInt(req.pathParams.perpage),
    "fields": _.flatten(fields)
  }, folder_params)

  var aql = `
  LET count = LENGTH((FOR doc IN datasets FILTER doc.type == @datatype ${folder} RETURN 1))
  LET data = (
    FOR doc IN datasets
      FILTER doc.type == @datatype
      LET image = (FOR u IN uploads FILTER u.object_id == doc._id SORT u.pos LIMIT 1 RETURN u)[0]
      ${folder} ${order} ${includes}
      LIMIT @offset, @perpage
      RETURN MERGE(KEEP(doc, @fields), { image: image ${include_merge} })
  )
  RETURN { count: count, data: data }
  `

  if (aql.indexOf('@lang') > 0) { Object.assign(bindVars, { lang: locale }); }

  res.send({ model: model, data: db._query(aql, bindVars).toArray() });
})
.header('X-Session-Id')
.description('Returns all objects');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/:service_key/:sub/page/:page/:perpage
router.get('/:service/:service_key/:sub/page/:page/:perpage', function (req, res) {
  let model = JSON.parse(
    models()[req.pathParams.service].javascript
  ).sub_models[req.pathParams.sub]
  const locale = req.headers['foxx-locale']
  let order = model.sort || 'SORT doc._key DESC'
  if (model.sortable) order = 'SORT doc.order ASC'

  let includes = ''
  let include_merge = ''
  if (model.includes) {
    includes = model.includes.conditions
    include_merge = model.includes.merges
  }

  var bindVars = {
    "datatype": req.pathParams.sub,
    "parent": req.pathParams.service_key,
    "offset": (req.pathParams.page - 1) * parseInt(req.pathParams.perpage),
    "perpage": parseInt(req.pathParams.perpage)
  }

  var aql = `
  LET count = LENGTH((FOR doc IN datasets FILTER doc.type == @datatype RETURN 1))
  LET data = (
    FOR doc IN datasets
      FILTER doc.parent_id == @parent
      FILTER doc.type == @datatype
      LET image = (FOR u IN uploads FILTER u.object_id == doc._id SORT u.pos LIMIT 1 RETURN u)[0]
      ${order} ${includes}
      LIMIT @offset, @perpage
      RETURN MERGE(doc, { image: image ${include_merge} })
  )
  RETURN { count: count, data: data }
  `
  if (aql.indexOf('@lang') > 0) { Object.assign(bindVars, { lang: locale }); }

  res.send({ model: model, data: db._query(aql, bindVars).toArray() });
})
.header('X-Session-Id')
.description('Returns all objects');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/search/:term
router.get('/:service/search/:term', function (req, res) {
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  var locale = req.headers['foxx-locale']
  if (locale.match(/[a-z]+/) == null) locale = 'en'
  let order = object.sort || 'SORT doc._key DESC'
  if (object.sortable) order = 'SORT doc.order ASC'

  let includes = ''
  let include_merge = ''
  if (object.includes) {
    includes = object.includes.conditions
    include_merge = object.includes.merges
  }

  if (locale.match(/[a-z]+/) == null) locale = 'en'

  var fields = ["_id", "_key"]
  fields.push(_.map(object.columns, function(d) { return d.name }))

  var bindVars = {
    "type": req.pathParams.service,
    "term": req.pathParams.term,
    "fields": _.flatten(fields)
  }
  var aql = `
  FOR doc IN FULLTEXT(datasets, 'search.${locale}', @term)
    FILTER doc.type == @type
    LET image = (FOR u IN uploads FILTER u.object_id == doc._id SORT u.pos LIMIT 1 RETURN u)[0]
    ${order} ${includes}
    LIMIT 100
    RETURN MERGE(KEEP(doc, @fields), { image: image ${include_merge} })
  `
  if (aql.indexOf('@lang') > 0) { Object.assign(bindVars, { lang: locale }) }

  res.send({ data: db._query(aql, bindVars).toArray() })
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Returns First 100 found objects');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/:id
router.get('/:service/:id', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.model
  _.each(fields, function (field, i) { if (field.d) { fields[i].d = list(field.d, req.headers['foxx-locale']) } })
  res.send({
    fields: fields,
    model: JSON.parse(models()[req.pathParams.service].javascript),
    data: collection.document(req.pathParams.id)
  });
})
.header('X-Session-Id')
.header('foxx-locale')
.description('Returns object within ID');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/sub/:sub_service/:id
router.get('/:service/sub/:sub_service/:id', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.sub_models[req.pathParams.sub_service]
  _.each(fields, function (field, i) { if (field.d) { fields[i].d = list(field.d, req.headers['foxx-locale']) } })
  res.send({
    fields: fields,
    model: JSON.parse(models()[req.pathParams.service].javascript),
    data: collection.document(req.pathParams.id)
  });
})
.header('X-Session-Id')
.description('Returns sub object within ID');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/fields
router.get('/:service/fields', function (req, res) {
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.model
  _.each(fields, function (field, i) {
    if (field.d) { fields[i].d = list(field.d, req.headers['foxx-locale']) }
  })
  res.send({ fields: fields });
})
.header('X-Session-Id')
.header('foxx-locale')
.description('Get all fields to build form');

////////////////////////////////////////////////////////////////////////////////
// POST /datasets/:service
router.post('/:service', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  object.revisions = object.revisions || 10
  let fields = object.model
  const body = JSON.parse(req.body.toString())
  var obj = null
  var errors = []
  if (!_.isArray(fields)) fields = fields.model

  try {
    var schema = {}
    if (object.act_as_tree) schema['folder_key'] = joi.string().required()
    _.each(fields, function (f) {
      schema[f.n] = _.isString(f.j) ? schema[f.n] = eval(f.j) : schema[f.n] = f.j
    })
    errors = joi.validate(body, schema, { abortEarly: false }).error.details
  }
  catch (e) { }

  if (errors.length == 0) {
    var data = fieldsToData(fields, body, req.headers)
    data.type = req.pathParams.service
    if (object.act_as_tree) data['folder_key'] = body.folder_key
    if (object.search) {
      var search_arr = []
      _.each(object.search, function(s) {
        if (_.isPlainObject(data[s])) {
          search_arr.push(data[s][req.headers['foxx-locale']])
        } else {
          search_arr.push(data[s])
        }
      })
      data.search = {}
      data.search[req.headers['foxx-locale']] = search_arr.join(" ")
    }
    if (object.timestamps === true) { data.created_at = +new Date() }
    var filter_by_folder = ''
    var folder_params = {}
    if (object.act_as_tree) {
      filter_by_folder = 'FILTER doc.folder_key == @folder'
      folder_params['folder'] = body.folder_key
    }
    data['order'] = db._query(`
      LET docs = (FOR doc IN datasets FILTER doc.type == @type ${filter_by_folder} RETURN 1)
      RETURN LENGTH(docs)
    `, _.merge({ type: req.pathParams.service }, folder_params)
    ).toArray()[0]
    obj = collection.save(data, { waitForSync: true })
    if (object.slug) {
      var slug = _.map(object.slug, function(field_name) {
        var value = ""
        if (_.isPlainObject(data[field_name])) {
          value = data[field_name][req.headers['foxx-locale']]
        } else {
          value = data[field_name]
        }
        return field_name == '_key' ? obj._key : value
      })

      if(data['slug'] == '' || data['slug'] == undefined ) {
        slug = _.kebabCase(slug)
        collection.update(obj, { slug: slug })
      }
    }
    save_revision(req.session.uid, obj, data, object.revisions)
    save_activity(obj._id, 'created', req.session.uid)
  }
  res.send({ success: errors.length == 0, data: obj, errors: errors });
}).header('foxx-locale')
.header('X-Session-Id')
.description('Create a new object.');

////////////////////////////////////////////////////////////////////////////////
// POST /datasets/:service/:service_key/:sub
router.post('/:service/:service_key/:sub', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  object.revisions = object.revisions || 10
  const body = JSON.parse(req.body.toString())
  var obj = null
  var errors = []
  let fields = object.sub_models[req.pathParams.sub].fields
  try {
    var schema = {}
    _.each(fields, function (f) {
      let validate = f.ju ? f.ju : f.j
      schema[f.n] = _.isString(validate) ? eval(validate) : validate
    })
    errors = joi.validate(body, schema, { abortEarly: false }).error.details
  }
  catch(e) {}
  if (errors.length == 0) {
    var data = fieldsToData(fields, body, req.headers)
    data.type = req.pathParams.sub
    if (object.search) {
      var search_arr = []
      _.each(object.search, function(s) {
        if (_.isPlainObject(data[s])) {
          search_arr.push(data[s][req.headers['foxx-locale']])
        } else {
          search_arr.push(data[s])
        }
      })
      data.search = {}
      data.search[req.headers['foxx-locale']] = search_arr.join(" ")
    }
    if (object.timestamps === true) { data.created_at = +new Date() }

    data['order'] = db._query(
      'LET docs = (FOR doc IN datasets FILTER doc.type == @type RETURN 1) RETURN LENGTH(docs)',
      { type: req.pathParams.sub }
    ).toArray()[0]
    data['parent_id'] = req.pathParams.service_key
    obj = collection.save(data, { waitForSync: true })
    if (object.slug) {
      var slug = _.map(object.slug, function(field_name) {
        var value = ""
        if (_.isPlainObject(data[field_name])) {
          value = data[field_name][req.headers['foxx-locale']]
        } else {
          value = data[field_name]
        }
        return field_name == '_key' ? obj._key : value
      })
      if(data['slug'] == '') {
        slug = _.kebabCase(slug)
        collection.update(obj, { slug: slug })
      }
    }
    save_revision(req.session.uid, obj, data, object.revisions)
    save_activity(object._id, 'created', req.session.uid)
  }
  res.send({ success: errors.length == 0, data: obj, errors: errors });
}).header('foxx-locale')
.header('X-Session-Id')
  .description('Create a new object.');

////////////////////////////////////////////////////////////////////////////////
// POST /datasets/:service/:id
router.post('/:service/:id', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  object.revisions = object.revisions || 10
  let fields = object.model
  const body = JSON.parse(req.body.toString())
  var obj = null
  var errors = []
  if (!_.isArray(fields)) fields = fields.model
  try {
    var schema = {}
    _.each(fields, function (f) {
      let validate = f.ju ? f.ju : f.j
      schema[f.n] = _.isString(validate) ? eval(validate) : validate
    })
    errors = joi.validate(body, schema, { abortEarly: false }).error.details
  }
  catch(e) {}
  if (errors.length == 0) {
    var doc = collection.document(req.pathParams.id)
    var data = fieldsToData(fields, body, req.headers)
    if (object.search) {
      data.search = {}
      var search_arr = []
      _.each(object.search, function(s) {
        if (_.isPlainObject(data[s])) {
          search_arr.push(data[s][req.headers['foxx-locale']])
        } else {
          search_arr.push(data[s])
        }
      })
      data.search[req.headers['foxx-locale']] = search_arr.join(" ")
    }
    if (object.timestamps === true) { data.updated_at = +new Date() }
    if (object.slug) {
      var slug = _.map(object.slug, function(field_name) {
        var value = ""
        if (_.isPlainObject(data[field_name])) {
          value = data[field_name][req.headers['foxx-locale']]
        } else {
          value = data[field_name]
        }
        return field_name == '_key' ? doc._key : value
      })
      if (data['slug'] == '' || data['slug'] == undefined) {
        data['slug'] = _.kebabCase(slug)
      }
    }
    obj = collection.update(doc, data)
    save_revision(req.session.uid, doc, data, object.revisions)
    save_activity(doc._id, 'updated', req.session.uid)
  }
  res.send({ success: errors.length == 0, data: obj, errors: errors });
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Update an object.');

////////////////////////////////////////////////////////////////////////////////
// POST /datasets/sub/:service/:sub_service/:id
router.post('/sub/:service/:sub_service/:id', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  object.revisions = object.revisions || 10
  let fields = object.sub_models[req.pathParams.sub_service].fields
  const body = JSON.parse(req.body.toString())
  var obj = null
  var errors = []
  try {
    var schema = {}
    _.each(fields, function (f) {
      if (f.ju) {
        schema[f.n] = _.isString(f.ju) ? eval(f.ju) : f.ju
      } else {
        schema[f.n] = _.isString(f.j) ? eval(f.j) : f.j
      }
    })
    errors = joi.validate(body, schema, { abortEarly: false }).error.details
  }
  catch(e) {}
  if (errors.length == 0) {
    var doc = collection.document(req.pathParams.id)
    var data = fieldsToData(fields, body, req.headers)
    if (object.search) {
      data.search = {}
      var search_arr = []
      _.each(object.search, function(s) {
        if (_.isPlainObject(data[s])) {
          search_arr.push(data[s][req.headers['foxx-locale']])
        } else {
          search_arr.push(data[s])
        }
      })
      data.search[req.headers['foxx-locale']] = search_arr.join(" ")
    }
    if (object.timestamps === true) { data.updated_at = +new Date() }
    if (object.slug) {
      var slug = _.map(object.slug, function(field_name) {
        var value = ""
        if (_.isPlainObject(data[field_name])) {
          value = data[field_name][req.headers['foxx-locale']]
        } else {
          value = data[field_name]
        }
        return field_name == '_key' ? doc._key : value
      })
      data['slug'] = _.kebabCase(slug)
    }
    obj = collection.update(doc, data)
    save_revision(req.session.uid, doc, data, object.revisions)
    save_activity(doc._id, 'updated', req.session.uid)
  }
  res.send({ success: errors.length == 0, data: obj, errors: errors });
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Update an object.');

////////////////////////////////////////////////////////////////////////////////
// PATCH /datasets/:service/:id/:field/toggle
router.patch('/:service/:id/:field/toggle', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  var item = collection.document(req.pathParams.id)
  let column = _.first(_.filter(object.columns, function(el) { return el.name == req.pathParams.field}))
  if (item) {
    var data = {}
    data[req.pathParams.field] = !item[req.pathParams.field]
    collection.update(item, data)
    var returned_data = !item[req.pathParams.field]
    if (column && column.values) returned_data = column.values[!item[req.pathParams.field]]
    res.send({ success: true, data: returned_data })
  } else {
    res.send({ success: false })
  }
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Toggle boolean field.');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/:id/duplicate
router.get('/:service/:id/duplicate', function (req, res) {
  var new_obj = db._query(`
    FOR doc IN datasets
    FILTER doc._key == @key
    INSERT UNSET( doc, "_id", "_key", "_rev" ) IN datasets RETURN NEW
  `, { key: req.pathParams.id }).toArray()[0]
  res.send(new_obj);
})
.header('X-Session-Id')
.description('duplicate an object.');

////////////////////////////////////////////////////////////////////////////////
// POST /datasets/:id/publish
router.post('/:id/publish', function (req, res) {
  var dataset = db.datasets.document(req.pathParams.id)
  db.publications.save({ _key: 'datasets_' + dataset._key, data: dataset }, { overwrite: true })
  db._query(`
    FOR dataset IN datasets FILTER dataset.parent_id == @key
    UPSERT { _id: @id }
      INSERT { data: dataset }
      UPDATE { data: dataset }
    IN publications
    RETURN dataset._key
  `, { key: req.pathParams.id, id: 'publications/' + req.pathParams.id })
  res.send({ success: true });
})
.header('X-Session-Id')
.description('publish a dataset.');

////////////////////////////////////////////////////////////////////////////////
// DELETE /datasets/:service/:id
router.delete('/:service/:id', function (req, res) {
  const collection = db._collection('datasets')
  collection.remove('datasets/' + req.pathParams.id)
  db.revisions.removeByExample({ object_id: 'datasets/' + req.pathParams.id })
  res.send({success: true });
})
.header('X-Session-Id')
.description('delete an object.');

////////////////////////////////////////////////////////////////////////////////
// PUT /datasets/:service/orders/:from/:to
router.put('/:service/orders/:from/:to', function (req, res) {
  const collection = db._collection('datasets')
  const from = parseInt(req.pathParams.from)
  const to = parseInt(req.pathParams.to)

  var filter_by_folder = ''
  var folder_params = {}

  if (req.queryParams.folder_key) {
    filter_by_folder = 'FILTER doc.folder_key == @folder'
    folder_params['folder'] = req.queryParams.folder_key
  }

  var doc = db._query(
    `FOR doc IN datasets FILTER doc.type == @type ${filter_by_folder} SORT doc.order ASC LIMIT @pos, 1 RETURN doc`,
    _.merge({ "type": req.pathParams.service, pos: parseInt(req.pathParams.from) }, folder_params)
  ).toArray()[0]

  if (from < to) {
    db._query(
      `FOR doc IN datasets
      ${filter_by_folder}
      FILTER doc.type == @type AND doc.order <= @to AND doc.order >= @from and doc._key != @key
        UPDATE({ _key: doc._key, order: doc.order - 1 }) IN datasets`,
      _.merge({ "type": req.pathParams.service, from, to, key: doc._key }, folder_params)
    )
  } else {
    db._query(
      `FOR doc IN datasets
        ${filter_by_folder}
        FILTER doc.type == @type AND doc.order <= @from and doc.order >= @to and doc._key != @key
        UPDATE({ _key: doc._key, order: doc.order + 1 }) IN datasets`,
      _.merge({ "type": req.pathParams.service, from, to, key: doc._key }, folder_params)
    )
  }

  collection.update(doc._key, { order: to })

  res.send({ success: true });
})
  .header('foxx-locale')
  .header('X-Session-Id')
  .description('Swap 2 items');

////////////////////////////////////////////////////////////////////////////////
// GET /datasets/:service/stats/:tag
router.get('/:service/stats/:tag', function (req, res) {
  var results = db._query(`
    LET tags = (
      FOR d IN datasets
        FILTER d.type == @service
        COLLECT tag = d[@tag] INTO tags
        FILTER tag != NULL
        RETURN FLATTEN(tag)
    )
    FOR tag IN UNIQUE(FLATTEN(tags))
      SORT tag
      LET size = (
        FOR d IN datasets
          FILTER d.type == @service AND CONTAINS(d.tags, tag)
          COLLECT WITH COUNT INTO size
          RETURN size
      )[0]
      SORT size DESC
      RETURN { tag, size }
  `, { tag: req.pathParams.tag, service: req.pathParams.service })

  res.send(results);
})
  .header('foxx-locale')
  .header('X-Session-Id')
  .description('Get tag statistic usages');
