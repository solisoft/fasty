const db = require('@arangodb').db

const model = function() {
  var partials = db._query(`
    FOR doc in partials RETURN [doc._key, doc.name]
  `).toArray()

  var aqls = db._query(`
    FOR doc in aqls RETURN [doc._key, doc.slug]
  `).toArray()

  return {
    model: [
      { r: true, c: "1-1", n: "shortcut", t: "string", j: "joi.string().required()", l: "Shortcut" },
      { r: true, c: "1-1", n: "partial_key", t: "list", j: "joi.string().required()", l: "Partial", d: partials },
      { r: true, c: "1-1", n: "aql_key", t: "list", j: "joi.string().required()", l: "AQL", d: aqls }
    ],
    collection: "helpers",
    columns: [{ name: 'shortcut' }],
    sort: "SORT doc.shortcut"
  }
}
module.exports = model