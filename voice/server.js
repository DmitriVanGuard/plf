const PORT = 8000;

const staticNode = require('node-static');
const WebSocket = require('ws');
const http = require('http');

const file = new staticNode.Server('./public');

const server = http
	.createServer((request, response) => {
		request
			.addListener('end', () => {
				file.serve(request, response);
			})
			.resume();
	})
	.listen(PORT);

const WSS = new WebSocket.Server({ server });

function sendTo(connection, message) {
	connection.send(JSON.stringify(message));
}

WSS.broadcast = (data, exceptClient = null) => {
	WSS.clients.forEach(client => {
		if (client !== exceptClient && client.readyState === WebSocket.OPEN) client.send(data);
	});
};

WSS.on('connection', ws => {
	console.log(`User connected`);
	ws.room = [];
	ws.on('message', message => {
		console.log('message: ', message);
		let data;
		try {
			data = JSON.parse(message);
		} catch (e) {
			// console.log(e);
			data = {};
		}
		// console.log(data);

		switch (data.type) {
			case 'join':
				console.log('User trying to join room');
				ws.room.push(data.room);
				break;

			case 'broadcast':
				broadcast(data.room, data.msg);
				break;

			case 'msg':
				console.log('message: ', data.msg);
				break;

			default:
				sendTo(ws, {
					type: 'error',
					message: `Command not found: ${data.type}`
				});
				break;
		}
	});
});

function broadcast(room, message) {
	console.log(`Broadcasting message [${message}] to the room -> ${room}.`);
	WSS.clients.forEach(client => {
		if (client.room.indexOf(room) > -1) {
			client.send(message);
		}
	});
}
