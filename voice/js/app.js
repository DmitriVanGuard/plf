import Client from './Client';
import Room from './Room';

const client = new Client('ws://localhost:8000');
const room = new Room();

room.loginForm.loginBtn.onclick = () => {
	if (loginForm.userNameInput.value === '') return alert('Please, enter your name');

	client.name = loginForm.userNameInput.value;
	client.joinChannel(loginForm.roomChoice.value);

	return console.log(`You[${client.name}] joined channel ${loginForm.roomChoice.value}`);
};

// ////////////////////////////
// WebSocket Handlers Callbacks
// ////////////////////////////
client.onJoinRoom(data => {
	if (data.success === false) return alert('Пожалуйста, выберите другое имя');

	room.currentRoom.textContent = client.room;
	room.userName.textContent = client.name;

	room.loginForm.loginBtn.disabled = true;
	room.updateUsersList(data.users);
	return console.log('Login successful');
});

client.onNewUser(data => room.updateUsersList(data.name));
