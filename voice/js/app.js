import 'webrtc-adapter';
import Client from './Client';
import Room from './Room';

const client = new Client('wss://7613f684.eu.ngrok.io');
const room = new Room();

// ////////////////////////////
// Control Form Event Handlers
// ////////////////////////////
room.controlForm.loginBtn.onclick = () => {
	if (room.controlForm.userNameInput.value === '') return alert('Please, enter your name');

	client.name = room.controlForm.userNameInput.value;
	client.joinRoom(room.controlForm.roomChoice.value);

	return console.log(`You[${client.name}] joined channel ${room.controlForm.roomChoice.value}`);
};
room.controlForm.loginBtn.ontouchstart = room.controlForm.loginBtn.onclick;

room.controlForm.logoutBtn.onclick = () => {
	client.leaveRoom();
	room.cleanRoom();
};
room.controlForm.logoutBtn.ontouchstart = room.controlForm.logoutBtn.onclick;

// /////////////////////////////
// WebSocket Callback Handlers
// /////////////////////////////
client.onJoinRoom(data => {
	if (data.success === false) return alert('Пожалуйста, выберите другое имя');

	window.onbeforeunload = () => {
		client.leaveRoom();
	};
	client.getUserMedia();
	client.onLocalAudio(stream => {
		room.localAudio.srcObject = stream;
		client.createOffers(data.users);
	});

	room.currentRoom.textContent = client.room;
	room.userName.textContent = client.name;

	room.switchControlsDisableState(true);

	room.updateUsersList(data.users);
	return console.log('Login successful');
});

client.onNewUser(data => room.updateUsersList(data.name));

client.onLeave(data => {
	if (client.name !== data.name) {
		room.removeUserFromUsersList(data.name);
		client.closePeerFromPeerConnections(data.name);
	} else {
		client.closePeerConnections();
		room.switchControlsDisableState(false);
		room.localAudio.srcObject = null;
	}
});

client.onRemoteAudio((stream, fromUser) => {
	console.log('Adding remote audio from user', fromUser);
	const item = room.usersList.querySelector(`li[data-name="${fromUser}"]`);
	item.lastElementChild.srcObject = stream;
});
