const FileManager = () => {

apps.files = new Application({
	title: "File Manager",
	abbreviation: "FIL",
	codeName: "files",
	image: "smarticons/files/fg.png",
	hideApp: 0,
	launchTypes: 1,
	main: function (launchType) {
		if (!this.appWindow.appIcon) {
			this.appWindow.paddingMode(0);
			this.appWindow.setDims("auto", "auto", 796, 400, 1);
		}
		this.appWindow.setCaption("File Manager");
		this.appWindow.openWindow();
		if (launchType === 'dsktp') {
			this.vars.currLoc = '/';
			getId('win_files_html').style.background = "none";
			this.appWindow.setContent(
				'<div id="FIL2topdiv" class="noselect" style="width:calc(100% - 96px); min-width:calc(70% + 48px); right:0; height:50px;">' +
				'<div title="Back" class="cursorPointer darkResponsive" style="width:34px; height:18px; padding-top:2px; left:5px; top:4px; border-top-left-radius:10px; border-bottom-left-radius:10px; text-align:center;" onClick="apps.files.vars.back()">&lArr; &nbsp;</div>' +
				'<div title="Home" class="cursorPointer darkResponsive" style="width:24px; border-left:1px solid #333; height:18px; padding-top:2px; left:30px; top:4px; border-top-left-radius:10px; border-bottom-left-radius:10px; text-align:center;" onClick="apps.files.vars.home()">H</div>' +
				'<div title="Refresh" class="cursorPointer darkResponsive" style="width:34px; height:18px; padding-top:2px; right:6px; top:4px; border-top-right-radius:10px; border-bottom-right-radius:10px; text-align:center;" onClick="apps.files.vars.update()">&nbsp; &#x21BB;</div>' +
				'<div title="View Mode" class="cursorPointer darkResponsive" style="width:24px; border-right:1px solid #333; height:18px; padding-top:2px; right:31px; top:4px; border-top-right-radius:10px; border-bottom-right-radius:10px; text-align:center;" onClick="apps.files.vars.setViewMode()">&#8801;</div>' +
				'<div id="FIL2path" class="darkResponsive" style="left:55px; font-family:monospace; height:25px; line-height:25px; vertical-align:middle; width:calc(100% - 110px); border-top-left-radius:5px; border-top-right-radius:5px;"><div id="FIL2green" style="width:0;height:100%;"></div><div style="width:100%;height:25px;"><input id="FIL2input" style="background:transparent;box-shadow:none;color:inherit;font-family:monospace;border:none;width:calc(100% - 8px);height:25px;padding:0;padding-left:8px;border-top-left-radius:5px;border-top-right-radius:5px;" onkeypress="if(event.keyCode===13){apps.files.vars.navigate(this.value)}" value="/"></div></div>' +
				'<div id="FIL2viewModeIcon" style="pointer-events:none; color:#7F7F7F; text-align:right; left:55px; font-family:monospace; height:25px; line-height:25px; vertical-align:middle; width:calc(100% - 110px);"></div>' +
				'<div id="FIL2search" class="darkResponsive" style="left:55px; top:26px; font-family:monospace; height:22px; line-height:22px; vertical-align:middle; width:calc(100% - 110px);"><input id="FIL2searchInput" placeholder="Search" style="background:transparent;box-shadow:none;color:inherit;font-family:monospace;border:none;width:calc(100% - 8px);height:20px;padding:0;padding-left:8px;" onkeyup="apps.files.vars.updateSearch(this.value)"></div>' +
				'<div class="cursorPointer darkResponsive" style="width:34px; height:18px; padding-top:2px; left:5px; top:27px; border-top-left-radius:10px; border-bottom-left-radius:10px; text-align:center; display:none" onClick=""></div>' +
				'<div title="Toggle Favorite" class="cursorPointer darkResponsive" style="width:24px; border-left:1px solid #333; height:18px; padding-top:2px; left:30px; top:27px; border-top-left-radius:10px; border-bottom-left-radius:10px; text-align:center;" onClick="apps.files.vars.toggleFavorite(apps.files.vars.currLoc)"><img class="darkInvert" style="position:absolute;display:block;left:8px;top:5px;" src="ctxMenu/happy.png"></div>' +
				'<div title="New Folder" class="cursorPointer darkResponsive" style="width:34px; height:18px; padding-top:2px; right:6px; top:27px; border-top-right-radius:10px; border-bottom-right-radius:10px; text-align:center;" onClick="apps.files.vars.mkdir()"><img class="darkInvert" style="position:absolute;display:block;left:16px;top:5px;" src="files/small/folder.png"></div>' +
				'<div title="New File" class="cursorPointer darkResponsive" style="width:24px; border-right:1px solid #333; height:18px; padding-top:2px; right:31px; top:27px; border-top-right-radius:10px; border-bottom-right-radius:10px; text-align:center;" onClick="apps.files.vars.mkfile()"><img class="darkInvert" style="position:absolute;display:block;left:8px;top:5px;" src="ctxMenu/new.png"></div>' +
				'</div>' +
				'<div id="FIL2sidebar" class="darkResponsive" style="overflow-y:scroll; border-top-left-radius:5px; font-family:W95FA, Courier, monospace; font-size:12px; width:144px; max-width:30%; padding:3px; height:calc(100% - 56px); top:50px;">' +
				'Home<br><div id="FIL2home" class="FIL2sidetbl FIL2viewMedium"></div><br>' +
				'Favorites<br><div id="FIL2favorites" class="FIL2sidetbl FIL2viewMedium"></div><br>' +
				'Navigation<br><div id="FIL2nav" class="FIL2sidetbl FIL2viewMedium"></div></div>' +
				'<div class="darkResponsive" style="width:calc(100% - 151px); border-top-right-radius:5px; min-width:calc(70% - 7px); right:0; height:calc(100% - 50px); top:50px; background-repeat:no-repeat; background-position:center" id="FIL2cntn"></div>'
			);
			getId("FIL2home").innerHTML =
				'<div class="cursorPointer" onClick="apps.files.vars.currLoc = \'/\';apps.files.vars.next(\'apps/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'/apps/\\\');toTop(apps.properties)\'])">' +
				'<img src="files/small/folder.png"> ' +
				'/apps/' +
				'</div><div class="cursorPointer" onClick="apps.files.vars.currLoc = \'/\';apps.files.vars.next(\'widgets/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'/widgets/\\\');toTop(apps.properties)\'])">' +
				'<img src="files/small/folder.png"> ' +
				'/widgets/' +
				'</div><div class="cursorPointer" onClick="apps.files.vars.currLoc = \'/\';apps.files.vars.next(\'USERFILES/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'/USERFILES/\\\');toTop(apps.properties)\'])">' +
				'<img src="files/small/folder.png"> ' +
				'/USERFILES/' +
				'</div>' +
				'</div>';
			this.vars.updateFavorites(1);
			this.vars.setViewMode(this.vars.currViewMode, 1);
		}
	},
	vars: {
		appInfo: '',
		currLoc: '/',
		viewModes: [
			['Small Grid', 'FIL2viewCompact'],
			['Large Grid', 'FIL2viewSmall'],
			['Small List', 'FIL2viewMedium'],
			['Large List', 'FIL2viewLarge']
		],
		currViewMode: 3,
		setViewMode: function(newMode, nosave) {
			try {
				getId('FIL2tbl').classList.remove(this.viewModes[this.currViewMode][1]);
			} catch (err) {
				// Window is not open
			}

			if (typeof newMode === "number") {
				if (newMode < this.viewModes.length) {
					this.currViewMode = newMode;
				}
			} else {
				this.currViewMode++;
				if (this.currViewMode >= this.viewModes.length) {
					this.currViewMode = 0;
				}
			}

			try {
				getId('FIL2viewModeIcon').innerHTML = this.viewModes[this.currViewMode][0] + "&nbsp;";
				getId('FIL2tbl').classList.add(this.viewModes[this.currViewMode][1]);
			} catch (err) {
				// Window is not open
			}

			if (!nosave) {
				apps.savemaster.vars.save("system/apps/files/view_mode", this.currViewMode, 1);
			}
		},
		back: function() {
			this.currLoc = this.currLoc.split("/");
			var cleanEscapeRun = 0;
			while (!cleanEscapeRun) {
				cleanEscapeRun = 1;
				for (let i = 0; i < this.currLoc.length - 1; i++) {
					if (this.currLoc[i][this.currLoc[i].length - 1] === '\\') {
						this.currLoc.splice(i, 2, this.currLoc[i].substring(0, this.currLoc[i].length) + '/' + this.currLoc[i + 1]);
						cleanEscapeRun = 0;
						break;
					}
				}
				if (cleanEscapeRun && this.currLoc.length > 0) {
					if (this.currLoc[this.currLoc.length - 1][this.currLoc[this.currLoc.length - 1].length - 1] === '\\') {
						this.currLoc.splice(i, 1, this.currLoc[this.currLoc.length - 1].substring(0, this.currLoc[this.currLoc.length - 1].length) + '/');
						cleanEscapeRun = 0;
					}
				}
			}
			this.currLoc.pop();
			this.currLoc.pop();
			this.currLoc = this.currLoc.join("/") + '/';
			this.update();
		},
		home: function() {
			this.currLoc = '/';
			this.update();
		},
		next: function (nextName) {
			var tempNextName = nextName;
			if (tempNextName.indexOf('/') !== -1 && tempNextName.indexOf('/') !== tempNextName.length - 1) {
				tempNextName = tempNextName.split('/');
				if (tempNextName[tempNextName.length - 1] === '') {
					tempNextName.pop();
					tempNextName = tempNextName.join('\\/') + '/';
				} else {
					tempNextName = tempNextName.join('\\/');
				}
			}
			this.currLoc += tempNextName;
			this.update();
		},
		mkdir: function() {
			if (this.currLoc === '/') {
				apps.prompt.vars.alert('Please navigate to a directory to create a new folder.', 'Okay', function() {}, 'File Manager');
			} else if (this.currLoc.indexOf('/USERFILES/') === 0) {
				apps.prompt.vars.prompt('Enter a name for the new folder.<br><br>Folder will be created in ' + this.currLoc + '<br><br>Leave blank to cancel.', 'Submit', function (str) {
					if (str) {
						apps.savemaster.vars.mkdir(this.currLoc.substring(11, this.currLoc.length) + str);
					}
					this.update();
				}.bind(this), "File Manager");
			} else if (this.currLoc !== '/apps/') {
				apps.prompt.vars.prompt('Enter a name for the new folder.<br><br>Folder will be created in ' + this.currLoc + '<br><br>Leave blank to cancel.', 'Submit', function (str) {
					if (str) {
						sh('mkdir ' + this.currLoc + str);
					}
					this.update();
				}.bind(this), "File Manager");
			} else {
				apps.prompt.vars.alert('Please navigate to a directory to create a new folder.', 'Okay', function() {}, 'File Manager');
			}
		},
		mkfile: function() {
			if (this.currLoc === '/') {
				apps.prompt.vars.alert('Please navigate to a directory to create a new file.', 'Okay', function() {}, 'File Manager');
			} else if (this.currLoc.indexOf('/USERFILES/') === 0) {
				apps.prompt.vars.prompt('Enter a name for the new file.<br><br>File will be created in ' + this.currLoc + '<br><br>Leave blank to cancel.', 'Submit', function (str) {
					if (str) {
						ufsave(this.currLoc.substring(11, this.currLoc.length) + str, '');
					}
					this.update();
				}.bind(this), "File Manager");
			} else if (this.currLoc !== '/apps/') {
				apps.prompt.vars.prompt('Enter a name for the new file.<br><br>File will be created in ' + this.currLoc + '<br><br>Leave blank to cancel.', 'Submit', function (str) {
					if (str) {
						eval(apps.bash.vars.translateDir(this.currLoc + str) + '=""');
					}
					this.update();
				}.bind(this), "File Manager");
			} else {
				apps.prompt.vars.alert('Please navigate to a directory to create a new file.', 'Okay', function() {}, 'File Manager');
			}

		},
		deleteItem: function (itemPath) {
			apps.prompt.vars.confirm("Are you sure you want to delete this item?<br><br>" + itemPath + "<br><br>WARNING: Deleting important files can cause major issues!", ["No, keep", "Yes, delete"], (btn) => {
				if (btn === 1) {
					if (typeof apps.bash.vars.getRealDir === "object") {
						sh("rmdir " + itemPath);
					} else {
						sh("rm " + itemPath);
					}
					apps.files.vars.update();
				}
			}, 'File Manager');
		},
		deleteItemUF: function (itemPath) {
			apps.prompt.vars.confirm("Are you sure you want to delete this item?<br><br>" + itemPath + "<br><br>WARNING: This cannot be undone!", ["No, keep", "Yes, delete"], (btn) => {
				if (btn === 1) {
					itemPath = itemPath.split('/');
					if (itemPath[0] === "") {
						itemPath.shift();
					}
					if (itemPath[0] === "USERFILES") {
						itemPath.shift();
					}
					itemPath = itemPath.join('/');
					ufdel(itemPath);
					apps.files.vars.update();
				}
			}, 'File Manager');
		},
		deleteItemLF: function (itemPath) {
			apps.prompt.vars.confirm("Are you sure you want to delete this item?<br><br>" + itemPath + "<br><br>WARNING: This cannot be undone!", ["No, keep", "Yes, delete"], (btn) => {
				if (btn === 1) {
					itemPath = itemPath.split('/');
					if (itemPath[0] === "") {
						itemPath.shift();
					}
					if (itemPath[0] === "USERFILES") {
						itemPath.shift();
					}
					itemPath = itemPath.join('/');
					lfdel(itemPath);
					apps.files.vars.update();
				}
			}, 'File Manager');
		},
		navigate: function (newName) {
			if (newName[0] !== "/") {
				newName = "/" + newName;
			}
			if (newName[newName.length - 1] !== "/") {
				newName = newName + "/";
			}
			this.currLoc = newName;
			this.update();
		},
		filetype: function (type) {
			switch (type) {
				case 'object':
					return 'folder';
				case 'string':
					return 'text';
				case 'function':
					return 'code';
				case 'boolean':
					return 'T/F';
				case 'undefined':
					return 'nothing';
				case 'number':
					return 'value';
				default:
					return type;
			}
		},
		icontype: function (type) {
			switch (type) {
				case 'object':
					return 'folder';
				case 'string':
					return 'file';
				case 'function':
					return 'console';
				case 'boolean':
					return 'gear';
				case 'undefined':
					return 'x';
				case 'number':
					return 'performance';
				default:
					return 'agent';
			}
		},
		testingFolder: {
			filenameTests: {
				"This is a really long file name that has spaces and stuff in it!": "Hello World",
				ThisIsAReallyLongFileNameThatDoesNotHaveAnySpacesAndStuffInIt: "HelloWorld",
				"123_test": "43110 World",
				test_123: "Hello |/\\|0710",
				"this.has.dots.in.it": "Hello.World",
				"Folder with spaces": {
					secretMessage: "Oof"
				},
				"Folder.with.dots": {
					secretMessage: "Yeet"
				},
				"file/with/slashes": "Wowza",
				"file/with/slash/at/end/": "oh boy",
				"folder/with/slash/at/end/": {
					"folder": {
						"wat": "odang"
					},
					"file": "oooooh"
				}
			},
			stringFile: "Hello World",
			functionFile: function() {
				return "Hello World"
			},
			booleanTrueFile: true,
			booleanFalseFile: false,
			undefinedFile: undefined,
			nullFile: null,
			numberFile: 1337
		},
		currTotal: 0,
		currItem: 0,
		currEffect: 0,
		currContentStr: '',
		currDirList: [],
		update: function() {
			this.currContentStr = '';
			getId('FIL2searchInput').value = '';
			getId("FIL2green").style.backgroundColor = 'rgb(170, 255, 170)';
			getId("FIL2green").style.width = "0";
			getId('FIL2cntn').classList.add('cursorLoadDark');
			getId("FIL2cntn").innerHTML = '<div id="FIL2tbl" class="' + this.viewModes[this.currViewMode][1] + '" style="width:100%; position:absolute; margin:auto;padding-bottom:3px;"></div>';
			getId("FIL2tbl").style.marginTop = scrollHeight;
			if (this.currLoc === '/') {
				getId("FIL2path").innerHTML = '<div id="FIL2green" style="height:100%;background-color:rgb(170, 255, 170)"></div><div style="width:100%;height:25px;"><input id="FIL2input" style="background:transparent;box-shadow:none;color:inherit;font-family:monospace;border:none;width:calc(100% - 8px);height:25px;padding:0;padding-left:8px;border-top-left-radius:5px;border-top-right-radius:5px;" onkeypress="if(event.keyCode===13){apps.files.vars.navigate(this.value)}" value="/"></div>';
				getId("FIL2tbl").innerHTML =
					'<span style="padding-left:3px;line-height:18px">Home</span><br>' +
					'<div class="cursorPointer" onClick="apps.files.vars.next(\'apps/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'/apps/\\\');toTop(apps.properties)\'])">' +
					'<img src="files/small/folder.png"> ' +
					'apps/' +
					'</div><div class="cursorPointer" onClick="apps.files.vars.next(\'widgets/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'/widgets/\\\');toTop(apps.properties)\'])">' +
					'<img src="files/small/folder.png"> ' +
					'widgets/' +
					'</div><div class="cursorPointer" onClick="apps.files.vars.next(\'USERFILES/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'/USERFILES/\\\');toTop(apps.properties)\'])">' +
					'<img src="files/small/folder.png"> ' +
					'USERFILES/' +
					'</div>' +
					'</div>' +
					'<br><br><span style="padding-left:3px;line-height:18px;">Favorites</span><br>';
				this.updateFavorites(1, 1);
				getId("FIL2green").className = '';
				getId('FIL2green').style.backgroundColor = "#FFF";
				getId("FIL2green").style.display = "none";
				getId("FIL2cntn").style.backgroundImage = "";
				getId('FIL2cntn').classList.remove('cursorLoadDark');
			} else {
				getId("FIL2path").innerHTML = '<div id="FIL2green" class="liveElement" data-live-target="style.width" data-live-eval="apps.files.vars.currItem/apps.files.vars.currTotal*100+\'%\'" style="height:100%;background-color:rgb(170, 255, 170);box-shadow:0 0 20px 10px rgb(170, 255, 170)"></div><div style="width:100%;height:25px;"><input id="FIL2input" style="background:transparent;box-shadow:none;color:inherit;font-family:monospace;border:none;width:calc(100% - 8px);height:25px;padding:0;padding-left:8px;border-top-left-radius:5px;border-top-right-radius:5px;" onkeypress="if(event.keyCode===13){apps.files.vars.navigate(this.value)}" value="' + this.currLoc + '"></div>';
				this.currDirList = sh("ls '" + this.currLoc + "'").split('\n');
				if (this.currDirList.length === 1 && this.currDirList[0] === "") {
					if (typeof apps.bash.vars.getRealDir(this.currLoc) !== "object" || apps.bash.vars.getRealDir(this.currLoc) === null) {
						apps.prompt.vars.alert("Could not open " + this.currLoc + ": Does not exist or is null.", "Okay", function() {}, "File Manager");
					}
				} else {
					this.currDirList.sort(function (a, b) {
						var aLow = a.toLowerCase();
						var bLow = b.toLowerCase();
						if (aLow === bLow) return 0;
						if (aLow > bLow) return 1;
						return -1;
					});
					var temphtml = '';
					if (this.currLoc.indexOf("/USERFILES/") === 0) {
						for (let item in this.currDirList) {
							if (this.currDirList[item]) {
								// if item is a folder
								if (this.currDirList[item][this.currDirList[item].length - 1] === "/" && this.currDirList[item][this.currDirList[item].length - 2] !== "\\") {
									temphtml += '<div class="cursorPointer" onclick="apps.files.vars.next(\'' + this.currDirList[item] + '\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (this.currLoc + this.currDirList[item]) + '\\\');toTop(apps.properties)\', \'+Delete\', \'apps.files.vars.deleteItemUF(\\\'' + (this.currLoc + this.currDirList[item]) + '\\\')\'])">' +
										'<img src="files/small/folder.png"> ' +
										this.currDirList[item].split('\\/').join('/') +
										'</div>';
								} else {
									temphtml += '<div class="cursorPointer" onClick="apps.notepad.vars.openFile(\'' + (this.currLoc + this.currDirList[item]).split('\\').join('\\\\') + '\');" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (this.currLoc + this.currDirList[item]).split('\\').join('\\\\') + '\\\');toTop(apps.properties)\', \'+Delete\', \'apps.files.vars.deleteItemUF(\\\'' + (this.currLoc + this.currDirList[item]) + '\\\')\'])">' +
										'<img src="files/small/' + this.icontype(typeof apps.bash.vars.getRealDir(this.currLoc + this.currDirList[item])) + '.png"> ' +
										this.currDirList[item].split('\\/').join('/') + '<span style="opacity:0.5;float:right;">' + this.filetype(typeof apps.bash.vars.getRealDir(this.currLoc + this.currDirList[item])) + '&nbsp;</span>' +
										'</div>';
								}
							}
						}
					} else if (this.currLoc === "/apps/") {
						for (let item in this.currDirList) {
							if (this.currDirList[item]) {
								// if item is a folder
								if (this.currDirList[item][this.currDirList[item].length - 1] === "/" && this.currDirList[item][this.currDirList[item].length - 2] !== "\\") {
									temphtml += '<div class="cursorPointer" onclick="apps.files.vars.next(\'' + this.currDirList[item] + '\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/window.png\', \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Open App\', \'openapp(apps.' + this.currDirList[item].substring(0, this.currDirList[item].length - 1) + ', \\\'dsktp\\\')\', \'+Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (this.currLoc + this.currDirList[item]) + '\\\');toTop(apps.properties)\', \'_Delete\', \'\'])">' +
										buildSmartIcon(16, apps[this.currDirList[item].split('/')[0]].appWindow.appImg) + ' ' +
										this.currDirList[item].split('\\/').join('/') +
										'</div>';
								} else {
									temphtml += '<div class="cursorPointer" onClick="apps.notepad.vars.openFile(\'' + (this.currLoc + this.currDirList[item]).split('\\').join('\\\\') + '\');" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (this.currLoc + this.currDirList[item]).split('\\').join('\\\\') + '\\\');toTop(apps.properties)\', \'-Delete\', \'\'])">' +
										'<img src="files/small/' + this.icontype(typeof apps.bash.vars.getRealDir(this.currLoc + this.currDirList[item])) + '.png"> ' +
										this.currDirList[item].split('\\/').join('/') + '<span style="opacity:0.5;float:right;">' + this.filetype(typeof apps.bash.vars.getRealDir(this.currLoc + this.currDirList[item])) + '&nbsp;</span>' +
										'</div>';
								}
							}
						}
					} else {
						for (let item in this.currDirList) {
							if (this.currDirList[item]) {
								// if item is a folder
								if (this.currDirList[item][this.currDirList[item].length - 1] === "/" && this.currDirList[item][this.currDirList[item].length - 2] !== "\\") {
									temphtml += '<div class="cursorPointer" onclick="apps.files.vars.next(\'' + this.currDirList[item] + '\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (this.currLoc + this.currDirList[item]) + '\\\');toTop(apps.properties)\', \'+Delete\', \'apps.files.vars.deleteItem(\\\'' + (this.currLoc + this.currDirList[item]) + '\\\')\'])">' +
										'<img src="files/small/folder.png"> ' +
										this.currDirList[item].split('\\/').join('/') +
										'</div>';
								} else {
									temphtml += '<div class="cursorPointer" onClick="apps.notepad.vars.openFile(\'/window' + (this.currLoc + this.currDirList[item]).split('\\').join('\\\\') + '\');" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (this.currLoc + this.currDirList[item]).split('\\').join('\\\\') + '\\\');toTop(apps.properties)\', \'+Delete\', \'apps.files.vars.deleteItem(\\\'' + (this.currLoc + this.currDirList[item]) + '\\\')\'])">' +
										'<img src="files/small/' + this.icontype(typeof apps.bash.vars.getRealDir(this.currLoc + this.currDirList[item])) + '.png"> ' +
										this.currDirList[item].split('\\/').join('/') + '<span style="opacity:0.5;float:right;">' + this.filetype(typeof apps.bash.vars.getRealDir(this.currLoc + this.currDirList[item])) + '&nbsp;</span>' +
										'</div>';
								}
							}
						}
					}
					getId('FIL2tbl').innerHTML = temphtml;
				}
				getId("FIL2green").className = '';
				getId('FIL2green').style.backgroundColor = "#FFF";
				getId("FIL2green").style.display = "none";
				getId("FIL2cntn").style.backgroundImage = "";
				getId('FIL2cntn').classList.remove('cursorLoadDark');
			}
			var pathSplit = this.currLoc.split('/');
			if (pathSplit[0] === "") {
				pathSplit.shift();
			}
			if (pathSplit[pathSplit.length - 1] === "") {
				pathSplit.pop();
			}
			var cleanEscapeRun = 0;
			while (!cleanEscapeRun) {
				cleanEscapeRun = 1;
				for (var j = 0; j < pathSplit.length - 1; j++) {
					if (pathSplit[j][pathSplit[j].length - 1] === '\\') {
						pathSplit.splice(j, 2, pathSplit[j].substring(0, pathSplit[j].length) + '/' + pathSplit[j + 1]);
						cleanEscapeRun = 0;
						break;
					}
				}
				if (cleanEscapeRun && pathSplit.length > 0) {
					if (pathSplit[pathSplit.length - 1][pathSplit[pathSplit.length - 1].length - 1] === '\\') {
						pathSplit.splice(j, 1, pathSplit[pathSplit.length - 1].substring(0, pathSplit[pathSplit.length - 1].length) + '/');
						cleanEscapeRun = 0;
					}
				}
			}
			var navDepth = 0;
			var navPath = "/";
			var tempHTML = '<div class="cursorPointer" onclick="apps.files.vars.currLoc = \'/\';apps.files.vars.update()" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \'-Properties\', \'\', \'_Delete\', \'\'])">' +
				'<img src="files/small/folder.png"> ' +
				'/' +
				'</div>';
			for (var i in pathSplit) {
				if (pathSplit.indexOf("apps") === 0 && navDepth === 1) {
					tempHTML += '<div class="cursorPointer" onclick="apps.files.vars.currLoc = \'' + navPath + '\';apps.files.vars.next(\'' + pathSplit[i] + '/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (navPath + pathSplit[i]) + '/\\\');toTop(apps.properties)\', \'_Delete\', \'\'])">' +
						buildSmartIcon(16, (apps[pathSplit[i]] || {
							appWindow: {
								appImg: {
									foreground: "appicons/redx.png"
								}
							}
						}).appWindow.appImg) + ' ' +
						pathSplit[i].split('\\/').join('/') + "/" +
						'</div>';
				} else {
					tempHTML += '<div class="cursorPointer" onclick="apps.files.vars.currLoc = \'' + navPath + '\';apps.files.vars.next(\'' + pathSplit[i] + '/\')" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + (navPath + pathSplit[i]) + '/\\\');toTop(apps.properties)\', \'_Delete\', \'\'])">' +
						'<img src="files/small/folder.png"> ' +
						pathSplit[i].split('\\/').join('/') + '/' +
						'</div>';
				}
				navPath += pathSplit[i] + '/';
				navDepth++;
			}
			getId("FIL2nav").innerHTML = tempHTML;
		},
		updateSearch: function (searchStr) {
			var searchElems = getId('FIL2tbl').getElementsByClassName('cursorPointer');
			for (var i = 0; i < searchElems.length; i++) {
				if (searchElems[i].innerText.toLowerCase().indexOf(searchStr.toLowerCase()) === -1) {
					searchElems[i].style.display = 'none';
				} else {
					searchElems[i].style.display = '';
				}
			}
		},
		favorites: [],
		updateFavorites: function (nosave, mainPage) {
			if (!nosave) ufsave('system/apps/files/favorites', JSON.stringify(this.favorites));
			var tempHTML = '';
			for (let i in this.favorites) {
				var currPath = this.favorites[i].split('/');
				var cleanEscapeRun = 0;
				while (!cleanEscapeRun) {
					cleanEscapeRun = 1;
					for (let j = 0; j < currPath.length - 1; j++) {
						if (currPath[j][currPath[j].length - 1] === '\\') {
							currPath.splice(j, 2, currPath[j].substring(0, currPath[j].length) + '/' + currPath[j + 1]);
							cleanEscapeRun = 0;
							break;
						}
					}
					if (cleanEscapeRun && currPath.length > 0) {
						if (currPath[currPath.length - 1][currPath[currPath.length - 1].length - 1] === '\\') {
							currPath.splice(j, 1, currPath[currPath.length - 1].substring(0, currPath[currPath.length - 1].length) + '/');
							cleanEscapeRun = 0;
						}
					}
				}
				if (currPath[currPath.length - 1] === "") {
					currPath.pop();
				}
				if (currPath[0] === "") {
					currPath.shift();
				}
				if (currPath.length === 0) {
					tempHTML += '<div class="cursorPointer" onclick="apps.files.vars.currLoc = \'/\';apps.files.vars.update()" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \'-Properties\', \'\', \'+Remove Favorite\', \'apps.files.vars.toggleFavorite(\\\'/\\\')\', \'_Delete\', \'\'])">' +
						'<img src="files/small/folder.png"> ' +
						'/' +
						'</div>';
				} else {
					var currName = currPath[currPath.length - 1];
					if (currPath.indexOf("apps") === 0 && currPath.length === 2) {
						tempHTML += '<div class="cursorPointer" onclick="apps.files.vars.currLoc = \'' + this.favorites[i] + '\';apps.files.vars.update()" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + this.favorites[i] + '\\\');toTop(apps.properties)\', \'+Remove Favorite\', \'apps.files.vars.toggleFavorite(\\\'' + this.favorites[i] + '\\\')\', \'_Delete\', \'\'])">' +
							buildSmartIcon(16, (apps[currName] || {
								appWindow: {
									appImg: {
										foreground: "appicons/redx.png"
									}
								}
							}).appWindow.appImg) + ' ' +
							currName.split('\\/').join('/') + "/" +
							'</div>';
					} else {
						tempHTML += '<div class="cursorPointer" onclick="apps.files.vars.currLoc = \'' + this.favorites[i] + '\';apps.files.vars.update()" oncontextmenu="ctxMenu([[event.pageX, event.pageY, \'ctxMenu/file.png\', \'ctxMenu/x.png\'], \' Properties\', \'apps.properties.main(\\\'openFile\\\', \\\'' + this.favorites[i] + '\\\');toTop(apps.properties)\', \'+Remove Favorite\', \'apps.files.vars.toggleFavorite(\\\'' + this.favorites[i] + '\\\')\', \'_Delete\', \'\'])">' +
							'<img src="files/small/folder.png"> ' +
							currName.split('\\/').join('/') + '/' +
							'</div>';
					}
				}
			}
			if (mainPage) {
				getId("FIL2tbl").innerHTML += tempHTML;
			} else {
				getId("FIL2favorites").innerHTML = tempHTML;
				if (this.currLoc === '/') {
					this.update();
				}
			}
		},
		toggleFavorite: function (item) {
			var itemLocation = this.favorites.indexOf(item);
			if (itemLocation === -1) {
				this.favorites.push(item);
			} else {
				this.favorites.splice(itemLocation, 1);
			}
			this.updateFavorites();
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
					if (ufload("system/apps/files/view_mode")) {
						this.vars.setViewMode(parseInt(ufload("system/apps/files/view_mode")), 1);
					}
					if (ufload("system/apps/files/favorites")) {
						this.vars.favorites = JSON.parse(ufload("system/apps/files/favorites"));
					}
					break;
				case 'shutdown':

					break;
				default:
					doLog("No case found for '" + signal + "' signal in app '" + this.dsktpIcon + "'", "#F00");
		}
	}
});

} // End initial variable declaration