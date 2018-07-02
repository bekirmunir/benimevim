var mongoose = require('mongoose');
exports.SulamaGorevSch = new mongoose.Schema({
    _id: mongoose.Schema.ObjectId,
    ValfNo: '',
    ValfOnSure: '',
    GorevTanimZamani:'',
    GorevCalisiyor:{ type: Boolean, default:false },
    GorevCalZamani:'',
    GorevSahibi:'',
    Aktif:{ type: Boolean, default:true }

});
exports.SulamaGorev = mongoose.model('SulamaGorev', exports.SulamaGorevSch);
