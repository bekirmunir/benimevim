/**
 * Created by sgedik on 11.07.2014.
 */
// Code dependencies
var express = require('express');
var app = express.createServer();
var server = app.listen(2222);
var io = require('socket.io').listen(server);
var mongoose = require('mongoose'),
    cihaznet = require('./controllers/AndChzKontrol'),
    ChzModel = require('./models/chz_model').ChzModel;



// Basic express server, only for static content
app.configure(function() {
    app.use(express.static(__dirname + '/public'));
});

// DB Cihazlara baglan
mongoose.connect('mongodb://localhost/demo-chat');

// Eski verileri sil
var cihazlar = new ChzModel();
cihazlar.collection.drop();



// Add listeners to the sockets
io.sockets.on('connection', function(socket) {

    // Handle chat logins
    socket.on('login attempt', function(data) {
        cihaznet.login(io, socket, data);
    });

    // handle chat logouts
    socket.on('logout attempt', function(data) {
        cihaznet.logout(io, socket, data);
    });

    // Handle messages
    socket.on('message', function(data) {
        cihaznet.message(io, socket, data);
    });

    // Handle disconnects
    socket.on('disconnect', function(data) {
        cihaznet.disconnect(io, socket, data);
    });
});