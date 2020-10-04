const model = function() {
  return {
    model: [
      { r: true, c: "1-2", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: false, c: "1-2", n: "slug", t: "string", j: "joi.string().required()", l: "Slug" },
      {
        r: false, c: "1-1", n: "kind", t: "list", j: "joi.string().required()", l: "Kind",
        d: [["riot", "RiotJS v3"], ["riot4", "RiotJS v4 & v5"]]
      },
      { r: true, c: "1-1", n: "html", t: "code:html", j: "joi.any()", l: "HTML" },
      { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: "joi.any()", l: "Compiled Javascript (if any)" },
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