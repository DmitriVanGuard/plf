import Client from './client';
// import WSHandlers from './WSHandlers';

const ws = new WebSocket('ws://localhost:8000');
const client = new Client(ws);
// const wsHandlers = new WSHandlers(ws);
const { loginForm } = document.forms;

loginForm.loginBtn.onclick = () => {
	if (loginForm.userNameInput.value === '') return alert('Please, enter your name');

	client.name = loginForm.userNameInput.value;
	client.joinChannel(loginForm.roomChoice.value);

	return console.log(`You[${client.name}] joined channel ${loginForm.roomChoice.value}`);
};

/* ******************** */
/*  WebSocket Handlers	*/
/* ******************** */

ws.onmessage = message => {
	console.log('Got message', message.data);
	const data = JSON.parse(message.data);

	switch (data.type) {
		case 'join':
			console.log(data);
			handleJoin(data);
			break;
		case 'newUser':
			updateUsersList(data.name);
			console.log(data);
			break;
		default:
			console.log(`Unknown message type ${data.type}`, data);
			break;
	}
};

/* ******************** */
/*	DOM ELEMENTS				*/
/* ******************** */
const currentRoomNode = document.getElementById('currentRoom');
const userNameNode = document.getElementById('userName');
const usersListNode = document.getElementById('usersList');

function handleJoin(data) {
	if (data.success === false) return alert('Пожалуйста, выберите другое имя');

	currentRoomNode.textContent = client.room;
	userNameNode.textContent = client.name;

	updateUsersList(data.users);

	return console.log('Login successful');
}

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

/*
	var group = document.getElementById('group').textContent;
	// const btn = document.querySelector('button');
	btn.onclick = bjoin;
	// console.log(btn);

	// var ws = new WebSocket('ws://localhost:8000');
	ws.onerror = function(e) {
		out.innerHTML = e;
	};
	ws.onclose = function(e) {
		out.innerHTML = 'closed' + e;
	};
	ws.onopen = function() {
		out.innerHTML = 'connected ';
	};
	ws.onmessage = function(ms) {
		out.innerHTML += ms.data + '<br>';
	};
	function send(msg) {
		ws.send(JSON.stringify({ msg: msg }));
	}
	function broadcast(msg, room) {
		ws.send(JSON.stringify({ type: 'broadcast', room, msg }));
	}
	function join(room) {
		ws.send(JSON.stringify({ type: 'join', room }));
	}
	function bjoin() {
		//alert(group);
		join(group);
		btn.textContent = 'Connected';
		btn.disabled = true;
	}
	text.onchange = function(el) {
		//alert(el.target.value);
		broadcast(el.target.value, group);
	};
	*/
