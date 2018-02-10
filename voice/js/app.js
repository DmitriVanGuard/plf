import Client from './client';

const client = new Client('ws://localhost:8000');
const { loginForm } = document.forms;

// ///////////////////////
// DOM ELEMENTS
// ///////////////////////
const currentRoomNode = document.getElementById('currentRoom');
const userNameNode = document.getElementById('userName');
const usersListNode = document.getElementById('usersList');

loginForm.loginBtn.onclick = () => {
	if (loginForm.userNameInput.value === '') return alert('Please, enter your name');

	client.name = loginForm.userNameInput.value;
	client.joinChannel(loginForm.roomChoice.value);

	return console.log(`You[${client.name}] joined channel ${loginForm.roomChoice.value}`);
};

// ////////////////////////////
// WebSocket Handlers Callbacks
// ////////////////////////////
function updateUsersList(users) {
	const arrayOfUserNames = Array.isArray(users);
	let nodeToAppend = null;
	console.log(users);
	if (arrayOfUserNames === true) {
		const frag = document.createDocumentFragment();
		for (let i = 0; i < users.length; i++) {
			const item = document.createElement('li');
			item.textContent = users[i];

			const audio = document.createElement('audio');
			audio.controls = true;
			item.appendChild(audio);

			frag.appendChild(item);
		}
		nodeToAppend = frag;
	} else {
		// users это не массив, а String - одно единственное имя
		const item = document.createElement('li');
		item.textContent = users;

		const audio = document.createElement('audio');
		audio.controls = true;
		item.appendChild(audio);

		nodeToAppend = item;
	}
	return usersListNode.appendChild(nodeToAppend);
}

client.onJoinRoom(data => {
	if (data.success === false) return alert('Пожалуйста, выберите другое имя');

	currentRoomNode.textContent = client.room;
	userNameNode.textContent = client.name;

	loginForm.loginBtn.disabled = true;
	updateUsersList(data.users);
	return console.log('Login successful');
});
client.onNewUser(data => updateUsersList(data.name));
