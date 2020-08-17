const db = require('@arangodb').db

const model = function () {
  var layouts = db._query(`FOR doc in layouts RETURN [doc._id, doc.name]`).toArray()

  return {
    model: [
      { r: true, c: "1-3", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: false, c: "1-3", n: "slug", t: "string", j: "joi.any()", l: "Slug" },
      { r: false, c: "1-3", n: "layout_id", t: "list", j: "joi.string().required()", l: "Layout", d: layouts },
      { r: true, c: "1-1", n: "builder", t: "boolean", j: "joi.number().integer()", l: "Page Builder?" },
      { r: true, c: "1-1", n: "html", t: "code:luapage", j: "joi.any()", l: "HTML (etlua)" }
    ],
    collection: "partials",
    columns: [
      { name: "name" },
      { name: "slug" }
    ],
    roles: {
      read: ['designer', 'developer', 'admin'],
      write: ['designer', 'developer', 'admin']
    },
    sort: "SORT doc.name ASC",
    search: ["name"],
    act_as_tree: true,


  }
}
module.exports = model