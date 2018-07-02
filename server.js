var restify = require('restify')
var mongoose = require('mongoose'),
    cihaznet = require('./controllers/AndChzKontrol'),
    mesajnet = require('./controllers/mesaj_control');
var SulamaGorevModel = require('./models/valfgorev_model').SulamaGorev;
var ElkGorevModel = require('./models/elkgorev_model').ElkGorev;
var XbeechzModel= require('./models/chz_model').xbeeModel;
var SunCalc = require('suncalc');
var js2xmlparser = require("js2xmlparser");
var os=require('os');

var sulamayaz=false;
var sulamaint=0;
var moment =require('moment');

mongoose.connect('mongodb://localhost/bekon');

var mesajdata = {
    SERVER_MESSAGE:"Sistem Artık Yenileniyor...",
    UzakIp:'0.0.0.0',
    LocalIP:'0.0.0.0',
    UzakPort:'2222',
    YerelPort:'2222',
    kamera: '1',
    Sicaklik:'15.6',
    Kapi: 'Kapali',
    Garaj: 'Açiliyor'
};

var testdata = {
        "@": {
            "ad_closebutton_ad_reappear_after": "600",
            "ad_closebutton_appear_after": "90",
            "ad_closebutton_enable": "1",
        },
        "CihazGroup": {
            "@": {"isim": "Aydınlatma"},
            "Cihaz":[
                    {"@": {"ID": "1", "isim": "Lamba1", "adres": "sss", "pinno": "d1","aktif": "true"},"durum":"On"},
                    {"@": {"ID": "2", "isim": "Lamba2", "adres": "sss", "pinno": "d1","aktif": "true"},"durum":"Off"}
            ]
        }
    }

var server = restify.createServer();
var io = require('socket.io').listen(server);
var Client = io.sockets;

server.get('/', function indexHTML(req, res, next) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
});


io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

server.listen(1111, function () {
    console.log('socket.io server listening at %s', server.url);
});

Client.on('connection',function(socket){
    socket.on('disconnect', function () {
        console.log('Cihaz Ayrıldı Baglantı No:'+socket.id);
        cihaznet.logout(socket.id);
    });






    socket.on('input',function(data){
        console.log("data-------> name: "+data.name+" message: "+data.message);
        //insert into mongodb server
        //json data from client
        var name = data.name,
            message = data.message,
            whitespacePattern = /^\s*$/;
        if(whitespacePattern.test(name) || whitespacePattern.test(message)){
            sendStatus("Name and Message is required.");
            console.log("invalid data");
        }else{
            col.insert({name: name,message:message},function(){
                //emit latest to all clients
                Client.emit('output',[data]);
                sendStatus({
                    message:"message sent",
                    clear:true
                });
            });
        }
        //on input
    });

    socket.on('login attempt', function(data) {
        // cihaznet.login(io, socket, data);
    });
    socket.on('ValfAyar', function(valfdata) {
        SulamaGorevYaz(valfdata);
        console.log(valfdata);

        Client.emit('<<ValfAyarSERVER>>',valfdata.ValfNo+"",valfdata.Sure+"");



    });
    socket.on('ButtonSet', function(butdata) {
        // cihaznet.login(io, socket, data);
        Client.emit('<<ButtonSet>>',butdata.button+"",butdata.onoff+"","false"); //button ilk set edildiginde çalışmadurumu false olarak yayın yap
        ElkGorevYaz(butdata);

    });




    socket.on('ValfDegerAl', function(data) {
        // cihaznet.login(io, socket, data);
        console.log(data);
        SulamaGorevOkuFn(Client);
    });
    socket.on('ElkDegerAl', function(data) {
        // cihaznet.login(io, socket, data);
        console.log(data);
        Gorevoku(Client,"Dış Aydınlatma")
    });

    socket.on('RegidKayit',function(regdata){
        cihaznet.login( socket, regdata);
        console.log("data-------> name: "+regdata.name+" message: "+regdata.message);
        //insert into mongodb server
        //json data from client
        var regid = regdata.regid,
            // message = data.message,
            whitespacePattern = /^\s*$/;
        if(whitespacePattern.test(regid) ){
            sendStatus("Regid Zorunludur..");
            console.log("hatalı data");

        }
        //on input
    });

});
//on connection



console.log(js2xmlparser.parse("cihazlist", testdata));

mesajnet.gcmmesaj(mesajdata,'','');

var xbeePromise2 = require('xbee-promise/lib/xbee-promise.js');

var xbee = xbeePromise2({
    serialport: '/com1',
    serialPortOptions: {
        baudrate: 9600
    },
    module: "ZigBee",
    debug: true
});
var command="ND";
xbee.localCommand({
    command: command

}).then(function (f) {
    console.log("Command successful:\n", f);
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
   // xbee.close();
});






//var http= require('http');
var  mesajnet = require('./controllers/mesaj_control');


function otogorev() {
    var times = SunCalc.getTimes(new Date(), 40.7681, 30.2388);

    var sunrise = moment(times.sunrise);
    var sunset = moment(times.sunset);
    var zaman = moment(new Date());
    var gece=false;
    var otogorevrun =false;

    console.log("Guneş dogumu:" + sunrise.toString());
    console.log("Guneş batımı:" + sunset.toString());
    console.log("zaman:" + zaman.toString());
   // zaman.add(saatdeger,'hours');
    var kosul = 'Lamba';

    if (zaman.isBefore(sunset) &&zaman.isAfter(sunrise)) { // true

        console.log("zaman :" + zaman.format() + "durum Gündüz");
        gece=false;
    }else {
        console.log("zaman :" + zaman.format() + "durum Gece ");
        gece=true;
    }


    ElkGorevModel.find({
        Chz: new RegExp(kosul)
    }, function (err, gorevlist) {
        // Oops...
        if (err) {
            console.log('GorevOto:', 'Hata:ElkGörev listesini Okuyamadım');
            return 'Hata:ElkGörev listesini Okuyamadım';

        }

        if (!gorevlist) {
            console.log('GorevOku:', 'Hata:Elk gorev listesinizboş')
            return 'Hata:Oto Elk Kayıtlı gorev Yok';
        } else {
            for (var i = 0, counter = gorevlist.length; i < counter; i++) {

                var data = gorevlist[i];
                console.log("durum:" + gece+" Chz:"+data.Chz+" onoff: "+data.OnOff);

                if (gece!=data.OnOff ) {
                    console.log("gunduz gece modu:yazıldı "+data.OnOff  );
                    var veri = {button:data.Chz,onoff:gece.toString(),regid : "OtoGorev"};
                    ElkGorevYaz(veri);
                    otogorevrun=true;

                }

            }
            if (otogorevrun ){
                mesajdata.SERVER_MESSAGE="Aydınlatma Oto Görev Çalıştı";
                mesajnet.gcmmesaj(mesajdata,'','');


            }

            setTimeout(otogorev, 300000);

        }
    })
};


function ic_ip_al() {

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (k in interfaces) {
        for (k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family == 'IPv4' && !address.internal) {
                addresses.push(address.address)
            }
        }
    }
    return addresses; //local :Ip mesaj data alanına kayıt edildi
}
function XbeeGor() {
    //console.log('İnfo:xbeeGörev listbmg');
    var query = XbeechzModel.find({Aktif: true,setDurumu:false});// aktif olup daha yzılamayan komutları getir
    query.sort('denemeSay SetZamani');
    query.find(function (err, xbeegorevveri) {
        // Oops...
        if (err) {
            console.log('Hata:xbeeGörev listesini Okuyamadım'+err);
            //return 'Hata:Görev listesini Okuyamadım';

        }

        if (xbeegorevveri.length<1) {
          //  console.log('Hata:xbee gorev listesiniboş')
            setTimeout(XbeeGor,500);

        }else{
            var data = xbeegorevveri[0];
            var chz=data.chzid;
            var onoff=data.SetDeger+"";
            console.log('bulunan Elkgorev işte bu:' +chz+' onoff:'+onoff);

            if (typeof onoff === "string" && !isNaN(parseInt(onoff, 10))) {
                onoff = [ parseInt(onoff, 10) ];
            }
            xbee.remoteCommand({

                command:data.XbeePin,
                commandParameter: onoff,
                // destination addresses can be in hexidecimal or byte arrays
                // serial number from the bottom of the module (or combination of ATSH and ATSL)
                destinationId: data.XbeeId
            }).then(function (response) {
                // response will be [ 0 ] from the response frame
                XbeechzModel.findOne({ chzid: chz }, function (err, doc){
                    doc.setDurumu = true;
                    doc.GetPinModu=doc.SetDeger;
                    doc.GetPinModuZamani= Date();
                    doc.GetPinModuModul='XbeeGorev';
                    doc.save();
                });
                if (data.SetModul=="Aydınlatma") {
                    if(data.SetDeger==5) onoff=true; else onoff=false;
                    console.log('GorevDurumYAY:emit dat:'+data.SocYayAnahtari, data.SocYayAdi, onoff + "", true);

                    Client.emit(data.SocYayAnahtari, data.SocYayAdi, onoff + "", true); // ilgili cihazın gorsel degerlerini yenile
                    }
                console.log("Xbee verisi başarı ile yazıldı  bunlar veriler"+ data.XbeeId+':'+data.XbeePin+':res:'+response.toString());
                if(data.SetDeger==5) drmyaz="Açık"; else drmyaz="Kapalı";

                mesajdata.SERVER_MESSAGE=data.etiket+ " :"+drmyaz;
                mesajnet.gcmmesaj(mesajdata,'','');
                setTimeout(XbeeGor, 100);
            }).catch(function (e) {
                XbeechzModel.findOne({ chzid: chz }, function (err, doc){
                    doc.setDurumu =false;
                    doc.denemeSay=doc.denemeSay+1;
                    doc.GetPinModu=-1;               //Xbee degere yazılmadı ise getpin modu degeri hata anlamında -1
                    doc.GetPinModuZamani= Date();
                    doc.GetPinModuModul='XbeeGorev';

                    if (doc.denemeSay>5) doc.Aktif=false;// hatalı işlem sayısı 5 den büyük ise görevi iptal et
                    doc.save();
                });
                if (data.SetModul=="Aydınlatma") {
                    if(data.SetDeger==5) onoff=true; else onoff=false;
                    console.log('emit dat:'+data.SocYayAnahtari, data.SocYayAdi, onoff + "", false);

                    Client.emit(data.SocYayAnahtari, data.SocYayAdi, onoff + "", false); // ilgili cihazın gorsel degerlerini yenile
                    mesajdata.SERVER_MESSAGE=data.etiket+ " :HATA İşlev yerine getirilemedi";
                    mesajnet.gcmmesaj(mesajdata,'','');

                }

                console.log("Xbee verisi Yazılmadı "+ data.XbeeId+':'+data.XbeePin+':'+data.SetDeger+' Hata:'+ e.toString());
                setTimeout(XbeeGor, 500);


            });



        }
    })
}



mesajdata.LocalIP=ic_ip_al()+''; //local :Ip mesaj data alanına kayıt edildi
console.log("İç adresiniz:"+mesajdata.LocalIP);


setTimeout(XbeeGor,5000);
console.log(new Date(), 'xbee gorev daemon 5 sn içinde başlayacak.İnşALLAH');

        setTimeout(otogorev,15000);
        console.log(new Date(), 'Otogorev daemon 15 sn içinde başlayacak.İnşALLAH');

setTimeout(SulamaGorevFn,8000);
console.log(new Date(), 'Sulama gorev daemon 8 sn içinde başlayacak.İnşALLAH');




function XbeeGorevyaz(modul,chz,setdeger,durum,UstGrvZamani){
    //  console.log('UstGrvZamanı:'+UstGrvId);
    if (UstGrvZamani!=null){

        XbeechzModel.update({ "chzid": chz},{SetZamani: Date(),
            SetDeger:   setdeger  ,
            SetModul: modul,
            UstGorevZamani:UstGrvZamani,
            Aktif:true,
            setDurumu:false,
            denemeSay:0},{upsert: true},function (err, numberAffected, raw) {
            if (err) return handleError(err);
            console.log('Xbee Görevi basari ile yazıldı XBeeGorev Yaz:', numberAffected);
            console.log('xbeegorevyaz'+modul ,chz, setdeger,durum, raw);
            XbeechzModel.save;
        });}
    else{
        XbeechzModel.update({ "chzid": chz},{SetZamani: Date(),
            SetDeger:   setdeger  ,
            SetModul: modul,
            Aktif:true,
            setDurumu:false,
            denemeSay:0},{upsert: true},function (err, numberAffected, raw) {
            if (err) return handleError(err);
            console.log('Xbee Görevi basari ile yazıldı XBeeGorev Yaz:', numberAffected);
            console.log('xbeegorevyaz'+modul ,chz, setdeger,durum, raw);
            XbeechzModel.save;
        });
    }

}



function SulamaGorevYaz( data) {
    // valf no ve sure boş olmamalı
    var gorevaktif;
    if (data.Sure <1) //set edilen deger 0  ise ilgili valfe ait görevler sıfırlanmalı
    {
        SulamaGorevModel.update({"ValfNo": data.ValfNo },
            {"Aktif": false, "GorevCalisiyor": false},
            {upsert: false}, function () {


                SulamaGorevModel.save;

            });
        gorevaktif=false;
        XbeeGorevyaz("Sulama","Valf"+data.ValfNo,4,true); //modul,chaz,setdeger,durum   İlgili valfi sıfıra çek
    } else {  //Sure 0 dan büyükse

        SulamaGorevModel.update({"ValfNo": data.ValfNo },
            {"Aktif": true, "GorevTanimZamani": Date(), ValfOnSure: data.Sure, "GorevSahibi": data.regid},
            {upsert: true}, function () {

                SulamaGorevModel.save;

            });



    }
sulamayaz=true;

};
function SulamaGorevOkuFn(Clin) {
    console.log('burası gorevoku fonksiyonu');
    SulamaGorevModel.find({
        Aktif:true
    }, function(err,valfgorevoku) {
        // Oops...
        if (err) {
            console.log('Hata:Görev listesini Okuyamadım');
            return 'Hata:Görev listesini Okuyamadım';

        }

        if (!valfgorevoku) {
            console.log('Hata:gorev listesiniboş');
            return 'Hata:Kayıtlı gorev Yok';
        }else{
            for (var i=0, counter=valfgorevoku.length; i < counter; i++) {

                var data = valfgorevoku[i];
                console.log('bulunan valfgorev:' +data.ValfNo);
                if (Clin) Clin.emit('<<ValfAyarSERVER>>',data.ValfNo+"",data.ValfOnSure+"",data.GorevCalisiyor);


            }
        }
    })
}


 function ElkGorevYaz( data) {
    // Lamp no
    var grvZaman = Date();
    ElkGorevModel.update({"Chz": data.button },
        {"Aktif": true, "GorevTanimZamani":grvZaman, OnOff: data.onoff, "GorevSahibi": data.regid},
        {upsert: true}, function () {

            ElkGorevModel.save;

            if(data.onoff=="true") deger=5;else deger=4;
            XbeeGorevyaz("Aydınlatma",data.button,deger,true,grvZaman);
        });


    //   xbeenet.xbeegorev();
};


 function Gorevoku (Client,Modul) {
    console.log('burası XbeeCHZgorevoku');
    XbeechzModel.find({
        ChzModul:Modul
    }, function(err,gorevlist) {
        // Oops...
        if (err) {
            console.log('GorevOku:','Hata:XbeeChzGörev listesini Okuyamadım');
            return 'Hata:XbeeGörev listesini Okuyamadım';

        }

        if (!gorevlist) {
            console.log('GorevOku:','Hata:xbeechz gorev listesinizboş')
            return 'Hata:XbeeChz Kayıtlı gorev Yok';
        }else{
            for (var i=0, counter=gorevlist.length; i < counter; i++) {

                var data = gorevlist[i];
                if (data.SetModul=="Aydınlatma") {

                    if(data.GetPinModu==5) onoff=true; else onoff=false;  //Aydınlatma modulu için pin modu 5 ise on degilse off
                    if(data.GetPinModu==-1) durum=false; else durum=true; //Aydınlatma modulu için pin modu -1 ise deger okunamadı demektir.

                    console.log('GorevOku:','emit dat:'+data.SocYayAnahtari, data.SocYayAdi, onoff + "", durum);
                    Client.emit(data.SocYayAnahtari, data.SocYayAdi, onoff + "", durum); // ilgili cihazın gorsel degerlerini yenile
                }
            }
        }
    })};




function SulamaGorevFn(Cli) {
    if(!sulamayaz)
    {
        if(sulamaint<60){
            sulamaint++;
            setTimeout(SulamaGorevFn,1000);
            return
        }else sulamaint=0;

    }
    sulamayaz=false;


    console.log('burası gorev Fonksiyon');

    var query = SulamaGorevModel.find({Aktif: true});
    query.sort('-GorevCalisiyor GorevTanimZamani');
    query.find(function (err, valfgorev) {
        // Oops...
        if (err) {
            console.log('Hata:Görev listesini Okuyamadım' + err);
            //return 'Hata:Görev listesini Okuyamadım';

        }

        if (valfgorev.length < 1) {
           // console.log('Hata:sulama gorev listesiniboş');

            XbeechzModel.update({ChzModul: "Sulama", SetDeger: 5}, {SetZamani: Date(),
                SetDeger: 4,
                SetModul: "SulamaGorev",
                setDurumu: false,
                denemeSay: 0}, {multi: true}, function (err, numberAffected, raw) {
                if (err) return handleError(err);
                console.log('xbeegorevyaz Otomatik Gorev Silme', raw);
                XbeechzModel.save;
            });
           // console.log('Hata:Kayıtlı sulama gorev Yok');
            gorevokuinternal= 10000;// Sure düşümü yapıldıktan 10 sn sonra bu yordamı geri çagır.
            setTimeout(SulamaGorevFn,1000);

        }                                                                           //1. Hiç sulama gorevi yoksa xbeepinlerini 4 yap
        // 2. sulama gorev kaydı varsa
        /*     1.xbee gorev kaydı yoksa kayıt ac
         2.kayıt varsa ve gorev başarı ile yazılmışsa  sureyi azaltmaya başla
         3.sure 0 olmuşşa xbee gorevini 4 yap sulama gorevini bitti yaz
         4. xbee gorevi başarasız olmussa sulama gorevini hata yaz.
         3. sulama gorevi bitmedi ise yenilemeyi 1 dk yap.
         3. sulama gorev bitti ise yenilemeyi 10 sn yap.

         */
        else //Kayıtlı Aktif gorevSulama varsa
        {
            //  console.log('valfgorev '+valfgorev.toString());
            var data = valfgorev[0];
            var ValfOnSure = data.ValfOnSure;
            var Aktif;
            var gorcal;
            var tanimzaman = data.GorevTanimZamani;


            XbeechzModel.find({                                    //Xbeegorev kaydından İlgili valfa ait kaydı cek
                    chzid: "Valf" + data.ValfNo, SetDeger: 5, UstGorevZamani: tanimzaman
                }, function (err, xbeegorev) {
                    if (err) {
                        console.log('Hata:ExbeeGörev listesini Okuyamadım');
                    }

                    if (xbeegorev.length < 1) {// Hiç Xbee gorevi yoksa
                        console.log('xbee gorev yazılmamış yenigorev yazılıyor')
                        XbeeGorevyaz("Sulama", "Valf" + data.ValfNo, 5, true, tanimzaman);
                        // İlk Xbee Gorev yazıldı.
                        if (Client) Client.emit('<<ValfAyarSERVER>>',data.ValfNo+"",data.ValfOnSure+"",data.GorevCalisiyor);
                        gorevokuinternal= 1500;// Yeni Görev Yazıldıktan 15 sn sonra bu yordamı geri çagır.
                        setTimeout(SulamaGorevFn,1000);
                    } else { //Mevcut bir Xbee görev kaydı varsa

                        xbeedata = xbeegorev[0];
                        console.log('bulunan xbeegorevbul:' + xbeedata.chzid + ' setdurumu:' + xbeedata.setDurumu, xbeedata.toString());

                        if (xbeedata.setDurumu) { //xbee bir onceki komutu işlemisse devam et
                            // Cihaz ON ise süreyi azaltmaya başla
                            if (ValfOnSure > 0) {   //Sure 0 dan büyük ise
                                console.log('GorevKontrol-SulamaGorev:', 'setdeger 5 valfonsure:' + ValfOnSure);
                                Aktif = true;
                                gorcal = true;

                            } else { //sure 0  olmuşsa

                                XbeeGorevyaz("Sulama", "Valf" + data.ValfNo, 4, true, tanimzaman); //Xbee pinlerini 4 Yap
                                Aktif = false;
                                gorcal = false;
                            }
                            if(ValfOnSure > 0)ValfOnSure--;
                            SulamaGorevModel.update({"ValfNo": data.ValfNo },
                                {"Aktif": Aktif, ValfOnSure: ValfOnSure, "GorevCalisiyor": gorcal},
                                {upsert: true}, function () {
                                    SulamaGorevModel.save;
                                });
                            if (Client) Client.emit('<<ValfAyarSERVER>>',data.ValfNo+"",ValfOnSure+"",gorcal+"");
                            gorevokuinternal= 60000;// Sure düşümü yapıldıktan 60 sn sonra bu yordamı geri çagır.
                            setTimeout(SulamaGorevFn,1000);


                        } else {  //xbee set edilememişse ve xbee gorevi iptal edilmişse

                            if (xbeedata.aktif == false && xbeedata.denemeSay > 5) {
                                SulamaGorevModel.update({"ValfNo": data.ValfNo },
                                    {"Aktif": false, ValfOnSure: -1, "GorevCalisiyor": false},
                                    {upsert: true}, function () {
                                        SulamaGorevModel.save;
                                    });
                                if (Client) Client.emit('<<ValfAyarSERVER>>',data.ValfNo+"","-1"+"",false+"");
                            }
                            gorevokuinternal= 15000;// Xbee yazımı hatalı ise 15 sn sonra bu yordamı geri çagır.
                            setTimeout(SulamaGorevFn,1000);

                        }
                    }
                }
            )
        };
    });

};






