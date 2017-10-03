var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require('child_process');

var universeData = [];
var maxGen = 0;
var universe = childProcess.fork('universe.js');
universe.on('message', function (msg) {
	universeData.push(msg.data);
	maxGen = msg.data.generation;
	io.emit('maxGen', maxGen);
});

io.on('connection', function (ws) {
	ws.on('run', function (msg) {
		if (msg.constructor != JSON.constructor) return;
		var values = [['count', Number.constructor], ['size', Array.constructor], ['fill', Number.constructor], ['generations', Number.constructor], ['temper', Number.constructor], ['mutation', Number.constructor], ['delay', Number.constructor]];
		for (var i = 0; i < values.length; i++) {
			if (typeof msg[values[i][0]] == 'undefined' || msg[values[i][0]].constructor != values[i][1]) return;
		}
		if (msg.size.length != 2 || isNaN(msg.size[0]) || isNaN(msg.size[1])) return;
		msg.size[0] = parseInt(msg.size[0]);
		msg.size[1] = parseInt(msg.size[1]);
		universe.send({cmd: 'stop'});
		maxGen = 0;
		universeData = [];
		universe.send(msg);
	});
	ws.on('generation', function (msg) {
		if (isNaN(msg)) return;
		msg = parseInt(msg);
		if (universeData.indexOf(msg) >= 0) ws.emit('generation', universeData[msg]);
		else ws.emit('generation', null);
	});
	ws.emit('maxGen', maxGen);
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
