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
    /*var tags = {};
    posts.forEach(function(element, index, array) {
      element.tags.forEach(function(el, i, arr){
        if(tags[el]) {
          tags[el] += 1;
        } else {
          tags[el] = 1;
        }
      });
    });*/
    return res.json(200, posts);
  });

};

// Creates a new rating in the DB.
exports.create = function(req, res) {

  var query = Post.where({address: req.body.address});

  query.findOne(function(er, po) {
    if(er) { return handleError(res, er); }
    if(!po) {
      req.body.tags = {};
      if(req.body.tag)
        req.body.tags[req.body.tag] = 1;
      req.body.weight = 1;
      Post.create(req.body, function(err, post) {
        if(err) { return handleError(res, err); }
        return res.send(201);
      });
    } else {
      po.weight++;

      var tags = po.tags;
      //console.log(tags);  
      if(tags.hasOwnProperty(req.body.tag)) {
        //console.log("its true");
          tags[req.body.tag]++;
       } else {
          tags[req.body.tag] = 1;
       }
       po.tags = tags;
      /* console.log(tags);
       console.log(po.tags);
       console.log(po);*/
       po.markModified("tags");
       po.save(function(err, post) {
          if (err) return validationError(res, err);
          //console.log(post)
          return res.send(201);

          /*Post.findOne({}, function (error, post) {
            //console.log(post);
            return res.send(201);
          })*/
      });
    }
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
