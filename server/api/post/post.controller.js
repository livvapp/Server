'use strict';

var _ = require('lodash');
var Post = require('./post.model');
var User = require('../user/user.model');
var link = require('../link/link.model');
var Invitation = require('../invitation/invitation.model');
var plivo = require('plivo');
var uuid = require('node-uuid');


exports.tags = function(req, res) {
  /*var userId = req.user._id;*/
  if(!req.user.phone)  return res.sendStatus(304);
  console.log(req.user.phone);
  if(!req.get("address")) return res.sendStatus(403);
  var query = Post.where({address: req.get("address")});
  query.findOne( function(err, post) {
    if(err) { return handleError(res, err); }
    if(!post) { return res.sendStatus(404); }
    return res.json({list: post.usertotag[req.user.phone]});
  });

};

// Get list of ratings
exports.index = function(req, res) {

  var myfriends = req.user.friends;
  if(!myfriends)  myfriends = [];
  myfriends.push(req.user.phone);

  // Possibly use geoWithin centerSphere
  var query = {
      loc: {
          $geoIntersects: {
              $geometry: {
                type: "Polygon" ,
                coordinates: [
                    [ 
                      [ Number(req.query.x1), Number(req.query.y1) ],
                      [ Number(req.query.x1), Number(req.query.y2) ],
                      [ Number(req.query.x2), Number(req.query.y2) ],
                      [ Number(req.query.x2), Number(req.query.y1) ],
                      [ Number(req.query.x1), Number(req.query.y1) ]
                    ]
                ]
              }
          }
      }
    };

   // query.select("-usertotag -tagtouser");

  Post.find(query,"-usertotag -_id -userpoints -__ttl -__v", function (err, posts) {
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
    var newPosts = []
    posts.forEach(function(element, index, array) {
      var con = true;
      if(element.toptag.charAt(0) == '#')
        if(_.intersection(myfriends, element.tagtouser[element.toptag]).length == 0)
          con = false;
      if(con) {
        var tmp = element;
        _.forOwn(element.tags,function(value, key){
          //console.log(element.tagtouser);
          if(key.charAt(0) == '#') {
            if(_.intersection(myfriends, element.tagtouser[key]).length == 0) {
              tmp.tags[key] = undefined;
              tmp.weight -= value;
            }
          }
        });
        if(tmp.weight > 0) {
          tmp.tagtouser = undefined;  
          newPosts.push(tmp);
        }
      }
    });

    return res.json(newPosts);
  });

};

// Creates a new rating in the DB.
exports.create = function(req, res) {

  if(!req.body.hasOwnProperty("address")) return res.sendStatus(403);
  if(!req.body.hasOwnProperty("loc")) return res.sendStatus(403);
  if(!req.body.hasOwnProperty("tag")) return res.sendStatus(403);
  if(!req.body.loc.hasOwnProperty("coordinates")) return res.sendStatus(403);
  if(!req.body.loc.coordinates[0]) return res.sendStatus(403);
  if(!req.body.loc.coordinates[1]) return res.sendStatus(403);
  if(!(req.body.tag instanceof Array)) return res.sendStatus(403);
  if(req.body.tag.length == 0)  return res.sendStatus(403);
  var query = Post.where({address: req.body.address});
  var tags = req.body.tag;//_.uniq(req.body.tag);
  var user = req.user;


  query.findOne(function(err, post) {
    if(err) { return handleError(res, err); }
    var invite = Invitation.where({address: req.body.address, to: user.phone});
    invite.findOne().populate('from').exec( function(err, invite) { 
      var tempuser = req.user;
      if(invite) {
        if(invite.from) {
          tempuser = invite.from;
          tempuser.score += 3;
        }
      }
      tempuser.save(function(err){
        if(!post) {
          req.body.tags = {};
          req.body.usertotag = {};
          req.body.tagtouser = {};
          req.body.userpoints = {};
          req.body.weight = 0;
          req.body.topweight = 0;
          req.body.toptag = "";
          post = Post(req.body);
        }

        if(!post.userpoints.hasOwnProperty(user.phone))
          post.userpoints[user.phone] = 10000000000; //user.score;

        post.userpoints[user.phone] -= tags.length;
        if(post.userpoints[user.phone] < 0) return res.sendStatus(403);

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
               return res.sendStatus(403);
           } else {
             return res.sendStatus(403);
          }

          var users = element.match(/@[0-9]{11,14}/g);
          if(users) {
            users.forEach(function(element, index, array){
              var query = User.where({phone: element.substring(1)});
              query.findOne(function(err, user){
                if(err) { return handleError(res, err); }
                if(!user) {
                  if(!_.contains(post.usertotag[req.user.phone],element)) {
                    if(post.usertotag.hasOwnProperty(req.user.phone))
                      post.usertotag[req.user.phone].push(element);
                    else
                      post.usertotag[req.user.phone] = [element];
                    var api = plivo.RestAPI({
                      authId: 'MAOGMYMDY2NDU1MDJMYM',
                      authToken: 'NTYyOGU0NGYyODVhZDk4NWM2NzM5NjYyMjEyNjg4'
                    });
                    var text;
                    if(req.user.username) {
                      text = req.user.username + " has invited you to the following location: ";
                    } else {
                      text = "You have been invited to the following location: ";
                    }
                    // text += link
                    var alias = uuid.v4().substring(0,5);
                    //TODO: Deal with a collision
                    link.create({alias: alias, lat: req.body.loc.coordinates[1], lon: req.body.loc.coordinates[0]},function(err){ if(err) console.log(err); });
                    text += "http://livv.net/m/" + alias + " - Livv";

                    var params = {
                      'src': '13525592572', // Caller Id
                      'dst' : element.substring(1), // User Number to Call
                      'text' : text,
                      'type' : "sms",
                    };

                    api.send_message(params, function (status, response) {
                      //TODO: LOGGING
                    });
                  }

                } else if(req.user.phone != user.phone){
                  // Push notification

                  var feed = {type: "invitation", tags: _.uniq(tags), host: req.user.phone, loc: req.body.loc, message: "Message not implemented yet."};
                  var invitation = Invitation( { address: req.body.address, from: req.user._id, to: user.phone } );
                  if(user.feed) {
                    user.feed.push(feed);
                  } else {
                    user.feed = [feed];
                  }
                  user.score++;
                  user.markModified("feed");
                  /*user.save(function(err){
                    if (err) return handleError(res, err);
                  });*/
                  user.save(function(err){
                    if (err) console.log(err);
                    User.findById(req.user._id,function(err, user) {
                      user.score++;
                      if (err) console.log(err);
                      if (user) {
                        user.save(function(err) {
                          if (err) console.log(err);
                        });
                      }
                    });
                  });
                  invitation.save(function(err){
                    if (err) return console.log(err);
                  });
                }
              });
            });
          } else {


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
              if(!_.contains(post.usertotag[user.phone], element))
                post.usertotag[user.phone].push(element);
            }

            if(!post.tagtouser[element]) {
              post.tagtouser[element] = [user.phone]; 
            } else {
              if(!_.contains(post.tagtouser[element], user.phone))
                post.tagtouser[element].push(user.phone);
            }
         }
        });
        if(post.toptag == "") return res.sendStatus(304);
        post.markModified("tags");
        post.markModified("userpoints");
        post.markModified("usertotag"); 
        post.markModified("tagtouser");    
        post.save(function(err){
          if(err) { return handleError(res, err); }
          return res.sendStatus(200);
        }); 
      });
    });
  });



};

function handleError(res, err) {
  return res.sendStatus(500, err);
}

exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
