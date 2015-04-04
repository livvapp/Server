'use strict';

var _ = require('lodash');
var Post = require('./post.model');
var User = require('../user/user.model');


exports.tags = function(req, res) {
  /*var userId = req.user._id;*/
  if(!req.user.phone)  return res.send(304);
  console.log(req.user.phone);
  if(!req.get("address")) return res.send(403);
  var query = Post.where({address: req.get("address")});
  query.findOne( function(err, post) {
    if(err) { return handleError(res, err); }
    if(!post) { return res.send(404); }
    return res.json({list: post.usertotag[req.user.phone]});
  });

};

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

   // query.select("-usertotag -tagtouser");

  Post.find(query,"-usertotag -_id -__ttl -__v", function (err, posts) {
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
posts.push({address: "default", tags: {"Deltopia": 0, "I❤️ Vista": 0, "Dayger": 0, "Kickback": 0}, loc: {}, weight: 0});
    return res.json(posts);
  });

};

// Creates a new rating in the DB.
exports.create = function(req, res) {

  if(!req.body.hasOwnProperty("address")) return res.send(403);
  if(!req.body.hasOwnProperty("loc")) return res.send(403);
  if(!req.body.hasOwnProperty("tag")) return res.send(403);
  if(!(req.body.tag instanceof Array)) return res.send(403);
  if(req.body.tag.length == 0)  return res.send(403);
  var query = Post.where({address: req.body.address});
  var tags = _.uniq(req.body.tag);
  var user = req.user;

  query.findOne(function(err, post) {
    if(err) { return handleError(res, err); }

    if(!post) {
      req.body.tags = {};
      req.body.usertotag = {};
      req.body.weight = 0;
      req.body.topweight = 0;
      req.body.toptag = "";
      post = Post(req.body);
    }

    tags.forEach(function(element, index, array) {

       if(typeof element == "string") {
         if(element.indexOf(".") != -1) {
           var parts = element.split(".")
           element = "";
           parts.forEach(function(e, i, a){
             element += e;
           });
          } 
         if(element.indexOf("$") != -1) {
           var parts = element.split("$")
           element = "";
           parts.forEach(function(e, i, a){
               element += e;
           });
         } 
         if(req.body.tag.length == 0)
           return res.send(403);
       } else {
         return res.send(403);
      }

      if(!_.contains(post.usertotag[user.phone],element)) {

        post.weight++;
        if(post.tags.hasOwnProperty(element)) {
          post.tags[element]++;
        } else {
          post.tags[element] = 1;
        }

        if(post.tags[element] > post.topweight) {
          post.topweight = post.tags[element];
          post.toptag = element;
        }

        if(!post.usertotag[user.phone]) {
          post.usertotag[user.phone] = [element]; 
        } else {
          post.usertotag[user.phone].push(element);
        }
       }
    });

    if(post.toptag == "") return res.send(403)
    post.markModified("tags");
    post.markModified("usertotag");    
    post.save(function(err){
      if(err) { return handleError(res, err); }
      return res.send(200);
    }); 

  });



};

function handleError(res, err) {
  return res.send(500, err);
}

exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
