require('webrtc-adapter');

export default class Client {
	constructor(host) {
		this.ws = new WebSocket(host);
		this.name = '';
		this.room = '';
		this.mediaConstraints = { video: false, audio: true };
		this.localStream = null;
		this.remoteStream = null;

		// WebRTC vars
		this.pcConfig = {
			iceServers: [
				{ url: 'stun:stun01.sipphone.com' },
				{ url: 'stun:stun.ekiga.net' },
				{ url: 'stun:stun.fwdnet.net' },
				{ url: 'stun:stun.ideasip.com' },
				{ url: 'stun:stun.iptel.org' },
				{ url: 'stun:stun.rixtelecom.se' },
				{ url: 'stun:stun.schlund.de' },
				{ url: 'stun:stun.l.google.com:19302' },
				{ url: 'stun:stun1.l.google.com:19302' },
				{ url: 'stun:stun2.l.google.com:19302' },
				{ url: 'stun:stun3.l.google.com:19302' },
				{ url: 'stun:stun4.l.google.com:19302' },
				{ url: 'stun:stunserver.org' },
				{ url: 'stun:stun.softjoys.com' },
				{ url: 'stun:stun.voiparound.com' },
				{ url: 'stun:stun.voipbuster.com' },
				{ url: 'stun:stun.voipstunt.com' },
				{ url: 'stun:stun.voxgratia.org' },
				{ url: 'stun:stun.xten.com' },
				{
					url: 'turn:numb.viagenie.ca',
					credential: 'muazkh',
					username: 'webrtc@live.com'
				},
				{
					url: 'turn:192.158.29.39:3478?transport=udp',
					credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
					username: '28224511:1379330808'
				},
				{
					url: 'turn:192.158.29.39:3478?transport=tcp',
					credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
					username: '28224511:1379330808'
				}
			]
		};
		this.PC = {};

		// Callbacks
		this._onLocalAudioCallback = null;
		this._onRemoteAudioCallback = null;
		this._onJoinRoomCallback = null;
		this._onLeaveCallback = null;
		this._onNewUserCallback = null;

		this.initSignalingChannelHandlers();
	}

	// ///////////////////////////
	// PUBLIC METHODS
	// ///////////////////////////

	/**
	 * Get client's user media (audio)
	 */
	getUserMedia() {
		navigator.getUserMedia(this.mediaConstraints, stream => this.handleUserMedia(stream), this.handleUserMediaError);
	}

	/**
	 * Manually adding remote audio
	 * @param {object} stream   -Other client's MediaStream
	 * @param {string} fromUser -Other client's username
	 */
	addRemoteAudio(stream, fromUser) {
		this._onRemoteAudioCallback(stream, fromUser);
	}

	/**
	 * Deleting another peer from PC object
	 * @param  {username} peerName -Property name to be deleted
	 * @return {boolean}           -Delete operation success
	 */
	removePeerFromPeerConnections(peerName) {
		return delete this.PC[peerName];
	}

	/**
	 * Simply reassign PC object in order to delete old one
	 */
	emptyPeerConnections() {
		this.PC = {};
	}

	// ///////////////////////////
	// PUBLIC CALLBACK INIT METHODS
	// ///////////////////////////

	/* Callback function to be called when the current user enters a room for first time */
	onJoinRoom(callback) {
		this._onJoinRoomCallback = callback;
	}

	/* Callback function to be called when any user leaves a room */
	onLeave(callback) {
		this._onLeaveCallback = callback;
	}

	/* Callback to be called when a new user enters a room */
	onNewUser(callback) {
		this._onNewUserCallback = callback;
	}

	/** Callback to be called when a local audio access granted */
	onLocalAudio(callback) {
		this._onLocalAudioCallback = callback;
	}

	/** Callback to be called when a remote audio is delivered */
	onRemoteAudio(callback) {
		this._onRemoteAudioCallback = callback;
	}

	// ///////////////////////////
	// WebSocket Communication Methods
	// ///////////////////////////

	/**
	 * Custom WebSocket send wrapper to auto send json
	 * @param  {object} data -Data to be send
	 */
	sendJSONToServer(data) {
		this.ws.send(JSON.stringify(data));
	}

	/**
	 * Client sends to server name of the room that he wants to join
	 * @param  {string} room -Name of the room
	 */
	joinRoom(room) {
		this.room = room;
		this.sendJSONToServer({
			type: 'join',
			room: this.room,
			name: this.name
		});
	}

	/**
	 * Client send msg about leaving the room
	 */
	leaveRoom() {
		this.sendJSONToServer({
			type: 'leave',
			room: this.room
		});
	}

	/**
	 * Client reacting to server message(response)
	 */
	initSignalingChannelHandlers() {
		this.ws.onmessage = message => {
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
					this.setPeerRemoteDescription(data.answer, data.from);
					break;
				case 'candidate':
					this.addCandidate(data);
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

	/**
	 * Creating new RTCPeerConnection and setting up all necessary handle functions
	 * @param  {string} username -It will be object property that contains RTCPeerConnection object
	 */
	initPeerConnectionWithUser(username) {
		this.PC[username] = new RTCPeerConnection(this.pcConfig);
		this.PC[username].onicecandidate = this.handleIceCandidateNegotiation(username);
		this.PC[username].onaddstream = this.handleRemoteTrackAdded(username);
		this.PC[username].onremovestream = this.handleRemoteStreamRemoved;
		this.PC[username].addStream(this.localStream);
		this.PC[username].oniceconnectionstatechange = err => {
			if (this.PC[username].iceConnectionState === 'failed') {
				console.log(err);
			}
		};
	}

	/**
	 * Initializing peer connection with existing users and creating offers to them
	 * @param  {array} users -Array of usernames to send offer
	 */
	createOffers(users) {
		for (let i = 0; i < users.length; i++) {
			console.log(`Creating offer for ${users[i]}`);

			this.initPeerConnectionWithUser(users[i]);

			this.PC[users[i]]
				.createOffer()
				.then(offer => {
					this.sendJSONToServer({
						type: 'offer',
						room: this.room,
						toUserIndex: i,
						offer
					});
					this.PC[users[i]].setLocalDescription(offer);
				})
				.catch(this.handleCreateOfferError);
		}
	}

	/**
	 * Initializing peer connection with specific user and creating answer for him
	 * @param  {object} offer    -WebRTC Offer object
	 * @param  {string} fromUser -Username who sent to us an offer -> creating him an answer
	 */
	createAnswer(offer, fromUser) {
		console.log(`Creating answer for ${fromUser}`);

		this.initPeerConnectionWithUser(fromUser);

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

	/**
	 * Setting up peer remote description based on answer
	 * @param {object} answer   -WebRTC answer object
	 * @param {string} fromUser -username who sent us an answer
	 */
	setPeerRemoteDescription(answer, fromUser) {
		this.PC[fromUser].setRemoteDescription(new RTCSessionDescription(answer));
	}

	/**
	 * Adding ice candidate peer connection
	 * @param {object} data -Object contains username and webRTC candidate object
	 */
	addCandidate(data) {
		console.log(`Ice candidate data`, data);
		this.PC[data.fromUser].addIceCandidate(new RTCIceCandidate(data.candidate));
	}

	// ///////////////////////////
	// HANDLERS
	// ///////////////////////////
	handleUserMedia(stream) {
		// console.log('Adding local stream');
		this.localStream = stream;
		this._onLocalAudioCallback(stream);
	}

	handleIceCandidateNegotiation(toUser) {
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
}
