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
		this.remoteStream = null;
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

	onRemoteAudio(callback) {
		this._onRemoteAudioCallback = callback;
	}

	// ///////////////////////////
	// SETUP/INIT METHODS
	// ///////////////////////////
	initSignalingChannelHandlers() {
		this.ws.onmessage = message => {
			// console.log('Got message', message.data);
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
				case 'offer':
					this.createAnswer(data.offer, data.from);
					break;
				case 'answer':
					console.log(`Got answer from ${data.from}`);
					this.setRemoteDescription(data.answer, data.from);
					break;
				case 'candidate':
					console.log('CAndidate message');
					this.handleCandidate(data);
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
			console.log(`Creating offer for ${users[i]}`);
			this.PC[users[i]] = new RTCPeerConnection(this.pcConfig);
			this.PC[users[i]].onicecandidate = this.handleIceCandidateAnswerWrapper(users[i]);
			this.PC[users[i]].onaddstream = this.handleRemoteTrackAdded(users[i]);
			this.PC[users[i]].onremovestream = this.handleRemoteStreamRemoved;
			this.PC[users[i]].addStream(this.localStream);

			this.PC[users[i]]
				.createOffer()
				.then(offer => {
					this.sendJSONToServer({
						type: 'offer',
						room: this.room,
						toUserIndex: i,
						offer
					});
					// create;
					this.PC[users[i]].setLocalDescription(offer);
				})
				.catch(this.handleCreateOfferError);
		}
	}

	createAnswer(offer, fromUser) {
		console.log(`Creating answer for ${fromUser}`);
		this.PC[fromUser] = new RTCPeerConnection(this.pcConfig);
		this.PC[fromUser].onicecandidate = this.handleIceCandidateAnswerWrapper(fromUser);
		this.PC[fromUser].onaddstream = this.handleRemoteTrackAdded(fromUser);
		this.PC[fromUser].onremovestream = this.handleRemoteStreamRemoved;
		this.PC[fromUser].addStream(this.localStream);

		this.PC[fromUser].setRemoteDescription(new RTCSessionDescription(offer));

		this.PC[fromUser]
			.createAnswer()
			.then(answer => {
				this.sendJSONToServer({
					type: 'answer',
					room: this.room,
					toUser: fromUser,
					answer
				});
				this.PC[fromUser].setLocalDescription(answer);
			})
			.catch(this.handleCreateAnswerError);
	}

	setRemoteDescription(answer, fromUser) {
		// Call RTCPeerConnection method setRemoteDescription (not Client class)
		this.PC[fromUser].setRemoteDescription(new RTCSessionDescription(answer));
	}

	// ///////////////////////////
	// HANDLERS
	// ///////////////////////////
	handleUserMedia(stream) {
		console.log('Adding local stream');
		this.localStream = stream;
		this._onLocalAudioCallback(stream);
	}

	handleIceCandidateAnswerWrapper(toUser) {
		return event => {
			if (event.candidate) {
				this.sendJSONToServer({
					type: 'candidate',
					candidate: event.candidate,
					room: this.room,
					toUser: toUser
				});
			}
		};
	}

	handleCandidate(data) {
		console.log(`Ice candidate data`, data);
		this.PC[data.fromUser].addIceCandidate(new RTCIceCandidate(data.candidate));
	}

	handleRemoteTrackAdded(from) {
		console.log('Track added event');
		return event => {
			console.log('Remote stream added');
			this.addRemoteAudio(event.stream, from);
			this.remoteStream = event.stream;
		};
	}
	handleRemoteStreamRemoved(event) {
		console.log('Remote streem removed. Event:', event);
	}
	handleUserMediaError(error) {
		console.log('getUserMedia error:', error);
	}
	handleCreateOfferError(error) {
		console.log('createOffer() error:', error);
	}
	handleCreateAnswerError(error) {
		console.log('createAnswer() error:', error);
	}

	// Check this function
	addRemoteAudio(stream, fromUser) {
		this._onRemoteAudioCallback(stream, fromUser);
	}
}
