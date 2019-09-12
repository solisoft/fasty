/* jshint asi: true, esversion: 6 */
const express   = require('express')
const morgan    = require('morgan')
const yaml      = require('js-yaml')
const request   = require('request').defaults({ encoding: null })
const bp        = require('body-parser')
const sharp     = require('sharp')
const fs        = require('fs')
const uuid      = require('node-uuid')
const _         = require('lodash')
const arangojs  = require('arangojs')

const app     = express()
const config  = yaml.safeLoad(fs.readFileSync(__dirname + '/config.yml', 'utf8'))

// DB setup
var db = new arangojs.Database({ url: config.arango_host })
db.useDatabase(config.arango_db)
db.useBasicAuth(config.arango_user, config.arango_pass)
var assets = db.collection('assets')

// Global variables
const root_path = config.root_path
const max_size  = config.max_size
var mime_types  = config.mime_type ? config.mime_type.split(',') : []

if (!fs.existsSync(root_path)) { fs.mkdirSync(root_path, 0744); }
if (!fs.existsSync(root_path + '/tmp')) { fs.mkdirSync(root_path + '/tmp', 0744) }

app.set('views', __dirname + '/views');
app.set('view engine', 'pug')
app.use(bp.json({limit: '10mb'})) // for parsing application/json
app.use(bp.urlencoded({ extended: true, limit: '10mb' })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))
app.use(morgan('tiny'))
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

////////////////////////////////////////////////////////////////////////////////////////////////////
// global methods

var createImage = function (dirname, filename, _uuid, res) {
  var image = sharp(filename)
  image.metadata().then(function (metadata) {
    if (_.includes(mime_types, metadata.format)) {
      if (metadata.width > max_size || metadata.height > max_size) {
        image = image.resize(max_size)
      }
      image.toFile(dirname + '/' + _uuid + '.' + metadata.format, function (err, info) {
        assets.save({
          path: dirname + '/' + _uuid + '.' + metadata.format,
          metadata: metadata,
          uuid: _uuid
        }).then(function () { res.json({ success: true, filename: _uuid }) })
      })

    } else { res.json({ success: false, reason: 'Bad input format' }) }
  })
}

var checkExisitingImage = function (req, res, callback) {
  var input = root_path + req.params.filename
  fs.access(input, fs.constants.R_OK, (err) => {
    if (err) { res.json({ success: false, reason: 'not found', err }) }
    else {
      var mtime = fs.statSync(input).mtime
      var date = (new Date(mtime)).toJSON().split('T')[0].split('-').join('/')
      var dirname = root_path + config.default_user + '/' + date
      if (!fs.existsSync(dirname)) { fs.mkdirSync(dirname, { mode: 0744, recursive: true }); }
      var image = sharp(input)
      image.metadata().then(function (metadata) {
        var desfile = dirname + '/' + req.params.filename + '.' + metadata.format
        fs.copyFile(input, desfile, function () {
          assets.save({ path: desfile, type: metadata.format, uuid: req.params.filename })
            .then(function () {
              fs.unlinkSync(input)
              callback(desfile)
            })
        })
      })
    }
  })
}

var updateLastTime = function (uuid) { assets.updateByExample({ uuid }, { date: +new Date() }) }

var render_output = function(image, format, output, req, res) {
  switch(format) {
    case 'webp':
      image.webp().toBuffer(function(err, data, info) { res.send(data) })
      break;
    case 'base64':
      image.toBuffer(function(err, data, info) { res.send(data.toString('base64')) })
      break;
    case 'base64_png': // Used for preview just like airbnb effect
      image.png().toBuffer(function(err, data, info) { res.send(data.toString('base64')) })
      break;
    default:
      image.toFile(root_path + output, function (err) {
        updateLastTime(req.params.filename)
        fs.createReadStream(root_path + output).pipe(res);
      })
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////

// Root page (doc)
app.get('/', function (req, res) { res.render('index', {}) })

// Upload methods
app.post('/upload_base64/', function (req, res) {
  if (req.body.key) {
    console.log(_.keys(req.body))
    db.collection('users').firstExample({ apikey: req.body.key }).then(function (user) {
      var date = (new Date()).toJSON().split('T')[0].split('-').join('/')
      if (req.body.image && req.body.filename) {
        var _uuid = uuid.v1()
        var filename = '/tmp/' + _uuid
        var dirname = root_path + user._key + '/' + date
        var base64Data = req.body.image
        if (req.body.image.indexOf('base64,') >= 0) base64Data = req.body.image.split('base64,')[1]
        if (!fs.existsSync(dirname)) { fs.mkdirSync(dirname, { mode: 0744, recursive: true }); }
        fs.writeFile(filename, base64Data, 'base64', function (err) {
          if (err) { res.json({ success: false, err: err }) }
          else { createImage(dirname, filename, _uuid, res) }
        })
      } else { res.status(400).json({ success: false, reason: 'bad params' }) }
    }).catch(function (err) { console.log(err); res.status(401).json({ success: false, reason: 'Bad APIKEY' }) })
  } else {
    res.status(401).json({ success: false, reason: 'Bad APIKEY' })
  }
})

app.post('/upload_http/', function (req, res) {
  if (req.body.key) {
    db.collection('users').firstExample({ apikey: req.body.key }).then(function (user) {
      var date = (new Date()).toJSON().split('T')[0].split('-').join('/')
      if (req.body.image) {
        request.get(req.body.image, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var base64Data = Buffer.from(body).toString('base64')
            var _uuid = uuid.v1()
            var filename = '/tmp/' + _uuid
            var dirname = root_path + user._key + '/' + date
            if (!fs.existsSync(dirname)) { fs.mkdirSync(dirname, { mode: 0744, recursive: true }); }
            fs.writeFile(filename, base64Data, 'base64', function (err) {
              if (err) { res.json({ success: false, err: err }) }
              else { createImage(dirname, filename, _uuid, res) }
            })
          }
        })
      } else { res.status(400).json({ success: false, reason: 'no image provided' }) }
    }).catch(function (err) { console.log(err); res.status(401).json({ success: false, reason: 'Bad APIKEY' }) })
  } else {
    res.status(401).json({ success: false, reason: 'Bad APIKEY' })
  }
})
////////////////////////////////////////////////////////////////////////////////////////////////////

// Original Image
var resize_o = function (path, req, res) {
  var input = path
  var format = req.params.format || 'jpg'
  fs.access(input, fs.constants.R_OK, (err) => {
    if(err) {
      res.status(404).json({ success: false, reason: 'not found' })
    } else {
      updateLastTime(req.params.filename)
      if(format == 'webp') {
        sharp(input).webp().toBuffer(function(err, data, info) { res.send(data) })
      } else {
        fs.createReadStream(input).pipe(res)
      }
    }
  })
}
app.get('/o/:filename/:format?', function (req, res) {
  assets.firstExample({ uuid: req.params.filename })
    .then(function (data) { resize_o(data.path, req, res) })
    .catch(function (err) {
      checkExisitingImage(req, res, function (path) { resize_o(path, req, res) })
    })
})
////////////////////////////////////////////////////////////////////////////////////////////////////

// Resize image by width(keep aspect ratio)
var resize_x = function (path, req, res) {
  var input = path
  var output = 'tmp/' + req.params.filename + '-r-' + req.params.x
  var format = req.params.format || 'jpg'
  fs.access(root_path + output, fs.constants.R_OK, (err) => {
    if(err) {
      var x = parseInt(req.params.x)
      if(x > 1200) x = 1200
      var image = sharp(input).resize(x, null)

      if(req.body.as_proxy) {
        image.toBuffer(function(err, data, info) { res.send(data.toString('base64')) })
      } else {
        render_output(image, format, output, req, res)
      }
    } else {
      fs.createReadStream(root_path + output).pipe(res);
    }
  })
}

app.get('/r/:filename/:x/:format?', function (req, res) {
  assets.firstExample({ uuid: req.params.filename })
    .then(function (data) {
      req.params.format = req.params.format || ''
      if(req.params.format.match(/[0-9]+/g)) {
        req.params.y = req.params.format
        resize_xy(data.path, req, res)
      }
      else resize_x(data.path, req, res)
    })
    .catch(function () {
      checkExisitingImage(req, res, function (path) { resize_x(path, req, res) })
    })
})
////////////////////////////////////////////////////////////////////////////////////////////////////

// Resize image by height(keep aspect ratio)
var resize_y = function (path, req, res) {
  var input = path
  var output = 'tmp/' + req.params.filename + '-rh-' + req.params.y
  var format = req.params.format || 'jpg'
  res.setHeader('Cache-Control', 'public, max-age=31557600');
  fs.access(root_path + output, fs.constants.R_OK, (err) => {
    if(err) {
      var y = parseInt(req.params.y)
      if(y > 1200) y = 1200
      var image = sharp(input).resize(null, y)
      if(req.body.as_proxy) {
        image.toBuffer(function(err, data, info) { res.send(data.toString('base64')) })
      } else {
        render_output(image, format, output, req, res)
      }
    } else { fs.createReadStream(root_path + output).pipe(res); }
  })
}
app.get('/rh/:filename/:y/:format?', function (req, res) {
  assets.firstExample({ uuid: req.params.filename })
    .then(function (data) { resize_y(data.path, req, res) })
    .catch(function () {
      checkExisitingImage(req, res, function (path) { resize_y(path, req, res) })
    })
})
////////////////////////////////////////////////////////////////////////////////////////////////////

// Resize image (keep aspect ratio)
var resize_xy = function (path, req, res) {
  var input = path
  var output = 'tmp/'+req.params.filename + '-r-' +
                req.params.x+'-'+req.params.y
  var format = req.params.format || 'jpg'
  fs.access(root_path + output, fs.constants.R_OK, (err) => {
    if(err) {
      var x = parseInt(req.params.x)
      var y = parseInt(req.params.y)
      if(x > 1200) x = 1200
      if(y > 1000) y = 1200
      var image = sharp(input).resize(x, y)
      if(req.body.as_proxy) {
        image.toBuffer(function(err, data, info) { res.send(data.toString('base64')) })
      } else {
        render_output(image, format, output, req, res)
      }
    } else { fs.createReadStream(root_path + output).pipe(res); }
  })
}

app.get('/r/:filename/:x/:y/:format?', function (req, res) {
  assets.firstExample({ uuid: req.params.filename })
    .then(function (data) { resize_xy(data.path, req, res) })
    .catch(function () {
      checkExisitingImage(req, res, function (path) { resize_xy(path, req, res) })
    })
})

app.get('/s/:filename/:size/:format?', function (req, res) {
  req.params.x = req.params.size
  req.params.y = req.params.size
  assets.firstExample({ uuid: req.params.filename })
    .then(function (data) { resize_xy(data.path, req, res) })
    .catch(function () {
      checkExisitingImage(req, res, function (path) { resize_xy(path, req, res) })
    })
})

app.listen(3000, function () { console.log('resize.ovh listening on port 3000!') })