var ChzModel = require('../models/chz_model').ChzModel;

// Cihaz giriş login
exports.login = function( socket, data) {
	// regid boş olmamamlı ?
	if (!data.regid) {
		socket.emit('hata', {
			message: 'RegID zorunlu'
		});
		return;
	}

	// Çift Kayıt Kontrolu
    ChzModel.update( {"regid":data.regid },
        {"regid":data.regid, "sonbaglanti": Date(),aktif:'E',"online":true,"socket_id":socket.id},
        {upsert:true}, function(){
            //emit latest to all clients

            ChzModel.save;
            socket.emit('Register',
                "<<OK>>",
                "true"
            );
        }
            )

}

// Çıkış yordamı
exports.logout = function(id) {
    ChzModel.update( {"socket_id":id },
        {aktif:'E',"online":false},
        {upsert:true}, function(){
            //emit latest to all clients

            ChzModel.save;


        }
    )



}

// Cihaz ve Siteme bilgi verme emit yordamı
exports.cihazlar = function(io, socket, data) {
	ChzModel.find({}, function(err, data) {
		io.sockets.emit('cihaz', {
			cihazlar: data
		});
	});
}


