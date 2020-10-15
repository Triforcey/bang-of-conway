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
	for (let i = 0; i < msg.length; i++) {
		const cells = msg[i].activeCells;
		const boundaries = [[0, 0], [0, 0]];
		cells.forEach(cell => {
			cell.forEach((coord, j) => {
				if (coord < boundaries[j][0]) boundaries[j][0] = coord;
				else if (coord > boundaries[j][1]) boundaries[j][1] = coord;
			});
		});
		const size = boundaries.map(boundary => boundary[1] - boundary[0] + 1);
		let c = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		c.classList.add('creature');
		c.setAttribute('easypz', '{"applyTransformTo": "svg > *", "modes": ["FLICK_PAN", "WHEEL_ZOOM", "PINCH_ZOOM", "DBLCLICK_ZOOM_IN", "DBLRIGHTCLICK_ZOOM_OUT"]}');
		c = creatureContainer.appendChild(c);
		const rect = window.getComputedStyle(c);
		const cSize = [c.clientWidth * window.devicePixelRatio, c.clientHeight * window.devicePixelRatio];
		c.setAttribute('width', cSize[0]);
		c.setAttribute('height', cSize[1]);
		const cellSize = [cSize[0] / size[0], cSize[1] / size[1]];
		cells.forEach(cell => {
			const coords = cell.map((coord, j) => coord - boundaries[j][0]);
			const square = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			square.setAttribute('x', coords[0] * cellSize[0]);
			square.setAttribute('y', coords[1] * cellSize[1]);
			square.setAttribute('width', cellSize[0]);
			square.setAttribute('height', cellSize[1]);
			square.setAttribute('fill', 'black');
			c.appendChild(square);
		});
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
