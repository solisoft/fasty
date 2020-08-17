const model = function() {
  return {
    model: [
      { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Mount Point" },
      { r: true, c: "1-2", n: "manifest", t: "code:json", j: "joi.string().required()", l: "Manifest.json" },
      { r: false, c: "1-2", n: "package", t: "code:javascript", j: "joi.string().required()", l: "Package.json" },
      { r: true, c: "1-1", n: "code", t: "code:javascript", j: "joi.string().required()", l: "Main.js" }
    ],
    collection: "apis",
    is_api: true,
    columns: [{ name: "name" }],
    sub_models: {
      api_routes: {
        fields: [
          { r: true, c: "1-1", n: "api_id", t: "hidden", j: "joi.string().required()", l: "Post ID" },
          { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Name" },
          { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: "joi.string().required()", l: "Code Javascript" },
        ],
        collection: "api_routes",
        singular: "api_route",
        key: "api_id",
        columns: [{ name: "name" }]
      },

      api_libs: {
        fields: [
          { r: true, c: "1-1", n: "api_id", t: "hidden", j: "joi.string().required()", l: "Post ID" },
          { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Name" },
          { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: "joi.string().required()", l: "Code Javascript" },
        ],
        collection: "api_libs",
        singular: "api_lib",
        key: "api_id",
        columns: [{ name: "name" }]
      },

      api_scripts: {
        fields: [
          { r: true, c: "1-1", n: "api_id", t: "hidden", j: "joi.string().required()", l: "Post ID" },
          { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Name" },
          { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: "joi.string().required()", l: "Code Javascript" },
        ],
        collection: "api_scripts",
        singular: "api_script",
        key: "api_id",
        columns: [{ name: "name" }]
      },

      api_tests: {
        fields: [
          { r: true, c: "1-1", n: "api_id", t: "hidden", j: "joi.string().required()", l: "Post ID" },
          { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().regex((/^[a-z0-9\-]+$/)).required()", l: "Name" },
          { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: "joi.string().required()", l: "Code Javascript" },
        ],
        collection: "api_tests",
        singular: "api_test",
        key: "api_id",
        columns: [{ name: "name" }]
      }
    }
  }
}
module.exports = model