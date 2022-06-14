/*jshint -W097, -W033, node: true, esversion: 6 */
'use strict'
const db = require('@arangodb').db
const _ = require('lodash')

const createRouter = require('@arangodb/foxx/router')
const router = createRouter()

module.context.use(router)

// -----------------------------------------------------------------------------
// GET /get
router.get('/:type', function (req, res) {

  let aql = ""

  let collection = "datasets"
  if(req.pathParams.type == "_widgets") collection = "widgets"

  let bindvars = { type: type, "@collection": collection }

  if (req.queryParams.search) {
    let key = req.queryParams.search.split('@')[0]
    let term = req.queryParams.search.split('@')[1]
    aql = "FOR data IN FULLTEXT(@@collection, @searchKey, @searhTerm)"
    bindvars.searchkKey = key
    bindvars.searchTerm = term
  } else {
    aql = "FOR data IN @@collection"
  }

  aql += " FILTER data.type == @type"

  aql += " LET assets = (FOR asset IN uploads FILTER asset.object_id == data._id SORT asset.pos, asset._key RETURN asset)"

  let type = req.pathParams.type == "_widgets" ? "widgets" : req.pathParams.type
  let bindvars_count = { type: type, "@collection": collection }

  let i = 0
  _.each(req.queryParams, function (v, k) {
    i++
    if (!_.includes(['fields', 'limit', 'offset', 'order', 'search'], k)) {
      aql += " FILTER data." + k + " == @params" + i + " "

      if (_.includes(["true", "false"], v)) {
        v = v == "true"
      } else if (!isNaN(v)) {
        v = parseFloat(v)
      }

      bindvars["params" + i] = v
      bindvars_count["params" + i] = v
    }
  })

  let aql_count = aql + " RETURN 1"

  if(req.queryParams.limit) {
    aql += " LIMIT @limit"
    bindvars.limit = parseInt(req.queryParams.limit)
  }

  if(req.queryParams.offset) {
    aql += ", @offset"
    bindvars.offset = parseInt(req.queryParams.offset)
  }

  if(req.queryParams.order) {
    aql += " SORT "
    _.each(req.queryParams.order.split(","), function (order) {
      let regex = RegExp('[a-zA-Z_-]+')
      if(regex.test(order)) {
        if (order[0] != "-") {
          aql += 'data.' + order + ' ASC'
        } else {
          aql += 'data.' + order.slice(1) + ' DESC'
        }
      }
    })
  }

  if (req.queryParams.fields) {
    aql += " RETURN MERGE(KEEP(data, "
    let fields_array = []
    _.each(req.queryParams.fields.split(","), function (field) {
      fields_array.push(`'${field}'`)
    })
    aql += fields_array.join(", ")

    aql += "), { assets })"
  } else {
    aql += " RETURN MERGE(data, { assets })"
  }

  let data = db._query(aql, bindvars).toArray()
  let count = db._query(aql_count, bindvars_count)._countTotal

  res.json({ count, data })
})
  .description("Fetch Data")

// -----------------------------------------------------------------------------
// Save any form to forms collection
router.post('/form/:name', function (req, res) {
  var data  = req.body
  data.type = req.pathParams.name

  res.json(db.forms.save(data))
})
  .description("Save form in the db")