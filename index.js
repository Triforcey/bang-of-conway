var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require('child_process');

var universe = childProcess.fork('universe.js');
universe.on('message', function (msg) {
	if (msg.type == 'done') {
		for (var i = 0; i < msg.data.jungle.length; i++) {
			console.log(msg.data.jungle[i].mass);
		}
	}
});
universe.send({cmd: 'start', count: 10, size: [10, 10], fill: .1, generations: 100, temper: .01, mutation: .01, delay: 0});
