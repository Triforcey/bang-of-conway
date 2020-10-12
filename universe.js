var fs = require('fs');
var JSONStream = require('JSONStream');

const { Creature } = require('./creature.js');

var immediate = false;
var jungle = [];
var gen;
var lastGen;
var temper;
var split;
var mutation;
var size;
function send(msg) {
	msg.jungle.sort(function (a, b) {
		return b.mass - a.mass;
	});
	var writeStream = fs.createWriteStream('universe-data/' + msg.generation);
	var readStream = JSONStream.stringify(false);
	readStream.pipe(writeStream);
	readStream.write(msg);
	process.send({type: 'generation', data: msg.generation});
	if (lastGen >= 0 && msg.generation >= lastGen) process.send({type: 'finished'});
}
function start(count, _size, fill) {
	size = _size
	immediate = true;
	for (var i = 0; i < count; i++) {
		const activeCells = [];
		for (var j = 0; j < size[0]; j++) {
			for (var k = 0; k < size[1]; k++) {
				var cell = Math.random() < fill ? true : false;
				if (cell) {
					activeCells.push([j, k]);
				}
			}
		}
		jungle.push(new Creature(activeCells));
	}
	send({jungle: jungle, generation: gen});
	if (lastGen != 0) immediate = setImmediate(generation);
}

function generation() {
	// pin creatures against each other
	for (var i = 0; i < jungle.length; i++) {
		for (var j = 0; j < jungle.length; j++) {
			if (i == j) {
				j++;
				if (j >= jungle.length) break;
			}
			if (Math.random() < temper) {
				if (jungle[i].mass >= jungle[j].mass) {
					jungle.splice(j, 1);
					if (i > j) i--;
					j--;
				} else {
					jungle.splice(i, 1);
					i--;
					if (j > i) j--;
					break;
				}
			}
		}
	}
	// modify bodies
	for (var i = 0; i < jungle.length; i++) {
		jungle[i].step();
	}
	// next generation
	var rookies = [];
	for (var i = 0; i < jungle.length; i++) {
		if (Math.random() >= split) continue;
		const initialStage = [...jungle[i].initialStage];
		initialStage.forEach((item, i) => {
			initialStage[i] = item.join(',');
		});
		for (let j = 0; j < size[0]; j++) {
			for (let k = 0; k < size[1]; k++) {
				if (Math.random() >= mutation) continue;
				const cell = [j, k].join(',');
				const index = initialStage.indexOf(cell);
				if (index) {
					initialStage.splice(index, 1);
				} else {
					initialStage.push(cell);
				}
			}
		}
		initialStage.forEach((item, j) => {
			item = item.split(',');
			item.forEach((coord, k) => {
				item[k] = parseInt(coord);
			});
			initialStage[j] = item;
		});
		const rookie = new Creature(initialStage);
		rookies.push(rookie);
	}
	jungle.push(...rookies);
	gen++;
	send({jungle: jungle, generation: gen});
	if (lastGen >= 0 && gen >= lastGen) {
		immediate = false;
	} else {
		immediate = setImmediate(generation);
	}
}

process.on('message', function (msg) {
	switch (msg.cmd) {
		case 'start':
			clearImmediate(immediate);
			immediate = false;
			jungle = [];
			gen = 0;
			lastGen = msg.generations;
			temper = msg.temper;
			split = msg.split;
			mutation = msg.mutation;
			expand = msg.expand;
			start(msg.count, msg.size, msg.fill);
			break;
		case 'stop':
			clearImmediate(immediate);
			immediate = false;
	}
});
