const model = function() {
  return {
    model: [
      { r: true, c: "1-3", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: false, c: "1-3", n: "slug", t: "string", j: "joi.string().required()", l: "Slug" },
      { r: false, c: "1-6", n: "synchronizable", t: "boolean", j: "joi.number().integer()", l: "Synchronizable?" },
      { r: false, c: "1-6", n: "deployable", t: "boolean", j: "joi.number().integer()", l: "Deployable?" },
      { r: true, c: "1-1", n: "javascript", t: "code:json", j: "joi.string().required()", l: "JSON definition" }

    ],
    collection: "datatypes",
    singular: "datatype",
    columns: [
      { name: "name" },
      { name: "slug" },
      { name: "synchronizable" }
    ],
    roles: {
      read: ['developer', 'admin'],
      write: ['developer', 'admin']
    },
    act_as_tree: true,
    sort: "SORT doc.name ASC"
  }
}
module.exports = model