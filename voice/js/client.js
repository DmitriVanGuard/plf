export default class Client {
	constructor(ws) {
		this.ws = ws;
		this.name = '';
		this.room = '';
	}
	sendJSONToServer(data) {
		this.ws.send(JSON.stringify(data));
	}
	joinChannel(room) {
		this.room = room;
		this.sendJSONToServer({
			type: 'join',
			room,
			name: this.name
		});
	}
}
