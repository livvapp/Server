'use strict';

var ttl = require('mongoose-ttl');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InvitationSchema = new Schema({
  to: String,
  from: { type: Schema.ObjectId, ref: 'User' },
  address: String
});

InvitationSchema.plugin(ttl, { ttl: '24h' });

module.exports = mongoose.model('Invitation', InvitationSchema);