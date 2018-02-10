export default class WSHandlers {
	constructor(ws) {
		this.ws = ws;
		this._onJoin = null;

		this.ws.onmessage = message => {
			console.log('Got message', message.data);
			const data = JSON.parse(message.data);

			switch (data.type) {
				case 'join':
					this._onJoin();
					break;
				case 'newUser':
					this._onNewUser();
					break;
				default:
					console.log(`Unknown message type ${data.type}`, data);
					break;
			}
		};
	}

	onJoin(callback) {
		this._onJoin = callback;
	}

	onDefault(callback) {
		this._onDefault = callback;
	}
}
