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
    if(err) { return handleError(req, res, err); }
    if(!post) { return res.sendStatus(404); }
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

  Post.find(query,"-usertotag -tagtouser -_id -userpoints -__ttl -__v", function (err, posts) {
    if(err) { return handleError(req, res, err); }
    var newPosts = []
    posts.forEach(function(element, index, array) {
      var con = true;
      if(element.toptag.charAt(0) == '#')
        if(!_.include(element.invitees, req.user.phone))
          con = false;
      if(con) {
        var tmp = element;
        _.forOwn(element.tags,function(value, key){
          //console.log(element.tagtouser);
          if(key.charAt(0) == '#') {
            if(!_.include(element.shares[req.user.phone], key)) {
              tmp.tags[key] = undefined;
              tmp.weight -= value;
            }
          }
        });
        if(tmp.weight > 0) { 
          tmp.shares = undefined;
          tmp.invitees = undefined;
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
  var privates = _.filter(tags,function(n) {
    return n.match(/^#/);
  });


  query.findOne(function(err, post) {
    if(err) { return handleError(req, res, err); }
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
          req.body.shares = {};
          req.body.invitees = [];
          req.body.weight = 0;
          req.body.topweight = 0;
          req.body.toptag = "";
          post = Post(req.body);
        }
        if(!_.include(post.invitees, user.phone))  post.invitees.push(user.phone);
        if(!post.shares) post.shares = {};

        if(post.shares.hasOwnProperty(user.phone)) {
          _.merge(post.shares[user.phone], privates);
        } else {
          post.shares[user.phone] = _.uniq(privates);
        }

        if(!post.userpoints.hasOwnProperty(user.phone))
          post.userpoints[user.phone] = user.score;

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
              if(element.substring(1) != user.phone) {
                if(post.shares.hasOwnProperty(element.substring(1))) {
                  _.merge(post.shares[element.substring(1)], privates);
                } else {
                  post.shares[element.substring(1)] = _.uniq(privates);
                }
              }
              if(!_.include(post.invitees, element.substring(1)))  post.invitees.push(element.substring(1));
              var query = User.where({phone: element.substring(1)});
              query.findOne(function(err, user) {
                if(err) { return handleError(req, res, err); }
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

                  var name = req.user.phone;
                  if(req.user.username) name = req.user.username;
                  var feed = {type: "invitation", tags: _.uniq(_.filter(tags,function(n){ return !n.match(/^@/); })), host: req.user.phone, loc: req.body.loc, name: name, address: req.body.address};
                  var invitation = Invitation( { address: req.body.address, from: req.user._id, to: user.phone } );

                  if(user.feed) {
                    user.feed.push(feed);
                  } else {
                    user.feed = [feed];
                  }
                  user.score++;
                  user.markModified("feed");
                  /*user.save(function(err){
                    if (err) return handleError(req, res, err);
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
         if(index == array.length - 1) {
           if(post.toptag == "") return res.sendStatus(304);
            post.markModified("tags");
            post.markModified("userpoints");
            post.markModified("usertotag"); 
            post.markModified("tagtouser");  
            post.markModified("shares"); 
            post.save(function(err){
              if(err) { return handleError(req, res, err); }
              return res.sendStatus(200);
            }); 
          }
        });
      });
    });
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

exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
