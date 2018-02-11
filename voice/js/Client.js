require('webrtc-adapter');

export default class Client {
	constructor(host) {
		this.ws = new WebSocket(host);
		this.name = '';
		this.room = '';
		this._onJoinRoomCallback = null;
		this._onLeaveCallback = null;
		this._onNewUserCallback = null;

		// WebRTC vars
		this.mediaConstraints = { video: false, audio: true };
		this.pcConfig = { iceServers: [{ url: 'stun:stun2.1.google.com:19302' }] };
		this.PC = {};
		this.localStream = null;
		this._onLocalAudioCallback = null;
		this._onRemoteAudioCallback = null;

		this.initSignalingChannelHandlers();
	}
	sendJSONToServer(data) {
		this.ws.send(JSON.stringify(data));
	}
	joinRoom(room) {
		this.room = room;
		this.sendJSONToServer({
			type: 'join',
			room: this.room,
			name: this.name
		});
	}
	leaveRoom() {
		this.sendJSONToServer({
			type: 'leave',
			room: this.room
		});
	}

	// ///////////////////////////
	// PUBLIC CALLBACK INIT METHODS
	// ///////////////////////////

	/* Add callback function function to be when the current user enters a room for first time */
	onJoinRoom(callback) {
		this._onJoinRoomCallback = callback;
	}

	/* Add callback function function to be called when any user leaves a room */
	onLeave(callback) {
		this._onLeaveCallback = callback;
	}

	/* Add callback function to be called when a new user enters a room */
	onNewUser(callback) {
		this._onNewUserCallback = callback;
	}

	getUserMedia() {
		navigator.getUserMedia(this.mediaConstraints, stream => this.handleUserMedia(stream), this.handleUserMediaError);
	}

	onLocalAudio(callback) {
		this._onLocalAudioCallback = callback;
	}

	// ///////////////////////////
	// SETUP/INIT METHODS
	// ///////////////////////////
	initSignalingChannelHandlers() {
		window.onbeforeunload = () => {
			this.leaveRoom();
		};
		this.ws.onmessage = message => {
			console.log('Got message', message.data);
			const data = JSON.parse(message.data);

			switch (data.type) {
				case 'join':
					this._onJoinRoomCallback(data);
					break;
				case 'newUser':
					this._onNewUserCallback(data);
					break;
				case 'leave':
					this._onLeaveCallback(data);
					break;
				default:
					console.log(`Unknown message type ${data.type}`, data);
					break;
			}
		};
	}
	// ///////////////////////////
	// COMMUNICATION METHODS
	// ///////////////////////////
	createOffers(users) {
		for (let i = 0; i < users.length; i++) {
			this.PC[users[i]] = new RTCPeerConnection(this.pcConfig);
			// this.PC[users[i]].onicecandidate = this.handleIceCandidateAnswerWrapper();
			// this.PC[users[i]].ontrack = handleRemoteTrackAdded(users[i]);
			// this.PC[users[i]].onremovestream = handleRemoteStreamRemoved;
			this.PC[users[i]].createOffer(offer => {
				this.PC[users[i]].setLocalDescription(offer);
			}, this.handleCreateOfferError);
		}
	}

	// ///////////////////////////
	// HANDLERS
	// ///////////////////////////
	handleUserMedia(stream) {
		console.log('Adding local stream');
		// console.log(this);
		this._onLocalAudioCallback(stream);
		this.localStream = stream;
	}
	handleUserMediaError(error) {
		console.log('getUserMedia error:', error);
	}
	handleCreateOfferError(error) {
		console.log('createOffer() error:', error);
	}
}
