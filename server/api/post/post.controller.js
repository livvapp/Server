'use strict';

var _ = require('lodash');
var Post = require('./post.model');
var User = require('../user/user.model');


exports.tags = function(req, res) {
  /*var userId = req.user._id;*/
  if(!req.user.username)  return res.send(304);
  console.log(req.user.username);
  if(!req.get("address")) return res.send(403);
  var query = Post.where({address: req.get("address")});
  query.findOne( function(err, post) {
    if(err) { return handleError(res, err); }
    if(!post) { return res.send(404); }
    return res.json({list: post.usertotag[req.user.username]});
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

  Post.find(query,"-usertotag -tagtouser -_id -__ttl -__v", function (err, posts) {
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

  var query = Post.where({address: req.body.address});
  if(!req.body.hasOwnProperty("tag")) return res.send(403);
  if(typeof req.body.tag != "string") return res.send(403);


  if(req.body.tag) {
    if(typeof req.body.tag == "string") {
      if(req.body.tag.indexOf(".") != -1) {
        var parts = req.body.tag.split(".")
        req.body.tag = "";
        parts.forEach(function(element, index, array){
          req.body.tag += element;
        });
      } 
      if(req.body.tag.indexOf("$") != -1) {
        var parts = req.body.tag.split("$")
        req.body.tag = "";
        parts.forEach(function(element, index, array){
          req.body.tag += element;
        });
      } 
      if(req.body.tag.length == 0)
        return res.send(403);
    }
  }

  /*if(req.body.tag) {
    if(typeof req.body.tag == "string") {
      req.body.tag.replace("^.#/","");
      req.body.tag.replace("/#.^","");
      if(req.body.tag.length == 0)
        return res.send(403);
    }
  }*/

  query.findOne(function(er, po) {
    if(er) { return handleError(res, er); }
    var userId = req.user._id;
    User.findById(userId, function(err, user) {
      if(!user.username) { return res.send(304); }
      if(!po) {
        req.body.tags = {};
        req.body.tags["Deltopia"] = 0;
        req.body.tags["I❤️ Vista"] = 0;
        req.body.tags["Dayger"] = 0;
        req.body.tags["Kickback"] = 0;
        if(req.body.tag) {
          req.body.tags[req.body.tag] = 1;
          req.body.toptag = req.body.tag;
          req.body.topweight = 1;
          req.body.tagtouser = {};
          req.body.tagtouser[req.body.tag] = [user.username];
          req.body.usertotag = {};
          req.body.usertotag[user.username] = [req.body.tag];
         /*var redis = require("redis"), client = redis.createClient();
        client.on("error", function (err) {
        return handleError(res, err);
        });
         var args = [ req.body.tag, 1, user.username ];
         client.zincrby(args, function (err, response) {
          if (err) return validationError(res, err);
          client.quit();
         });*/
        }

        req.body.weight = 1;
        Post.create(req.body, function(err, post) {
          if(err) { return handleError(res, err); }
          return res.send(201);
        });
      } else {
        if(_.contains(po.usertotag[user.username],req.body.tag))  return res.send(304);
        po.weight++;
        po.resetTTL();

        var tags = po.tags;
        //console.log(tags);  
        if(tags.hasOwnProperty(req.body.tag)) {
          //console.log("its true");
            tags[req.body.tag]++;
        } else {
            tags[req.body.tag] = 1;
        }
        po.tags = tags;

        if(tags.hasOwnProperty(req.body.tag)) {
          if(po.tags[req.body.tag] > po.topweight) {
            po.toptag = req.body.tag;
            po.topweight = po.tags[req.body.tag];
          }
        }

        if(po.usertotag.hasOwnProperty(user.username)) {
          if(!_.contains(po.usertotag[user.username],req.body.tag)) {
            po.usertotag[user.username].push(req.body.tag);
          }
        } else {
          po.usertotag[user.username] = [req.body.tag];
        }

        if(po.tagtouser.hasOwnProperty(req.body.tag)) {
          if(!_.contains(po.tagtouser[req.body.tag],user.username)) {
            po.tagtouser[req.body.tag].push(user.username);
          }
        } else {
          po.tagtouser[req.body.tag] = [user.username];
        }


         if(_.size(po.tags) == 10) {
          if(po.tags.hasOwnProperty("Deltopia"))
            if(po.tags["Deltopia"] == 0)
              delete po.tags["Deltopia"];
          if(po.tags.hasOwnProperty("I❤️ Vista"))
            if(po.tags["I❤️ Vista"] == 0)
              delete po.tags["I❤️ Vista"];
          if(po.tags.hasOwnProperty("Dayger"))
            if(po.tags["Dayger"] == 0)
              delete po.tags["Dayger"];
          if(po.tags.hasOwnProperty("Kickback"))
            if(po.tags["Kickback"] == 0)
              delete po.tags["Kickback"];
         }
        /* console.log(tags);
         console.log(po.tags);
         console.log(po);*/
        /*ar redis = require("redis"), client = redis.createClient();
        client.on("error", function (err) {
        return handleError(res, err);
        });
         var args = [ req.body.tag, po.tags[req.body.tag], user.username ];
         client.zincrby(args, function (err, response) {
          if (err) return validationError(res, err);
          client.quit();
          po.tagtouser[req.body.tag].forEach(function(element, index, array){
            if(element != user.username) {
              var client1 = redis.createClient();
              client1.on("error", function (err) {
                return handleError(res, err);
              });
              var args1 = [ req.body.tag, 1, element ];
              client1.zincrby(args1, function (err, response) {
                if (err) return validationError(res, err);
                client1.quit();
              });
            }
          });
         });*/

         po.tagtouser[req.body.tag].forEach(function(element, index, array){

         });

         po.markModified("tags");
         po.markModified("tagtouser");
         po.markModified("usertotag");
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
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
