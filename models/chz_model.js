var mongoose = require('mongoose');

exports.ChzSchema = new mongoose.Schema({
	_id: mongoose.Schema.ObjectId,
    regid: '',
    socket_id: '',
    cihaz:'',
    sonbaglanti:'',
    aktif:'',
    online:''

});


exports.ChzModel = mongoose.model('AndCihazlar', exports.ChzSchema);


exports.xbeeSchema = new mongoose.Schema({
    _id: mongoose.Schema.ObjectId,
    chzid:'',
    etiket:'',
    ChzModul:'',
    XbeeId:'',
    XbeeAdr64: '',
    XbeePin:'',
    Default:'',
    GetPinModu:'',
    GetPinModuZamani:'',
    GetPinModuModul:'',
    PinModSet:'',//modul tarafından set edilen pin modu
    Aktif: { type: Boolean, default: true },
    SetDeger: '',                               //set edilen deger
    SetModul: '',                            // set eden modul
    SetZamani: {type:Date},
    setDurumu: { type: Boolean, default: true }, //xbee'ye yazma durumu response OK veya fault
    denemeSay: {type:Number}, // xbeeye yazma dnemee sayısı
    SocYayAnahtari:'',
    SocYayAdi:'',
    UstGorevZamani:'',
    gorevler: [
        {
            _id: mongoose.Schema.ObjectId,
            SetDeger: '',                               //set edilen deger
            SetModul: '',                            // set eden modul
            SetZamani: '',
            setDurumu: { type: Boolean, default: true }, //xbee'ye yazma durumu response OK veya fault
            denemeSay: {type:Number} // xbeeye yazma dnemee sayısı
        }]

});


exports.xbeeModel = mongoose.model('xbeeCihazlar', exports.xbeeSchema);

