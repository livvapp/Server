/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

var loggly = require('loggly');
 
 var logger = loggly.createClient({
    token: "3b05e407-4548-47ca-bc35-69696794ea62",
    subdomain: "livv",
    tags: ["NodeJS"],
    json:true
});

  // allow cross origin stuff
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

 app.use(function (req, res, next) {
  var log = {};
  log.req = req.body;
  log.url = req.originalUrl;
  log.method = req.method;
  res.on('finish', function(){
    if(req.user)  log.user = req.user.phone;
    log.status = res.statusCode;
    logger.log(log);
  });
  next();
});
 
  // Insert routes below
  app.use('/api/links', require('./api/link'));
  app.use('/api/tokens', require('./api/token'));
  app.use('/api/posts', require('./api/post'));
  app.use('/api/emails', require('./api/email'));
  app.use('/api/users', require('./api/user'));

  app.use('/auth', require('./auth'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
