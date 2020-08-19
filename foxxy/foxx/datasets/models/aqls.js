const model = function() {
  return {
    model: [
      { r: true, c: "1-1", n: "slug", t: "string", j: "joi.string().required()", l: "Slug" },
      { r: true, c: "1-1", n: "aql", t: "code:aql", j: "joi.string().required()", l: "AQL" },
      { r: true, c: "1-1", n: "options", t: "code:json", j: "joi.any()", l: "Options" }
    ],
    columns: [
      { name: "slug" }, { name: "aql" }
    ],
    sort: "SORT doc.slug ASC",
    collection: "aqls",
    singular: "aql"
  }
}
module.exports = model