const PORT = 8000;

const staticNode = require('node-static');
const WebSocket = require('ws');
const http = require('http');
const chalk = require('chalk');

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

console.log(chalk.yellow('Server is running on port -> ') + chalk.bgGreen(chalk.black(PORT)));

const WSS = new WebSocket.Server({ server });

WSS.rooms = {
	alpha: [],
	beta: []
};

WSS.on('connection', wsClient => {
	console.log(chalk.cyan(`New connection established`));

	/* WHEN CLIENT SEND MESSAGE */
	wsClient.on('message', message => {
		// console.log('message: ', message);
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
				if (isNameInUseInChosenRoom(data.name, data.room)) {
					sendTo(wsClient, { type: 'join', success: false });
					break;
				}
				console.log(`User[${data.name}] joined room ${data.room}`);
				sendTo(wsClient, { type: 'join', success: true, users: getExistingRoomUserNames(data.room) });
				wsClient.name = data.name;
				wsClient.id = generateUserIDinRoom(data.room);

				WSS.broadcast(data.room, { type: 'newUser', name: data.name });

				WSS.rooms[data.room].push(wsClient);
				// console.log(WSS.rooms);
				break;

			case 'broadcast':
				// broadcast(data.room, data.msg);
				break;

			case 'msg':
				console.log('message: ', data.msg);
				break;

			default:
				sendTo(wsClient, {
					type: 'error',
					message: `Command not found: ${data.type}`
				});
				break;
		}
	});

	/* CLIENT CLOSE BROWSER OR CONNECTION */
	wsClient.on('close', (code, reason) => {
		if (wsClient.name) {
			console.log(`User[${wsClient.name}] disconnected from the server\n\tCode -> ${code}\n\tReason -> ${reason}`);
		}
	});

	wsClient.on('error', () => console.log(chalk.red(`Some error after closing browsers`)));
});

function sendTo(connection, message) {
	connection.send(JSON.stringify(message));
}
function isNameInUseInChosenRoom(name, room) {
	return WSS.rooms[room].some(socket => socket.name === name);
}
function getExistingRoomUserNames(room) {
	return WSS.rooms[room].map(socket => socket.name);
}
function generateUserIDinRoom(room) {
	return WSS.rooms[room].length;
}
WSS.broadcast = (room, data, exceptClient = null) => {
	WSS.rooms[room].forEach(client => {
		if (client !== exceptClient && client.readyState === WebSocket.OPEN) sendTo(client, data);
	});
};

/*function broadcast(room, message) {
	console.log(`Broadcasting message [${message}] to the room -> ${room}.`);
	WSS.clients.forEach(client => {
		if (client.room.indexOf(room) > -1) {
			client.send(message);
		}
	});
}*/
