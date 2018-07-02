var ChzModel = require('../models/chz_model').ChzModel;
var MesajModel = require('../models/mesaj_model').MesajModel;
var apiKey = 'AIzaSyBmcCCQObwsz-gefWsw0uVSqDFdF06dpDI';
var wns = require('dpush');

// Receive and broadcast messages
exports.gcmmesaj=function(mesaj,regid,isOnline){
console.log('gcm.....');
    ChzModel.find({
       aktif:'E',online:false
    }, function(err, cihazlar) {
        // Oops...
        if (err) {
            console.log('Hata:Cihaz listesini Okuyamadım')
            return 'Hata:Cihaz listesini Okuyamadım';

        }

        if (!cihazlar) {
            console.log('Hata:Cihaz listesiniboş')
            return 'Hata:Kayıtlı Cihaz Yok';
        }else{
            for (var i=0, counter=cihazlar.length; i < counter; i++) {

                var chz = cihazlar[i];
                 console.log('bulunan cihazlar:' +chz.regid);
                console.log(mesaj);

                wns.send(apiKey,chz.regid, mesaj, function (error, response) {
                        if (error)
                            console.error(error);
                        else
                            console.log(response);

                    });

                }
            }
        });





}

exports.mesaj = function(io, socket, data) {
	// No message, no fun
	if (!data.mesaj) {
		socket.emit('hata', {
			mesaj: 'içerik yok'
		});
		return;
	}

	// Find client broadcasting the message
	ChzModel.findOne({
		socket_id: socket.id
	}, function(err, doc) {
		// Oops...
		if (err) {
			socket.emit('hata', {
				mesaj: 'Cihaz listesini Okuyamadım'
			});
			return;
		}

		// Who is she?
		if (!doc) {
			socket.emit('hata', {
				message: 'chz yok'
			});
			return;
		}

		// Prepare message
		var mesaj = {
			regid: doc.regid,
			mesaj: data.mesaj,
			timestamp: Date.now()
		}

		var log = new MesajModel(mesaj);
		log.save();

		// Dünyaya gönder
		io.sockets.emit('mesaj', mesaj);
	});
}
