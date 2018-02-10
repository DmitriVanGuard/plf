export default class Room {
	constructor() {
		this.loginForm = document.forms.loginForm;
		this.currentRoom = document.getElementById('currentRoom');
		this.userName = document.getElementById('userName');
		this.usersList = document.getElementById('usersList');
	}

	updateUsersList(usernames) {
		const arrayOfUserNames = Array.isArray(usernames);
		let nodeToAppend = null;
		console.log(usernames);
		if (arrayOfUserNames === true) {
			const frag = document.createDocumentFragment();
			for (let i = 0; i < usernames.length; i++) {
				const item = this.createNewItemInUsersList(usernames[i]);
				frag.appendChild(item);
			}
			nodeToAppend = frag;
		} else {
			// usernames это не массив, а String - одно единственное имя
			nodeToAppend = this.createNewItemInUsersList(usernames);
		}
		return this.usersList.appendChild(nodeToAppend);
	}

	createNewItemInUsersList(username) {
		const item = document.createElement('li');
		item.textContent = username;

		const audio = document.createElement('audio');
		audio.controls = true;
		item.appendChild(audio);
		return item;
	}
}
