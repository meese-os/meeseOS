const Dashboard = () => {

apps.startMenu = new Application({
	title: "Dashboard",
	abbreviation: "DsB",
	codeName: "startMenu",
	image: "smarticons/aOS/fg.png",
	hideApp: 1,
	launchTypes: 1,
	main: function (launchType) {
		if (launchType === 'srtup') {
			this.appWindow.paddingMode(0);
			getId('win_startMenu_shrink').style.display = "none";
			getId('win_startMenu_big').style.display = "none";
			getId('win_startMenu_exit').style.display = "none";
			getId('win_startMenu_fold').style.display = 'none';
			getId('win_startMenu_top').style.transform = 'scale(1)';
			getId('win_startMenu_cap').classList.remove('cursorLoadLight');
			getId('win_startMenu_cap').classList.add('cursorDefault');
			getId('win_startMenu_cap').setAttribute('onmousedown', '');
			getId('win_startMenu_size').style.pointerEvents = "none";
			getId('win_startMenu_cap').setAttribute('oncontextmenu', 'ctxMenu(apps.startMenu.vars.captionCtx, 1, event)');
			getId('win_startMenu_top').style.borderTopLeftRadius = "0";
			getId('win_startMenu_top').style.borderBottomLeftRadius = "0";
			getId('win_startMenu_top').style.borderBottomRightRadius = "";
			getId('win_startMenu_top').style.borderTopRightRadius = "0";
			getId('win_startMenu_html').style.borderBottomLeftRadius = "0";
			getId('win_startMenu_html').style.borderBottomRightRadius = "";
			getId('win_startMenu_html').style.overflowY = "auto";
			getId('win_startMenu_html').style.background = 'none';
			getId('win_startMenu_top').setAttribute('onClick', "toTop(apps.startMenu, 2)");
			getId('icn_startMenu').setAttribute('oncontextmenu', 'ctxMenu(apps.startMenu.vars.iconCtx, 1, event)');

			getId('win_startMenu_top').style.transition = '0.35s';
			getId('win_startMenu_aero').style.transition = '0.35s';

			this.appWindow.alwaysOnTop(1);

			this.appWindow.setCaption('Dashboard');
			this.appWindow.openWindow();
			this.appWindow.closeKeepTask();
		} else if (launchType === 'dsktp' || launchType === 'tskbr') {
			if (getId('win_startMenu_top').style.display !== 'block') {
				requestAnimationFrame(function() {
					apps.startMenu.appWindow.setDims(0, 0, 300, 370)
				});

				this.appWindow.openWindow();
				this.vars.listOfApps = '';
				this.appWindow.setContent(
					'<div style="width:100%;height:100%;">' +
					'<div style="position:relative;text-align:center;">' +
					'<button onclick="c(function(){ctxMenu(apps.startMenu.vars.powerCtx, 1, event)})">Power</button>  ' +
					'<button onclick="openapp(apps.files, \'dsktp\')">Files</button> ' +
					// TODO: Unbreak this
					'<button onclick="openapp(apps.appsbrowser, \'dsktp\')">All Apps</button><br>' +
					'<button onclick="openapp(apps.jsConsole, \'dsktp\')">JavaScript Console</button> ' +
					'<input autocomplete="off" style="width:calc(100% - 6px);margin-top:3px;" placeholder="App Search" onkeyup="apps.startMenu.vars.search(event)" id="appDsBsearch">' +
					'</div><div id="appDsBtableWrapper" class="noselect" style="width:100%;overflow-y:scroll;background-color:rgba(' + darkSwitch('255, 255, 255', '39, 39, 39') + ', 0.5);">' +
					'<table id="appDsBtable" style="color:#000;font-family:W95FA, monospace; font-size:12px; width:100%;color:' + darkSwitch('#000', '#FFF') + ';"></table>' +
					'</div></div>'
				);
				var outerbound = getId("win_startMenu_html").getBoundingClientRect();
				var innerbound = getId("appDsBtableWrapper").getBoundingClientRect();
				getId("appDsBtableWrapper").style.height = outerbound.height - (innerbound.top - outerbound.top) + "px";
				if (this.vars.listOfApps.length === 0) {
					getId('appDsBtable').innerHTML = '<tr><td></td></tr>';
					getId('appDsBtable').classList.add('cursorLoadLight');
					for (let appHandle in appsSorted) {
						if (apps[appsSorted[appHandle]].keepOffDesktop < 2) {
							apps.startMenu.vars.listOfApps += '<tr class="cursorPointer dashboardSearchItem" onClick="openapp(apps.' + appsSorted[appHandle] + ', \'dsktp\')" oncontextmenu="ctxMenu(apps.startMenu.vars.ctx, 1, event, \'' + appsSorted[appHandle] + '\')">' +
								'<th>' + buildSmartIcon(32, apps[appsSorted[appHandle]].appWindow.appImg) + '</th>' +
								'<td>' + apps[appsSorted[appHandle]].appName + '</td>' +
								'<td style="text-align:right;opacity:0.5">' + apps[appsSorted[appHandle]].dsktpIcon + '</td>' +
								'</tr>';
						}
					}
					
					getId('appDsBtable').innerHTML = apps.startMenu.vars.listOfApps;
					getId('appDsBtable').innerHTML += '<tr><th><div style="width:32px;height:32px;position:relative;"></div></th><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>&nbsp;&nbsp;&nbsp;</td>';
					getId('appDsBtable').classList.remove('cursorLoadLight');
					apps.startMenu.vars.appElems = getId('appDsBtable').getElementsByClassName('dashboardSearchItem');
				} else {
					getId('appDsBtable').innerHTML = this.vars.listOfApps;
					this.vars.appElems = getId('appDsBtable').getElementsByTagName('tr');
				}
				if (!mobileMode) {
					getId('appDsBsearch').focus();
				}
			} else {
				apps.startMenu.signalHandler('shrink');
			}
		}
	},
	vars: {
		appInfo: '',
		appElems: null,
		search: function (event, iblock) {
			if (this.appElems !== null) {
				if (event.keyCode === 13) {
					for (let i = 0; i < this.appElems.length; i++) {
						if (this.appElems[i].style.display !== 'none') {
							this.appElems[i].click();
							break;
						}
					}
				} else {
					for (let i = 0; i < this.appElems.length; i++) {
						if (this.appElems[i].innerText.toLowerCase().indexOf(getId('appDsBsearch').value.toLowerCase()) > -1) {
							this.appElems[i].style.display = iblock ? 'inline-block' : '';
						} else {
							this.appElems[i].style.display = 'none';
						}
					}
				}
			}
		},
		listOfApps: "",
		minimize: function() {
			apps.startMenu.appWindow.closeKeepTask();
			getId("icn_startMenu").classList.remove("openAppIcon");
		},
		captionCtx: [
			[' Hide', function() {
				apps.startMenu.signalHandler('shrink');
			}, 'ctxMenu/minimize.png']
		],
		iconCtx: [
			[' Files', function() {
				openapp(apps.files, 'dsktp');
			}, 'ctxMenu/folder.png'],
			[' All Apps', function() {
				openapp(apps.appsBrowser, 'dsktp');
			}, 'ctxMenu/window.png'],
			/*[' Settings', function() {
				openapp(apps.settings, 'dsktp');
			}, 'ctxMenu/gear.png'],*/
			['+Log Out', function() {
				window.shutDown('restart', 1);
			}, 'ctxMenu/power.png'],
			[' Restart', function() {
				window.shutDown('restart', 0);
			}, 'ctxMenu/power.png'],
			[' Shut Down', function() {
				window.shutDown(0, 1);
			}, 'ctxMenu/power.png']
		],
		powerCtx: [
			[' Log Out', function() {
				window.shutDown('restart', 1);
			}, 'ctxMenu/power.png'],
			[' Restart', function() {
				window.shutDown('restart', 0);
			}, 'ctxMenu/power.png'],
			[' Shut Down', function() {
				window.shutDown(0, 1);
			}, 'ctxMenu/power.png']
		],
		ctx: [
			[' Open', function (arg) {
				openapp(apps[arg], "dsktp");
			}, 'ctxMenu/window.png'],
			[function (arg) {
				if (dsktp[arg]) {
					return '_Add Desktop Icon';
				} else {
					return '+Add Desktop Icon';
				}
			}, function (arg) {
				if (dsktp[arg]) {
					removeDsktpIcon(arg);
				} else {
					newDsktpIcon(arg, arg);
				}
				openapp(apps.startMenu, 'tskbr');
			}, 'ctxMenu/add.png'],
			[function (arg) {
				return `${dsktp[arg] ? ' ' : '-'}Remove Desktop Icon`;
			}, function (arg) {
				dsktp[arg] ? removeDsktpIcon(arg) : newDsktpIcon(arg, arg);
				openapp(apps.startMenu, 'tskbr');
			}, 'ctxMenu/x.png'],
			['+About This App', function (arg) {
				openapp(apps.appInfo, arg);
			}, 'ctxMenu/file.png'],
			[' View Files', function (arg) {
				c(function() {
					openapp(apps.files, 'dsktp');
					c(function() {
						apps.files.vars.next('apps/');
						apps.files.vars.next(arg + '/');
					});
				});
			}, 'ctxMenu/folder.png']
		]
	},
	signalHandler: function (signal) {
		switch (signal) {
			case "forceclose":
				this.appWindow.closeWindow();
				this.appWindow.closeIcon();
				break;
			case "close":
				setTimeout(apps.startMenu.vars.minimize, 350);
				this.appWindow.setDims(-305, 0, 300, 370);
				if (mobileMode)
					getId('win_startMenu_top').style.transform = 'scale(1) translate(-' + getId('desktop').style.width + ', 0)';
				
				break;
			case "checkrunning":
				if (this.appWindow.appIcon) {
					return 1;
				} else {
					return 0;
				}
				case "shrink":
					setTimeout(apps.startMenu.vars.minimize, 350);
					this.appWindow.setDims(-305, 0, 300, 370);
					if (mobileMode) {
						getId('win_startMenu_top').style.transform = 'scale(1) translate(-' + getId('desktop').style.width + ', 0)';
					}

					this.appWindow.appIcon = 0;
					break;
				case "USERFILES_DONE":
					// SET UP WIDGETS
					addWidget('notifications', 1);
					addWidget('time', 1);
					addWidget('flow', 1);

					// Remove taskbar text
					getId('icntitle_startMenu').style.display = "none";

					// Settings page stuff
					window.setTimeout(function() {
						getId('loadingInfo').innerHTML = 'Welcome.';
						getId('desktop').style.display = '';
						getId('taskbar').style.display = '';
					}, 0);
					window.setTimeout(function() {
						getId('isLoading').style.opacity = 0;
						getId('loadingBg').style.opacity = 0;
					}, 5);
					window.setTimeout(function() {
						getId('isLoading').style.display = 'none';
						getId('isLoading').innerHTML = '';
						getId('loadingBg').style.display = 'none';
					}, 1005);
					window.setTimeout(function() {
						var dsktpIconFolder = ufload("system/desktop/");
						if (dsktpIconFolder) {
							for (let file in dsktpIconFolder) {
								if (file.indexOf('ico_') === 0) {
									if (getId(file.substring(10, 16)) !== null) {
										getId(file.substring(4, file.length)).style.left = eval(USERFILES[file])[0] + "px";
										getId(file.substring(4, file.length)).style.top = eval(USERFILES[file])[1] + "px";
									}
								}
							}
						}
					}, 0);

					// From web_app_maker
					appsSorted = []; 
					for (var i in apps) { 
						appsSorted.push(apps[i].appName.toLowerCase() + "|WAP_apps_sort|" + i); 
					} 
					appsSorted.sort(); 
					for (var i in appsSorted) { 
						var tempStr = appsSorted[i].split("|WAP_apps_sort|"); 
						tempStr = tempStr[tempStr.length - 1]; 
						appsSorted[i] = tempStr; 
					}

					break;
				case "shutdown":

					break;
				default:
					doLog("No case found for '" + signal + "' signal in app '" + this.dsktpIcon + "'");
		}
	}
});
apps.startMenu.main('srtup');

} // End initial variable declaration