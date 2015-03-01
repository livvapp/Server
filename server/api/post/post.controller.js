'use strict';

var _ = require('lodash');
var Post = require('./post.model');

// Get list of ratings
exports.index = function(req, res) {


  // Possibly use geoWithin centerSphere
  var query = {
      loc: {
          $geoIntersects: {
              $geometry: {
                type: "Polygon" ,
                coordinates: [
                    [ 
                      [ Number(req.param('x1')), Number(req.param('y1')) ],
                      [ Number(req.param('x1')), Number(req.param('y2')) ],
                      [ Number(req.param('x2')), Number(req.param('y2')) ],
                      [ Number(req.param('x2')), Number(req.param('y1')) ],
                      [ Number(req.param('x1')), Number(req.param('y1')) ]
                    ]
                ]
              }
          }
      }
    };

  Post.find(query, function (err, posts) {
    if(err) { return handleError(res, err); }
    return res.json(200, posts);
  });

};

// Creates a new rating in the DB.
exports.create = function(req, res) {
  Post.create(req.body, function(err, post) {
    if(err) { return handleError(res, err); }
    return res.json(201, post);
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
