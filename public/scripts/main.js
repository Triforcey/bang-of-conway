function sliderShare() {
	genInput.value = genInputRange.value;
	ws.emit('gen', [parseInt(genInput.value), parseInt(viewInput.value)]);
}

function revSliderShare() {
	var gen;
	genInput.value != '' ? gen = parseInt(genInput.value) : gen = 0;
	if (gen > parseInt(genInput.max)) genInput.value = genInput.max;
	genInputRange.value = gen;
	ws.emit('gen', [parseInt(genInput.value), parseInt(viewInput.value)]);
}

var ws = io('/');

ws.on('maxGen', function (msg) {
	genInput.max = msg;
	genInputRange.max = msg;
});

ws.on('status', function (msg) {
	statusOut.innerHTML = msg;
});

ws.on('settings', function (msg) {
	countInput.value = msg.count;
	widthInput.value = msg.size[0];
	heightInput.value = msg.size[1];
	fillInput.value = msg.fill;
	setGenInput.value = msg.generations;
	temperInput.value = msg.temper;
	splitInput.value = msg.split;
	mutationInput.value = msg.mutation;
});

ws.on('gen', function (msg) {
	if (msg == null) return;
	creatureContainer.innerHTML = '';
	for (var i = 0; i < msg.length; i++) {
		const cells = msg[i].activeCells;
		const boundaries = [[0, 0], [0, 0]];
		cells.forEach(cell => {
			cell.forEach((coord, j) => {
				if (coord < boundaries[j][0]) boundaries[j][0] = coord;
				else if (coord > boundaries[j][1]) boundaries[j][1] = coord;
			});
		});
		const size = boundaries.map(boundary => boundary[1] - boundary[0] + 1);
		const body = [];
		for (let j = 0; j < size[0]; j++) {
			const row = [];
			for (let k = 0; k < size[1]; k++) {
				row.push(false);
			}
			body.push(row);
		}
		cells.forEach(cell => {
			body[cell[0] - boundaries[0][0]][cell[1] - boundaries[1][0]] = true;
		});
		var c = document.createElement('canvas');
		c.classList.add('creature');
		c = creatureContainer.appendChild(c);
		var ctx = c.getContext('2d');
		var rect = window.getComputedStyle(c);
		var cSize = [c.clientWidth * window.devicePixelRatio, c.clientHeight * window.devicePixelRatio];
		c.width = cSize[0];
		c.height = cSize[1];
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'white';
		for (var j = 0; j < body.length; j++) {
			for (var k = 0; k < body[j].length; k++) {
				if (body[j][k]) {
					var offset = [cSize[0] / body.length, cSize[1] / body[j].length];
					ctx.lineWidth = Math.min(...offset) / 10;
					var coord = [j * offset[0], k * offset[1]];
					ctx.fillRect(...coord, ...offset);
					ctx.strokeRect(...coord, ...offset);
				}
			}
		}
	}
});

function sendReq() {
	function getVal(e, floatMode) {
		if (floatMode) {
			return !isNaN(parseFloat(e.value)) ? parseFloat(e.value) : parseFloat(e.min);
		} else {
			return !isNaN(parseInt(e.value)) ? parseInt(e.value) : parseInt(e.min);
		}
	}
	var req = {count: getVal(countInput), size: [getVal(widthInput), getVal(heightInput)], fill: getVal(fillInput, true), generations: getVal(setGenInput), temper: getVal(temperInput, true), split: getVal(splitInput, true), mutation: getVal(mutationInput, true)};
	ws.emit('run', req);
}
