export default class Client {
	constructor(ws) {
		this.ws = ws;
		this.name = '';
	}
	sendJSONToServer(data) {
		this.ws.send(JSON.stringify(data));
	}
	joinChannel(cnl) {
		this.sendJSONToServer({
			type: 'join',
			room: cnl,
			name: this.name
		});
	}
}
