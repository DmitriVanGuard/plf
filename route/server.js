const PORT = 8000;

const staticNode = require('node-static');
const WS = require('ws');
const http = require('http');

const file = new staticNode.Server('./public', {
	cache: 3600,
	gzip: true
});

http
	.createServer(function(request, response) {
		request
			.addListener('end', function() {
				file.serve(request, response);
			})
			.resume();
	})
	.listen(PORT);
