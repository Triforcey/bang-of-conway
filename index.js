var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require('child_process');
var fs = require('fs');
var rimraf = require('rimraf');
var JSONStream = require('JSONStream');

if (!fs.existsSync('universe-data')) {
	fs.mkdirSync('universe-data');
}
let lastGen = null;
if (fs.existsSync('universe-data/last-gen')) {
	lastGen = JSON.parse(fs.readFileSync('universe-data/last-gen'));
}
var universe = false;
var status = 'idle';
function setStatus(newStatus) {
	status = newStatus;
	io.emit('status', status);
}
function runUniverse(settings) {
	if (universe) universe.kill();
	if (fs.existsSync('universe-data')) {
		rimraf.sync('universe-data');
	}
	fs.mkdirSync('universe-data');
	fs.writeFileSync('universe-data/settings', JSON.stringify(settings));
	settings.cmd = 'start';
	universe = childProcess.fork('universe.js');
	universe.on('message', function (msg) {
		switch (msg.type) {
			case 'generation':
				lastGen = msg.data;
				fs.writeFileSync('universe-data/last-gen', JSON.stringify(lastGen));
				io.emit('maxGen', lastGen);
				break;
			case 'finished':
				setStatus('idle');
		}
	});
	universe.send(settings);
}

io.on('connection', function (ws) {
	ws.on('run', function (msg) {
		if (msg == null || msg.constructor != JSON.constructor) return;
		var values = [['count', Number], ['size', Array], ['fill', Number], ['generations', Number], ['temper', Number], ['split', Number], ['mutation', Number]];
		for (var i = 0; i < values.length; i++) {
			if (typeof msg[values[i][0]] == 'undefined' || msg[values[i][0]] === null || msg[values[i][0]].constructor != values[i][1]) return;
		}
		if (msg.size.length != 2 || isNaN(msg.size[0]) || isNaN(msg.size[1])) return;
		msg.size[0] = Math.abs(parseInt(msg.size[0]));
		msg.size[1] = Math.abs(parseInt(msg.size[1]));
		lastGen = null;
		fs.writeFileSync('universe-data/last-gen', JSON.stringify(lastGen));
		runUniverse(msg);
		setStatus('running');
	});
	ws.on('gen', function (msg) {
		if (msg == null || msg.constructor != Array || msg.length != 2 || isNaN(parseInt(msg[0])) || isNaN(parseInt(msg[1]))) return;
		msg[0] = Math.abs(parseInt(msg[0]));
		msg[1] = parseInt(msg[1]);
		if (msg[0] <= lastGen) {
			fs.readFile('universe-data/' + msg[0], function (err, data) {
				try {
					var res = JSON.parse(data).jungle;
					if (msg[1] < 0) {
						msg[1] = -msg[1];
						res.reverse();
					}
					if (msg[1] > 0) {
						res.splice(msg[1], res.length - msg[1]);
					}
					ws.emit('gen', res);
				} catch (e) {}
			});
		}
		else ws.emit('gen', null);
	});
	if (lastGen != null) ws.emit('maxGen', lastGen);
	ws.emit('status', status);
	if (fs.existsSync('universe-data/settings')) {
		fs.readFile('universe-data/settings', function (err, data) {
			ws.emit('settings', JSON.parse(data));
		});
	}
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
