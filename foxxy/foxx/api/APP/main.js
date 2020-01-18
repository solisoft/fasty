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
  let aql = "FOR data IN datasets FILTER data.type == @type"

  let bindvars = { type: req.pathParams.type }

  let i = 0
  _.each(req.queryParams, function (v, k) {
    i++
    if (!_.includes(['fields', 'limit', 'offset', 'order'], k)) {
      aql += " FILTER data." + k + " == @params" + i + " "

      if (_.includes(["true", "false"], v)) {
        v = v == "true"
      } else if (!isNaN(v)) {
        v = parseFloat(v)
      }

      bindvars["params" + i] = v
    }
  })

  let aql_count = aql + " RETURN 1"

  if(req.queryParams.limit) {
    aql += " LIMIT @limit"
    bindvars['limit'] = parseInt(req.queryParams.limit)
  }

  if(req.queryParams.offset) {
    aql += ", @offset"
    bindvars['offset'] = parseInt(req.queryParams.offset)
  }

  if(req.queryParams.order) {
    aql += " SORT @order"
    let orders = []
    _.each(req.queryParams.order.split(","), function (order) {
      if (order[0] != "-") {
        orders.push(order + ' ASC')
      } else {
        orders.push(order.slice(1) + ' DESC')
      }
    })
    bindvars['order'] = orders.join(", ")
  }

  if (req.queryParams.fields) {
    aql += " RETURN KEEP(data, "
    let fields_array = []
    _.each(req.queryParams.fields.split(","), function (field) {
      fields_array.push(`'${field}'`)
    })
    aql += fields_array.join(", ")

    aql += ")"
  } else {
    aql += " RETURN data"
  }

  let data = db._query(aql, bindvars).toArray()
  let count = db._query(aql_count, bindvars)

  res.json({ count, data, aql, bindvars })
})
  .description("Fetch Data")