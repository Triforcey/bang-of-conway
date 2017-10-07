var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require('child_process');

var universeData = [];
var maxGen = 0;
var universe = false;
var status = 'idle';
function setStatus(newStatus) {
	status = newStatus;
	io.emit('status', status);
}
function runUniverse(settings) {
	if (universe) universe.kill();
	universe = childProcess.fork('universe.js');
	var construct;
	var lengths = [];
	universe.on('message', function (msg) {
		switch (msg.type) {
			case 'init':
				construct = msg.data;
				break;
			case 'data':
				if (!lengths.length) {
					construct.jungle.push(msg.data);
					lengths.push(msg.data.mass);
				} else {
					for (var i = 0; i < lengths.length; i++) {
						if (msg.data.mass >= lengths[i] || i >= lengths.length - 1) {
							construct.jungle.splice(i, 0, msg.data);
							lengths.splice(i, 0, msg.data.mass);
							break;
						}
					}
				}
				break;
			case 'end':
				universeData.push(construct);
				maxGen = construct.generation;
				lengths = [];
				io.emit('maxGen', maxGen);
				break;
			case 'finished':
				universe.kill();
				universe = false;
				setStatus('idle');
		}
	});
	universe.send(settings);
}

io.on('connection', function (ws) {
	ws.on('run', function (msg) {
		if (msg == null || msg.constructor != JSON.constructor) return;
		var values = [['count', Number], ['size', Array], ['fill', Number], ['generations', Number], ['temper', Number], ['mutation', Number]];
		for (var i = 0; i < values.length; i++) {
			if (typeof msg[values[i][0]] == 'undefined' || msg[values[i][0]] === null || msg[values[i][0]].constructor != values[i][1]) return;
		}
		if (msg.size.length != 2 || isNaN(msg.size[0]) || isNaN(msg.size[1])) return;
		msg.size[0] = Math.abs(parseInt(msg.size[0]));
		msg.size[1] = Math.abs(parseInt(msg.size[1]));
		maxGen = 0;
		universeData = [];
		msg.cmd = 'start';
		runUniverse(msg);
		setStatus('running');
	});
	ws.on('gen', function (msg) {
		if (msg == null || msg.constructor != Array || msg.length != 2 || isNaN(parseInt(msg[0])) || isNaN(parseInt(msg[1]))) return;
		msg[0] = Math.abs(parseInt(msg[0]));
		msg[1] = parseInt(msg[1]);
		if (msg[0] < universeData.length) {
			var res = [...universeData[msg[0]].jungle];
			if (msg[1] < 0) {
				msg[1] = -msg[1];
				res.reverse();
			}
			if (msg[1] > 0) {
				res.splice(msg[1], res.length - msg[1]);
			}
			ws.emit('gen', res);
		}
		else ws.emit('gen', null);
	});
	ws.emit('maxGen', maxGen);
	ws.emit('status', status);
});

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile('index.html', {root: __dirname});
});

app.use(function (req, res) {
	res.status(404).send('404');
});

app.use(function (err, req, res, next) {
	res.status(500).send('500');
});

server.listen(process.env.PORT || 80);
