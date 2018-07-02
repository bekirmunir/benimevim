var mongoose = require('mongoose');
exports.ElkGorevSch = new mongoose.Schema({
    _id: mongoose.Schema.ObjectId,
    Chz: '',
    OnOff:{ type: Boolean, default:false },
    GorevTanimZamani:'',
    GorevCalisiyor:{ type: Boolean, default:false },
    GorevCalZamani:'',
    GorevSahibi:'',
    Aktif:{ type: Boolean, default:true }

});
exports.ElkGorev = mongoose.model('ElkGorev', exports.ElkGorevSch);
