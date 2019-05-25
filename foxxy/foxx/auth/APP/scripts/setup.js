'use strict';
const db = require('@arangodb').db;
const crypt = require('@arangodb/crypto');
const settings = 'foxxy_settings';
const users = 'users';
const auth = require('@arangodb/foxx/auth')();

const uuid = crypt.genRandomAlphaNumbers(80);

if (!db._collection(settings)) {
  db._createDocumentCollection(settings);
  db._collection(settings).save({
    jwt_secret: uuid,
    mailgun_apikey: "mailgun_apikey",
    mailgun_domain: "mailgun_domain",
    mailgun_from: "mailgun_from",
    upload_path: '/home/',
    upload_url: '/static/uploads'
  });
}

if (!db._collection(users)) {
  db._createDocumentCollection(users);
}

db._collection(users).ensureIndex({
  type: 'hash',
  fields: ['username'],
  unique: true
});

if(db.users.count() == 0) {
  db.users.save({
    username: 'demo@foxxy.ovh',
    authData: auth.create('977cebdd'),
    a: true,
    role: 'admin'
  })
}