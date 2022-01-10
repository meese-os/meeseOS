import { getId } from "./HelperFunctions.js";
import { AudioVisualizer } from "./AudioVisualizer.js";
const vis = AudioVisualizer;
const currVis = "waveform";

var devToolsConnected = 0;
var newScriptTag = document.createElement("script");
newScriptTag.setAttribute("data-light", "true");
newScriptTag.src = "../devTools.js";
document.head.appendChild(newScriptTag);

window.devTools_connectListener = function () {
	devTools.openWindow();
	devToolsConnected = 1;
}

var audio = new Audio();
window.audio = audio;

var audioContext;
var mediaSource;
var delayNode;

const setVolume = (newVolume) => audio.volume = newVolume;
window.setVolume = setVolume;

var fileNames = [];
window.fileNames = fileNames;
var currentSong = -1;
window.currentSong = currentSong;
var winsize = [window.innerWidth, window.innerHeight];
window.size = [window.innerWidth - 8, window.innerHeight - 81];
var supportedFormats = ['aac', 'aiff', 'wav', 'm4a', 'mp3', 'amr', 'au', 'weba', 'oga', 'wma', 'flac', 'ogg', 'opus', 'webm'];

var currentSong = -1;
function selectSong(id) {
	currentSong = id;
	audio.pause();
	audio.currentTime = 0;
	audio.src = fileNames[id][2];
	getId("currentlyPlaying").innerHTML = `
		<p class="marqueetext1">${fileNames[id][0]}</p>
	`;
	if (devToolsConnected) {
		devTools.sendRequest({
			action: "appwindow:set_caption",
			content: "Music Player",
			conversation: "set_caption"
		});
	}
}
window.selectSong = selectSong;

/** Play or pause audio, depending on which state was previously in play. */
window.toggleAudioState = () => audio.paused ? play() : pause();
function play() {
	if (currentSong === -1) {
		shuffle();
	} else {
		audio.play();
	}

	getId("playpauseicon").src = "pause.svg";
}
function pause() {
	audio.pause();
	getId("playpauseicon").src = "play.svg";
}

audio.addEventListener("canplaythrough", play);
window.addEventListener('load', function() {
	console.log('All audio assets are loaded...')
	play();
});

function back() {
	if (audio.currentTime >= 3) return audio.currentTime = 0;
	currentSong--;
	if (currentSong < 0) currentSong = fileNames.length - 1;
	selectSong(currentSong);
}
window.back = back;

function next() {
	currentSong++;
	if (currentSong > fileNames.length - 1) currentSong = 0;
	selectSong(currentSong);
}
window.next = next;

function songEnd() {
	next();
}

audio.addEventListener("ended", songEnd);
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		let temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

function shuffle() {
	audio.pause();
	audio.currentTime = 0;
	currentSong = 0;
	shuffleArray(fileNames);
	selectSong(0);
}

var perfLast = performance.now();
var perfCurrent = perfLast;

function globalFrame() {
	requestAnimationFrame(globalFrame);
	perfLast = perfCurrent;
	perfCurrent = performance.now();

	if (winsize[0] !== window.innerWidth || winsize[1] !== window.innerHeight) {
		winsize = [window.innerWidth, window.innerHeight];
		window.size = [window.innerWidth, window.innerHeight];
		getId("visCanvas").width = window.size[0];
		getId("visCanvas").height = window.size[1];
	}

	window.analyser.getByteFrequencyData(window.visData);

	// If the audio's volume is lowered, the visualizer can't hear it, so
	// this attempts to artificially bring the volume back up to full
	if (audio.volume < 0.9) {
		let gainFactor = 0.9 - audio.volume + 1;
		for (let i = 0; i < window.visData.length; i++) {
			window.visData[i] = Math.floor(window.visData[i] * gainFactor);
		}
	}

	// Modify the data values with Power
	for (let i = 0; i < 128; i++) {
		window.visData[i] = Math.pow(window.visData[i], 2) / 255;
	}

	// Do the visualizer
	vis[currVis].frame();
}

function loadAudio() {
	// https://stackoverflow.com/a/55270278/6456163
	let files = [];
	let xhr = new XMLHttpRequest();
	xhr.open("GET", "./audio", false);
	xhr.onload = () => {
		if (xhr.status !== 200) return alert('Request failed. Returned status of ' + xhr.status);
		let parser = new DOMParser();
		let HTML = parser.parseFromString(xhr.response, 'text/html');
		let elements = HTML.getElementsByTagName("a");
		for (let x of elements) {
			let filePath = x.href;
			let filePathParts = filePath.split("Music");
			if (supportedFormats.includes(filePath.split(".")[2])) {
				// Push the correct file path to the files array
				files.push(filePathParts[0] + "Music/audio" + filePathParts[1]);
			}
		};
	}

	xhr.send();
	return files;
}

function loadAudioFiles() {
	audio.pause();
	currentSong = -1;
	const filePaths = loadAudio();

	for (let i = 0; i < filePaths.length; i++) {
		let fileName = filePaths[i].split('audio/')[1].split(".")[0];
		fileNames.push([decodeURI(fileName), i, filePaths[i]]);
	}

	audioContext = new AudioContext({
		latencyHint: 'playback',
		//sampleRate: 8000,
	});
	
	mediaSource = audioContext.createMediaElementSource(audio);
	delayNode = audioContext.createDelay();
	delayNode.delayTime.value = 0.07;
	delayNode.connect(audioContext.destination);

	window.analyser = audioContext.createAnalyser();
	window.analyser.fftSize = 2048;
	window.analyser.maxDecibels = -20;
	window.analyser.minDecibels = -60;
	window.analyser.smoothingTimeConstant = 0.8;

	mediaSource.connect(window.analyser);
	window.analyser.connect(delayNode);
	window.visData = new Uint8Array(window.analyser.frequencyBinCount);

	winsize = [window.innerWidth, window.innerHeight];
	window.size = [window.innerWidth - 8, window.innerHeight - 81];

	vis[currVis].start();
	requestAnimationFrame(globalFrame);
}
loadAudioFiles();