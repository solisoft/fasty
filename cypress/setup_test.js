var arangojs = require("arangojs");
var db = new arangojs.Database({
  url: "http://localhost:8530"
});

db.useBasicAuth("root", "password");
db.dropDatabase("db_test", function () {
}).then(function () {
  db.createDatabase("db_test");
}).catch(function () {
  db.createDatabase("db_test");
}) ;
