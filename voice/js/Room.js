export default class Room {
	constructor() {
		this.controlForm = document.forms.controlForm;
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
				const item = this.createNewListItemInUsersList(usernames[i]);
				frag.appendChild(item);
			}
			nodeToAppend = frag;
		} else {
			// usernames это не массив, а String - одно единственное имя
			nodeToAppend = this.createNewListItemInUsersList(usernames);
		}
		return this.usersList.appendChild(nodeToAppend);
	}

	cleanRoom() {
		this.userName.textContent = '';
		this.currentRoom.textContent = '';
		this.usersList.innerHTML = '';
	}

	removeUserFromUsersList(username) {
		const target = this.usersList.querySelector(`li[data-name="${username}"]`);

		if (target === null) return;
		target.lastElementChild.src = '';
		target.remove();
	}

	// /////////////////////////////
	// Helper functions
	// /////////////////////////////
	createNewListItemInUsersList(username) {
		const item = document.createElement('li');
		item.setAttribute('data-name', username);
		item.textContent = username;

		const audio = document.createElement('audio');
		audio.controls = true;
		item.appendChild(audio);
		return item;
	}
}
