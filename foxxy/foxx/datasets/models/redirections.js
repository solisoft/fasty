const model = function () {
  return {
    model: [
      { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: true, c: "1-3", n: "route", t: "string", j: "joi.string().required()", l: "Route" },
      { r: false, c: "1-3", n: "class", t: "string", j: "joi.any()", l: "Classe" },
      { r: false, c: "1-3", n: "type_redirection", t: "list", j: "joi.any()", l: "Type", d: [['spa', 'SPA']] },
      { r: true, c: "1-2", n: "spa_id", t: "list", j: "joi.any()", l: "Single Page Application", d: "FOR doc in spas RETURN [doc._id, doc.name]" },
      { r: false, c: "1-2", n: "layout_id", t: "list", j: "joi.string().required()", l: "Layout", d: "FOR doc in layouts RETURN [doc._id, doc.name]" }
    ],
    collection: "redirections",
    singular: "redirection",
    roles: {
      read: ['developer', 'admin'],
      write: ['developer', 'admin']
    },
    columns: [{ name: "name" }, { name: "route" }],
    search: ["name"],
    timestamps: true
  }
}
module.exports = model