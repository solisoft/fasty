const model = function() {
  return {
    model: [
      { r: true, c: "1-1", n: "shortcut", t: "string", j: "joi.string().required()", l: "Shortcut" },
      {
        r: true, c: "1-1", n: "partial_key", t: "list", j: "joi.string().required()", l: "Partial",
        d: "FOR doc in partials RETURN [doc._key, doc.name]"
      },
      {
        r: true, c: "1-1", n: "aql_key", t: "list", j: "joi.string().required()", l: "AQL",
        d: "FOR doc in aqls RETURN [doc._key, doc.slug]"
      }
    ],
    collection: "helpers",
    singular: "helper",
    columns: [{ name: 'shortcut' }],
    sort: "SORT doc.shortcut",
    roles: {
      read: ['designer', 'developer', 'admin'],
      write: ['designer', 'developer', 'admin']
    }
  }
}
module.exports = model