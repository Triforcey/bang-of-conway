var fs = require('fs');
var JSONStream = require('JSONStream');

var immediate = false;
var jungle = [];
var gen;
var lastGen;
var temper;
var split;
var mutation;
var expand;
function send(msg) {
	msg.jungle.sort(function (a, b) {
		return b.mass - a.mass;
	});
	var readStream = fs.createWriteStream('universe-data/' + msg.generation);
	var writeStream = JSONStream.stringify(false);
	writeStream.pipe(readStream);
	writeStream.write(msg);
	process.send({type: 'generation', data: msg.generation});
	if (lastGen >= 0 && gen >= lastGen) process.send({type: 'finished'});
}
function start(count, size, fill) {
	immediate = true;
	for (var i = 0; i < count; i++) {
		var creature = {body: [], mass: 0};
		var border = [];
		if (expand) {	
			for (var j = 0; j < size[1]; j++) {
				border.push(0);
			}
			creature.body.push(border);
		}
		for (var j = 0; j < size[0]; j++) {
			var column = [];
			if (expand) column.push(0);
			for (var k = 0; k < size[1]; k++) {
				var cell = Math.random() < fill ? true : false;
				column.push(cell);
				if (cell) creature.mass++;
			}
			if (expand) column.push(0);
			creature.body.push(column);
		}
		creature.body.push(border);
		creature.premature = {body: [...creature.body], mass: creature.mass};
		for (var j = 0; j < creature.premature.body.length; j++) {
			creature.premature.body[j] = [...creature.premature.body[j]];
		}
		jungle.push(creature);
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
		var oldBody = [...jungle[i].body];
		var expanded = [false, false, false, false];
		for (var j = 0; j < jungle[i].body.length; j++) {
			for (var k = 0; k < jungle[i].body[j].length; k++) {
				var neighbors = 0;
				for (var l = 0; l < 9; l++) {
					if (l == 4) l++;
					var offset = l.toString(3);
					if (offset.length < 2) offset = 0 + offset;
					offset = offset.split('');
					offset[0]--;
					offset[1]--;
					offset[0] += j;
					offset[1] += k;
					if (offset[0] >= 0 && offset[0] < oldBody.length && offset[1] >= 0 && offset[1] < oldBody[j].length) {
						if (oldBody[offset[0]][offset[1]]) neighbors++;
					}
				}
				var cell = jungle[i].body[j][k];
				if (!cell && neighbors == 3) {
					jungle[i].body[j][k] = true;
					jungle[i].mass++;
					if (expand) {
						var border;
						if ((j <= 0 && !expanded[0]) || (j >= jungle[i].body.length - 1 && !expanded[1])) {
							border = new Array(jungle[i].body[j].length).fill(false);
						}
						if (j <= 0 && !expanded[0]) {
							jungle[i].body.unshift(border);
							oldBody.unshift(border);
							expanded[0] = true;
							j++;
						}
						if (j >= jungle[i].body.length - 1 && !expanded[1]) {
							jungle[i].body.push(border);
							oldBody.push(border);
							expanded[1] = true;
						}
						if (k <= 0) {
							for (var l = 0; l < jungle[i].body.length; l++ && !expanded[2]) {
								jungle[i].body[l].unshift(false);
								oldBody[l].unshift(false);
								k++;
							}
							expanded[2] = true;
						}
						if (k >= jungle[i].body[j].length - 1 && !expanded[3]) {
							for (var l = 0; l < jungle[i].body.length; l++) {
								jungle[i].body[l].push(false);
								oldBody[l].push(false);
							}
							expanded[3] = true;
						}
					}
				} else if (cell && (neighbors < 2 || neighbors > 3)) {
					jungle[i].body[j][k] = false;
					jungle[i].mass--;
				}
			}
		}
	}
	// next generation
	var rookies = [];
	for (var i = 0; i < jungle.length; i++) {
		if (Math.random() >= split) continue;
		var rookie = {body: [...jungle[i].premature.body], mass: jungle[i].premature.mass};
		for (var j = 0; j < rookie.body.length; j++) {
			rookie.body[j] = [...rookie.body[j]];
		}
		for (var j = 0; j < rookie.body.length; j++) {
			for (var k = 0; k < rookie.body[j].length; k++) {
				if (!immediate) return;
				if (Math.random() < mutation) {
					rookie.body[j][k] = !rookie.body[j][k];
					if (rookie.body[j][k]) rookie.mass++;
					else rookie.mass--;
				}
			}
		}
		rookie.premature = {body: [...rookie.body], mass: rookie.mass};
		for (var j = 0; j < rookie.premature.body.length; j++) {
			rookie.premature.body[j] = [...rookie.premature.body[j]];
		}
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
