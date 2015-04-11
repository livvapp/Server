'use strict';

var _ = require('lodash');
var Tag = require('./tag.model');

// Get list of tags
exports.index = function(req, res) {
  Tag.find(function (err, tags) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(tags);
  });
};

// Get a single tag
exports.show = function(req, res) {
  return res.send(501);
  /*if(!req.body.tag) return res.send(304);
  var redis = require("redis"), client = redis.createClient();
  client.on("error", function (err) {
      return handleError(res, err);
  });

  var args1 = [ req.body.tag, '0', '19' ];
  client.zrevrange(args1, function (err, response) {
      if (err) { return handleError(res, err); }
      var args2 = [ req.body.tag ];
      client.zcard(args2, function (err, count) {
        if (err) { return handleError(res, err); }
        client.quit();
        return res.json({list: response, total: count});
    });
  });*/
/*
  client.set("string key", "string val", redis.print);
  client.hset("hash key", "hashtest 1", "some value", redis.print);
  client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
  client.hkeys("hash key", function (err, replies) {
      console.log(replies.length + " replies:");
      replies.forEach(functio__n (reply, i) {
          console.log("    " + i + ": " + reply);
      });
      client.quit();
      return res.send(200);
  });*/

  /*
  Tag.findById(req.params.id, function (err, tag) {
    if(err) { return handleError(res, err); }
    if(!tag) { return res.send(404); }
    return res.json(tag);
  });*/
};

// Creates a new tag in the DB.
exports.create = function(req, res) {
  Tag.create(req.body, function(err, tag) {
    if(err) { return handleError(res, err); }
    return res.json(201, tag);
  });
};

// Updates an existing tag in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Tag.findById(req.params.id, function (err, tag) {
    if (err) { return handleError(res, err); }
    if(!tag) { return res.send(404); }
    var updated = _.merge(tag, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, tag);
    });
  });
};

// Deletes a tag from the DB.
exports.destroy = function(req, res) {
  Tag.findById(req.params.id, function (err, tag) {
    if(err) { return handleError(res, err); }
    if(!tag) { return res.send(404); }
    tag.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}