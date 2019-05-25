'use strict';
const db = require('@arangodb').db;
const settings = db._collection('foxxy_settings').firstExample();
const request = require('@arangodb/request');
const params = module.context.argv[0];
const email_text = `Hi,

To confirm your email address, please click on the link below :
https://${settings.domain}/#confirm/${params.uuid}

If you don't know about this email, please ignore it

Best,
Foxxy app`


console.log(`Sent to ${params.to}`);
console.log(email_text);

request({
  method: "POST",
  url: "https://api:"+ settings.mailgun_apikey +"@api.mailgun.net/v3/"+ settings.mailgun_domain +"/messages",
  form: {
    from: settings.mailgun_from,
    to: params.to,
    subject: "Email confirmation",
    text: email_text
  }
})

