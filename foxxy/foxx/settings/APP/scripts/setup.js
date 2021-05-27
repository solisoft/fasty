'use strict';
const db = require('@arangodb').db;
const crypt = require('@arangodb/crypto');

if (!db._collection('settings')) {
  db._createDocumentCollection('settings');
  db._collection('settings').save({
    jwt_secret: crypt.genRandomAlphaNumbers(80),
    resize_ovh: '',
    token: crypt.genRandomAlphaNumbers(40),
    deploy_token: '',
    ba_pass: '',
    langs: 'en,fr',
    ba_login: '',
    home: '{ "all": "-", "slug": "home" }',
    upload_path: '/home/',
    upload_url: '/static/uploads',
    mailgun_apikey: 'mailgun_apikey',
    mailgun_domain: 'mailgun_domain',
    mailgun_from: 'mailgun_from',
  }) // Create an empty element
}


if (!db._collection('stats_aql')) {
  db._createDocumentCollection('stats_aql');
}
