const model = function() {
  return {
    model: [
      { r: true, c: "1-2", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: false, c: "1-2", n: "slug", t: "string", j: "joi.string().required()", l: "Slug" },
      { r: true, c: "1-1", n: "html", t: "code:html", j: "joi.any()", l: "HTML" },
    ],
    columns: [
      { name: "name" },
      { name: "slug" }
    ],
    collection: "components",
    singular: "component",
    roles: {
      read: ['designer', 'developer', 'admin'],
      write: ['designer', 'developer', 'admin']
    },
    act_as_tree: true,
    sort: "SORT doc.name ASC",
  }
}
module.exports = model