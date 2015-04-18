'use strict';

function updateStatus(message, control) {
	document.getElementById("statusMessage").innerHTML = message;
	if (control === 'disable') {
		document.getElementById('uploadfile').disabled = true;
	}
	if (control === 'enable') {
		document.getElementById('uploadfile').disabled = false;
		document.getElementById('uploadfile').value = '';
	}
}

var readChunkSize = 100;

function getFileChecksum(fileHanlde, callback) {
	var fileSize = fileHanlde.size;
	var fromByte = 0;
	var toByte = readChunkSize;
	var fileChecksum;
	var reader = new FileReader();
	reader.onload = function() {
		var previousChecksum;
		if (fileChecksum) previousChecksum = fileChecksum.crc32buffer;
        fileChecksum = zcrc32.getChecksum(reader.result, previousChecksum);
        if (toByte < fileSize) {
        	fromByte = toByte + 1;
        	toByte += readChunkSize;
        	reader.readAsArrayBuffer(fileHanlde.slice(fromByte, toByte));
        } else {
        	updateStatus('File checksum was calculated');
        	callback(null, fileChecksum.crc32string);
        }
	};
	reader.readAsArrayBuffer(fileHanlde.slice(fromByte, toByte));
}

function startFileTransfer(fileHanlde, fileChecksum) {
	var socket = new WebSocket(window.location.origin.replace('http', 'ws'));
	var fileOffset = 0;
	socket.binaryType = "arraybuffer";
	socket.onopen = function (e) {
    	socket.send(JSON.stringify({
					filename: 	fileHanlde.name,
					filesize: 	fileHanlde.size,
					uploadtype: 'new',
					crc32: 		fileChecksum
    				}));
	}
	socket.onmessage = function (e) {
		var srvResponse = JSON.parse(e.data);
		//console.log('server response: ' + srvResponse.received + ' bytes received ');
		if (srvResponse.crc32) {
            updateStatus('<b>Upload finished</b>. Please choose file to upload ...', 'enable');
			socket.close();
		} else {
	        updateStatus('Sending ... ' + Math.round (fileOffset * 100 / fileHanlde.size) + '%');
			sendFileBlock(fileOffset, fileOffset + readChunkSize, fileHanlde, socket);
			fileOffset += readChunkSize;
		}
	}
}

function sendFileBlock(fromByte, toByte, fileHandle, socket) {
	var reader = new FileReader();
	reader.onload = function() {
        //console.log(reader.result.byteLength);
        socket.send(reader.result);
	};
	var blob = fileHandle.slice(fromByte, toByte);
	reader.readAsArrayBuffer(blob);
}

function sendFile(input, event) {
	updateStatus('Uploading ...', 'disable');
	getFileChecksum(event.target.files[0], function (err, fileChecksum) {
		startFileTransfer(event.target.files[0], fileChecksum);
	});
};



