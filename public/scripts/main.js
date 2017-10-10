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
	expandInput.checked = msg.expand;
});

ws.on('gen', function (msg) {
	if (msg == null) return;
	creatureContainer.innerHTML = '';
	for (var i = 0; i < msg.length; i++) {
		var c = document.createElement('canvas');
		c.classList.add('creature');
		c = creatureContainer.appendChild(c);
		var ctx = c.getContext('2d');
		var rect = window.getComputedStyle(c);
		var size = [msg[i].body.length * 100, msg[i].body.length > 0 ? msg[i].body[0].length * 100 : 0];
		c.width = size[0];
		c.height = size[1];
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'white';
		for (var j = 0; j < msg[i].body.length; j++) {
			for (var k = 0; k < msg[i].body[j].length; k++) {
				if (msg[i].body[j][k]) {
					var offset = [size[0] / msg[i].body.length, size[1] / msg[i].body[j].length];
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
	var req = {count: getVal(countInput), size: [getVal(widthInput), getVal(heightInput)], fill: getVal(fillInput, true), generations: getVal(setGenInput), temper: getVal(temperInput, true), split: getVal(splitInput, true), mutation: getVal(mutationInput, true), expand: expandInput.checked};
	ws.emit('run', req);
}
