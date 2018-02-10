var group = document.getElementById('group').textContent;
// const btn = document.querySelector('button');
btn.onclick = bjoin;
// console.log(btn);

var ws = new WebSocket('ws://localhost:8000');
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
