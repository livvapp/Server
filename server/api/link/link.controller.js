'use strict';

var _ = require('lodash');
var Link_ = require('./link.model');

// Get a single link
exports.show = function(req, res) {
  Link_.findOne({alias: req.params.id}, function (err, link) {
    if(err) { return handleError(req, res, err); }
    if(!link) { return res.sendStatus(404); }
    return res.json(link);
  });
};

function handleError(req, res, err) {
  var loggly = require('loggly');
 
  var logger = loggly.createClient({
    token: "3b05e407-4548-47ca-bc35-69696794ea62",
    subdomain: "livv",
    tags: ["NodeJS"],
    json:true
  });

  var error = {err: err}
  if(req.user)  error.user = req.user.phone
  logger.log(error);

  return res.status(500).json(err);
}