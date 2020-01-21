'use strict';
const db = require('@arangodb').db;
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');
const sessionsMiddleware = require('@arangodb/foxx/sessions');
const jwtStorage = require('@arangodb/foxx/sessions/storages/jwt');
require("@arangodb/aql/cache").properties({ mode: "on" });

const router = createRouter();
const _settings = db.settings.firstExample();

const sessions = sessionsMiddleware({
  storage: jwtStorage({ secret: _settings.jwt_secret, ttl: 60 * 60 * 24 * 365 }),
  ttl: 60 * 60 * 24 * 365, // one year in seconds
  transport: 'header'
});

module.context.use(sessions);
module.context.use(router);

// -----------------------------------------------------------------------------
router.get('/', function (req, res) {
  var data = []
  res.send({ data });
})
.summary('Get Data for Dashboard');