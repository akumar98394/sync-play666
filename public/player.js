let temp_arr = window.location.pathname.split("/");
let roomno = temp_arr[temp_arr.length - 1];
let arr = [];
let current_username = new URLSearchParams(window.location.search).get(
	"username"
);
let room_URL = `https://sync-player666.herokuapp.com/room/${roomno}`;

let spanEle = document.getElementById("roomNo");
spanEle.innerText += roomno;

const socket = io();
socket.emit("joinroom", roomno, current_username);

const video = document.getElementById("video");
const slider = document.getElementById("custom-seekbar");

function copyLink() {
	console.log(room_URL);
	let para = document.createElement("textarea");
	para.id = "copiedLink";
	para.value = room_URL;
	document.body.appendChild(para);
	let ele = document.getElementById("copiedLink");
	ele.select();
	document.execCommand("copy");
	document.body.removeChild(para);
}

let URL = window.URL || window.webkitURL;
const displayMessage = function (message, isError) {
	let element = document.getElementById("message");
	element.innerHTML = message;
	element.className = isError ? "error" : "info";
};

const playSelectedFile = function (event) {
	let file = this.files[0];
	let type = file.type;
	let videoNode = document.querySelector("video");
	let canPlay = videoNode.canPlayType(type);
	if (canPlay === "") canPlay = "no";
	let message = 'Can play type "' + type + '": ' + canPlay;
	let isError = canPlay === "no";
	displayMessage(message, isError);

	if (isError) {
		return;
	}

	let fileURL = URL.createObjectURL(file);
	videoNode.src = fileURL;
};

let inputNode = document.getElementById("input");
inputNode.addEventListener("change", playSelectedFile, false);

video.ontimeupdate = function () {
	var percentage = (video.currentTime / video.duration) * 100;
	$("#custom-seekbar span").css("width", percentage + "%");
	socket.emit("update", percentage, roomno);
};

$("#custom-seekbar").on("click", function (e) {
	var offset = $(this).offset();
	var left = e.pageX - offset.left;
	var totalWidth = $("#custom-seekbar").width();
	var percentage = left / totalWidth;
	var vidTime = video.duration * percentage;
	video.currentTime = vidTime;
	playVideo();
});

// play event added
function playVideo() {
	socket.emit("play", roomno);
	video.play();
	let fraction = video.currentTime / video.duration;
	video.currentTime = video.duration * fraction;
	socket.emit("slider", video.currentTime, roomno);
}

// pause event handled
function pauseVideo() {
	socket.emit("pause", roomno);
	video.pause();
}

//play event handled
video.onplaying = () => {
	socket.emit("play", roomno);
	socket.emit("seeked", video.currentTime, roomno);
};

// pause event handled
video.onpause = () => {
	socket.emit("pause", roomno);
};

// seeking event handled
video.onseeked = () => {
	socket.emit("seeked", video.currentTime, roomno);
};
// socket events handled
socket.on("update", (data) => {
	console.log("Recieved data", data);
	$("#custom-seekbar span").css("width", data + "%");
});

socket.on("play", () => {
	video.play();
});

socket.on("pause", () => {
	video.pause();
});

socket.on("seeked", (data) => {
	if (Math.abs(video.currentTime - data) > 1) {
		video.currentTime = data;
	}
});

socket.on("slider", (data) => {
	video.currentTime = data;
});

socket.on("new user", (username) => {
	Notification.requestPermission().then(function () {
		new Notification(`${username} joined the room`);
	});
});

socket.on("left room", (username) => {
	Notification.requestPermission().then(function () {
		new Notification(`${username} left the room`);
	});
});

socket.on("user_array", (user_array) => {
	// Getting the array of users in room
	document.getElementById("no_of_members").innerText = user_array.length;
	let z = document.getElementById("sidePanel");
	z.innerHTML = "";
	let h = document.createElement("h3");
	let txt = document.createTextNode("Connected Users:");
	h.appendChild(txt);
	z.appendChild(h);
	for (var i = 0; i < user_array.length; i++) {
		let para = document.createElement("p");
		let node = document.createTextNode(user_array[i]);
		para.appendChild(node);
		z.appendChild(para);
	}
	console.log(user_array);
});
