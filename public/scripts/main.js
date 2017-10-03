var ws = io('/');
ws.on('maxGen', function (msg) {
	console.log(genInputRange.max);
	genInputRange.max = msg;
});
