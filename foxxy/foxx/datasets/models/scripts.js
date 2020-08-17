const model = function() {
  return {
    model: [
        { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Name" },
        { r: false, c: "1-1", n: "package", t: "code:javascript", j: "joi.string().required()", l: "Package.json" },
        { r: true, c: "1-1", n: "code", t: "code:javascript", j: "joi.string().required()", l: "Javascript" }
    ],
    collection: "scripts",
    columns: [{ name: "name" }],
    sort: "SORT doc.name ASC",
    timestamps: true,
  }
}
module.exports = model