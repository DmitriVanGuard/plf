const PORT = 8000;

const staticNode = require('node-static');
const WebSocket = require('ws');
const http = require('http');
const chalk = require('chalk');

// ///////////////////////////
// HELPER FUNCTIONS
// ///////////////////////////

/**
 * WebSocket Server broadcoasting to all clients inside room
 * @param  {string} room         Room clients to get server message
 * @param  {object} data         JSON data for clients
 * @param  {object} exceptClient WS object reference of the client to exclude
 */
WSS.broadcast = (room, data, exceptClient = null) => {
	WSS.rooms[room].forEach(client => {
		if (client !== exceptClient && client.readyState === WebSocket.OPEN) sendTo(client, data);
	});
};
const sendTo = (connection, message) => {
	connection.send(JSON.stringify(message));
};
const isNameInUseInChosenRoom = (name, room) => {
	return WSS.rooms[room].some(socket => socket.name === name);
};
const getExistingRoomUserNames = room => {
	return WSS.rooms[room].map(socket => socket.name);
};
const deleteUserSocketFromRoomsArray = (socket, room) => {
	const userIndex = WSS.rooms[room].indexOf(socket);
	console.log(`${chalk.red('Deleting user')} at index -> ${chalk.red(userIndex)}`);
	if (userIndex !== -1) WSS.rooms[room].splice(userIndex, 1);
};
// ///////////////////////////
// HELPER FUNCTIONS END
// ///////////////////////////

const file = new staticNode.Server('./public');

const server = http
	.createServer((request, response) => {
		console.log(`${new Date()} user enters the site`);
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
		let data;
		try {
			data = JSON.parse(message);
		} catch (e) {
			data = {};
		}

		switch (data.type) {
			case 'join':
				if (isNameInUseInChosenRoom(data.name, data.room)) {
					sendTo(wsClient, { type: 'join', success: false });
					break;
				}
				console.log(`User[${chalk.green(data.name)}] joined room ${chalk.green(data.room)}`);
				sendTo(wsClient, { type: 'join', success: true, users: getExistingRoomUserNames(data.room) });

				wsClient.name = data.name;
				WSS.broadcast(data.room, { type: 'newUser', name: data.name });

				WSS.rooms[data.room].push(wsClient);
				break;

			case 'leave':
				WSS.broadcast(data.room, { type: 'leave', name: wsClient.name });
				deleteUserSocketFromRoomsArray(wsClient, data.room);
				break;

			case 'offer':
				console.log(`${chalk.magenta(wsClient.name)} wants to send an ${chalk.magenta('offer')} to ${chalk.magenta(WSS.rooms[data.room][data.toUserIndex].name)} in room ${chalk.magenta(data.room)}`); // prettier-ignore
				sendTo(WSS.rooms[data.room][data.toUserIndex], { type: 'offer', offer: data.offer, from: wsClient.name });
				break;

			case 'answer':
				console.log(`${chalk.greenBright(wsClient.name)} wants to send an ${chalk.greenBright('answer')} to ${chalk.greenBright(data.toUser)} in room ${chalk.greenBright(data.room)}`); // prettier-ignore
				for (let i = WSS.rooms[data.room].length - 1; i !== -1; i--) {
					if (WSS.rooms[data.room][i].name === data.toUser) {
						sendTo(WSS.rooms[data.room][i], { type: 'answer', answer: data.answer, from: wsClient.name });
						break;
					}
				}
				break;

			case 'candidate':
				console.log(`${chalk.cyanBright(wsClient.name)} wants to send an ${chalk.cyanBright('candidate')} to ${chalk.cyanBright(data.toUser)} in room ${chalk.cyanBright(data.room)}`); // prettier-ignore
				WSS.rooms[data.room].some(socket => {
					if (socket.name === data.toUser) {
						sendTo(socket, {
							type: 'candidate',
							fromUser: wsClient.name,
							candidate: data.candidate
						});
					}
					return false;
				});
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
			// deleteUserSocketFromRoomsArray(); TODO: DELETE USER
			deleteUserSocketFromRoomsArray(wsClient, 'alpha');
			console.log(`User[${chalk.red(wsClient.name)}] disconnected from the server\n\tCode -> ${code}\n\tReason -> ${reason}`);
		}
	});

	wsClient.on('error', () => {
		if (wsClient.name) {
			deleteUserSocketFromRoomsArray(wsClient, 'alpha');
		}
		console.log(chalk.red(`Some error after closing browsers`));
	});
});
