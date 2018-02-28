export default class Room {
	constructor() {
		this.controlForm = document.forms.controlForm;
		this.currentRoom = document.getElementById('currentRoom');
		this.userName = document.getElementById('userName');
		this.usersList = document.getElementById('usersList');
		this.localAudio = document.getElementById('localAudio');
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
			// usernames не массив, а String - одно единственное имя
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

	/**
	 * Creates new list item and audio in room interface
	 * @param  {string} username -Client's username to be added
	 * @return {HTMLLIElement}   -li HTML element which contains username as text and audio for remote audio
	 */
	createNewListItemInUsersList(username) {
		const item = document.createElement('li');
		item.setAttribute('data-name', username);
		item.textContent = username;

		const audio = document.createElement('audio');
		audio.controls = true;
		item.appendChild(audio);
		return item;
	}

	/**
	 * Disable user control depending on logged in status
	 * @param  {boolean} state -TRUE=user logged in room, FALSE=user is not logged in
	 */
	switchControlsDisableState(state) {
		this.controlForm.userNameInput.disabled = state;
		this.controlForm.loginBtn.disabled = state;
		this.controlForm.roomChoice.disabled = state;
		this.controlForm.logoutBtn.disabled = !state;
	}
}
