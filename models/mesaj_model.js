var mongoose = require('mongoose');

exports.MesajSchema = new mongoose.Schema({
	_id: mongoose.Schema.ObjectId,
	regid: '',
	message: '',
	timestamp: ''
});

exports.MesajModel = mongoose.model('messages', exports.MesajSchema);
