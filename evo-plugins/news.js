'use strict';
let moment = require('moment');
// News from Gold
// Refactored for Evo

Evo.generateNews = function generateNews () {
	let lobby = Rooms('lobby');
	if (!lobby) return false;
	if (!lobby.news || Object.keys(lobby.news).length < 0) return false;
	if (!lobby.news) lobby.news = {};
	let news = lobby.news, newsDisplay = [];
	Object.keys(news).forEach(announcement => {
		newsDisplay.push(`<h4>${announcement}</h4>${news[announcement].desc}<br /><br /><strong>—<font color="${Evo.hashColor(news[announcement].by)}">${news[announcement].by}</font></strong> on ${moment(news[announcement].posted).format("MMM D, YYYY")}`);
	});
		return newsDisplay;
	}

Evo.newsDisplay = function newsDisplay (user) {
	if (!Users(user)) return false;
	let newsDis = this.generateNews();
	if (newsDis.length === 0) return false;

	if (newsDis.length > 0) {
	
		newsDis = newsDis.join('<hr>');
			return Users(user).send(`|pm| Evolution News|${Users(user).getIdentity()}|/raw ${newsDis}`);
		}
	}

exports.commands = {
	news: 'announcements',
	'announcements': {
		'': 'view',
		display: 'view',
		view: function (target, room, user) {
			if (!Rooms('lobby') || !Rooms('lobby').news) return this.errorReply("Strange, there are no server announcements...");
			if (!Rooms('lobby').news && Rooms('lobby')) Rooms('lobby').news = {};
			let news = Rooms('lobby').news;
			if (Object.keys(news).length === 0) return this.sendReply("There are currently no new server announcements at this time.");
			return user.send('|popup||wide||html|' +
				"<center><strong>Current server announcements:</strong></center>" +
					Evo.generateNews().join('<hr>')
			);

		},

		delete: function (target, room, user) {
			if (!this.can('ban')) return false;
			if (!target) return this.parse('/help serverannouncements');
			if (!Rooms('lobby').news) Rooms('lobby').news = {};
			let news = Rooms('lobby').news;
			if (!news[target]) return this.errorReply("This announcement doesn't seem to exist...");
			delete news[target];
			Rooms('lobby').news = news;
			Rooms('lobby').chatRoomData.news = Rooms('lobby').news;
			Rooms.global.writeChatRoomData();
			this.privateModCommand(`(${user.name} deleted server announcement titled: ${target}.)`);
		},

		add: function (target, room, user) {
			if (!this.can('ban')) return false;
			if (!target) return this.parse('/help serverannouncements');
			target = target.split('|');
			for (let u in target) target[u] = target[u].trim();
			if (!target[1]) return this.errorReply("Usage: /news add [title]| [desc]");
			if (!Rooms('lobby').news) Rooms('lobby').news = {};
			let news = Rooms('lobby').news;

			news[target[0]] = {
				desc: target[1],
				posted: Date.now(),
				by: user.name,
			};
			Rooms('lobby').news = news;
			Rooms('lobby').chatRoomData.news = Rooms('lobby').news;
			Rooms.global.writeChatRoomData();
			this.privateModCommand(`(${user.name} added server announcement: ${target[1]})`);

		},

	},
};
