const PORT = 8000;

const staticNode = require('node-static');
const WebSocket = require('ws');
const http = require('http');
const chalk = require('chalk');

// Static Server Setup
const file = new staticNode.Server('./public');

// HTTP Server Setup
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
// ----------------

// WSS Server Setup
const WSS = new WebSocket.Server({ server });
WSS.rooms = {
	alpha: [],
	beta: []
};
// ----------------

// Helper Functions

/**
 * Stringify JSON data and send it to client
 * @param  {object} socket 		-Client's WebSocket to get message
 * @param  {object} message   -Data to be stringified
 */
const sendTo = (socket, message) => socket.send(JSON.stringify(message));

/**
 * Check if username is already in use
 * @param  {string} name -Name to check
 * @param  {string} room -Room to be checked
 * @return {boolean}     -True if name already exist
 */
const isNameInUseInChosenRoom = (name, room) => WSS.rooms[room].some(socket => socket.name === name);

/**
 * Get array of usernames who connected before new client
 * @param  {string} room -Room name where to get usernames
 * @return {array}       -New array of usernames
 */
const getUsernamesInChosenRoom = room => WSS.rooms[room].map(socket => socket.name);

/**
 * Delete client's websocket from room
 * @param  {object} socket -Clients websocket to be deleted
 * @param  {string} room   -Room where clients socket to be found
 */
const deleteUserSocketFromRoomsArray = (socket, room) => {
	const userIndex = WSS.rooms[room].indexOf(socket);
	console.log(`${chalk.red('Deleting user')} at index -> ${chalk.red(userIndex)}`);
	if (userIndex !== -1) WSS.rooms[room].splice(userIndex, 1);
};

/**
 * WebSocket Server broadcoasting to all clients inside room
 * @param  {string} room         -Room clients to get server message
 * @param  {object} data         -JSON data for clients
 * @param  {object} exceptSocket -Client websocket to exclude
 */
WSS.broadcast = (room, data, exceptSocket = null) => {
	WSS.rooms[room].forEach(client => {
		if (client !== exceptSocket && client.readyState === WebSocket.OPEN) sendTo(client, data);
	});
};
// ----------------

// WebSocket Server Behaviour
WSS.on('connection', wsClient => {
	console.log(chalk.cyan(`New connection established`));

	/* WHEN CLIENT SENDS MESSAGE */
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
				wsClient.name = data.name;
				wsClient.room = data.room;

				console.log(`User[${chalk.green(data.name)}] joined room ${chalk.green(wsClient.room)}`);

				sendTo(wsClient, { type: 'join', success: true, users: getUsernamesInChosenRoom(wsClient.room) });
				WSS.broadcast(wsClient.room, { type: 'newUser', name: wsClient.name });

				WSS.rooms[wsClient.room].push(wsClient);
				break;

			case 'leave':
				WSS.broadcast(wsClient.room, { type: 'leave', name: wsClient.name });
				deleteUserSocketFromRoomsArray(wsClient, wsClient.room);
				break;

			case 'offer':
				console.log(`${chalk.magenta(wsClient.name)} wants to send an ${chalk.magenta('offer')} to ${chalk.magenta(WSS.rooms[wsClient.room][data.toUserIndex].name)} in room ${chalk.magenta(wsClient.room)}`); // prettier-ignore
				sendTo(WSS.rooms[wsClient.room][data.toUserIndex], { type: 'offer', offer: data.offer, from: wsClient.name });
				break;

			case 'answer':
				console.log(`${chalk.greenBright(wsClient.name)} wants to send an ${chalk.greenBright('answer')} to ${chalk.greenBright(data.toUser)} in room ${chalk.greenBright(wsClient.room)}`); // prettier-ignore

				// Send answer to client. Searching from right, because client which waits for answer is in the end
				for (let i = WSS.rooms[wsClient.room].length - 1; i > -1; i--) {
					if (WSS.rooms[wsClient.room][i].name === data.toUser) {
						sendTo(WSS.rooms[wsClient.room][i], { type: 'answer', answer: data.answer, from: wsClient.name });
						break;
					}
				}
				break;

			case 'candidate':
				console.log(`${chalk.cyanBright(wsClient.name)} wants to send an ${chalk.cyanBright('candidate')} to ${chalk.cyanBright(data.toUser)} in room ${chalk.cyanBright(wsClient.room)}`); // prettier-ignore

				WSS.rooms[wsClient.room].some(socket => {
					if (socket.name === data.toUser) {
						sendTo(socket, {
							type: 'candidate',
							fromUser: wsClient.name,
							candidate: data.candidate
						});
						return true;
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
			deleteUserSocketFromRoomsArray(wsClient, wsClient.room);
			console.log(`User[${chalk.red(wsClient.name)}] disconnected from the server\n\tCode -> ${code}\n\tReason -> ${reason}`);
		}
	});

	wsClient.on('error', () => {
		if (wsClient.name) {
			deleteUserSocketFromRoomsArray(wsClient, wsClient.room);
		}
		console.log(chalk.red(`Some error after closing browsers`));
	});
});
