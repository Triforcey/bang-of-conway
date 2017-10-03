var timer;
var jungle = [];
var gen;
var lastGen;
var temper;
var mutation;
function start(count, size, fill, delay) {
	for (var i = 0; i < count; i++) {
		var creature = {body: [], mass: 0};
		for (var j = 0; j < size[0]; j++) {
			var row = [];
			for (var k = 0; k < size[1]; k++) {
				var cell = Math.random() < fill ? true : false;
				row.push(cell);
				if (cell) creature.mass++;
			}
			creature.body.push(row);
		}
		creature.premature = JSON.parse(JSON.stringify(creature));
		jungle.push(creature);
	}
	process.send({type: 'data', data: {jungle: jungle, generation: gen}});
	timer = setInterval(generation, delay);
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
		var rookie = JSON.parse(JSON.stringify(jungle[i].premature));
		for (var j = 0; j < rookie.body.length; j++) {
			for (var k = 0; k < rookie.body[j].length; k++) {
				if (Math.random() < mutation) {
					rookie.body[j][k] = !rookie.body[j][k];
					if (rookie.body[j][k]) rookie.mass++;
					else rookie.mass--;
				}
			}
		}
		rookie.premature = JSON.parse(JSON.stringify(rookie));
		rookies.push(rookie);
	}
	jungle.push(...rookies);
	gen++;
	var data = {jungle: jungle, generation: gen};
	if (lastGen >= 0 && gen >= lastGen) {
		clearInterval(timer);
		process.send({type: 'done', data: data});
	} else {
		process.send({type: 'data', data: data});
	}
}

process.on('message', function (msg) {
	switch (msg.cmd) {
		case 'start':
			clearInterval(timer);
			gen = 0;
			lastGen = msg.generations;
			temper = msg.temper;
			mutation = msg.mutation;
			start(msg.count, msg.size, msg.fill, msg.delay);
			break;
		case 'stop':
			clearInterval(timer);
	}
});
