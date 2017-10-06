var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require('child_process');

var universeData = [];
var maxGen = 0;
var universe = childProcess.fork('universe.js');
var status = 'idle';
function setStatus(newStatus) {
	status = newStatus;
	io.emit('status', status);
}
universe.on('message', function (msg) {
	universeData.push(msg.data);
	maxGen = msg.data.generation;
	io.emit('maxGen', maxGen);
	if (msg.type == 'done') setStatus('idle');
});

io.on('connection', function (ws) {
	ws.on('run', function (msg) {
		if (msg.constructor != JSON.constructor) return;
		var values = [['count', Number], ['size', Array], ['fill', Number], ['generations', Number], ['temper', Number], ['mutation', Number], ['delay', Number]];
		for (var i = 0; i < values.length; i++) {
			if (typeof msg[values[i][0]] == 'undefined' || msg[values[i][0]] === null || msg[values[i][0]].constructor != values[i][1]) return;
		}
		if (msg.size.length != 2 || isNaN(msg.size[0]) || isNaN(msg.size[1])) return;
		msg.size[0] = parseInt(msg.size[0]);
		msg.size[1] = parseInt(msg.size[1]);
		maxGen = 0;
		universe.send({cmd: 'stop'});
		universeData = [];
		msg.cmd = 'start';
		universe.send(msg);
		setStatus('running');
	});
	ws.on('gen', function (msg) {
		if (isNaN(msg)) return;
		msg = parseInt(msg);
		if (msg <= universeData.length) ws.emit('gen', universeData[msg].jungle);
		else ws.emit('gen', null);
	});
	ws.emit('maxGen', maxGen);
	ws.emit('status', status);
	if (universeData.length > 0) ws.emit('gen', universeData[0].jungle);
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
