'use strict';
const db = require('@arangodb').db;
const joi = require('joi');
const createAuth = require('@arangodb/foxx/auth');
const createRouter = require('@arangodb/foxx/router');
const sessionsMiddleware = require('@arangodb/foxx/sessions');
const jwtStorage = require('@arangodb/foxx/sessions/storages/jwt');
require("@arangodb/aql/cache").properties({ mode: "on" });

const queues = require('@arangodb/foxx/queues');
const crypt = require('@arangodb/crypto');

const request = require('@arangodb/request');
const auth = createAuth();
const router = createRouter();
const users = db.users;

const each = require('lodash').each;
const queue = queues.create('mailer');

const _settings = db.settings.firstExample();

const sessions = sessionsMiddleware({
  storage: jwtStorage({ secret: _settings.jwt_secret, ttl: 60 * 60 * 24 * 365 }),
  ttl: 60 * 60 * 24 * 365, // one year in seconds
  transport: 'header'
});
module.context.use(sessions);
module.context.use(router);

var fields = []
var schema = {}

var loadFields = function() {

  // r: new row; c: classname; n: name/id; t: type; j: joi validation; l: label; d: data list
  fields = [
    { r: true,  c:"uk-width-1-1", n:"company", t:"string", j: joi.string().required(), l:"Company" },
    { r: true,  c:"uk-width-1-1", n:"fn", t:"string", j: joi.string().required(), l:"First Name" },
    { r: true,  c:"uk-width-1-1", n:"ln", t:"string", j: joi.string().required(), l:"Last Name" },
    { r: true,  c:"uk-width-1-1", n:"username", t:"email", j: joi.string().required(), l:"Email" },
    { r: true,  c:"uk-width-1-1", n:"password", t:"password", j: joi.string().min(8).max(32).required(), l:"Password" },
    { r: true,  c:"uk-width-1-1", n:"password_confirmation", t:"confirm", j: joi.string().required(), l:"Password Confirmation" }
  ]

  schema = {}
  each(fields, function(f) {
    schema[f.n] = f.j
  })
}

loadFields();

// -----------------------------------------------------------------------------
router.get('/check_form', function (req, res) {
  var errors = []
  try {
    errors = joi.validate(JSON.parse(req.queryParams.data), schema, { abortEarly: false }).error.details
  } catch(e) {}
  res.send({errors: errors });
})
.description('Check the form for live validation');
// -----------------------------------------------------------------------------
router.get('/fields', function (req, res) {
  loadFields()
  res.send({ fields: fields });
})
.description('Get all fields to build form');
// -----------------------------------------------------------------------------
// GET whoami
router.get('/whoami', function (req, res) {
  if(!req.session.uid) res.throw('unauthorized')
  try {
    const user = users.document(req.session.uid);
    res.send({
      username: user.username, role: user.role, a: user.a, resize_api_key: _settings.resize_ovh
    });
  } catch (e) {
    res.send({username: null});
  }
})
.description('Returns the currently active username.');
// -----------------------------------------------------------------------------
// POST login
router.post('/login', function (req, res) {
  // This may return a user object or null
  const user = users.firstExample({
    username: req.body.username,
    a: true
  });
  const valid = auth.verify(
    user ? user.authData : {},
    req.body.password
  );
  // Log the user in
  if(valid) {
    req.session.uid = user._key;
  }
  res.setHeader("Access-Control-Expose-Headers", "X-Session-Id");

  res.send({success: valid, uid: req.session});
})
.body(joi.object({
  username: joi.string().required(),
  password: joi.string().required()
}).required(), 'Credentials')
.description('Logs a registered user in.');
// -----------------------------------------------------------------------------
// POST logout
router.post('/logout', function (req, res) {
  if (req.session.uid) {
    req.session.uid = null;
  }
  res.send({success: true});
})
.description('Logs the current user out.');
// -----------------------------------------------------------------------------
// POST signup
router.post('/signup', function (req, res) {
  const user = req.body;
  const uuid = crypt.genRandomAlphaNumbers(40);

  try {
    // Create an authentication hash
    user.authData = auth.create(user.password);
    delete user.password;
    delete user.password_confirmation;

    user.email_code = uuid;
    delete user.company;

    const meta = users.save(user);
    Object.assign(user, meta);
  } catch (e) {
    res.throw('bad request', 'Username already taken', e);
  }
  // Log the user in
  queue.push(
    {mount: '/auth', name: 'send-mail'},
    {to: user.username, uuid: uuid}
  );
  req.session.uid = user._key;
  res.send({success: true});
})
.body(joi.object(schema), 'Credentials')
.description('Creates a new user and logs them in.');
// -----------------------------------------------------------------------------
router.post('/confirm', function (req, res) {
  const user = users.firstExample({
    email_code: req.body.uuid
  });
  if(user) {
    user.a = true;
    delete user.email_code;
    users.update(user._id, user);
  }
  res.send({success: true});
})
.body(joi.object({
  uuid: joi.string().required(),
}).required(), 'UUID')
.description('Check email code');


