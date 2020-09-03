const model = function() {
  return {
    model: [
      { r: true, c: "1-1", n: "key", t: "string", j: "joi.string().required()", l: "Key" },
      { r: true, c: "1-1", n: "value", t: "text", j: "joi.string().required()", l: "Value", tr: true }
    ],
    collection: "trads",
    singular: "trad",
    sort: "SORT doc.key ASC",
    columns: [
      { name: 'key' },
      { name: 'value', tr: true },
    ],
    roles: {
      read: ['editor', 'developer', 'admin'],
      write: ['editor', 'developer', 'admin']
    }
  }
}
module.exports = model