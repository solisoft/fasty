const model = function() {
    return {
      model: [
          { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Name" },
          { r: false, c: "1-1", n: "model", t: "code:json", j: "joi.string().required()", l: "Model definition" },
          { r: true, c: "1-1", n: "partial", t: "code:etlua", j: "joi.string().required()", l: "View (etlua)" },
          { r: true, c: "1-1", n: "picture", t: "image", j: "joi.any()", l: "Picture" }
      ],
      collection: "widgets",
      singular: "widget",
      columns: [{ name: "name" }],
      sort: "SORT doc.name ASC",
      timestamps: true
    }
  }
  module.exports = model