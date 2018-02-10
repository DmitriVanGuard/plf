import Client from './client';

const ws = new WebSocket('ws://localhost:8000');
const client = new Client(ws);

const { loginForm } = document.forms;

loginForm.loginBtn.onclick = () => {
	if (loginForm.userNameInput.value === '') return alert('Please, enter your name');

	client.name = loginForm.userNameInput.value;
	client.joinChannel(loginForm.roomChoice.value);

	return console.log(`You[${client.name}] joined channel ${loginForm.roomChoice.value}`);
};

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
