'use strict';
//We eventually should move all evo globals here.
const Autolinker = require('autolinker');

Evo.nameColor = function (name, bold, userGroup) {
	let userGroupSymbol = Users.usergroups[name] ? '<b><font color=#948A88>' + Users.usergroups[name].substr(0, 1) + '</font></b>' : "";
	return (userGroup ? userGroupSymbol : "") + (bold ? "<b>" : "") + "<font color=" + Evo.hashColor(name) + ">" + (Users(name) && Users(name).connected && Users.getExact(name) ? Chat.escapeHTML(Users.getExact(name).name) : Chat.escapeHTML(name)) + "</font>" + (bold ? "</b>" : "");
};
// usage: Evo.nameColor(user.name, true) for bold OR Evo.nameColor(user.name, false) for non-bolded.

Evo.parseMessage = function (message) {
	if (message.substr(0, 5) === "/html") {
		message = message.substr(5);
		message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
		message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>'); // bold
		message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
		message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
		message = Autolinker.link(message.replace(/&#x2f;/g, '/'), {stripPrefix: false, phone: false, twitter: false});
		return message;
	}
	message = Chat.escapeHTML(message).replace(/&#x2f;/g, '/');
	message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
	message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>'); // bold
	message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
	message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
	message = Autolinker.link(message, {stripPrefix: false, phone: false, twitter: false});
	return message;
};


let MD5 = require('md5');
let colorCache = {};

// hashColor function
Evo.hashColor = function (name) {
	name = toId(name);
	if (colorCache[name]) return colorCache[name];
	let hash = MD5(name);
	let H = parseInt(hash.substr(4, 4), 16) % 360; // 0 to 360
	let S = parseInt(hash.substr(0, 4), 16) % 50 + 40; // 40 to 89
	let L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30); // 30 to 49
	let C = (100 - Math.abs(2 * L - 100)) * S / 100 / 100;
	let X = C * (1 - Math.abs((H / 60) % 2 - 1));
	let m = L / 100 - C / 2;

	let R1, G1, B1;
	switch (Math.floor(H / 60)) {
	case 1:
		R1 = X;
		G1 = C;
		B1 = 0;
		break;
	case 2:
		R1 = 0;
		G1 = C;
		B1 = X;
		break;
	case 3:
		R1 = 0;
		G1 = X;
		B1 = C;
		break;
	case 4:
		R1 = X;
		G1 = 0;
		B1 = C;
		break;
	case 5:
		R1 = C;
		G1 = 0;
		B1 = X;
		break;
	case 0:
	default:
		R1 = C;
		G1 = X;
		B1 = 0;
		break;
	}
	let lum = (R1 + m) * 0.2126 + (G1 + m) * 0.7152 + (B1 + m) * 0.0722; // 0.05 (dark blue) to 0.93 (yellow)
	let HLmod = (lum - 0.5) * -100; // -43 (yellow) to 45 (dark blue)
	if (HLmod > 12) {
		HLmod -= 12;
	} else if (HLmod < -10) {
		HLmod = (HLmod + 10) * 2 / 3;
	} else {
		HLmod = 0;
	}

	L += HLmod;
	let Smod = 10 - Math.abs(50 - L);
	if (HLmod > 15) Smod += (HLmod - 15) / 2;
	S -= Smod;

	let rgb = hslToRgb(H, S, L);
	colorCache[name] = "#" + rgbToHex(rgb.r, rgb.g, rgb.b);
	return colorCache[name];
};

function hslToRgb(h, s, l) {
	let r, g, b, m, c, x;
	if (!isFinite(h)) h = 0;
	if (!isFinite(s)) s = 0;
	if (!isFinite(l)) l = 0;
	h /= 60;
	if (h < 0) h = 6 - (-h % 6);
	h %= 6;
	s = Math.max(0, Math.min(1, s / 100));
	l = Math.max(0, Math.min(1, l / 100));
	c = (1 - Math.abs((2 * l) - 1)) * s;
	x = c * (1 - Math.abs((h % 2) - 1));
	if (h < 1) {
		r = c;
		g = x;
		b = 0;
	} else if (h < 2) {
		r = x;
		g = c;
		b = 0;
	} else if (h < 3) {
		r = 0;
		g = c;
		b = x;
	} else if (h < 4) {
		r = 0;
		g = x;
		b = c;
	} else if (h < 5) {
		r = x;
		g = 0;
		b = c;
	} else {
		r = c;
		g = 0;
		b = x;
	}
	m = l - c / 2;
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);
	return {
		r: r,
		g: g,
		b: b,
	};
}

function rgbToHex(R, G, B) {
	return toHex(R) + toHex(G) + toHex(B);
}

function toHex(N) {
	if (N === null || N === undefined) return "00";
	N = parseInt(N);
	if (N === 0 || isNaN(N)) return "00";
	N = Math.max(0, N);
	N = Math.min(N, 255);
	N = Math.round(N);
	return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
}
