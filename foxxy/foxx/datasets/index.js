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

var typeCast = function(type, value) {
  var value = unescape(value)
  if(type == "integer") value = parseInt(value)
  if(type == "float")   value = parseFloat(value)
  return value
}

var models = function () {
  return db._query(
    `
    LET ds = (FOR doc IN datatypes SORT doc.name RETURN ZIP([doc.slug], [doc]))
    RETURN MERGE(ds)
    `
  ).toArray()[0]
}

var list = function (aql) {
  return db._query(aql).toArray()
}

var fieldsToData = function(fields, body, headers) {
  var data = {}
  _.each(fields, function(f) {
    if(f.tr != true) {
      if(_.isArray(body[f.n])) {
        data[f.n] = _.map(body[f.n], function(v) { return typeCast(f.t,v) })
      } else {
        if(body[f.n] === undefined) {
          if(f.t == "boolean") data[f.n] = false
          else data[f.n] = null
        } else {
          if(f.t == "boolean") data[f.n] = true
          else data[f.n] = typeCast(f.t, body[f.n])
        }
      }
    } else {
      data[f.n] = {}
      if(_.isArray(body[f.n])) {
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
  if(!req.session.uid) res.throw('unauthorized')
  res.setHeader("Access-Control-Expose-Headers", "X-Session-Id")
  next();
});
// -----------------------------------------------------------------------------
router.get('/datatypes', function (req, res) {
  res.send(db._query(`FOR doc IN datatypes SORT doc.name RETURN { name: doc.name, slug: doc.slug }`))
})
.header('X-Session-Id')
.description('Returns all datatypes');
// -----------------------------------------------------------------------------
router.get('/:service/page/:page/:perpage', function (req, res) {
  let model = JSON.parse(models()[req.pathParams.service].javascript)
  const locale = req.headers['foxx-locale']
  let order = model.sort || 'SORT doc._key DESC'
  if(model.sortable) order = 'SORT doc.order ASC'
  let includes = ''
  let include_merge = ''
  if(model.includes) {
    includes = model.includes.conditions
    include_merge = model.includes.merges
  }
  var bindVars = {
    "datatype": req.pathParams.service,
    "offset": (req.pathParams.page - 1) * parseInt(req.pathParams.perpage),
    "perpage": parseInt(req.pathParams.perpage)
  }

  var aql = `
  LET count = LENGTH((FOR doc IN datasets FILTER doc.type == @datatype RETURN 1))
  LET data = (
    FOR doc IN datasets
      FILTER doc.type == @datatype
      LET image = (FOR u IN uploads FILTER u.object_id == doc._id SORT u.pos LIMIT 1 RETURN u)[0]
      ${order}
      ${includes}
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
// -----------------------------------------------------------------------------
router.get('/:service/search/:term', function (req, res) {
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  var locale = req.headers['foxx-locale']
  if(locale.match(/[a-z]+/) == null) locale = 'en'
  let order = object.sort || 'SORT doc._key DESC'
  if(model.sortable) order = 'SORT doc.order ASC'
  let includes = ''
  let include_merge = ''
  if(object.includes) {
    includes = object.includes.conditions
    include_merge = object.includes.merges
  }
  if (locale.match(/[a-z]+/) == null) locale = 'en'
  var bindVars = { "type": req.pathParams.service, "term": req.pathParams.term }
  var aql = `
  FOR doc IN FULLTEXT(datasets, 'search.${locale}', @term)
    FILTER doc.type == @type
    LET image = (FOR u IN uploads FILTER u.object_id == doc._id SORT u.pos LIMIT 1 RETURN u)[0]
    ${order}
    ${includes}
    LIMIT 100
    RETURN MERGE(doc, { image: image ${include_merge} })
  `
  if (aql.indexOf('@lang') > 0) { Object.assign(bindVars, { lang: locale }) }

  res.send({ data: db._query(aql, bindVars).toArray() })
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Returns First 100 found objects');
// -----------------------------------------------------------------------------
router.get('/:service/:id', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.model
  _.each(fields, function (field, i) { if (field.d) { fields[i].d = list(field.d) } })
  res.send({ fields: fields,
             data: collection.document(req.pathParams.id) });
})
.header('X-Session-Id')
.description('Returns object within ID');
// -----------------------------------------------------------------------------
router.get('/:service/fields', function (req, res) {
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.model
  _.each(fields, function (field, i) { if (field.d) { fields[i].d = list(field.d) } })
  res.send({ fields: fields });
})
.header('X-Session-Id')
.description('Get all fields to build form');
// -----------------------------------------------------------------------------
router.post('/:service', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.model
  const body = JSON.parse(req.body.toString())
  var obj = null
  var errors = []
  if(!_.isArray(fields)) fields = fields.model
  try {
    var schema = {}
    _.each(fields, function (f) {
      schema[f.n] = _.isString(f.j) ? schema[f.n] = eval(f.j) : schema[f.n] = f.j
    })
    errors = joi.validate(body, schema, { abortEarly: false }).error.details
  }
  catch(e) {}
  if(errors.length == 0) {
    var data = fieldsToData(fields, body, req.headers)
    data.type = req.pathParams.service
    if(object.search) {
      var search_arr = []
      _.each(object.search, function(s) {
        if(_.isPlainObject(data[s])) {
          search_arr.push(data[s][req.headers['foxx-locale']])
        } else {
          search_arr.push(data[s])
        }
      })
      data.search = {}
      data.search[req.headers['foxx-locale']] = search_arr.join(" ")
    }
    if(object.timestamps === true) { data.created_at = +new Date() }
    if(object.slug) {
      var slug = _.map(object.slug, function(field_name) { return data[field_name] })
      data['slug'] = _.kebabCase(slug)
    }
    data['order'] = db._query(
      'LET docs = (FOR doc IN datasets FILTER doc.type == @type RETURN 1) RETURN LENGTH(docs)',
      { type: req.pathParams.service }
    ).toArray()[0]
    obj = collection.save(data, { waitForSync: true })
  }
  res.send({ success: errors.length == 0, data: obj, errors: errors });
}).header('foxx-locale')
.header('X-Session-Id')
.description('Create a new object.');
// -----------------------------------------------------------------------------
router.post('/:service/:id', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  let fields = object.model

  const body = JSON.parse(req.body.toString())
  var obj = null
  var errors = []
  if(!_.isArray(fields)) fields = fields.model
  try {
    var schema = {}
    _.each(fields, function (f) {
      schema[f.n] = _.isString(f.j) ? schema[f.n] = eval(f.j) : schema[f.n] = f.j
    })
    errors = joi.validate(body, schema, { abortEarly: false }).error.details
  }
  catch(e) {}
  if(errors.length == 0) {
    var doc = collection.document(req.pathParams.id)
    var data = fieldsToData(fields, body, req.headers)
    if(object.search) {
      data.search = {}
      var search_arr = []
      _.each(object.search, function(s) {
        if(_.isPlainObject(data[s])) {
          search_arr.push(data[s][req.headers['foxx-locale']])
        } else {
          search_arr.push(data[s])
        }
      })
      data.search[req.headers['foxx-locale']] = search_arr.join(" ")
    }
    if(object.timestamps === true) { data.updated_at = +new Date() }
    if(object.slug) {
      var slug = _.map(object.slug, function(field_name) {
        return data[field_name]
      })
      data['slug'] = _.kebabCase(slug)
    }
    obj = collection.update(doc, data)
  }
  res.send({ success: errors.length == 0, data: obj, errors: errors });
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Update an object.');
// -----------------------------------------------------------------------------
router.patch('/:service/:id/:field/toggle', function (req, res) {
  const collection = db._collection('datasets')
  let object = JSON.parse(models()[req.pathParams.service].javascript)
  var item = collection.document(req.pathParams.id)
  let column = _.first(_.filter(object.columns, function(el) { return el.name == req.pathParams.field}))
  if(item) {
    var data = {}
    data[req.pathParams.field] = !item[req.pathParams.field]
    collection.update(item, data)
    var returned_data = !item[req.pathParams.field]
    if(column && column.values) returned_data = column.values[!item[req.pathParams.field]]
    res.send({ success: true, data: returned_data })
  } else {
    res.send({ success: false })
  }
})
.header('foxx-locale')
.header('X-Session-Id')
.description('Toggle boolean field.');
// -----------------------------------------------------------------------------
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
// -----------------------------------------------------------------------------
router.delete('/:service/:id', function (req, res) {
  const collection = db._collection('datasets')
  collection.remove('datasets/' + req.pathParams.id)
  res.send({success: true });
})
.header('X-Session-Id')
.description('delete an object.');
// -----------------------------------------------------------------------------
router.put('/:service/orders/:from/:to', function (req, res) {
  const collection = db._collection('datasets')
  const from = parseInt(req.pathParams.from)
  const to = parseInt(req.pathParams.to)

  var doc = db._query(
    `FOR doc IN datasets FILTER doc.type == @type SORT doc.order ASC LIMIT @pos, 1 RETURN doc`,
    { "type": req.pathParams.service, pos: parseInt(req.pathParams.from) }
  ).toArray()[0]

  if (from < to) {
    db._query(
      `FOR doc IN datasets
        FILTER doc.type == @type AND doc.order <= @to AND doc.order >= @from and doc._key != @key
        UPDATE({ _key: doc._key, order: doc.order - 1 }) IN datasets`,
      { "type": req.pathParams.service, from, to, key: doc._key }
    )
  } else {
    db._query(
      `FOR doc IN datasets
        FILTER doc.type == @type AND doc.order <= @from and doc.order >= @to and doc._key != @key
        UPDATE({ _key: doc._key, order: doc.order + 1 }) IN datasets`,
      { "type": req.pathParams.service, from, to, key: doc._key }
    )
  }

  collection.update(doc._key, { order: to })

  res.send({ success: true });
})
  .header('foxx-locale')
  .header('X-Session-Id')
  .description('Swap 2 items');
