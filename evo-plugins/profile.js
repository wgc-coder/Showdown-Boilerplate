'use strict';
/*eslint no-restricted-modules: [0]*/

let color = require('../config/color');
let moment = require('moment');

let BR = '<br>';
let SPACE = '&nbsp;';
let profileColor = '#24678d';
let trainersprites = [1, 2, 101, 102, 169, 170, 265, 266, 168];

/**
 * Profile constructor.
 *
 * @param {Boolean} isOnline
 * @param {Object|String} user - if isOnline then Object else String
 * @param {String} image
 */
function Profile(isOnline, user, image) {
	this.isOnline = isOnline || false;
	this.user = user || null;
	this.image = image;

	this.username = Chat.escapeHTML(this.isOnline ? this.user.name : this.user);
	this.url = Config.avatarurl || '';
}

/**
 * Create an bold html tag element.
 *
 * Example:
 * createFont('Hello World!');
 * => '<b>Hello World!</b>'
 *
 * @param {String} color
 * @param {String} text
 * @return {String}
 */
function bold(text) {
	return '<b>' + text + '</b>';
}

/**
 * Create an font html tag element.
 *
 * Example:
 * createFont('Hello World!', 'blue');
 * => '<font color="blue">Hello World!</font>'
 *
 * @param {String} color
 * @param {String} text
 * @return {String}
 */
function font(color, text) {
	return '<font color="' + color + '">' + text + '</font>';
}

/**
 * Create an img tag element.
 *
 * Example:
 * createImg('phil.png');
 * => '<img src="phil.png" height="80" width="80" align="left">'
 *
 * @param {String} link
 * @return {String}
 */
function img(link) {
	return '<img src="' + link + '" height="80" width="80">';
}

/**
 * Create a font html element wrap around by a bold html element.
 * Uses to `profileColor` as a color.
 * Adds a colon at the end of the text and a SPACE at the end of the element.
 *
 * Example:
 * label('Name');
 * => '<b><font color="#24678d">Name:</font></b> '
 *
 * @param {String} text
 * @return {String}
 */
function label(text) {
	return bold(font(profileColor, text + ':')) + SPACE;
}

function currencyName(amount) {
	let name = " buck";
	return amount === 1 ? name : name + "s";
}

Profile.prototype.avatar = function () {
	if (this.isOnline) {
		if (typeof this.image === 'string') return img(this.url + ':' + Config.port + '/avatars/' + this.image);
		return img('http://play.pokemonshowdown.com/sprites/trainers/' + this.image + '.png');
	}
	for (let name in Config.customAvatars) {
		if (this.username === name) {
			return img('http://' + this.url + ':' + Config.port + '/avatars/' + Config.customavatars[name]);
		}
	}
	let selectedSprite = trainersprites[Math.floor(Math.random() * trainersprites.length)];
	return img('http://play.pokemonshowdown.com/sprites/trainers/' + selectedSprite + '.png');
};

Profile.prototype.buttonAvatar = function () {
	let css = 'border:none;background:none;padding:0;float:left;';
	return '<button style="' + css + '" name="parseCommand" value="/user ' + this.username + '">' + this.avatar() + "</button>";
};

Profile.prototype.group = function () {
	if (this.isOnline && this.user.group === ' ') return label('Group') + 'Regular User';
	if (this.isOnline) return label('Group') + Config.groups[this.user.group].name;
	for (let name in Users.usergroups) {
		if (toId(this.username) === name) {
			return label('Group') + Config.groups[Users.usergroups[name].charAt(0)].name;
		}
	}
	return label('Group') + 'Regular User';
};

Profile.prototype.money = function (amount) {
	return label('Money') + amount + currencyName(amount);
};

Profile.prototype.name = function () {
	return label('Name') + bold(font(color(toId(this.username)), this.username));
};

Profile.prototype.seen = function (timeAgo) {
	if (this.isOnline) return label('Last Seen') + font('#2ECC40', 'Currently Online');
	if (!timeAgo) return label('Last Seen') + 'Never';
	return label('Last Seen') + moment(timeAgo).fromNow();
};

Profile.prototype.dev = function () {
	if (typeof this.user === 'string' && devs.indexOf(toId(this.user)) > -1) return ' (<font color=#13B4C4><b>Evo Dev</b></font>)';
	if (this.user && devs.indexOf(this.user.userid) > -1) return  ' (<font color=#13B4C4><b>Evo Dev</b></font>)';
	return '';
};


Profile.prototype.title = function () {
	let title = Db('TitleDB').get(toId(toId(this.user)));
	if (typeof title !== 'undefined' && title !== null)  return ' (<font color=#' + title[0] + '><b>' + Chat.escapeHTML(title[1]) + '</b></font>)';
	return '';
};

Profile.prototype.background = function (user) {
	let bg = Db('backgrounds').get(user);
	if(!Db('backgrounds').has(user)) return '<div>';
	return '<div style="background:url(' + bg + ') ; background-size: 100%; background-position: center; background-repeat: no-repeat;">';
};

Profile.prototype.song = function (user) {
	let song = Db('music').get(user);
	if(!Db('music').has(user)) return '';
	return '<audio src="' + song + '" controls="" style="width:100%;"></audio></acronym>';
};


Profile.prototype.league = function () {
	let league = Evo.getLeague(this.username);
	let leagueRank = Evo.getLeagueRank(this.username);
	if (league) return label('League') + league + SPACE + "(" + leagueRank + ")" + BR;
	return '';
};


Profile.prototype.show = function (callback) {
	let userid = toId(this.username);

	return this.background(userid) + "<div style='opacity: 0.7; background-color: white;'>" + this.buttonAvatar() +
		SPACE + this.name() + this.title() + BR +
		SPACE + this.group() + this.dev() + BR +
		SPACE + this.money(Db("money").get(userid, 0)) + BR +
		SPACE + this.seen(Db("seen").get(userid)) + BR +
		SPACE + this.league() + BR +
		this.song(userid) +
		'<br clear="all"></div>';
};

exports.commands = {
	profile: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (target.length >= 19) return this.sendReply("Usernames are required to be less than 19 characters long.");
		let targetUser = this.targetUserOrSelf(target);
		let profile;
		if (!targetUser) {
			profile = new Profile(false, target);
		} else {
			profile = new Profile(true, targetUser, targetUser.avatar);
		}
		this.sendReplyBox(profile.show());
	},
	customtitle: function (target, room, user) {
		let parts = target.split(',');
		let cmd = parts[0].trim().toLowerCase();
		let userid, targetUser;
		let title = [];
		switch (cmd) {
		case 'set':
			if (!this.can('lock')) return false;
			let reg = /^\w+$/;
			userid = toId(parts[1]);
			targetUser = Users.getExact(userid);
			if (!userid) return this.sendReply("You didn't specify a user.");
			if (!Users.get(targetUser)) return this.errorReply('The target user is not online.');
			if (targetUser.length >= 19) return this.sendReply("Usernames are required to be less than 19 characters long.");
			if (!reg.test(parts[2].trim())) return this.sendReply("Enter only alphanumeric characters for the eg. ff80b3");
			if (parts.length < 4) return this.sendReply("Invalid command. Valid commands are `/customtitle set, user, color, title`.");
			title[0] = parts[2].trim();
			title[1] = Chat.escapeHTML(parts.slice(3).join(",").trim());
			if (title[1].length > 30) return this.errorReply("Custom titles cannot be longer than 30 characters.");
			Db('TitleDB').set(toId(userid), title);
			Users.get(userid).popup('|modal||html|<font color="red"><strong>ATTENTION!</strong></font><br /> You have received a custom title from <b><font color="' + color(user.userid) + '">' + Chat.escapeHTML(user.name) + '</font></b>: ' + '<font color=' + title[0] + '> <b>' + Chat.escapeHTML(title[1]) + '</b></font>');
			this.sendReply("Usertitle set.");
		break;
		case 'delete':
			if (!this.can('lock')) return false;
			userid = toId(parts[1]);
			targetUser = Users.get(userid);
			if (!targetUser) return this.errorReply("Target user not found!");
			if (targetUser.length >= 19) return this.errorReply("Useranmes are required to be less than 19 characters long.");
			if (!Db('TitleDB').has(toId(userid))) return this.errorReply("That use does not have a title!");
			Db('TitleDB').delete(toId(userid));
			Users(userid).popup("|modal|Your custom title has been removed by a staff member!");
			this.sendReply("Title Removed!");
		break;
		default:
			return this.sendReply("Invalid command. Valid commands are `/customtitle set, user, color, title` `/customtitle delete, user.");
		}
	},
	profilehelp: ["/profile -	Shows information regarding user's name, group, money, and when they were last seen."],
	bg: 'setbackground',
	setbg:'setbackground',
	setbackground: function (target, room, user) {
		if(!this.can('lock')) return false;
		let parts = target.split(',');
		if(!parts[1]) return this.errorReply('USAGE: /setbackground (user), (link)');
		let targeted = parts[0].toLowerCase().trim();
		let link = parts[1].trim();
		if (!Users.get(targeted)) return this.errorReply("The target user is not online.");
		Db('backgrounds').set(targeted, link);
		this.sendReply('This users background has been set to : ');
		Monitor.log("[BG MONITOR] " + user + " has given " + Users.get(targeted) + " a Profile Background");
		this.parse('/profile ' + targeted);
	},
	deletebackground: 'deletebg',
	deletebg: function (target, room, user){
		if(!this.can('lock')) return false;
		let targeted = target.toLowerCase();
		if(!target) return this.errorReply('USAGE: /deletebackground (user)');
		if(!Db('backgrounds').has(targeted)) return this.errorReply('This user does not have a custom background.');
		Db('backgrounds').delete(targeted);
		this.sendReply('This users background has deleted.');
	},
	profilemusic: 'setmusic',
	music: 'setmusic',
	setmusic: function (target, room, user){
		if(!this.can('lock')) return false;
		let parts = target.split(',');
		let targeted = parts[0].toLowerCase().trim();
		if(!parts[1]) return this.errorReply('USAGE: /setmusic (user), (link)');
		let link = parts[1].trim();
		if (!Users.get(targeted)) return this.errorReply("The target user is not online.");
		Db('music').set(targeted, link);
		Monitor.log("[Music MONITOR] " + user + " has given " + Users.get(targeted) + " Profile Music");
		this.sendReply(targeted + '\'s song has been set to: ');
		this.parse('/profile ' + targeted);
	},
};
