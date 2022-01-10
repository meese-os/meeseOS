const NORA = () => {

var currNoraPhrase = "listen computer";

apps.nora = new Application({
	title: "NORAA",
	abbreviation: "NRA",
	codeName: "nora",
	image: "smarticons/noraa/fg.png",
	hideApp: 1,
	launchTypes: 1,
	main: function (launchtype) {
		if (!this.appWindow.appIcon) {
			this.appWindow.paddingMode(0);
			this.appWindow.setCaption('NORAA');
			this.appWindow.setDims("auto", "auto", 600, 500);
			this.appWindow.setContent(`<div id="NORAout" class="darkResponsive">-- ${websiteTitle} Assistant Ready --</div><button id="NORAspeech" onclick="apps.nora.vars.speakIn()">Speak</button><input id="NORAin" onKeydown="if(event.keyCode === 13){apps.nora.vars.input()}"><button id="NORAbtn" onClick="apps.nora.vars.input()">Say</button>`);
			this.vars.say("Type \"help\" to see what I can do!");
		}
			
		if (launchtype === 'srtup') {
			if (window.webkitSpeechRecognition) {
				this.vars.recognition = new window.webkitSpeechRecognition();
				this.vars.recognition.interimResults = true;
				this.vars.recognition.onresult = function (event) {
					getId('NORAin').value = event.results[0][0].transcript;
					if (event.results[0].isFinal) {
						if (apps.nora.vars.currentlySpeaking) {
							getId('NORAspeech').style.backgroundColor = '#0F0';
							getId('NORAin').style.borderColor = 'rgb(' + Math.round(255 - event.results[0][0].confidence * 255) + ',' + Math.round(event.results[0][0].confidence * 255) + ',0)';
						} else {
							getId('NORAspeech').style.backgroundColor = '#F80';
						}
						window.setTimeout(function() {
							getId('NORAspeech').style.backgroundColor = '#AAC';
							getId('NORAin').style.borderColor = '#557';
							if (apps.nora.vars.currentlySpeaking) {
								apps.nora.vars.input(1);
								apps.nora.vars.currentlySpeaking = 0;
							}
						}, apps.nora.vars.inputDelay);
					}
				};

				// Continuous speech recognition
				this.vars.contRecog = new window.webkitSpeechRecognition();
				this.vars.contRecog.interimResults = true;
				this.vars.contRecog.continuous = true;
				this.vars.currContTrans = [];
				this.vars.contRecog.onresult = function (event) {
					apps.nora.vars.currContTrans = event.results[0][0].transcript;
					if (!apps.nora.vars.currentlySpeaking && getId('NORAin').value === "" && apps.nora.vars.currContTrans.indexOf(currNoraPhrase) > -1) {
						openapp(apps.nora, 'tskbr');
						apps.nora.vars.speakIn();
					}
				};
				this.vars.contRecog.onstart = function() {
					apps.nora.vars.contRecogRunning = 1;
				};
				this.vars.contRecog.onend = function() {
					apps.nora.vars.contRecogRunning = 0;
					// TODO: Something is suppposed to go here but can't remember
					if (!apps.nora.vars.intendedToStopRecog) {
						apps.nora.vars.startContRecog();
					}
				};

			} else {
				getId('NORAspeech').style.display = 'none';
				getId('NORAin').style.left = '0';
				getId('NORAin').style.width = '90%';
			}
			try {
				apps.nora.vars.speakWordsMsg = new window.SpeechSynthesisUtterance('test');
				this.vars.speakWordsMsg.onend = function() {
					apps.nora.vars.currentlySpeakingWords = 0;
					apps.nora.vars.speakWords();
				};

				this.vars.voices = window.speechSynthesis.getVoices();
				this.vars.initing = 1;
				window.speechSynthesis.onvoiceschanged = function() {
					apps.nora.vars.voices = window.speechSynthesis.getVoices();
					if (!apps.nora.vars.initing) {
						apps.nora.vars.speakWordsMsg.voice = apps.nora.vars.voices.filter(function (voice) {
							return voice.name === apps.nora.vars.lang;
						})[0];
					}
					apps.nora.vars.initing = 0;
				};
			} catch (err) {
				c(function() {
					doLog('Text-To-Speech is not supported in your browser.', '#F00');
				});
				apps.nora.vars.speakWords = function() {
					return false;
				};
			}
		} else {
			this.appWindow.openWindow();
		}
	},
	vars: {
		appInfo: '',
		captionCtx: [
			[' Hide', function() {
				apps.nora.signalHandler('shrink');
			}, 'ctxMenu/minimize.png']
		],
		initing: 1,
		voices: [],
		lang: 'Chrome OS US English',
		contRecog: {},
		currContTrans: [],
		notes: [],
		sayings: {
			hello: [
				function() {
					return 'What\'s up?';
				},
			],
			what: [
				function() {
					return 'Oops! I don\'t know how to do that!';
				},
			],
			okay: [
				function() {
					return 'I shall do your bidding.';
				},
			],
			user_mean: [
				function() {
					return 'You\'re going to make me cry with that!';
				},
			],
			user_nice: [
				function() {
					return 'Thank you!';
				},
			]
		},
		commands: [
			// https://techranker.net/cortana-commands-list-microsoft-voice-commands-video/
			[
				'define',
				'define [word]',
				'Have me define a word for you by asking DuckDuckGo.',
				function (text) {
					if (text.length > 0) {
						apps.nora.vars.prepareDDG(text);
						apps.nora.vars.askDDG('define');
					} else {
						apps.nora.vars.say('I cannot define nothing. Sorry.');
					}
				}
			],
			[
				'delete note',
				'delete note {"number"} [note to be deleted]',
				'Have me delete a note that you gave me.',
				function (text) {
					if (text) {
						if (!isNaN(parseInt(text.split(' ')[text.split(' ').length - 1], 10))) {
							if (parseInt(text.split(' ')[text.split(' ').length - 1], 10) > 0 && parseInt(text.split(' ')[text.split(' ').length - 1], 10) - 1 < apps.nora.vars.notes.length) {
								apps.nora.vars.sayDynamic('okay');
								this[4].lastDelete = parseInt(text.split(' ')[text.split(' ').length - 1], 10) - 1;
								this[4].lastDeleted = apps.nora.vars.notes[this[4].lastDelete];
								for (var i = this[4].lastDelete; i < apps.nora.vars.notes.length - 1; i++) {
									apps.nora.vars.notes[i] = apps.nora.vars.notes[i + 1];
								}
								apps.nora.vars.notes.pop();
								ufsave('system/noraa/notes', String(apps.nora.vars.notes));
								apps.nora.vars.say('Deleted the note ' + this[4].lastDeleted);
							} else {
								apps.nora.vars.say('I can\'t delete something that\'s not there. You only have ' + apps.nora.vars.notes.length + ' notes.');
							}
						} else {
							apps.nora.vars.say('I do not see a number there.');
						}
					} else {
						apps.nora.vars.say('<i>NORAA does just that - deletes nothing.</i>');
					}
				},
				{
					lastDelete: -1,
					lastDeleted: ''
				}
			],
			[
				'flip a coin',
				'flip a coin {"and predict"}',
				'Have me flip a virtual coin for you.',
				function (text) {
					if (text.toLowerCase().indexOf('and predict') === 0) {
						this[4].guess = Math.round(Math.random());
						apps.nora.vars.say('I call ' + this[4].coins[this[4].guess] + '!');
					}
					this[4].result = Math.round(Math.random());
					apps.nora.vars.say('I flipped ' + this[4].coins[this[4].result] + '!');
					if (text.toLowerCase().indexOf('and predict') === 0) {
						if (this[4].guess === this[4].result) {
							apps.nora.vars.say('Yay!');
						} else {
							apps.nora.vars.say('Darn!');
						}
					}
				},
				{
					guess: 0,
					result: 0,
					coins: ['tails', 'heads']
				}
			],
			[
				'hello',
				null,
				'Tell NORAA hello, and get Hello back.',
				function (text) {
					apps.nora.vars.sayDynamic('hello');
				}
			],
			[
				'help',
				'help {command}',
				'Have me tell you about all commands or a specific command. Keep in mind that all commands must be said exactly (except for case) as shown here and as the first thing in your statement.',
				function (text) {
					if (text) {
						this[4].cmdFound = -1;
						for (var cmd in apps.nora.vars.commands) {
							if (apps.nora.vars.commands[cmd][0] === text && apps.nora.vars.commands[cmd][1] !== null) {
								this[4].cmdFound = cmd;
								break;
							}
						}
						if (this[4].cmdFound !== -1) {
							apps.nora.vars.say('<span style="color:#F80">' + apps.nora.vars.commands[this[4].cmdFound][0] + '</span>');
							apps.nora.vars.say('<span style="color:#ACE">Usage: ' + apps.nora.vars.commands[this[4].cmdFound][1] + '</span>');
							apps.nora.vars.say(apps.nora.vars.commands[this[4].cmdFound][2]);
						} else {
							apps.nora.vars.say('<i>NORAA does not know that command.</i>');
						}
					} else {
						apps.nora.vars.say('When speaking to me, the color of the button and the input field\'s border will give these indicators...');
						apps.nora.vars.say('<span style="color:#F00">Red Button</span> means that I am listening to you. If you messed up, you can click the button again to cancel.');
						apps.nora.vars.say('<span style="color:#0F0">Green Button</span> means that I am done listening and am giving you some time to cancel the spoken input, if needed, before accepting it.');
						apps.nora.vars.say('<span style="color:#F80">Orange Button</span> means that you have cancelled speech recognition. If I still seem to be listening, it\'s okay. I will not accept the input generated.');
						apps.nora.vars.say('The <span style="color:#0F0">greener</span> the border of the input is, the more confident I am that I heard you right. The <span style="color:#F00">redder</span> it is, the less confident.');
						apps.nora.vars.say('List of all NORAA commands... Args key: [required arg] {optional arg}');
						for (var command in apps.nora.vars.commands) {
							if (apps.nora.vars.commands[command][1] !== null) {
								apps.nora.vars.say('<span style="color:#F80">' + apps.nora.vars.commands[command][0] + '</span>');
								apps.nora.vars.say('<span style="color:#ACE">Usage: ' + apps.nora.vars.commands[command][1] + '</span>');
								apps.nora.vars.say(apps.nora.vars.commands[command][2]);
							}
						}
					}
				},
				{
					cmdFound: -1
				}
			],
			[
				'hide',
				'hide {"and stop talking"}',
				'Have me minimize and, optionally, stop talking.',
				function (text) {
					apps.nora.vars.sayDynamic('okay');
					apps.nora.signalHandler('shrink');
					if (text.indexOf('and stop talking') === 0) {
						window.speechSynthesis.cancel();
						apps.nora.vars.waitingToSpeak = [];
					}
				}
			],
			[
				'how do i',
				'how do i [some action on aOS]',
				'Have me tell you how to do something, as long as that action has been documented.',
				function (text) {
					if (this[4].phrases[text.toLowerCase()]) {
						apps.nora.vars.say(this[4].phrases[text.toLowerCase()]);
					} else {
						apps.nora.vars.say('Sorry, I do not know how to ' + text + ' at the moment.');
					}
				},
				{
					links: {
						'move desktop icons': '.desktop',
						'resize windows': '.windows'
					},
					phrases: {
						'open apps': 'To open apps, you can click the app\'s desktop icon, or if the app has been minimised, click its icon on the taskbar. Alternatively, all apps will appear in the applications list in the bottom-left corner of the screen.',
						'talk to you': 'Your computer must support the speech engine. If you cannot see the "speak" button to the left of my input box, that means your computer doesn\'t.',
						'move desktop icons': 'You may right-click the icon, then click "Move Icon", then click some location on the desktop.',
						'move windows': 'You can click on the top title bar of the window, then click somewhere else.',
						'resize windows': 'You can click the bottom half of the border of the window, then click somewhere else.'
					}
				}
			],
			[
				'i hate you',
				null,
				'',
				function (text) {
					apps.nora.vars.sayDynamic('user_mean');
				}
			],
			[
				'i like you',
				null,
				'',
				function (text) {
					apps.nora.vars.sayDynamic('user_nice');
				}
			],
			[
				'launch',
				'launch [app name]',
				'Launch the app with the above name.',
				function (text) {
					apps.nora.vars.sayDynamic('okay');
					this[4].found = 0;
					for (var app in apps) {
						if (apps[app] !== apps.startMenu && apps[app] !== apps.nora && apps[app].appName.toLowerCase() === text.toLowerCase()) {
							this[4].found = 1;
							openapp(apps[app], 'dsktp');
							break;
						}
					}
					if (!this[4].found) {
						apps.nora.vars.say('I can\'t find an app by that name...');
					}
				},
				{
					found: 0
				}
			],
			[
				'my',
				'my [whatever] ["is" [something] | "will be deleted"]',
				'Tell NORAA something about yourself.',
				function (text) {
					if (text.indexOf(' is ') > -1) {
						this[4].inpObj = text.split(' is ');
						this[4].inpPro = this[4].inpObj.shift();
						this[4].inpVal = this[4].inpObj.join(' is ');
						apps.nora.vars.say('Thank you for telling me that your ' + this[4].inpPro + ' is ' + this[4].inpVal);
						apps.nora.vars.updateUserObj(this[4].inpPro, this[4].inpVal);
					} else if (text.indexOf('will be deleted') > -1) {
						delete apps.nora.vars.userObj[text.substring(0, text.indexOf(' will be deleted'))];
						ufsave('system/noraa/user_profile', JSON.stringify(apps.nora.vars.userObj));
						apps.nora.vars.say('I deleted that info about you.');
					} else {
						apps.nora.vars.say('I cannot find any discernable information in there.');
					}
				},
				{
					inpObj: [],
					inpPro: '',
					inpVal: ''
				}
			],
			[
				'open',
				'open [app name]',
				'Open the app with the above name.',
				function (text) {
					apps.nora.vars.sayDynamic('okay');
					this[4].found = 0;
					for (var app in apps) {
						if (apps[app] !== apps.startMenu && apps[app] !== apps.nora && apps[app].appName.toLowerCase() === text.toLowerCase()) {
							this[4].found = 1;
							openapp(apps[app], 'dsktp');
							break;
						}
					}
					if (!this[4].found) {
						apps.nora.vars.say('I can\'t find an app by that name...');
					}
				},
				{
					found: 0
				}
			],
			[
				'random shade of',
				'random shade of [color]',
				'Have NORAA give a random shade of a color for you.',
				function (text) {
					if (this[4].colors.hasOwnProperty(text.toLowerCase())) {
						this[4].colors._COLORS = {
							r: 0,
							g: 0,
							b: 0
						};
						this[4].colors[text.toLowerCase()]();
						for (var i in this[4].colors._COLORS) {
							if (this[4].colors._COLORS[i] < 0) {
								this[4].colors._COLORS[i] = 0;
							}
							if (this[4].colors._COLORS[i] > 255) {
								this[4].colors._COLORS[i] = 255;
							}
						}
						apps.nora.vars.say("<span style='color:rgb(" + this[4].colors._COLORS.r + "," + this[4].colors._COLORS.g + "," + this[4].colors._COLORS.b + ")'>Here's a random shade of " + text.toLowerCase() + "!</span>");
						apps.nora.vars.say("That color is red " + this[4].colors._COLORS.r + ", green " + this[4].colors._COLORS.g + ", blue " + this[4].colors._COLORS.b + ".");
					} else {
						apps.nora.vars.say("I don't know what that color is, sorry! Make sure also that you arent using punctuation!");
					}
				},
				{
					colors: {
						_COLORS: {
							r: 0,
							g: 0,
							b: 0
						},
						red: function() {
							this._COLORS.r = Math.floor(Math.random() * 256);
							this._COLORS.g = Math.floor(Math.random() * (this._COLORS.r / 3));
							this._COLORS.b = Math.floor(Math.random() * (this._COLORS.r / 3));
						},
						green: function() {
							this._COLORS.g = Math.floor(Math.random() * 256);
							this._COLORS.r = Math.floor(Math.random() * (this._COLORS.g / 3));
							this._COLORS.b = Math.floor(Math.random() * (this._COLORS.g / 3));
						},
						blue: function() {
							this._COLORS.b = Math.floor(Math.random() * 256);
							this._COLORS.g = Math.floor(Math.random() * (this._COLORS.b / 3));
							this._COLORS.r = Math.floor(Math.random() * (this._COLORS.b / 3));
						},

						yellow: function() {
							this._COLORS.r = Math.floor(Math.random() * 256);
							this._COLORS.g = this._COLORS.r + (Math.floor(Math.random() * 30) - 15);
							this._COLORS.b = Math.floor(Math.random() * (((this._COLORS.r + this._COLORS.g) / 2) / 3));
						},
						teal: function() {
							this._COLORS.b = Math.floor(Math.random() * 256);
							this._COLORS.g = this._COLORS.b + (Math.floor(Math.random() * 30) - 15);
							this._COLORS.r = Math.floor(Math.random() * (((this._COLORS.b + this._COLORS.g) / 2) / 3));
						},
						violet: function() {
							this._COLORS.r = Math.floor(Math.random() * 256);
							this._COLORS.b = this._COLORS.r + (Math.floor(Math.random() * 30) - 15);
							this._COLORS.g = Math.floor(Math.random() * (((this._COLORS.r + this._COLORS.b) / 2) / 3));
						},

						orange: function() {
							this._COLORS.r = Math.floor(Math.random() * 256);
							this._COLORS.g = Math.floor(Math.random() * (this._COLORS.r * 0.7) + (this._COLORS.r * 0.15));
							this._COLORS.b = Math.floor(Math.random() * (((this._COLORS.r + this._COLORS.g) / 2) / 3));
						},
						turquoise: function() {
							this._COLORS.g = Math.floor(Math.random() * 256);
							this._COLORS.b = Math.floor(Math.random() * (this._COLORS.g * 0.7) + (this._COLORS.g * 0.15));
							this._COLORS.r = Math.floor(Math.random() * (((this._COLORS.g + this._COLORS.b) / 2) / 3));
						},
						cyan: function() {
							this._COLORS.b = Math.floor(Math.random() * 256);
							this._COLORS.g = Math.floor(Math.random() * (this._COLORS.b * 0.7) + (this._COLORS.b * 0.15));
							this._COLORS.r = Math.floor(Math.random() * (((this._COLORS.b + this._COLORS.g) / 2) / 3));
						},
						purple: function() {
							this._COLORS.b = Math.floor(Math.random() * 256);
							this._COLORS.r = Math.floor(Math.random() * (this._COLORS.b * 0.7) + (this._COLORS.b * 0.15));
							this._COLORS.g = Math.floor(Math.random() * (((this._COLORS.b + this._COLORS.r) / 2) / 3));
						}
					}
				}
			],
			[
				'read notes',
				'read notes',
				'Have me read all your notes.',
				function (text) {
					if (apps.nora.vars.notes.length !== 0) {
						apps.nora.vars.sayDynamic('okay');
						apps.nora.vars.say('If you need a note deleted, just ask me to delete that note number.');
						for (var i in apps.nora.vars.notes) {
							apps.nora.vars.say('<span style="color:#F80">' + (parseInt(i, 10) + 1) + ': </span>' + apps.nora.vars.notes[i]);
						}
					} else {
						apps.nora.vars.say('<i>NORAA does as you say - reads all 0 of your notes.</i>');
					}
				}
			],
			[
				'roll some dice',
				'roll some dice {"and predict"}',
				'Have me roll a single 6-sided die and, optionally, predict the outcome.',
				function (text) {
					if (text.toLowerCase().indexOf('and predict') === 0) {
						this[4].guess = Math.floor(Math.random() * 6) + 1;
						apps.nora.vars.say('I call ' + this[4].guess + '!');
					}
					this[4].result = Math.floor(Math.random() * 6) + 1;
					apps.nora.vars.say('I rolled ' + this[4].result + '!');
					if (text.toLowerCase().indexOf('and predict') === 0) {
						if (this[4].guess === this[4].result) {
							apps.nora.vars.say('Yay!');
						} else {
							apps.nora.vars.say('Darn!');
						}
					}
				},
				{
					guess: 0,
					result: 0
				}
			],
			[
				'say',
				'say {"out loud"} [text]',
				'Have me say something.',
				function (text) {
					if (text) {
						if (text.indexOf('out loud') === 0) {
							if (!apps.nora.vars.lastSpoken) {
								apps.nora.vars.waitingToSpeak.push(text.substring(9, text.length));
								apps.nora.vars.speakWords();
							}
							apps.nora.vars.say(text.substring(9, text.length).split('<').join('&lt;').split('>').join('&gt;'));
						} else {
							apps.nora.vars.say(text.split('<').join('&lt;').split('>').join('&gt;'));
						}
					} else {
						apps.nora.vars.say('<i>NORAA remains silent.</i>');
					}
				}
			],
			[
				'start',
				'start [app name]',
				'Start the app with the above name.',
				function (text) {
					apps.nora.vars.sayDynamic('okay');
					this[4].found = 0;
					for (var app in apps) {
						if (apps[app] !== apps.startMenu && apps[app] !== apps.nora && apps[app].appName.toLowerCase() === text.toLowerCase()) {
							this[4].found = 1;
							openapp(apps[app], 'dsktp');
							break;
						}
					}
					if (!this[4].found) {
						apps.nora.vars.say('I can\'t find an app by that name...');
					}
				},
				{
					found: 0
				}
			],
			[
				'stop talking',
				'stop talking',
				'Have me stop talking. Useful for if I\'m trying to speak a huge wall of text out loud and you need me to stop.',
				function() {
					apps.nora.vars.sayDynamic('okay');
					window.speechSynthesis.cancel();
					apps.nora.vars.waitingToSpeak = [];
					apps.nora.vars.currentlySpeakingWords = 0;
				}
			],
			[
				'take note',
				'take note {"of" / "that"} [something to remember]',
				'Have me take down a note for you. I remember it between sessions as well!',
				function (text) {
					if (text) {
						apps.nora.vars.sayDynamic('okay');
						if (text.indexOf('of ') === 0 || text.indexOf('that ') === 0) {
							apps.nora.vars.notes.push(text.substring(text.indexOf(' ') + 1, text.length).replace(',', '&comma;'));
						} else {
							apps.nora.vars.notes.push(text.replace(',', '&comma;'));
						}
						ufsave('system/noraa/notes', String(apps.nora.vars.notes));
						apps.nora.vars.say('I took the note ' + text);
					} else {
						apps.nora.vars.say('<i>NORAA does as you asked - takes note of nothing</i>');
					}
				}
			],
			[
				'watch the time',
				'watch the time',
				'Have me watch the time for you, using an alert window.',
				function (text) {
					apps.nora.vars.sayDynamic('okay');
					apps.prompt.vars.alert('<h1 class="liveElement" data-live-eval="Date()"></h1>', 'Close Time Monitor', function() {}, 'NORAA');
				}
			],
			[
				'what is',
				'what is [{something} or {"the weather in" somewhere}]',
				'Have me give you some info and, if I don\'t know it, give you a DuckDuckGo link for it.',
				function (text) {
					if (text.length > 0) {
						switch (text.toLowerCase()) {
							case 'the date':
								apps.nora.vars.say('The date is ' + formDate('M-/D-/Y') + '.');
								break;
							case 'your name':
								apps.nora.vars.say('My name is NORAA.');
								break;
							case 'your favorite color':
								this[4].lastColor = Math.floor(Math.random() * this[4].colors.length);
								apps.nora.vars.say('<span style="color:' + this[4].colors[this[4].lastColor][1] + ';">Right now, I\'m feeling ' + this[4].colors[this[4].lastColor][0] + '.');
								break;
							default:
								apps.nora.vars.prepareDDG(text);
								apps.nora.vars.askDDG('what');
						}
					} else {
						apps.nora.vars.say('I don\'t know what nothing is, but I won\'t bother searching DuckDuckGo for it. All they would give you is something, which is not what you seem to be looking for.');
					}
				},
				{
					lastSearch: '',
					lastColor: 0,
					colors: [
						['blue', '#00F'],
						['navy blue', '#34C'],
						['red', '#F00'],
						['brick red', '#B22222'],
						['salmon', '#FA8072'],
						['green', '#0F0'],
						['forest green', '#228B22'],
						['gray', '#7F7F7F'],
						['purple', '#A0F'],
						['lavender', '#E6E6FA'],
						['yellow', '#FF0'],
						['orange', '#FF7F00'],
						['white', '#FFF'],
						['black', '#555'],
						['powder blue', '#ABCDEF'],
						['cyan', '#0FF'],
						['blue... </span><span style="color:#44B">n</span><span style="color:#999">o</span><span style="color:#BB4">,</span><span style="color:#FF0"> yel- aaAAAAAAAAHHHHhhhhh..', '#00F'],
					]
				}
			],
			[
				'what do you know about me',
				'what do you know about me',
				'Have me tell you all the information I have associated with you, and ask if you want me to change any.',
				function() {
					apps.nora.vars.say('Here is what I know about you.');
					for (var i in apps.nora.vars.userObj) {
						apps.nora.vars.say('Your ' + i + ' is ' + apps.nora.vars.userObj[i]);
					}
					apps.nora.vars.specialCommand = function (text) {
						if (text.toLowerCase().indexOf('yes') > -1) {
							apps.nora.vars.specialCommand = function (text) {
								if (text.toLowerCase().indexOf('my') === 0) {
									apps.nora.vars.specialCommand = null;
									getId('NORAin').value = text;
									apps.nora.vars.input(apps.nora.vars.lastSpoken, 1);
								} else {
									apps.nora.vars.say('Not really sure what information I can glean from that.');
								}
							};
							apps.nora.vars.say('What would you like to change? (say "my [whatever] is [something]")');
						} else {
							apps.nora.vars.say('Okay.');
						}
					};
					apps.nora.vars.say('Would you like me to change any of these?');
				}
			],
			[
				'who is',
				'who is [someone]',
				'Have me tell you who somebody is and, if I don\'t know, give you a DuckDuckGo link for them.',
				function (text) {
					if (text.length > 0) {
						apps.nora.vars.prepareDDG(text);
						apps.nora.vars.askDDG('who');
					} else {
						apps.nora.vars.say('I don\'t know who nobody is, but I won\'t bother searching DuckDuckGo for them. All they would give you is something, which is not what you seem to be looking for.');
					}
				},
				{
					lastSearch: ''
				}
			]
		],
		userObj: {

		},
		updateUserObj: function (property, value) {
			d(1, 'NORAA knows something about the user.');
			this.userObj[property] = value;
			ufsave('system/noraa/user_profile', JSON.stringify(this.userObj));
		},
		getUserName: function() {
			if (typeof this.userObj.name === 'string') {
				return this.userObj.name;
			} else {
				return 'user';
			}
		},
		sayDynamic: function (saying) {
			getId('NORAout').innerHTML += '<br>&nbsp;' + this.sayings[saying][0]();
			getId("NORAout").scrollTop = getId("NORAout").scrollHeight;
			if (this.lastSpoken) {
				this.waitingToSpeak.push(this.sayings[saying][0]());
				this.speakWords();
			}
		},
		waitingToSpeak: [],
		currentlySpeakingWords: 0,
		speakWordsMsg: {},
		speakWordsStripTags: document.createElement('div'),
		speakWords: function() {
			if (!this.currentlySpeakingWords) {
				if (this.waitingToSpeak.length !== 0) {
					this.speakWordsStripTags.innerHTML = this.waitingToSpeak.shift();
					this.speakWordsMsg.text = this.speakWordsStripTags.innerText;
					window.speechSynthesis.speak(this.speakWordsMsg);
					this.currentlySpeakingWords = 1;
				} else {
					if (this.specialCommand !== null) {
						this.speakIn();
					} else {
						var currNoraListening = "0";
						if (currNoraListening === "1" && !apps.nora.vars.currentlySpeaking) {
							apps.nora.vars.startContRecog();
						}
					}
				}
				return 1;
			}
			return -1;
		},
		say: function (saying) {
			getId('NORAout').innerHTML += '<br>&nbsp;' + saying;
			getId("NORAout").scrollTop = getId("NORAout").scrollHeight;
			if (this.lastSpoken && saying.indexOf('<i>') !== 0) {
				this.waitingToSpeak.push(saying);
				this.speakWords();
			}
		},
		contRecogRunning: 0,
		lastIn: '',
		inSuccess: 0,
		recognition: {},
		specialCommand: null,
		specCommBuff: null,
		inputDelay: 3000,
		ddg: {},
		ddgText: '',
		ddgQuery: '',
		ddgResponse: {},
		ddgFinal: '',
		prepareDDG: function (text) {
			text = text.toLowerCase();
			if (text.indexOf('a ') === 0) {
				text = text.substring(2, text.length);
			} else if (text.indexOf('an ') === 0) {
				text = text.substring(3, text.length);
			}
			text.split('&').join('%26');
			this.ddgText = text;
		},
		askDDG: function (query) {
			// TODO: USE THIS AS AN ACTUAL SEARCH ENGINE FROM THE SERVER SIDE
			apps.nora.vars.say("I'll ask DuckDuckGo for you...");
			this.ddgQuery = query;
			this.ddg.open('GET', 'ddgSearch.php?q=' + this.ddgText);
			this.ddg.send(); // ddg.onreadystatechange refers to finishDDG
		},
		finishDDG: function() {
			if (this.ddg.readyState === 4) {
				if (this.ddg.status === 200) {
					this.ddgResponse = JSON.parse(this.ddg.responseText);
					this.ddgFinal = "";
					switch (this.ddgQuery) { // at the moment all cases are the same, but as more questions are added, different behavior may be needed
						case 'who':
							try {
								this.ddgFinal = this.ddgResponse.AbstractText ||
									this.ddgResponse.Abstract ||
									this.ddgResponse.RelatedTopics[0].Result ||
									this.ddgResponse.RelatedTopics[0].Text;
							} catch (err) {
								doLog('NORAA encountered an error with DuckDuckGo.', '#F00');
							}
							if (this.ddgFinal === "") {
								apps.nora.vars.say("I couldn't find anything. Here is a <a target='_blank' href='https://duckduckgo.com?q=" + this.ddgText + "'>search page</a> from DuckDuckGo.");
							}
							break;
						case 'define':
							try {
								this.ddgFinal = this.ddgResponse.AbstractText ||
									this.ddgResponse.Abstract ||
									this.ddgResponse.RelatedTopics[0].Result ||
									this.ddgResponse.RelatedTopics[0].Text;
							} catch (err) {
								doLog('NORAA encountered an error with DuckDuckGo.', '#F00');
							}
							if (this.ddgFinal === "") {
								apps.nora.vars.say("I couldn't find anything. Here is a <a target='_blank' href='https://duckduckgo.com?q=" + this.ddgText + "'>search page</a> from DuckDuckGo.");
							}
							break;
						default: // "what" or unknown
							try {
								this.ddgFinal = this.ddgResponse.AbstractText ||
									this.ddgResponse.Abstract ||
									this.ddgResponse.RelatedTopics[0].Result ||
									this.ddgResponse.RelatedTopics[0].Text;
							} catch (err) {
								doLog('NORAA encountered an error with DuckDuckGo.', '#F00');
							}
							if (this.ddgFinal === "") {
								apps.nora.vars.say("I couldn't find anything. Here is a <a target='_blank' href='https://duckduckgo.com?q=" + this.ddgText + "'>search page</a> from DuckDuckGo.");
							}
					}
					if (this.ddgFinal !== "") {
						this.say("DuckDuckGo says, " + this.ddgFinal.split('<a href=').join('<a target="_blank" href=').split('</a>').join('</a> is '));
					}
				} else {
					apps.nora.vars.say("DuckDuckGo isn't responding. Here's a <a target='_blank' href='https://duckduckgo.com?q=" + this.ddgText + "'>search page</a> from them.");
				}
			}
		},
		input: function (spoken, silent) {
			d(1, 'NORAA taking input');
			this.inSuccess = 0;
			if (!silent) {
				if (spoken) {
					this.lastSpoken = 0;
					this.say('<span style="color:#0F0"><u>&gt;</u> ' + getId('NORAin').value + '</span>');
					this.lastSpoken = 1;
				} else {
					this.lastSpoken = 0;
					this.say('<span style="color:#0F0">&gt; ' + getId('NORAin').value + '</span>');
				}
			}
			this.lastIn = getId('NORAin').value;
			getId('NORAin').value = '';
			if (this.specialCommand === null) {
				for (var cmd in this.commands) {
					if (this.lastIn.toLowerCase().indexOf(this.commands[cmd][0]) === 0) {
						this.inSuccess = 1;
						this.commands[cmd][3](this.lastIn.substring(this.commands[cmd][0].length + 1, this.lastIn.length));
						break;
					}
				}
			} else {
				this.specCommBuff = this.specialCommand;
				this.specialCommand = null;
				this.specCommBuff(this.lastIn);
				this.inSuccess = 1;
			}
			if (!this.inSuccess) {
				this.sayDynamic('what');
			}
		},
		currentlySpeaking: 0,
		lastSpoken: 0,
		intendedToStopRecog: 1,
		startContRecog: function() {
			this.intendedToStopRecog = 0;
			this.contRecog.start(); // TODO: Checking to see if it is already started
		},
		stopContRecog: function() {
			this.intendedToStopRecog = 1;
			this.contRecog.stop();
		},
		speakIn: function() {
			if (!this.currentlySpeaking) {
				this.currentlySpeaking = 1;
				getId('NORAspeech').style.backgroundColor = '#F00';
				this.stopContRecog();
				try {
					this.recognition.start();
				} catch (err) {
					doLog("NORAA speech recognition:", "#FF0000");
					doLog(err, "#FF0000");
				}
			} else {
				getId('NORAspeech').style.backgroundColor = '#F80';
				this.currentlySpeaking = 0;
			}
		}
	},
	signalHandler: function (signal) {
		switch (signal) {
			case "forceclose":
				this.appWindow.closeWindow();
				this.appWindow.closeIcon();
				break;
			case "close":
				this.appWindow.closeWindow();
				break;
			case "checkrunning":
				if (this.appWindow.appIcon) {
					return 1;
				} else {
					return 0;
				}
				case "shrink":
					this.appWindow.closeKeepTask();
					break;
				case "USERFILES_DONE":
					// Remove taskbar text
					this.vars.ddg = new XMLHttpRequest();
					this.vars.ddg.onreadystatechange = function() {
						apps.nora.vars.finishDDG();
					}
					if (ufload("system/noraa/notes")) {
						this.vars.notes = ufload("system/noraa/notes").split(',');
					}
					if (ufload("system/noraa/user_profile")) {
						this.vars.userObj = JSON.parse(ufload("system/noraa/user_profile"));
					}
					if (ufload("system/noraa/speech_voice")) {
						this.vars.lang = ufload("system/noraa/speech_voice");
						this.vars.initing = 0;
						try {
							window.speechSynthesis.onvoiceschanged();
						} catch (err) {
							doLog('Error - speechSynthesis not supported.', '#F00');
						}
					}
					if (ufload("system/noraa/speech_response_delay")) {
						this.vars.inputDelay = parseInt(ufload("system/noraa/speech_response_delay"), 10);
					}
					this.vars.sayDynamic('hello');
					this.vars.say("[This app in in Beta. It's not complete.]");
					break;
				case 'shutdown':

					break;
				default:
					doLog("No case found for '" + signal + "' signal in app '" + this.dsktpIcon + "'");
		}
	}
});
apps.nora.main('srtup');

function textspeech(message) {
	d(1, 'Doing text-speech: ' + message);
	openapp(apps.nora, 'tskbr');
	apps.nora.vars.lastSpoken = 0;
	apps.nora.vars.say('<span style="color:#ACE">Text-to-speech from selection:</span>');
	apps.nora.vars.lastSpoken = 1;
	apps.nora.vars.say(message);
}
window.textspeech = textspeech;

} // End initial variable declaration