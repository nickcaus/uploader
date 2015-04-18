'use strict';

var fs = require('fs');
var hapi = require('hapi');
var webserver = new hapi.Server({});

webserver.connection({ port: 8080 });

webserver.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'public'
        }
    }
});


webserver.start(function () {
    console.log('Server running at:', webserver.info.uri);
});

var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
    httpServer: webserver.listener
});

wsServer.on('request', function(r) {
    console.log('Client connected');
    var targetFile = fs.createWriteStream('./files/target.dat');
    var connection = r.accept('', r.origin);
    var totalReceived = 0;
    var sourceFile;
    var data = false;
	connection.on('message', function(message) {
        if (message.type === 'utf8') {
            sourceFile = JSON.parse(message.utf8Data);
            console.log(sourceFile);
            connection.sendUTF(JSON.stringify({received: totalReceived}));
        }
        if (message.type === 'binary') {
            totalReceived += message.binaryData.length;
            console.log('received ' + totalReceived + ' of ' + sourceFile.filesize);
            targetFile.write(message.binaryData);
            //
            if (sourceFile.filesize === totalReceived) {
                console.log('File received, size (bytes) : '+ totalReceived );
                connection.sendUTF(JSON.stringify({received: totalReceived, crc32: '<crc32>'}));
            } else {
                connection.sendUTF(JSON.stringify({received: totalReceived}));
            }
        }
	});
	connection.on('close', function(reasonCode, description) {
        targetFile.end();
        /*
        if (sourceFile.filesize != totalReceived) {
            fs.unlink('./files/target.dat');
            console.log('Client was disconnected.');
        }
        */
    });
});



