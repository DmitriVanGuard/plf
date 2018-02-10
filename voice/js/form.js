import Client from './client';

const ws = new WebSocket('ws://localhost:8000');
const client = new Client(ws);

const { loginForm } = document.forms;

loginForm.loginBtn.onclick = () => {
	if (loginForm.userNameInput.value === '') return alert('Please, enter your name');
	client.name = loginForm.userNameInput.value;
	client.sendJSONToServer({
		type: 'join',
		room: loginForm.roomChoice.value,
		name: client.name
	});
	return console.log(`You[${client.name}] joined channel ${loginForm.roomChoice.value}`);
};
