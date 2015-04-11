'use strict';

var _ = require('lodash');
var Link_ = require('./link.model');

// Get a single link
exports.show = function(req, res) {
  Link_.findOne({alias: req.query.id}, function (err, link) {
    if(err) { return handleError(res, err); }
    if(!link) { return res.sendStatus(404); }
    return res.json(link);
  });
};

function handleError(res, err) {
  return res.send(500, err);
}