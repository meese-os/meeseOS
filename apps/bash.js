const Bash = () => {

apps.bash = new Application({
	title: 'Pseudo-Bash Terminal',
	abbreviation: "sh",
	codeName: "bash",
	image: "smarticons/bash/fg.png",
	hideApp: 2,
	main: function() {
		if (!this.appWindow.appIcon) {
			this.appWindow.paddingMode(0);
			this.appWindow.setCaption('Bash');
			this.appWindow.setDims("auto", "auto", 662, 504);
			this.appWindow.setContent(
				'<span id="bashContent" style="display:block;line-height:1em;font-family:W95FA;font-size:12px;width:100%;">' +
				'This terminal is a work-in-progress. Some features are incomplete.<br>' +
				'Use "help" for a list of commands or for information of a specific command.<br>' +
				'Click on the prompt\'s line to begin typing.' +
				'</span>' +
				'<input id="bashInput" onkeydown="apps.bash.vars.checkPrefix(event, 1)" onkeypress="apps.bash.vars.checkPrefix(event)" onkeyup="apps.bash.vars.checkPrefix(event);if(event.keyCode === 13){apps.bash.vars.execute()}" style="background:none;color:inherit;box-shadow:none;display:block;line-height:1em;font-family:W95FA;font-size:12px;border:none;outline:none;padding:0;width:100%;">'
			);
			this.vars.checkPrefix({
				keyCode: null
			});
			this.vars.currHistory = -1;
			getId('win_bash_html').style.overflowY = 'scroll';
			getId("win_bash_html").style.overflowX = 'auto';
		}

		this.appWindow.openWindow();
	},
	vars: {
		appInfo: 'This app is intended to imitate a Linux Bash Terminal, but is written completely in JavaScript. Type "help" for available commands and usage.',
		prefix: `[user@${websiteTitle} bash]$ `,
		pastValue: `[user@${websiteTitle} bash]$ `,
		command: '',
		workdir: '/apps/bash',
		workdirorig: '',
		workdirtemp: [],
		workdirtrans: 'window.apps.bash',
		workdirfinal: 'window.apps.bash',
		workdirprev: 'window.apps.bash',
		workdirdepth: 0,
		translateDir: function (origworkdir) {
			this.workdirorig = origworkdir;
			this.workdirtrans = this.workdirorig;

			this.workdirdepth = 0;
			this.workdirfinal = 'window';
			if (this.workdirorig[0] !== '/') {
				this.workdirtrans = this.workdir + '/' + this.workdirtrans;
			}

			this.workdirtemp = this.workdirtrans.split('/');
			var cleanEscapeRun = 0;
			while (!cleanEscapeRun) {
				cleanEscapeRun = 1;
				for (let i = 0; i < this.workdirtemp.length - 1; i++) {
					if (this.workdirtemp[i][this.workdirtemp[i].length - 1] === '\\') {
						this.workdirtemp.splice(i, 2, this.workdirtemp[i].substring(0, this.workdirtemp[i].length - 1) + '/' + this.workdirtemp[i + 1]);
						cleanEscapeRun = 0;
						break;
					}
				}

				if (cleanEscapeRun && this.workdirtemp.length > 0) {
					if (this.workdirtemp[this.workdirtemp.length - 1][this.workdirtemp[this.workdirtemp.length - 1].length - 1] === '\\') {
						this.workdirtemp.splice(i, 1, this.workdirtemp[this.workdirtemp.length - 1].substring(0, this.workdirtemp[this.workdirtemp.length - 1].length - 1) + '/');
						cleanEscapeRun = 0;
					}
				}
			}
			while (this.workdirdepth < this.workdirtemp.length) {
				if (this.workdirtemp[this.workdirdepth] !== '') {
					if (this.workdirtemp[this.workdirdepth] === '..') {
						if (this.workdirfinal.length === 0) {
							this.workdirfinal = "/";
						} else if (this.workdirfinal[this.workdirfinal.length - 1] === "]") {
							this.workdirfinal = this.workdirfinal.split("['");
							this.workdirfinal.pop();
							this.workdirfinal = this.workdirfinal.join(".");
						} else {
							this.workdirfinal = this.workdirfinal.split(".");
							this.workdirfinal.pop();
							this.workdirfinal = this.workdirfinal.join(".");
						}
						if (this.workdirfinal.length === 0) {
							this.workdirfinal = "/";
						}
					} else {
						if (
							isNaN(parseInt(this.workdirtemp[this.workdirdepth], 10)) &&
							this.workdirtemp[this.workdirdepth].indexOf('=') === -1 &&
							this.workdirtemp[this.workdirdepth].indexOf(' ') === -1 &&
							this.workdirtemp[this.workdirdepth].indexOf(';') === -1 &&
							this.workdirtemp[this.workdirdepth].indexOf('.') === -1 &&
							this.workdirtemp[this.workdirdepth].indexOf(',') === -1 &&
							this.workdirtemp[this.workdirdepth].indexOf('/') === -1
						) {
							try {
								new Function(this.workdirtemp[this.workdirdepth], 'var ' + this.workdirtemp[this.workdirdepth]);
								this.workdirfinal += "." + this.workdirtemp[this.workdirdepth];
							} catch (err) {
								this.workdirfinal += "['" + this.workdirtemp[this.workdirdepth] + "']";
							}
						} else {
							this.workdirfinal += "['" + this.workdirtemp[this.workdirdepth] + "']";
						}
					}
				}
				this.workdirdepth++;
			}
			return this.workdirfinal;
		},
		getRealDir: function (origdir) {
			return eval(this.translateDir(origdir));
		},
		alias: {},
		checkPrefix: function (event, keyUp) {
			if (keyUp && event.keyCode === 38) {
				getId('bashInput').value = this.prefix + this.seekHistory(1);
				event.preventDefault();
			} else if (keyUp && event.keyCode === 40) {
				getId('bashInput').value = this.prefix + this.seekHistory(-1);
				event.preventDefault();
			} else if (getId('bashInput').value.indexOf(this.prefix) !== 0) {
				getId('bashInput').value = this.pastValue;
			}
			this.pastValue = getId('bashInput').value;
		},
		echo: function (message) {
			if (this.piping) {
				this.pipeOut += '<br>' + String(message);
			} else {
				try {
					getId('bashContent').innerHTML += '<br>' + cleanStr(String(message)).split('  ').join(' &nbsp;').split('\n').join('<br>') + '&nbsp;';
					getId('win_bash_html').scrollTop = getId('win_bash_html').scrollHeight;
				} catch (err) {
					// the window is not open and cannot recieve the echo
				}
			}
		},
		piping: 0,
		commandPipeline: 0,
		pipeOut: '',
		getAlias: function (search, doSearch) {
			if (doSearch) {
				var found = -1;
				for (let item in this.alias) {
					if (item === search) {
						found = item;
						return this.getCmdObjects(this.alias[item]);
					}
				}
				return [search];
			} else {
				return [search];
			}
		},
		getCmdObjects: function (command, alias) {
			var cmdObjects = [];

			// doublequotes
			var i = 0;
			// singlequotes
			var j = 0;
			// spaces
			var s = 0;
			// current cursor
			var curr = 0;
			// end of potential quote sequence
			var next = 0;
			// previous cursor
			var prev = 0;
			while (prev < command.length) {
				i = command.indexOf('"', prev);
				j = command.indexOf("'", prev);
				s = command.indexOf(' ', prev);

				// if no quotes or spaces found
				if (i === -1 && j === -1 && s === -1) {
					// add remainder of string to commands list
					var postAlias = this.getAlias(command.substring(prev, command.length), alias);
					for (var l in postAlias) {
						cmdObjects.push(postAlias[l]);
					}
					// quit
					break;
				}

				// if space found and comes before quotes or there are no quotes
				if (s !== -1 && (s < i || i === -1) && (s < j || j === -1)) {
					// if space is not current character
					if (s !== prev) {
						// push this "word" to object list
						var postAlias = this.getAlias(command.substring(prev, s), alias);
						for (var l in postAlias) {
							cmdObjects.push(postAlias[l]);
						}
					}
					prev = s + 1;
				} else {
					// if both types of quotes are found
					if (i !== -1 && j !== -1) {
						// place cursor at closest quote
						curr = Math.min(i, j);
						// else if doublequotes are found
					} else if (i !== -1) {
						// place cursor at doublequote
						curr = i;
						// else if singlequotes are found
					} else if (j !== -1) {
						// place cursor at singlequote
						curr = j;
					}
					// if there is a character between previous "word" and this bit
					if (curr !== prev) {
						// add the preceding "word" to object list
						var postAlias = this.getAlias(command.substring(prev, curr), alias);
						for (var l in postAlias) {
							cmdObjects.push(postAlias[l]);
						}
					}
					// try to find end of quotes
					var tempCurr = curr;
					tempCurr = command.indexOf(command[curr], tempCurr + 1);
					while (command[tempCurr - 1] === "\\") {
						command = command.substring(0, tempCurr - 1) + command.substring(tempCurr, command.length);
						tempCurr = command.indexOf(command[curr], tempCurr);
						if (tempCurr === -1) {
							break;
						}
					}
					var next = tempCurr;
					// if no end is found, assume it's at the end of the string
					if (next === -1) {
						// add the remainder of the string to command objects
						cmdObjects.push(command.substring(curr + 1, command.length));
						// break loop
						break;
					} else {
						// add this quotation to list
						cmdObjects.push(command.substring(curr + 1, next));
						prev = next + 1;
					}
				}
			}
			return cmdObjects;
		},
		execute: function (cmd, silent) {
			if (cmd) {
				this.command = cmd;
				if (silent) {
					var temporaryBashWorkDir = this.workdir;
					if (arguments.callee.caller === window.sh) {
						if (typeof arguments.callee.caller.caller.__bashworkdir === "string") {
							this.workdir = arguments.callee.caller.caller.__bashworkdir;
						} else {
							arguments.callee.caller.caller.__bashworkdir = "/";
							this.workdir = "/";
						}
					} else {
						if (typeof arguments.callee.caller.__bashworkdir === "string") {
							this.workdir = arguments.callee.caller.__bashworkdir;
						} else {
							arguments.callee.caller.__bashworkdir = "/";
							this.workdir = "/";
						}
					}
				} else {
					this.echo(`[${websiteTitle}]$ ` + cleanStr(cmd));
				}
				var commandObjects = this.getCmdObjects(this.command);
			} else {
				this.command = getId('bashInput').value.substring(getId('bashInput').value.indexOf('$') + 2, getId('bashInput').value.length);
				this.appendHistory(getId('bashInput').value.substring(getId('bashInput').value.indexOf('$') + 2, getId('bashInput').value.length));
				this.echo(cleanStr(getId('bashInput').value));
				getId('bashInput').value = this.prefix;
				this.pastValue = this.prefix;
				var commandObjects = this.getCmdObjects(this.command, 1);
			}
			if (this.command.length !== 0) {
				var pipeGroups = [];
				if (commandObjects.indexOf('|') !== -1) {
					for (var i = 0; commandObjects.indexOf('|', i) !== -1; i = commandObjects.indexOf('|', i) + 1) {
						var pipeGroup = [];
						for (var j = i; j < commandObjects.indexOf('|', i); j++) {
							pipeGroup.push(commandObjects[j]);
						}
						pipeGroups.push(pipeGroup);
					}
					var pipeGroup = [];
					for (var j = commandObjects.lastIndexOf('|') + 1; j < commandObjects.length; j++) {
						pipeGroup.push(commandObjects[j]);
					}
					pipeGroups.push(pipeGroup);
				} else {
					pipeGroups.push(commandObjects);
				}

				let cmdResult = "";
				for (var i = 0; i < pipeGroups.length; i++) {
					var currCmd = pipeGroups[i].shift();
					var cmdID = -1;
					for (var j = 0; j < this.commands.length; j++) {
						if (this.commands[j].name === currCmd) {
							cmdID = j;
							break;
						}
					}

					if (cmdID !== -1) {
						try {
							cmdResult = this.commands[cmdID].action(pipeGroups[i]);
						} catch (err) {
							this.echo(currCmd + ': ' + err);
							break;
						}
						if (cmdResult) {
							if (i !== pipeGroups.length - 1) {
								pipeGroups[i + 1].push(cmdResult);
							}
						}
					} else {
						this.echo(currCmd + ": command not found");
						break;
					}
				}

				if (cmdResult && !cmd) {
					this.echo(cmdResult);
				} else if (cmd) {
					if (silent) {
						if (arguments.callee.caller === window.sh) {
							arguments.callee.caller.caller.__bashworkdir = this.workdir;
						} else {
							arguments.callee.caller.__bashworkdir = this.workdir;
						}
						this.workdir = temporaryBashWorkDir;
					}
					return cmdResult
				}
			}
		},
		currHelpSearch: '',
		cmdHistory: [],
		currHistory: -1,
		seekHistory: function (direction) { // 1 or -1
			var nextHistory = this.currHistory + direction;
			if (nextHistory < 0) {
				this.currHistory = -1;
				return '';
			} else if (nextHistory >= this.cmdHistory.length) {
				if (this.cmdHistory.length > 0) {
					this.currHistory = this.cmdHistory.length - 1;
					return this.cmdHistory[this.cmdHistory.length - 1];
				} else {
					return '';
				}
			} else {
				this.currHistory = nextHistory;
				return this.cmdHistory[nextHistory];
			}
		},
		appendHistory: function (str) {
			this.cmdHistory.unshift(str);
			this.currHistory = -1;
			if (this.cmdHistory.length > 50) {
				this.cmdHistory.pop();
			}
		},
		commands: [{
				name: 'help',
				usage: 'help [command]',
				desc: 'Prints the usage and help doc for a command.',
				action: function (args) {
					apps.bash.vars.currHelpSearch = args.join(" ");
					this.vars.foundCmds = apps.bash.vars.commands.filter(function (i) {
						return apps.bash.vars.currHelpSearch.indexOf(i.name) > -1 || i.name.indexOf(apps.bash.vars.currHelpSearch) > -1;
					});
					var str = "";
					for (let i in this.vars.foundCmds) {
						str += '\n\n' + this.vars.foundCmds[i].name + ': ' + this.vars.foundCmds[i].usage;
						str += '\n' + this.vars.foundCmds[i].desc;
					}
					return str.substring(2, str.length);
				},
				vars: {
					foundCmds: []
				}
			},
			{
				name: 'echo',
				usage: 'echo [message]',
				desc: 'Prints message to console.',
				action: function (args) {
					str = args.join(" ");
					return str;
				}
			},
			{
				name: 'alias',
				usage: 'alias [shorthand]="[definition]"',
				desc: 'Creates a persistent alias for the user. Make sure to use quotes if there are spaces or quotes in your definition!',
				action: function (args) {
					if (args.length > 0) {
						if ((args[0].length > 0 && args[1] === "=") || args[0].length > 1) {
							if (args[0].indexOf('=') === args[0].length - 1) {
								let shifted = args.shift();
								apps.bash.vars.alias[shifted.substring(0, shifted.length - 1)] = args.join(" ");
							} else if (args[1] === "=") {
								let shifted = args.shift();
								args.shift();
								apps.bash.vars.alias[shifted] = args.join(" ");
							} else {
								throw "AliasError: The alias command appears to be malformed. Make sure your alias is only one word and the = is in the correct place.";
							}
						} else {
							throw "AliasError: The alias command appears to be malformed. Make sure your alias is only one word and the = is in the correct place.";
						}

						ufsave('system/apps/bash/alias', JSON.stringify(apps.bash.vars.alias));
					} else {
						let str = "";
						for (let i in apps.bash.vars.alias) {
							str += '\n' + i + " = " + apps.bash.vars.alias[i];
						}
						return str.substring(1, str.length);
					}
				},
				vars: {

				}
			},
			{
				name: 'js',
				usage: 'js [code]',
				desc: 'Run JavaScript code and echo the returned value',
				action: function (args) {
					return eval(args.join(" "));
				}
			},
			{
				name: 'pwd',
				usage: 'pwd [-J]',
				desc: 'Prints the current working directory. If -J is specified, also prints the JavaScript-equivalent directory.',
				action: function (args) {
					if (args.length > 0) {
						if (args[0].toLowerCase() === '-j') {
							return 'shdir: ' + apps.bash.vars.workdir + '\n' +
								'jsdir: ' + apps.bash.vars.translateDir(apps.bash.vars.workdir);
						} else {
							return apps.bash.vars.workdir;
						}
					} else {
						return apps.bash.vars.workdir;
					}
				},
				vars: {}
			},
			{
				name: 'cd',
				usage: 'cd [dirname]',
				desc: 'Move working directory to specified directory.',
				action: function (args) {
					if (args.length > 0) {
						this.vars.prevworkdir = apps.bash.vars.workdir;
						try {
							this.vars.tempadd = args[0].split('/');
							let cleanEscapeRun = 0;
							while (!cleanEscapeRun) {
								cleanEscapeRun = 1;
								for (var i = 0; i < this.vars.tempadd.length - 1; i++) {
									if (this.vars.tempadd[i][this.vars.tempadd[i].length - 1] === '\\') {
										this.vars.tempadd.splice(i, 2, this.vars.tempadd[i].substring(0, this.vars.tempadd[i].length) + '/' + this.vars.tempadd[i + 1]);
										cleanEscapeRun = 0;
										break;
									}
								}
								if (cleanEscapeRun && this.vars.tempadd.length > 0) {
									if (this.vars.tempadd[this.vars.tempadd.length - 1][this.vars.tempadd[this.vars.tempadd.length - 1].length - 1] === '\\') {
										this.vars.tempadd.splice(i, 1, this.vars.tempadd[this.vars.tempadd.length - 1].substring(0, this.vars.tempadd[this.vars.tempadd.length - 1].length) + '/');
										cleanEscapeRun = 0;
									}
								}
							}

							this.vars.tempstart = (apps.bash.vars.workdir[0] === '/');
							if (args[0][0] === '/' || apps.bash.vars.workdir === '/') {
								this.vars.tempdir = [];
								this.vars.tempstart = 1;
							} else {
								this.vars.tempdir = apps.bash.vars.workdir.split('/');
							}

							cleanEscapeRun = 0;
							while (!cleanEscapeRun) {
								cleanEscapeRun = 1;
								for (let i = 0; i < this.vars.tempdir.length - 1; i++) {
									if (this.vars.tempdir[i][this.vars.tempdir[i].length - 1] === '\\') {
										this.vars.tempdir.splice(i, 2, this.vars.tempdir[i].substring(0, this.vars.tempdir[i].length) + '/' + this.vars.tempdir[i + 1]);
										cleanEscapeRun = 0;
										break;
									}
								}
								if (cleanEscapeRun && this.vars.tempdir.length > 0) {
									if (this.vars.tempdir[this.vars.tempdir.length - 1][this.vars.tempdir[this.vars.tempdir.length - 1].length - 1] === '\\') {
										this.vars.tempdir.splice(i, 1, this.vars.tempdir[this.vars.tempdir.length - 1].substring(0, this.vars.tempdir[this.vars.tempdir.length - 1].length) + '/');
										cleanEscapeRun = 0;
									}
								}
							}
							for (let i in this.vars.tempadd) {
								if (this.vars.tempadd[i] === '..') {
									this.vars.tempdir.pop();
								} else {
									this.vars.tempdir.push(this.vars.tempadd[i]);
								}
							}
							if (this.vars.tempdir.length > 0) {
								var lastTempAdd = this.vars.tempdir[this.vars.tempdir.length - 1];
							} else {
								var lastTempAdd = '/';
							}
							this.vars.temppath = this.vars.tempdir.join('/');
							if (this.vars.tempstart && this.vars.temppath[0] !== '/') {
								this.vars.temppath = '/' + this.vars.temppath;
							}
							this.vars.temppath = this.vars.temppath.split('//').join('/');
							apps.bash.vars.workdir = this.vars.temppath;
							if (apps.bash.vars.getRealDir('') === undefined) {
								var badworkdir = apps.bash.vars.workdir;
								apps.bash.vars.workdir = this.vars.prevworkdir;
								throw "" + badworkdir + ': No such file or directory';
							} else if (typeof apps.bash.vars.getRealDir('') !== 'object') {
								var badworkdir = apps.bash.vars.workdir;
								apps.bash.vars.workdir = this.vars.prevworkdir;
								throw "" + badworkdir + ': Not a directory';
							}
							
							if (apps.bash.vars.workdir === '/') {
								apps.bash.vars.prefix = `[${SRVRKEYWORD.substring(0, 4)}@${websiteTitle} /]$ `;
							} else {
								apps.bash.vars.prefix = `[${SRVRKEYWORD.substring(0, 4)}@${websiteTitle} ${lastTempAdd}]$ `;
							}

							apps.bash.vars.pastValue = apps.bash.vars.prefix;
							getId('bashInput').value = apps.bash.vars.prefix;
						} catch (err) {
							apps.bash.vars.workdir = this.vars.prevworkdir;
							throw err;
						}
					}
				},
				vars: {
					temppath: '',
					prevworkdir: '',
					tempstart: 0,
					tempadd: [],
					tempdir: []
				}
			},
			{
				name: 'grep',
				usage: 'grep [needle] ',
				desc: 'List lines of a source that contain a target string.',
				action: function (args) {
					this.vars.target = args.shift();
					this.vars.lines = args.join("\n").split('\n');
					this.vars.out = '';
					for (var i in this.vars.lines) {
						if (this.vars.lines[i].toLowerCase().indexOf(this.vars.target.toLowerCase()) > -1) {
							this.vars.out += '\n' + this.vars.lines[i];
						}
					}
					return this.vars.out.substring(1, this.vars.out.length);
				},
				vars: {
					target: '',
					lines: [],
					out: ''
				}
			},
			{
				name: 'ls',
				usage: 'ls [-R] [dirname]',
				desc: 'List files in a directory.\n-R prints subdirectories up to 1 layer deep\nIf no directory is provided, current directory is used.\nWARNING: -R can be dangerous in large directories like /',
				action: function (args) {
					if (args.length > 0) {
						if (args[0] === "-R") {
							try {
								this.vars.selectedDir = apps.bash.vars.getRealDir(args[1]);
							} catch (err) {
								this.vars.selectedDir = apps.bash.vars.getRealDir('');
							}
							this.vars.printSub = 1;
						} else {
							this.vars.selectedDir = apps.bash.vars.getRealDir(args[0]);
							this.vars.printSub = 0;
						}
					} else {
						this.vars.selectedDir = apps.bash.vars.getRealDir('');
						this.vars.printSub = 0;
					}
					
					var dirSize = 0;
					var printBuffer = "";
					if (typeof this.vars.selectedDir) {
						if (typeof this.vars.selectedDir === 'object') {
							for (var item in this.vars.selectedDir) {
								dirSize++;
								if (dirSize > 1) {
									printBuffer += '\n' + item.split('/').join('\\/');
								} else {
									printBuffer += item.split('/').join('\\/');
								}
								if (typeof this.vars.selectedDir[item] === 'object') {
									printBuffer += '/';
									if (this.vars.printSub) {
										for (var subitem in this.vars.selectedDir[item]) {
											printBuffer += '\n' + item.split('/').join('\\/') + '/' + subitem.split('/').join('\\/');
											if (typeof this.vars.selectedDir[item][subitem] === 'object') {
												printBuffer += '/';
											}
										}
									}
								}
							}
						} else {
							throw args.join(' ') + ': Not a directory';
						}
					} else {
						throw 'Cannot access ' + args.join(' ') + ': No such file or directory';
					}
					return printBuffer;
				},
				vars: {
					printSub: 0,
					selectedDir: {}
				}
			},
			{
				name: 'mv',
				usage: 'mv [path] [newpath]',
				desc: 'Moves a file or directory to a new path.',
				action: function (args) {
					if (args.length > 1) {
						this.vars.currSet = [args[0], args[1]];
						eval(apps.bash.vars.translateDir(this.vars.currSet[1]) + '=' + apps.bash.vars.translateDir(this.vars.currSet[0]));
						eval('delete ' + apps.bash.vars.translateDir(currSet[0]));
					} else {
						throw "Missing a file, must specify two";
					}
				},
				vars: {
					currSet: [],
					currItem: {}
				}
			},
			{
				name: 'cp',
				usage: 'cp [path] [newpath]',
				desc: 'Copies a file or directory to a new path.',
				action: function (args) {
					if (args.length > 1) {
						this.vars.currSet = [args[0], args[1]];
						eval(apps.bash.vars.translateDir(this.vars.currSet[1]) + '=' + apps.bash.vars.translateDir(this.vars.currSet[0]));
					} else {
						throw "Missing a file, must specify two";
					}
				},
				vars: {
					currSet: [],
					currItem: {}
				}
			},
			{
				name: 'rm',
				usage: 'rm [file]...',
				desc: 'Deletes files.',
				action: function (args) {
					if (args.length > 0) {
						for (var i in args) {
							if (typeof apps.bash.vars.getRealDir(args[i]) !== 'object') {
								eval('delete ' + apps.bash.vars.translateDir(args[i]));
							} else {
								throw 'Cannot delete ' + args[i] + ': is a directory';
							}
						}
					} else {
						throw 'No files provided';
					}
				}
			},
			{
				name: 'rmdir',
				usage: 'rmdir [directory]',
				desc: 'Deletes a file or directory.',
				action: function (args) {
					if (args.length > 0) {
						for (var i in args) {
							if (typeof apps.bash.vars.getRealDir(args[i]) === 'object') {
								eval('delete ' + apps.bash.vars.translateDir(args[i]));
							} else {
								throw 'Cannot delete ' + args[i] + ': is not a directory';
							}
						}
					} else {
						throw 'No files provided';
					}
				}
			},
			{
				name: 'touch',
				usage: 'touch [file]...',
				desc: 'Creates empty files',
				action: function (args) {
					if (args.length > 0) {
						for (let i in args) {
							if (!apps.bash.vars.getRealDir(args[i])) {
								eval(apps.bash.vars.translateDir(args[i]) + '=""');
							} else {
								throw 'Cannot create ' + args[i] + ': already exists';
							}
						}
					} else {
						throw 'No files provided';
					}
					if (!eval(apps.bash.vars.translateDir(args))) {
						eval(apps.bash.vars.translateDir(args) + '= ""');
					}
				}
			},
			{
				name: 'clear',
				usage: 'clear',
				desc: 'Clears the console screen.',
				action: function (args) {
					getId('bashContent').innerHTML = '';
				}
			},
			{
				name: 'mkdir',
				usage: 'mkdir [directory]...',
				desc: 'Creates blank directories.',
				action: function (args) {
					if (args.length > 0) {
						for (let item in args) {
							this.vars.first = 1;
							this.vars.stack = args[item].split('/');
							for (var i in this.vars.stack) {
								if (this.vars.first) {
									this.vars.trace = this.vars.stack[i];
									this.vars.first = 0;
								} else {
									this.vars.trace += '/' + this.vars.stack[i];
								}
								if (typeof apps.bash.vars.getRealDir(this.vars.trace) !== 'object') {
									if (apps.bash.vars.getRealDir(this.vars.trace) === undefined) {
										eval(apps.bash.vars.translateDir(this.vars.trace) + ' = {}');
									} else {
										//throw 'Failed to create ' + args[item] + ": " + this.vars.trace + ' already exists';
									}
								}
							}
						}
					} else {
						throw 'No names given';
					}
				},
				vars: {
					first: 1,
					trace: '',
					stack: []
				}
			},
			{
				name: 'cat',
				usage: 'cat <file>',
				desc: 'Get the contents of a file, as it appears to JavaScript.',
				action: function (args) {
					if (args.length == 0) throw 'No file provided';
					if (typeof apps.bash.vars.getRealDir(args[0]) !== "undefined") {
						return apps.bash.vars.getRealDir(args[0]);
					} else {
						throw args[0] + ': No such file or directory';
					}
				}
			},
			{
				name: 'fortune',
				usage: 'fortune',
				desc: 'Displays a fortune for you!',
				action: function (args) {
					let rand = Math.floor(Math.random() * this.vars.fortunes.length);
					return this.vars.fortunes[rand];
				},
				vars: {
					fortunes: [
						'Test Fortune 1',
						'Test Fortune 2',
						'Test Fortune 3'
					]
				}
			},
			{
				name: 'exit',
				usage: 'exit',
				desc: 'Exits the bash console.',
				action: function (args) {
					if (apps.bash.appWindow.appIcon) {
						apps.bash.signalHandler('close');
					}
				}
			},
			{
				name: 'repo',
				usage: 'repo {install [repo.]pkg | remove [repo.]pkg | update | upgrade | add-repo repo | remove-repo repo | search [query | repo | repo.query] | list | list-all | list-updates}',
				desc: 'Manage the installed app repositories and packages.\n\n',
				action: function (args) {
					if (args.length > 0) {
						var currentAction = args.shift();
						args = args.join(' ');
						switch (currentAction) {
							case 'install':
								var result = repoAddPackage(args.trim(), apps.bash.vars.echo);
								if (typeof result !== 'boolean') return result;
								break;
							case 'remove':
								var result = repoRemovePackage(args.trim(), apps.bash.vars.echo);
								if (typeof result !== 'boolean') return result;
								break;
							case 'update':
								var result = repoUpdate(apps.bash.vars.echo);
								if (typeof result !== 'boolean') return result;
								break;
							case 'upgrade':
								var result = repoUpgrade(apps.bash.vars.echo);
								if (typeof result !== 'boolean') return result;
								break;
							case 'search':
								var result = repoPackageSearch(args.trim());
								if (typeof result !== 'boolean') this.vars.batchEcho(result);
								break;
							case 'add-repo':
								var result = repoAddRepository(args.trim(), apps.bash.vars.echo);
								if (typeof result !== 'boolean') return result;
								break;
							case 'remove-repo':
								var result = repoRemoveRepository(args.trim(), apps.bash.vars.echo);
								if (typeof result !== 'boolean') return result;
								break;
							case 'list-all':
								var result = repoListAll();
								if (typeof result !== 'boolean') this.vars.batchEcho(result);
								break;
							case 'list':
								var result = repoListInstalled();
								if (typeof result !== 'boolean') this.vars.batchEcho(result);
								break;
							case 'list-updates':
								var result = repoGetUpgradeable();
								if (typeof result !== 'boolean') this.vars.batchEcho(result);
								break;
							default:
								throw currentAction + ' is not a recognized repo command.';
						}
					} else {
						throw 'No arguments provided.';
					}
				},
				vars: {
					batchEcho: function (arr) {
						apps.bash.vars.echo(arr.join('\n'));
					}
				}
			}
		]
	},
	signalHandler: function (signal) {
		switch (signal) {
			case "forceclose":
				this.appWindow.closeWindow();
				this.appWindow.closeIcon();
				break;
			case "close":
				this.appWindow.closeWindow();
				setTimeout(function() {
					if (getId("win_" + this.objName + "_top").style.opacity === "0") {
						this.appWindow.setContent("");
					}
				}.bind(this), 300);
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
					this.vars.prefix = `[${SRVRKEYWORD.substring(0, 4)}@${websiteTitle} bash]$ `;
					this.vars.pastValue = `[${SRVRKEYWORD.substring(0, 4)}@${websiteTitle} bash]$ `;

					if (ufload("system/apps/bash/alias")) {
						this.vars.alias = JSON.parse(ufload("system/apps/bash/alias"));
					}
					break;
				default:
					doLog("No case found for '" + signal + "' signal in app '" + this.dsktpIcon + "'");
		}
	}
});

window.sh = function (input) {
	return apps.bash.vars.execute(input, 1);
}

} // End initial variable declaration