import Client from './Client';
import Room from './Room';

const client = new Client('ws://localhost:8000');
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

room.controlForm.logoutBtn.onclick = () => {
	client.leaveRoom();
	room.cleanRoom();
};

// /////////////////////////////
// WebSocket Callback Handlers
// /////////////////////////////
client.onJoinRoom(data => {
	if (data.success === false) return alert('Пожалуйста, выберите другое имя');

	client.getUserMedia();
	client.onLocalAudio(stream => {
		room.localAudio.srcObject = stream;
	});
	client.createOffers(data.users);

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
	} else {
		room.switchControlsDisableState(false);
		room.localAudio.srcObject = null;
	}
});
