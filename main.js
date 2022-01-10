var bootTime = new Date().getTime();
const websiteTitle = 'MeeseOS';
document.title = websiteTitle;

if (typeof console === "undefined") {
	console = {
		log: function() {
			/* IE compatibility because console doesn't exist */
		}
	};
}

// Check if backdrop filter blur and others are supported by the browser
var backdropFilterSupport = false;
var backgroundBlendSupport = false;
var cssFilterSupport = false;
if (typeof CSS !== "undefined") {
	if (typeof CSS.supports !== "undefined") {

		if (CSS.supports("(backdrop-filter: blur(5px))")) {
			backdropFilterSupport = true;
		}

		if (CSS.supports("(background-blend-mode: screen)")) {
			backgroundBlendSupport = true;
		}

		if (CSS.supports("(filter: blur(5px))")) {
			cssFilterSupport = true;
		}
	}
}

// Substitute performance.now if not intact
var windowperformancenowIntact = 1;
if (window.performance === undefined) {
	window.performance = {
		now: function() {
			return (new Date).getTime() * 1000;
		}
	};
} else if (window.performance.now === undefined) {
	window.performance.now = function() {
		return (new Date).getTime() * 1000;
	};
}

// Approximately how long it took to load the page
var timeToPageLoad = Math.round(performance.now() * 10) / 10;

// See if animationframe is supported - if not, substitute it
var requestAnimationFrameIntact = 1;
if (window.requestAnimationFrame === undefined) {
	requestAnimationFrameIntact = 0;
	window.requestAnimationFrame = function (func) {
		window.setTimeout(func, 0);
	};
}

(function (win, doc) {
	// No need to polyfill
	if (win.addEventListener) return;

	function docHijack(p) {
		var old = doc[p];
		doc[p] = function (v) {
			return addListen(old(v))
		}
	}

	function addEvent(on, fn, self) {
		return (self = this).attachEvent('on' + on, function (e) {
			var e = e || win.event;
			e.preventDefault = e.preventDefault || function() {
				e.returnValue = false
			}
			e.stopPropagation = e.stopPropagation || function() {
				e.cancelBubble = true
			}
			fn.call(self, e);
		});
	}

	function addListen(obj, i) {
		if (i = obj.length)
			while (i--) obj[i].addEventListener = addEvent;
		else obj.addEventListener = addEvent;
		return obj;
	}

	addListen([doc, win]);
	if ('Element' in win) win.Element.prototype.addEventListener = addEvent; // IE8
	else { // IE < 8
		doc.attachEvent('onreadystatechange', function() {
			addListen(doc.all)
		}); // Make sure we also init at domReady
		docHijack('getElementsByTagName');
		docHijack('getElementById');
		docHijack('createElement');
		addListen(doc.all);
	}
})(window, document);

if (typeof document.getElementsByClassName === 'undefined') {
	document.getElementsByClassName = function() {
		return [];
	}
}

// End of IE compatibility fixes

// 0 is smaller, 1 is same size, 2 is bigger
const winFadeDistance = 0;
const winBorder = 3;

var darkMode = true;
const darkSwitch = (light, dark) => darkMode ? dark : light;
if (darkMode) {
	document.body.classList.add('darkMode');
} else {
	document.body.classList.remove('darkMode');
}

var autoMobile = true;
function checkMobileSize() {
	if (!autoMobile) return;
	if (!mobileMode && (!window.matchMedia("(pointer: fine)").matches || parseInt(getId("monitor").style.width, 10) < 768)) {
		setMobile(1);
	} else if (mobileMode && (window.matchMedia("(pointer: fine)").matches && parseInt(getId("monitor").style.width, 10) >= 768)) {
		setMobile(0);
	}
}

// 0 is off, 1 is on, 2 is automatic
var mobileMode = 2;
const mobileSwitch = (no, yes) => !!mobileMode ? yes : no;

function setMobile(type) {
	if (type) {
		mobileMode = 1;
		getId('monitor').classList.add('mobileMode');
	} else {
		mobileMode = 0;
		getId('monitor').classList.remove('mobileMode');
	}
}

// Sanitize a string to make HTML safe
function cleanStr(str) {
	return str.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
}

// Make sure monitor doesn't get scrolled away
function checkMonitorMovement() {
	getId('monitor').scrollTop = 0;
	getId('monitor').scrollLeft = 0;
	requestAnimationFrame(checkMonitorMovement);
}
requestAnimationFrame(checkMonitorMovement);

var lasterrorconfirmation = 0;

// Error handler itself
window.onerror = function (errorMsg, url, lineNumber) {
	// Just in case it has been destroyed, vartry is rebuilt - check function vartry(...){...} for commentation on it
	vartry = function (varname) {
		try {
			return eval(varname);
		} catch (err) {
			return '-failed vartry(' + varname + ') ' + err + '-'
		}
	}
	var errorModule = module;
	if (formDate('YMDHmSs') - lasterrorconfirmation > 30000) {
		lasterrorconfirmation = formDate('YMDHmSs');
		try {
			apps.prompt.vars.notify('Error in ' + errorModule + '<br>[' + lineNumber + '] ' + errorMsg + '<br><br>' + randomPhrase, ['Open Console', 'Dismiss'], function (btn) {
				if (!btn) openapp(apps.jsConsole, 'dsktp');
			}, 'Uncaught Error', 'appicons/redx.png');
		} catch (err) {
			console.log("Could not prompt error!");
		}
	}
	try {
		doLog("");
		doLog("You found an error! " + randomPhrase, '#F00');
		doLog("");
		doLog("Error in " + url, "#F00");
		doLog("Module '" + errorModule + "' at [" + lineNumber + "]:", "#F00");
		doLog(errorMsg, "#F00");
		doLog("");
	} catch (err) {
		console.log("");
		console.error("Error in " + url);
		console.error("Module '" + module + "' at [" + lineNumber + "]:");
		console.error(errorMsg);
		console.log("");
	}
};

// Scale of screen, for HiDPI compatibility or for smaller devices
var screenScale = 1;

var modulelast = `init ${websiteTitle}`;
var module = modulelast;
var initStatus = 0;

// Changes the current module
function m(msg) {
	d(2, 'Module changed: ' + msg);
	if (module !== msg) {
		modulelast = module;
		module = msg;
		// Reset module to idle so it is ready for next one
		if (msg !== "unknown") {
			window.setTimeout(function() {
				m('unknown');
			}, 0);
		}
	}
}

// Dynamic debug logging
var dbgLevel = 0;
var d = function (level, message) {
	// Level must be higher than the debuglevel set by Settings in order to log
	if (level <= dbgLevel) {
		doLog('<span style="color:#80F">Dbg:</span> ' + message);
	}
};

// Formats a number with commas
function numberCommas(number) {
	let tempNCnumber = number + "";
	let tempNCresult = "";

	// Adds commas every third character from right
	for (let i = tempNCnumber.length - 3; i > 0; i -= 3) {
		tempNCresult = ',' + tempNCnumber.substring(i, i + 3) + tempNCresult;
		tempNCnumber = tempNCnumber.substring(0, i);
	}
	tempNCresult = tempNCnumber + tempNCresult;
	return tempNCresult;
}

// Performance-measuring functions
m('init performance measure');
var perfObj = {};

// Start measuring a certain performance block
function perfStart(name) {
	d(2, 'Started Performance: ' + name);
	perfObj[name] = [window.performance.now(), 0, 0];
	return Math.round(perfObj[name][0] * 1000);
}
// Check performance of a block
function perfCheck(name) {
	perfObj[name][1] = window.performance.now();
	perfObj[name][2] = perfObj[name][1] - perfObj[name][0];
	d(2, 'Checked Performance: ' + name);
	return Math.round(perfObj[name][2] * 1000);
}
// Start measuring boot time
perfStart('masterInit');

// Vartry is used when something might not work
m('init onerror and USERFILES and getId');
var vartryArray = {};
var vartry = function (varname) {
	try {
		return eval(varname);
	} catch (err) {
		return '-failed vartry(' + varname + ') ' + err + '-';
	}
}

// Convert number to true/false
const getStatus = (num) => !!num ? 'Enabled' : 'Disabled';

// this is where the user's files go
var USERFILES = [];

// Make the desktop invisible to speed up boot
getId('desktop').style.display = 'none';
getId('taskbar').style.display = 'none';

// Find client scrollbar size
m('init Scrollsize');
var scrollWidth = getId("findScrollSize").offsetWidth - getId("findScrollSize").clientWidth;
var scrollHeight = getId("findScrollSize").offsetHeight - getId("findScrollSize").clientHeight;
getId('findScrollSize').style.display = 'none';

// Taskbar settings
var tskbrToggle = {
	perfMode: 0,
	tskbrPos: 1
};

getId("icons").innerHTML = "";

// Function to ping the server
m('init ping functions');
function ping(callbackScript) {
	d(1, 'Pinging server...');
	var pingxhttp = {};
	pingxhttp = new XMLHttpRequest();
	pingxhttp.onreadystatechange = function() {
		if (pingxhttp.readyState === 4) {
			apps.savemaster.vars.saving = 0;
			callbackScript([perfCheck('ping'), pingxhttp.status]);
		}
	};
	pingxhttp.open('GET', 'xmlping.php', 'true');
	perfStart('ping');
	apps.savemaster.vars.saving = 1;
	pingxhttp.send();
}

// Ping the CORS proxy
var corspingxhttp = {};
function corsPing(callbackScript) {
	d(2, 'Pinging CORS...');
	corspingxhttp = new XMLHttpRequest();
	corspingxhttp.onreadystatechange = function() {
		if (corspingxhttp.readyState === 4) {
			apps.savemaster.vars.saving = 0;
			callbackScript([perfCheck('corsping'), corspingxhttp.status]);
		}
	};
	corspingxhttp.open('GET', 'https://cors-anywhere.herokuapp.com/' + 'https://duckduckgo.com/', 'true');
	perfStart('corsping');
	apps.savemaster.vars.saving = 1;
	corspingxhttp.send();
}

// Live elements allow dynamic content to be placed on the page w/o manual updating
var liveElements = [];

// Checks for live elements
function checkLiveElements() {
	liveElements = document.getElementsByClassName('liveElement');
	for (var elem in liveElements) {
		if (elem == parseInt(elem)) {
			if (liveElements[elem].getAttribute('data-live-target') === null) {
				try {
					liveElements[elem].innerHTML = eval(liveElements[elem].getAttribute('data-live-eval'));
				} catch (err) {
					liveElements[elem].innerHTML = 'LiveElement Error: ' + err;
				}
			} else {
				try {
					eval('liveElements[' + elem + '].' + liveElements[elem].getAttribute('data-live-target') + ' = "' + eval(liveElements[elem].getAttribute('data-live-eval')) + '"');
				} catch (err) {}
			}
		}
	}
	requestAnimationFrame(checkLiveElements);
}
requestAnimationFrame(checkLiveElements);

// List of pinned apps
var pinnedApps = [];

function pinApp(app) {
	if (pinnedApps.indexOf(app) === -1) {
		pinnedApps.push(app);
	} else {
		pinnedApps.splice(pinnedApps.indexOf(app), 1);
	}
	ufsave('system/taskbar/pinned_apps', JSON.stringify(pinnedApps));
}

// Application class
m('init Application class');
var apps = {};
window.apps = apps;
var appsSorted = [];
var appTotal = 0;
var appPosX = 8;
var appPosY = 8;
var Application = function (
	appIcon,
	appName,
	appDesc,
	handlesLaunchTypes,
	mainFunction,
	signalHandlerFunction,
	appVariables,
	keepOffDesktop,
	appPath,
	appImg,
	resizeable = true
) {
	try {
		if (typeof appIcon === "object") {
			if (appIcon.hasOwnProperty('resizeable')) resizeable = appIcon.resizeable;
			appImg = appIcon.image || "appicons/aOS.png";
			appPath = appIcon.codeName;
			keepOffDesktop = typeof appIcon.hideApp === "number" ? appIcon.hideApp : 1;
			appVariables = appIcon.vars || {};
			signalHandlerFunction = appIcon.signalHandler || function (signal) {
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
						return this.appWindow.appIcon ? 1 : 0;
					case "shrink":
						this.appWindow.closeKeepTask();
						break;
					case "USERFILES_DONE":

						break;
					case 'shutdown':

						break;
					default:
						doLog("No case found for '" + signal + "' signal in app '" + this.dsktpIcon + "'", "#F00");
				}
			};
			mainFunction = appIcon.main || function() {};
			handlesLaunchTypes = appIcon.launchTypes || 0;
			appName = appIcon.title || "Application";
			appDesc = appIcon.desc || "No description available.";
			appIcon = appIcon.abbreviation || "App";
		}

		// this used to be used in HTML elements but now is just an abbreviation
		this.dsktpIcon = appIcon;
		// now HTML elements match the codename of apps
		this.objName = appPath;
		this.appName = appName;
		this.appDesc = appDesc;
		this.main = mainFunction;
		this.signalHandler = signalHandlerFunction;
		this.launchTypes = handlesLaunchTypes ? 1 : 0;
		this.vars = appVariables;
		this.resizeable = resizeable;
		this.appWindow = {
			/*
					these are the elements that make up a window...
					pretend in this case the app is called "settings"
					anything below that says "settings" can be replaced with the name of your app
					
					div .window    #win_settings_top        Topmost window div, contains entire window
					div .winBimg   #win_settings_img        Texture of window borders
					div .winres    #win_settings_size       Handle to resize window
					div .winCap    #win_settings_cap        Window caption with title and icon
					div .winFld    #win_settings_fold       Button to fold window (compare to Shade in linux)
					div .winHTML   #win_settings_html       HTML content of window, this is where your actual content goes
					div .winBig    #win_settings_big        Button to maximize the window (make the window "big"ger)
					div .winShrink #win_settings_shrink     Button to shrink, or hide, the window
					div .winExit   #win_settings_exit       Button to close window
			*/
			dsktpIcon: appIcon,
			objName: appPath,
			appImg: appImg,
			windowX: 100,
			windowY: 50,
			windowH: 525,
			windowV: 300,
			fullscreen: 0,
			appIcon: 0,
			dimsSet: 0,
			onTop: 0,
			alwaysOnTop: function (setTo) {
				if (setTo && !this.onTop) {
					getId('win_' + this.objName + '_top').style.zIndex = '100';
					this.onTop = 1;
				} else if (!setTo && this.onTop) {
					getId('win_' + this.objName + '_top').style.zIndex = '90';
					this.onTop = 0;
				}
			},
			paddingMode: function (mode) {
				if (mode) {
					getId("win_" + this.objName + "_html").classList.remove('noPadding');
				} else {
					getId("win_" + this.objName + "_html").classList.add('noPadding');
				}
			},
			setDims: function (xOff, yOff, xSiz, ySiz, ignoreDimsSet) {
				d(2, 'Setting dims of window.');
				if (!this.fullscreen) {
					var windowCentered = [0, 0];
					if (xOff === "auto") {
						xOff = Math.round(parseInt(getId('desktop').style.width) / 2 - (xSiz / 2));
						windowCentered[0] = 1;
					}
					if (yOff === "auto") {
						yOff = Math.round(parseInt(getId('desktop').style.height) / 2 - (ySiz / 2));
						windowCentered[1] = 1;
					}
					xOff = Math.round(xOff);
					yOff = Math.round(yOff);
					if (this.windowX !== xOff) {
						getId("win_" + this.objName + "_top").style.left = xOff + "px";
						this.windowX = Math.round(xOff);
					}
					if (this.windowY !== yOff) {
						getId("win_" + this.objName + "_top").style.top = (yOff * (yOff > -1)) + "px";
						this.windowY = Math.round(yOff);
					}
					if (this.windowH !== xSiz) {
						getId("win_" + this.objName + "_top").style.width = xSiz + "px";
						getId("win_" + this.objName + "_aero").style.width = xSiz + 80 + "px";
						this.windowH = xSiz;
					}
					if (this.windowV !== ySiz) {
						if (!this.folded) {
							getId("win_" + this.objName + "_top").style.height = ySiz + "px";
						}

						getId("win_" + this.objName + "_aero").style.height = ySiz + 80 + "px";
						this.windowV = ySiz;
					}
					var aeroOffset = [0, -32];
					try {
						calcWindowblur(this.objName, 1);
					} catch (err) {
						getId("win_" + this.objName + "_aero").style.backgroundPosition = (-1 * xOff + 40 + aeroOffset[0]) + "px " + (-1 * (yOff * (yOff > -1)) + 40 + aeroOffset[1]) + "px";
					}

					if (typeof this.dimsSet === 'function' && !ignoreDimsSet) {
						this.dimsSet();
					}
					if (
						!this.fullscreen && (
							(windowCentered[0] && xSiz > parseInt(getId("desktop").style.width, 10)) ||
							(windowCentered[1] && ySiz > parseInt(getId("desktop").style.height, 10))
						)
					) {
						this.toggleFullscreen();
					}
				}
			},
			openWindow: function() {
				this.appIcon = 1;
				getId("win_" + this.objName + "_top").classList.remove('closedWindow');
				getId("win_" + this.objName + "_top").style.display = "block";
				getId("icn_" + this.objName).style.display = "inline-block";
				getId("icn_" + this.objName).classList.add("openAppIcon");
				getId("win_" + this.objName + "_top").style.pointerEvents = "";

				requestAnimationFrame(function() {
					getId("win_" + this.objName + "_top").style.transform = 'scale(1)';
					getId("win_" + this.objName + "_top").style.opacity = "1";
				}.bind(this));
				setTimeout(function() {
					if (this.appIcon) {
						getId("win_" + this.objName + "_top").style.display = "block";
						getId("win_" + this.objName + "_top").style.opacity = "1";
					}
				}.bind(this), 300);
			},
			closeWindow: function() {
				this.appIcon = 0;
				getId("win_" + this.objName + "_top").classList.add('closedWindow');

				getId('win_' + this.objName + '_top').style.transformOrigin = '';
				getId("win_" + this.objName + "_top").style.transform = `scale(${winFadeDistance})`;
				getId("win_" + this.objName + "_top").style.opacity = "0";
				getId("win_" + this.objName + "_top").style.pointerEvents = "none";
				setTimeout(function() {
					if (!this.appIcon) {
						getId("win_" + this.objName + "_top").style.display = "none";
						getId("win_" + this.objName + "_top").style.width = "";
						getId("win_" + this.objName + "_top").style.height = "";
						this.windowH = -1;
						this.windowV = -1;
					}
				}.bind(this), 300);

				if (pinnedApps.indexOf(this.objName) === -1) {
					getId("icn_" + this.objName).style.display = "none";
				}
				getId("icn_" + this.objName).classList.remove("openAppIcon");
				this.fullscreen = 0;
				if (this.folded) {
					this.foldWindow();
				}
				toTop({
					dsktpIcon: 'CLOSING'
				}, 1);
			},
			closeIcon: function() {
				if (pinnedApps.indexOf(this.objName) === -1) {
					getId("icn_" + this.objName).style.display = "none";
				}
			},
			folded: 0,
			foldWindow: function() {
				if (this.folded) {
					getId('win_' + this.objName + '_html').style.display = 'block';
					getId('win_' + this.objName + '_top').style.height = this.windowV + 'px';
					this.folded = 0;
				} else {
					getId('win_' + this.objName + '_html').style.display = 'none';
					getId('win_' + this.objName + '_top').style.height = 32 + winBorder + 'px';
					this.folded = 1;
				}
			},
			closeKeepTask: function() {
				if (this.objName !== 'startMenu') {
					if (!mobileMode) {
						try {
							getId("win_" + this.objName + "_top").style.transformOrigin = getId("icn_" + this.objName).getBoundingClientRect().left - this.windowX + 23 + 'px ' + (0 - this.windowY) + 'px';
						} catch (err) {
							getId("win_" + this.objName + "_top").style.transformOrigin = '50% -' + window.innerHeight + 'px';
						}
					} else {
						try {
							getId("win_" + this.objName + "_top").style.transformOrigin = getId("icn_" + this.objName).getBoundingClientRect().left + 23 + 'px 0px';
						} catch (err) {
							getId("win_" + this.objName + "_top").style.transformOrigin = '50% -' + window.innerHeight + 'px';
						}
					}
					getId("win_" + this.objName + "_top").style.transform = 'scale(0.1)';
					getId("win_" + this.objName + "_top").style.opacity = "0";
					setTimeout(function() {
						getId("win_" + this.objName + "_top").style.display = "none";
					}.bind(this), 300);
				} else {
					getId("win_" + this.objName + "_top").style.display = "none";
				}

				setTimeout("getId('icn_" + this.objName + "').classList.remove('activeAppIcon')", 0);
			},
			setCaption: function (newCap) {
				d(1, 'Changing caption.');
				if (this.appImg) {
					getId("win_" + this.objName + "_cap").innerHTML = buildSmartIcon(32, this.appImg) + '<div class="winCaptionTitle">' + newCap + '</div>';
				} else {
					getId("win_" + this.objName + "_cap").innerHTML = '<div class="winCaptionTitle">' + this.dsktpIcon + '|' + newCap + '</div>';
				}
			},
			setContent: function (newHTML) {
				getId("win_" + this.objName + "_html").innerHTML = newHTML;
			},
			toggleFullscreen: function() {
				d(1, 'Setting Maximise.');
				if (this.fullscreen) {
					this.fullscreen = 0;
					getId("win_" + this.objName + "_top").classList.remove("maximizedWindow");
				} else {
					this.fullscreen = 1;
					getId("win_" + this.objName + "_top").classList.add("maximizedWindow");
				}
			}
		};
		if (typeof this.appWindow.appImg === "string") {
			this.appWindow.appImg = {
				foreground: this.appWindow.appImg
			};
		}

		this.keepOffDesktop = keepOffDesktop;
		if (!this.keepOffDesktop) {
			newDsktpIcon(appPath, appPath, null, this.appName, this.appWindow.appImg,
				['arg', 'openapp(apps[arg], "dsktp");'], [appPath],
				['arg1', 'arg2', 'ctxMenu(baseCtx.appXXX, 1, event, [event, arg1, arg2]);'], [appPath, appIcon],
				1
			);
		}

		getId("desktop").innerHTML +=
			'<div class="window closedWindow" id="win_' + appPath + '_top">' +
			'<div class="winAero" id="win_' + appPath + '_aero"></div>' +
			'<div class="winBimg" id="win_' + appPath + '_img"></div>' +
			'<div class="winRes cursorOpenHand" id="win_' + appPath + '_size"></div>' +
			'<div class="winCap cursorOpenHand noselect" id="win_' + appPath + '_cap">' +
			'</div>' +
			'<div class="winFld cursorPointer noselect" id="win_' + appPath + '_fold">^' +
			'</div>' +
			'<div class="winHTML" id="win_' + appPath + '_html">' +
			'</div>' +
			'<div class="winBig cursorPointer noselect" id="win_' + appPath + '_big">o' +
			'</div>' +
			'<div class="winShrink cursorPointer noselect" id="win_' + appPath + '_shrink">v' +
			'</div>' +
			'<div class="winExit cursorPointer noselect" id="win_' + appPath + '_exit">x' +
			'</div></div>';
		if (this.appWindow.appImg) {
			getId("icons").innerHTML +=
				'<div class="icon cursorPointer" id="icn_' + appPath + '">' +
				'<div class="iconOpenIndicator"></div>' +
				buildSmartIcon(32, this.appWindow.appImg, "margin-left:6px") +
				'<div class="taskbarIconTitle" id="icntitle_' + appPath + '">' + appName + '</div>' +
				'</div>';
		} else {
			getId("icons").innerHTML +=
				'<div class="icon cursorPointer" id="icn_' + appPath + '">' +
				'<div class="iconOpenIndicator"></div>' +
				'<div class="iconImg">' + appIcon +
				'</div></div>';
		}

		if (this.resizeable) {
			getId("win_" + appPath + "_size").setAttribute("onmousedown", "if(event.button!==2){toTop(apps." + appPath + ");winres(event);}event.preventDefault();return false;");
		}
		
		getId("win_" + appPath + "_cap").setAttribute("onmousedown", "if(event.button!==2){toTop(apps." + appPath + ");winmove(event);}event.preventDefault();return false;");
		getId("icn_" + appPath).setAttribute("onClick", "openapp(apps." + appPath + ", function(){if(apps." + appPath + ".appWindow.appIcon){return 'tskbr'}else{return 'dsktp'}}())");
		getId("win_" + appPath + "_top").setAttribute("onClick", "toTop(apps." + appPath + ")");
		if (appPath !== 'startMenu') {
			getId("icn_" + appPath).setAttribute("oncontextmenu", "ctxMenu(baseCtx.icnXXX, 1, event, '" + appPath + "')");
			getId("icn_" + appPath).setAttribute("onmouseenter", "if(apps." + appPath + ".appWindow.appIcon){highlightWindow('" + appPath + "')}");
			getId("icn_" + appPath).setAttribute("onmouseleave", "highlightHide()");
		}
		getId("win_" + appPath + "_exit").setAttribute("onClick", "apps." + appPath + ".signalHandler('close');event.stopPropagation()");
		getId("win_" + appPath + "_shrink").setAttribute("onClick", "apps." + appPath + ".signalHandler('shrink');event.stopPropagation()");
		getId("win_" + appPath + "_big").setAttribute("onClick", "apps." + appPath + ".appWindow.toggleFullscreen()");
		getId("win_" + appPath + "_fold").setAttribute("onClick", "apps." + appPath + ".appWindow.foldWindow()");
		getId("win_" + appPath + "_cap").setAttribute("oncontextmenu", "ctxMenu(baseCtx.winXXXc, 1, event, '" + appPath + "')");
	} catch (err) {
		if (doLog) doLog(err, '#F00');
	}
};

// Desktop vars
var dsktp = {};
function newDsktpIcon(id, owner, position, title, icon, action, actionArgs, ctxAction, ctxActionArgs, nosave) {
	if (!id) id = "uico_" + (new Date().getTime());
	if (!title) {
		title = apps[owner] ? apps[owner].appName : "Icon";
	}
	if (!icon) {
		if (apps[owner]) {
			icon = {
				...apps[owner].appWindow.appImg
			};
		} else {
			icon = {
				...apps.startMenu.appWindow.appImg
			};
		}
	}
	if (typeof icon === "string") {
		icon = { foreground: icon };
	}

	if (!action) {
		if (apps[owner]) {
			action = [
				'arg',
				'openapp(apps[arg], "dsktp");'
			];
			actionArgs = [owner];
		} else {
			action = [
				'apps.prompt.vars.alert("This icon has no assigned action.", "Okay.", function(){}, "");'
			];
			actionArgs = [];
		}
	}

	if (typeof action === "string") action = [action];
	if (!actionArgs) actionArgs = [];
	if (!ctxAction) {
		if (apps[owner]) {
			ctxAction = [
				'arg1', 'arg2',
				'ctxMenu(baseCtx.appXXX, 1, event, [event, arg1, arg2]);'
			]
			ctxActionArgs = [id, apps[owner].dsktpIcon];
		} else {
			ctxAction = [
				'arg1',
				'ctxMenu(baseCtx.appXXX, 1, event, [event, arg1, "site"]);'
			];
			ctxActionArgs = [id];
		}
	}

	if (typeof ctxAction === "string") ctxAction = [ctxAction];
	if (!ctxActionArgs) ctxActionArgs = [];
	dsktp[id] = {
		id: id,
		owner: owner,
		position: position,
		title: title,
		icon: icon,
		action: action,
		actionArgs: actionArgs || [],
		ctxAction: ctxAction,
		ctxActionArgs: ctxActionArgs || []
	};
	if (getId("app_" + id)) {
		getId("desktop").removeChild(getId("app_" + id));
	}
	let tempIco = document.createElement("div");
	tempIco.classList.add("app");
	tempIco.classList.add("cursorPointer");
	tempIco.classList.add("noselect");
	tempIco.id = "app_" + id;
	tempIco.setAttribute("data-icon-id", id);
	tempIco.setAttribute("onclick", 'Function(...dsktp[this.getAttribute("data-icon-id")].action)(...dsktp[this.getAttribute("data-icon-id")].actionArgs)');
	tempIco.setAttribute('oncontextmenu', 'Function(...dsktp[this.getAttribute("data-icon-id")].ctxAction)(...dsktp[this.getAttribute("data-icon-id")].ctxActionArgs)');
	tempIco.innerHTML = '<div class="appIcon" id="ico_' + id + '" style="pointer-events:none">' +
		buildSmartIcon(64, icon) +
		'</div>' +
		'<div class="appName" id="dsc_' + id + '">' + title + '</div>';
	getId("desktop").appendChild(tempIco);
	if (!nosave) {
		ufsave("system/desktop/user_icons/ico_" + id, JSON.stringify(dsktp[id]));
	}
	arrangeDesktopIcons();
}

function removeDsktpIcon(id, nosave) {
	if (dsktp[id]) {
		delete dsktp[id];
		getId("desktop").removeChild(getId("app_" + id));
		if (!nosave) {
			if (ufload("system/desktop/user_icons/ico_" + id)) {
				ufdel("system/desktop/user_icons/ico_" + id);
			} else {
				ufsave("system/desktop/user_icons/ico_" + id, JSON.stringify({
					"removed": "true",
					"id": id
				}));
			}
		}
		arrangeDesktopIcons();
	}
};

function arrangeDesktopIcons() {
	appTotal = 0;
	appPosX = 8;
	appPosY = 8;
	for (let ico in dsktp) {
		if (!dsktp[ico].position) {
			appTotal++;
			getId("app_" + ico).style.left = appPosX + "px";
			getId("app_" + ico).style.top = appPosY + "px";
			appPosY += 98;
			if (appPosY > parseInt(getId('monitor').style.height) - 138) {
				appPosY = 8;
				appPosX += 108;
			}
		} else {
			getId("app_" + ico).style.left = dsktp[ico].position[0] + "px";
			getId("app_" + ico).style.top = dsktp[ico].position[1] + "px";
		}
	}
}

var widgetsList = {};
FlowWidget();
NotificationsWidget();
TimeWidget();

// Text-editing functionality
function showEditContext(event) {
	textEditorTools.tempvar = currentSelection.length === 0 ? '-' : ' ';
	let canPasteHere = 0;
	if ((event.target.tagName === "INPUT" && (event.target.getAttribute("type") === "text" || event.target.getAttribute("type") === "password" || event.target.getAttribute("type") === null)) || event.target.tagName === "TEXTAREA") {
		canPasteHere = 1;
	}
	textEditorTools.tmpGenArray = [
		[event.pageX, event.pageY, "ctxMenu/happy.png"], textEditorTools.tempvar + "Speak \'" + currentSelection.substring(0, 5).split("\n").join(' ').split('<').join('&lt;').split('>').join('&gt;') + "...\'", "textspeech(\'" + currentSelection.split("\n").join('<br>').split('\\').join('\\\\').split('"').join("&quot;").split("'").join("&quot;").split('<').join('&lt;').split('>').join('&gt;') + "\');getId(\'ctxMenu\').style.display = \'none\'"
	];
	if (currentSelection.length === 0) {
		textEditorTools.tempvar = '-';
		textEditorTools.tempvar2 = '_';
	} else {
		textEditorTools.tempvar = ' ';
		textEditorTools.tempvar2 = '+';
	}
	textEditorTools.tmpGenArray.push(textEditorTools.tempvar2 + 'Copy (' + cleanStr(currentSelection.substring(0, 5)) + '...)');
	textEditorTools.tmpGenArray[0].push('ctxMenu/load.png');
	textEditorTools.tmpGenArray.push('textEditorTools.copy();getId(\'ctxMenu\').style.display = \'none\'');

	if (canPasteHere) {
		if (textEditorTools.clipboard.length === 0 || (typeof event.target.id !== "string" || event.target.id === "") || event.target.getAttribute("disabled") !== null) {
			textEditorTools.tmpGenArray.push(`_Paste (${cleanStr(textEditorTools.clipboard.substring(0, 5))}...)`);
			textEditorTools.tmpGenArray.push('');
		} else {
			textEditorTools.tmpGenArray.push(`+Paste (${cleanStr(textEditorTools.clipboard.substring(0, 5))}...)`);
			textEditorTools.tmpGenArray.push('textEditorTools.paste(\'' + event.target.id + '\', ' + event.target.selectionStart + ',' + event.target.selectionEnd + ');getId(\'ctxMenu\').style.display = \'none\'');
		}
		textEditorTools.tmpGenArray[0].push('ctxMenu/save.png');
	}
	textEditorTools.tempvar3 = currentSelection;
	ctxMenu(textEditorTools.tmpGenArray);
}

var textEditorTools = {
	tempvar: '',
	tempvar2: '',
	tempvar3: '',
	clipboard: "",
	tmpGenArray: [],
	copy: function () {
		this.clipboard = this.tempvar3;
		ufsave("system/clipboard", JSON.stringify(this.clipboard));
	},
	paste: function (element, cursorpos, endselect) {
		getId(element).value = getId(element).value.substring(0, cursorpos) + this.clipboard + getId(element).value.substring(endselect, getId(element).value.length);
	},
	swap: function (element, cursorpos) {
		var tempCopy = this.clipboard;
		this.clipboard = this.tempvar3;
		ufsave("system/clipboard", JSON.stringify(this.clipboard));
		getId(element).value = getId(element).value.substring(0, cursorpos) + tempCopy + getId(element).value.substring(cursorpos, getId(element).value.length);
	}
};

// Start menu
m('init DsB');
var codeToRun = [];

function c(code, args) {
	if (typeof code === 'function') {
		if (args) {
			codeToRun.push([code, args]);
		} else {
			codeToRun.push(code);
		}
	}
}

var workingcodetorun = [];
var finishedWaitingCodes = 0;
window.setInterval(checkWaitingCode, 0);

function checkWaitingCode() {
	if (codeToRun.length == 0) return;

	m('Running Waiting Code');
	workingcodetorun = codeToRun.shift();
	if (typeof workingcodetorun === 'function') {
		workingcodetorun();
	} else {
		workingcodetorun[0](workingcodetorun[1]);
	}

	finishedWaitingCodes++;
}

getId('loadingInfo').innerHTML = 'Applications List';
c(function() {
	Dashboard();
	getId('loadingInfo').innerHTML = 'NORAA';
});

c(function() {
	NORA();
	getId('loadingInfo').innerHTML = 'Info Viewer...';
});

c(function() {
	AppInfo();
	getId('loadingInfo').innerHTML = 'JavaScript Console';
});

var currentSelection = "";
function setCurrentSelection() {
	currentSelection = window.getSelection().toString();
	requestAnimationFrame(setCurrentSelection);
}

requestAnimationFrame(setCurrentSelection);
c(function() {
	JSConsole();
	getId('loadingInfo').innerHTML = 'Bash Console';
});

c(() => Bash());

c(function() {
	AppPrompt();
	getId('loadingInfo').innerHTML = 'Smart Icon Settings';
});

c(function() {
	SmartIconSettings();
	getId('loadingInfo').innerHTML = 'JS Paint';
})

c(function() {
	JSPaint();
	getId('loadingInfo').innerHTML = 'Properties Viewer';
});

c(function() {
	PropertiesViewer();
	getId('loadingInfo').innerHTML = 'File Manager';
});
c(function() {
	FileManager();
	getId('loadingInfo').innerHTML = 'Save Master';
});

c(function() {
	window.SRVRKEYWORD = window.SRVRKEYWORD || "";
	SaveMaster();
	getId('loadingInfo').innerHTML = 'Messaging';
});

c(function() {
	Messaging();
	getId('loadingInfo').innerHTML = 'Music Player';
});

c(function() {
	MusicPlayer();
	getId('loadingInfo').innerHTML = 'Old Site';
});

c(function() {
	OldSite();
	getId('loadingInfo').innerHTML = 'Help';
});

c(function() {
	Help();
	getId('loadingInfo').innerHTML = 'Accreditation';
});

c(function() {
	Accreditation();
	getId('loadingInfo').innerHTML = 'View Count';
});

c(function() {
	ViewCount();
	getId('loadingInfo').innerHTML = 'Finalizing...';
});

// Function to open apps
var currTopApp = '';
function toTop(appToNudge, dsktpClick) {
	if (!appToNudge) return;
	m('Moving App ' + appToNudge.dsktpIcon + ' to Top');
	currTopApp = '';
	if (dsktpClick !== 2) {
		for (var appLication in apps) {
			if (getId("win_" + apps[appLication].objName + "_top").style.zIndex !== "100") {
				getId("win_" + apps[appLication].objName + "_top").style.zIndex = parseInt(getId("win_" + apps[appLication].objName + "_top").style.zIndex, 10) - 1;
			}
			getId("win_" + apps[appLication].objName + "_cap").style.opacity = "1";
			getId("win_" + apps[appLication].objName + "_aero").style.opacity = "1";
			getId('icn_' + apps[appLication].objName).classList.remove('activeAppIcon');
		}
	}
	if (!dsktpClick) {
		if (appToNudge.appWindow.appIcon && getId("win_" + appToNudge.objName + "_top").style.opacity !== "1") {
			appToNudge.appWindow.openWindow();
		}
		if (getId("win_" + appToNudge.objName + "_top").style.zIndex !== "100") {
			getId("win_" + appToNudge.objName + "_top").style.zIndex = "90";
		}
		getId("win_" + appToNudge.objName + "_cap").style.opacity = "1";
		getId("win_" + appToNudge.objName + "_aero").style.opacity = "1";
		getId('icn_' + appToNudge.objName).classList.add('activeAppIcon');
		try {
			currTopApp = appToNudge.objName;
			document.title = appToNudge.appName + ' | ' + websiteTitle;
		} catch (err) {
			document.title = websiteTitle;
		}
	} else {
		document.title = websiteTitle;
	}
	if (appToNudge !== apps.startMenu && apps.startMenu.appWindow.appIcon) {
		apps.startMenu.signalHandler('shrink');
	}
	getId("ctxMenu").style.display = "none";

	if (appToNudge.dsktpIcon !== "CLOSING") {
		var tempAppsList = [];
		for (let appLication in apps) {
			if (getId("win_" + apps[appLication].objName + "_top").style.zIndex !== "100" && apps[appLication].appWindow.appIcon) {
				tempAppsList.push([appLication, getId("win_" + apps[appLication].objName + "_top").style.zIndex]);
			}
		}
		tempAppsList.sort(function (a, b) {
			return b[1] - a[1];
		});
		for (let i = 0; i < tempAppsList.length; i++) {
			getId("win_" + apps[tempAppsList[i][0]].objName + "_top").style.zIndex = 90 - i;
		}
	}
}

function openapp(appToOpen, launchTypeUsed) {
	if (!appToOpen) return;
	m('Opening App ' + appToOpen.dsktpIcon);
	if (appToOpen.launchTypes) {
		appToOpen.main(launchTypeUsed);
	} else {
		appToOpen.main();
	}
	toTop(appToOpen);
}

// Function to remove broken text warning
function fadeResizeText() {
	getId("timesUpdated").style.display = "none";
}

var icomoveSelect = "";
var icomovex = 0;
var icomovey = 0;
var icomoveOrX = 0;
var icomoveOrY = 0;

function icomove(e, elem) {
	if (elem) {
		getId("icomove").style.display = "block";
		icomoveSelect = "app_" + elem;
		icomovex = e.pageX;
		icomovey = e.pageY;
		icomoveOrX = parseInt(getId(icomoveSelect).style.left, 10);
		icomoveOrY = parseInt(getId(icomoveSelect).style.top, 10);
		toTop({
			dsktpIcon: 'DESKTOP'
		}, 1);
	} else {
		getId("icomove").style.display = "none";
		var newXCoord = icomoveOrX + (e.pageX - icomovex) * (1 / screenScale);
		var newYCoord = icomoveOrY + (e.pageY - icomovey) * (1 / screenScale);
		newXCoord = Math.round(newXCoord / 108) * 108 + 8;
		newYCoord = Math.round(newYCoord / 98) * 98 + 8;
		dsktp[icomoveSelect.substring(4)].position = [newXCoord, newYCoord];
		ufsave('system/desktop/user_icons/ico_' + icomoveSelect.substring(4), JSON.stringify(dsktp[icomoveSelect.substring(4)]));
		getId(icomoveSelect).style.left = newXCoord + "px";
		getId(icomoveSelect).style.top = newYCoord + "px";
	}
}

getId("icomove").addEventListener("click", icomove);
function icomoving(e) {
	getId(icomoveSelect).style.left = icomoveOrX + (e.pageX - icomovex) * (1 / screenScale) + "px";
	getId(icomoveSelect).style.top = icomoveOrY + (e.pageY - icomovey) * (1 / screenScale) + "px";
}

// Custom icons; TODO
function icnmove(e, elem) {
	if (elem) {
		getId("icnmove").style.display = "block";
		icomoveSelect = "app" + elem;
		icomovex = e.pageX;
		icomovey = e.pageY;
		icomoveOrX = parseInt(getId(icomoveSelect).style.left, 10);
		icomoveOrY = parseInt(getId(icomoveSelect).style.top, 10);
		toTop({
			dsktpIcon: 'DESKTOP'
		}, 1);
	} else {
		getId("icnmove").style.display = "none";
		var newXCoord = icomoveOrX + (e.pageX - icomovex) * (1 / screenScale);
		var newYCoord = icomoveOrY + (e.pageY - icomovey) * (1 / screenScale);
		newXCoord = Math.round(newXCoord / 108) * 108 + 8;
		newYCoord = Math.round(newYCoord / 98) * 98 + 8;
		getId(icomoveSelect).style.left = newXCoord + "px";
		getId(icomoveSelect).style.top = newYCoord + "px";
	}
}

getId("icnmove").addEventListener("click", icnmove);
function icnmoving(e) {
	getId(icomoveSelect).style.left = icomoveOrX + (e.pageX - icomovex) * (1 / screenScale) + "px";
	getId(icomoveSelect).style.top = icomoveOrY + (e.pageY - icomovey) * (1 / screenScale) + "px";
}

function scrollHorizontally(event) {
	this.scrollBy({
		left: event.deltaY,
		behavior: 'smooth'
	});
}
getId("icons").addEventListener("wheel", scrollHorizontally);

function highlightHide() {
	getId('windowFrameOverlay').style.display = 'none';
}

var ctxSetup = [
	[0, 0, "appicons/redx.png", "appicons/redx.png"],
	' Context', 'alert("Context Menu Not Correctly Initialized")',
	' Menu', 'alert("Context Menu Not Correctly Initialized")'
];
var newCtxSetup = [
	[' Context', function() {
		alert('context')
	}, 'appicons/redx.png'],
	[' Menu', function() {
		alert('menu')
	}, 'appicons/redx.png']
];
var newCtxCoord = [10, 10];
var newCtxArgs = [];
var ctxMenuImg = "";
var showingCtxMenu = 0;

function ctxMenu(setupArray, version, event, args) {
	m('Opening ctxMenu');
	if (version) {
		if (!showingCtxMenu) {
			showingCtxMenu = 1;
			requestAnimationFrame(function() {
				showingCtxMenu = 0;
			});
			newCtxCoord = [event.pageX * (1 / screenScale), event.pageY * (1 / screenScale)];
			newCtxArgs = args;
			newCtxSetup = setupArray;
			getId("ctxMenu").style.display = "block";
			if (newCtxCoord[0] > window.innerWidth * (1 / screenScale) / 2) {
				getId("ctxMenu").style.removeProperty("left");
				getId("ctxMenu").style.right = window.innerWidth * (1 / screenScale) - newCtxCoord[0] - 1 + "px";
			} else {
				getId("ctxMenu").style.removeProperty("right");
				getId("ctxMenu").style.left = newCtxCoord[0] + "px";
			}
			if (newCtxCoord[1] > window.innerHeight * (1 / screenScale) / 2) {
				getId("ctxMenu").style.removeProperty("top");
				getId("ctxMenu").style.bottom = window.innerHeight * (1 / screenScale) - newCtxCoord[1] - 1 + "px";
			} else {
				getId("ctxMenu").style.removeProperty("bottom");
				getId("ctxMenu").style.top = newCtxCoord[1] + "px";
			}
			getId("ctxMenu").innerHTML = "";
			var tempCtxContent = "";
			for (var i in newCtxSetup) {
				if (typeof newCtxSetup[i][0] === 'function') {
					if (newCtxSetup[i][0](newCtxArgs)[0] === '+' || newCtxSetup[i][0](newCtxArgs)[0] === '_') {
						tempCtxContent += '<hr>';
					}
					if (newCtxSetup[i][2]) {
						ctxMenuImg = '<img src="' + newCtxSetup[i][2] + '" style="width:10px; height:10px; margin-top:1px; margin-bottom:-2px; margin-left:1px;" onerror="this.style.marginLeft = \'0\';this.style.marginRight = \'1px\';this.src = \'ctxMenu/simple.png\'">';
					} else {
						ctxMenuImg = '<img src="ctxMenu/simple.png" style="width:10px; height:10px; margin-top:1px; margin-bottom:-2px; margin-right:1px">';
					}
					if (newCtxSetup[i][0](newCtxArgs)[0] === '-' || newCtxSetup[i][0](newCtxArgs)[0] === '_') {
						tempCtxContent += '<p class="hiddenCtxOption">' + ctxMenuImg + "&nbsp;" + newCtxSetup[i][0](newCtxArgs).substring(1, newCtxSetup[i][0](newCtxArgs).length) + '&nbsp;</p>';
					} else {
						tempCtxContent += '<p class="cursorPointer" onClick="newCtxSetup[' + i + '][1](newCtxArgs)">' + ctxMenuImg + "&nbsp;" + newCtxSetup[i][0](newCtxArgs).substring(1, newCtxSetup[i][0](newCtxArgs).length) + '&nbsp;</p>';
					}
				} else {
					if (newCtxSetup[i][0][0] === '+' || newCtxSetup[i][0][0] === '_') {
						tempCtxContent += '<hr>';
					}
					if (newCtxSetup[i][2]) {
						ctxMenuImg = '<img src="' + newCtxSetup[i][2] + '" style="width:10px; height:10px; margin-top:1px; margin-bottom:-2px; margin-left:1px;" onerror="this.style.marginLeft = \'0\';this.style.marginRight = \'1px\';this.src = \'ctxMenu/simple.png\'">';
					} else {
						ctxMenuImg = '<img src="ctxMenu/simple.png" style="width:10px; height:10px; margin-top:1px; margin-bottom:-2px; margin-right:1px">';
					}
					if (newCtxSetup[i][0][0] === '-' || newCtxSetup[i][0][0] === '_') {
						tempCtxContent += '<p class="hiddenCtxOption">' + ctxMenuImg + "&nbsp;" + newCtxSetup[i][0].substring(1, newCtxSetup[i][0].length) + '&nbsp;</p>';
					} else {
						tempCtxContent += '<p class="cursorPointer" onClick="newCtxSetup[' + i + '][1](newCtxArgs)">' + ctxMenuImg + "&nbsp;" + newCtxSetup[i][0].substring(1, newCtxSetup[i][0].length) + '&nbsp;</p>';
					}
				}
			}
			getId("ctxMenu").innerHTML = tempCtxContent;
		}
	} else {
		if (!showingCtxMenu) {
			showingCtxMenu = 1;
			requestAnimationFrame(function() {
				showingCtxMenu = 0;
			});
			ctxSetup = setupArray;
			getId("ctxMenu").style.display = "block";
			ctxSetup[0][0] *= (1 / screenScale);
			ctxSetup[0][1] *= (1 / screenScale);
			if (ctxSetup[0][0] > window.innerWidth * (1 / screenScale) / 2) {
				getId("ctxMenu").style.removeProperty("left");
				getId("ctxMenu").style.right = window.innerWidth * (1 / screenScale) - ctxSetup[0][0] - 1 + "px";
			} else {
				getId("ctxMenu").style.removeProperty("right");
				getId("ctxMenu").style.left = ctxSetup[0][0] + "px";
			}
			if (ctxSetup[0][1] > window.innerHeight * (1 / screenScale) / 2) {
				getId("ctxMenu").style.removeProperty("top");
				getId("ctxMenu").style.bottom = window.innerHeight * (1 / screenScale) - ctxSetup[0][1] - 1 + "px";
			} else {
				getId("ctxMenu").style.removeProperty("bottom");
				getId("ctxMenu").style.top = ctxSetup[0][1] + "px";
			}

			getId("ctxMenu").innerHTML = "";
			var tempCtxContent = "";

			// First char of name of element: + means new group | - means cannot click | _ means new group and cannot click
			for (var i = 1; i < ctxSetup.length - 1; i += 2) {
				if (i !== 1) {
					if (ctxSetup[i][0] === '+' || ctxSetup[i][0] === '_') {
						tempCtxContent += '<hr>';
					}
				}
				if (ctxSetup[0][2]) {
					ctxMenuImg = '<img src="' + ctxSetup[0][Math.floor(i / 2) + 2] + '" style="width:10px; height:10px; margin-top:1px; margin-bottom:-2px; margin-left:1px;" onerror="this.style.marginLeft = \'0\';this.style.marginRight = \'1px\';this.src = \'ctxMenu/simple.png\'">';
				} else {
					ctxMenuImg = '<img src="ctxMenu/simple.png" style="width:10px; height:10px; margin-top:1px; margin-bottom:-2px; margin-right:1px">';
				}
				if (ctxSetup[i][0] === '-' || ctxSetup[i][0] === '_') {
					tempCtxContent += '<p class="hiddenCtxOption">' + ctxMenuImg + "&nbsp;" + ctxSetup[i].substring(1, ctxSetup[i].length) + '&nbsp;</p>';
				} else {
					tempCtxContent += '<p class="cursorPointer" onClick="' + ctxSetup[i + 1] + '">' + ctxMenuImg + "&nbsp;" + ctxSetup[i].substring(1, ctxSetup[i].length) + '&nbsp;</p>';
				}
			}
			getId("ctxMenu").innerHTML = tempCtxContent;
		}
	}
}

var baseCtx = {
	hideall: [
		/*[' Settings', function() {
			openapp(apps.settings, 'dsktp');
		}, 'ctxMenu/gear.png'],*/
		[' JavaScript Console', function() {
			openapp(apps.jsConsole, 'dsktp');
		}, 'ctxMenu/console.png'],
		['+Change Screen Resolution', function() {
			openapp(apps.settings, 'dsktp');
		}, 'ctxMenu/gear.png']
	],
	desktop: [
		/*[' Settings', function() {
			openapp(apps.settings, 'dsktp');
		}, 'ctxMenu/gear.png'],*/
		[' JavaScript Console', function() {
			openapp(apps.jsConsole, 'dsktp');
		}, 'ctxMenu/console.png'],
		[function() {
			return '+Speak' + ' "' + currentSelection.substring(0, 5) + '..."'
		}, function() {
			textspeech(currentSelection);
		}, 'ctxMenu/happy.png']
	],
	taskbar: [
		/*[' Settings', function() {
			openapp(apps.settings, 'dsktp');
		}, 'ctxMenu/gear.png'],*/
		[' JavaScript Console', function() {
			openapp(apps.jsConsole, 'dsktp');
		}, 'ctxMenu/console.png'],
		/*['+Taskbar Settings', function() {
			openapp(apps.settings, 'dsktp');
		}, 'ctxMenu/gear.png']*/
	],
	appXXX: [
		[' Open', function (args) {
			openapp(apps[args[1]], 'dsktp');
		}, 'ctxMenu/window.png'],
		['+Move Icon', function (args) {
			icomove(args[0], args[1]);
		}],
		['+Delete Icon', function (args) {
			removeDsktpIcon(args[1]);
		}, 'ctxMenu/x.png']
	],
	appXXXjs: [
		[' Execute', function (args) {
			Function(...dsktp[args[1]].action)(...dsktp[args[1]].actionArgs);
		}, 'ctxMenu/window.png'],
		['+Move Icon', function (args) {
			icomove(args[0], args[1]);
		}],
		['+Delete Icon', function (args) {
			removeDsktpIcon(args[1]);
		}, 'ctxMenu/x.png']
	],
	icnXXX: [
		[function (arg) {
			if (apps[arg].appWindow.appIcon) {
				return ' Show';
			} else {
				return ' Open';
			}
		}, function (arg) {
			if (apps[arg].appWindow.appIcon) {
				openapp(apps[arg], 'tskbr');
			} else {
				openapp(apps[arg], 'dsktp');
			}
		}, 'ctxMenu/window.png'],
		[function (arg) {
			if (apps[arg].appWindow.appIcon) {
				return ' Hide';
			} else {
				return '-Hide';
			}
		}, function (arg) {
			apps[arg].signalHandler('shrink');
		}, 'ctxMenu/minimize.png'],
		[function (arg) {
			if (pinnedApps.indexOf(arg) === -1) {
				return '+Pin App';
			} else {
				return '+Unpin App';
			}
		}, function (arg) {
			pinApp(arg);
			if (pinnedApps.indexOf(arg) === -1 && !apps[arg].appWindow.appIcon) {
				getId('icn_' + arg).style.display = 'none';
			}
		}, 'ctxMenu/minimize.png'],
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
		}, 'ctxMenu/add.png'],
		[function (arg) {
			if (dsktp[arg]) {
				return ' Remove Desktop Icon';
			} else {
				return '-Remove Desktop Icon';
			}
		}, function (arg) {
			if (dsktp[arg]) {
				removeDsktpIcon(arg);
			} else {
				newDsktpIcon(arg, arg);
			}
		}, 'ctxMenu/x.png'],
		['+Close', function (arg) {
			apps[arg].signalHandler('close');
		}, 'ctxMenu/x.png']
	],
	winXXXc: [
		[' About This App', function (arg) {
			openapp(apps.appInfo, arg);
		}, 'ctxMenu/file.png'],
		['+Fold', function (arg) {
			apps[arg].appWindow.foldWindow();
		}, 'ctxMenu/less.png'],
		['+Hide', function (arg) {
			apps[arg].signalHandler('shrink');
		}, 'ctxMenu/minimize.png'],
		[' Fullscreen', function (arg) {
			apps[arg].appWindow.toggleFullscreen();
			toTop(apps[arg]);
		}, 'ctxMenu/add.png'],
		[' Close', function (arg) {
			apps[arg].signalHandler('close');
		}, 'ctxMenu/x.png'],
		[function (arg) {
			if (apps[arg].appWindow.onTop === 0) {
				return '+Stay On Top';
			} else {
				return '_Stay On Top';
			}
		}, function (arg) {
			apps[arg].appWindow.alwaysOnTop(1);
		}, 'ctxMenu/add.png'],
		[function (arg) {
			if (apps[arg].appWindow.onTop === 1) {
				return ' Stay On Top';
			} else {
				return '-Stay On Top';
			}
		}, function (arg) {
			apps[arg].appWindow.alwaysOnTop(0);
		}, 'ctxMenu/less.png']
	]
};
getId("hideall").setAttribute('oncontextmenu', 'ctxMenu(baseCtx.hideall, 1, event);');
getId("taskbar").setAttribute('oncontextmenu', 'ctxMenu(baseCtx.taskbar, 1, event);');
getId("monitor").setAttribute('oncontextmenu', 'if(event.target !== getId("ctxMenu")){return false}');

var flowMode = 0;
function exitFlowMode() {
	if (getId("monitor").classList.contains('flowDesktop')) {
		getId("monitor").classList.remove('flowDesktop');
	}
	flowMode = 0;
}

function enterFlowMode() {
	if (!getId("monitor").classList.contains('flowDesktop')) {
		getId("monitor").classList.add('flowDesktop');
		getId("desktop").scrollTop = 0;
	}
	flowMode = 1;
}

function toggleFlowMode() {
	if (flowMode) {
		if (getId("monitor").classList.contains('flowDesktop')) {
			getId("monitor").classList.remove('flowDesktop');
		}
		flowMode = 0;
	} else {
		if (!getId("monitor").classList.contains('flowDesktop')) {
			getId("monitor").classList.add('flowDesktop');
			getId("desktop").scrollTop = 0;
		}
		flowMode = 1;
	}
}

var sessionStorageSupported = 1;
try {
	if (typeof sessionStorage === "undefined") {
		sessionStorage = {
			getItem: function() {
				return false
			},
			setItem: function() {
				return false
			},
			removeItem: function() {
				return false
			}
		};
		sessionStorageSupported = 0;
	}
} catch (err) {
	sessionStorage = {
		getItem: function() {
			return false
		},
		setItem: function() {
			return false
		},
		removeItem: function() {
			return false
		}
	};
	sessionStorageSupported = 0;
}
var localStorageSupported = 1;
try {
	if (typeof localStorage === "undefined") {
		localStorage = {
			getItem: function() {
				return false
			},
			setItem: function() {
				return false
			},
			removeItem: function() {
				return false
			}
		};
		localStorageSupported = 0;
	}
} catch (err) {
	localStorage = {
		getItem: function() {
			return false
		},
		setItem: function() {
			return false
		},
		removeItem: function() {
			return false
		}
	};
	localStorageSupported = 0;
}
fitWindow();
fadeResizeText();

// Set up LOCALFILES
window.LOCALFILES = {};
window.lfsave = function (file, content) {
	sh("mkdir /LOCALFILES/" + file);
	eval(apps.bash.vars.translateDir('/LOCALFILES/' + file) + ' = content');
};
window.lfload = function (file, debug) {
	try {
		if (debug) {
			doLog("lfload " + file + ":", '#ABCDEF');
			doLog(apps.bash.vars.getRealDir('/LOCALFILES/' + file), '#ABCDEF');
		}
		return apps.bash.vars.getRealDir('/LOCALFILES/' + file);
	} catch (err) {
		if (debug) {
			doLog(err, '#FFCDEF');
		}
		return null;
	}
};
window.lfmkdir = function (dirname) {
	sh("mkdir /LOCALFILES/" + dirname);
};
window.lfdel = function (filename) {
	eval("delete " + apps.bash.vars.translateDir("/LOCALFILES/" + filename));
};

// Auto-resize display on window change
window.addEventListener('resize', fitWindowIfPermitted);
var monMouseEvent = {};
function monMouseCheck() {
	try {
		if (typeof document.elementFromPoint(monMouseEvent.pageX, monMouseEvent.pageY).oncontextmenu === 'function') {
			document.elementFromPoint(monMouseEvent.pageX, monMouseEvent.pageY).oncontextmenu(monMouseEvent);
		} else if (typeof document.elementFromPoint(monMouseEvent.pageX, monMouseEvent.pageY).oncontextmenu === 'string') {
			eval(document.elementFromPoint(monMouseEvent.pageX, monMouseEvent.pageY).oncontextmenu);
		} else {
			doLog('Failed to find ctxmenu on ' + vartry('document.elementFromPoint(monMouseEvent.pageX, monMouseEvent.pageY).id'));
		}
	} catch (err) {
		doLog('Failed to open ctxmenu on ' + vartry('document.elementFromPoint(monMouseEvent.pageX, monMouseEvent.pageY).id'));
	}
}

var keepingAwake = false;

// Set up service worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('serviceworker.js').then(function (registration) {

		}, function (err) {
			try {
				doLog('ServiceWorker registration failed: ' + err, '#F00');
			} catch (err2) {
				console.log('ServiceWorker registration failed: ' + err);
			}
		});
	});
}

c(function() {
	getId('loadingInfo').innerHTML = 'Loading your files...';
	getId('isLoading').classList.remove('cursorLoadLight');
	getId('isLoading').classList.add('cursorLoadDark');

	initStatus = 1;
	doLog('Took ' + (perfCheck('masterInit') / 1000) + 'ms to initialize.');
	perfStart("masterInit");
});

var bootFileHTTP = new XMLHttpRequest();
bootFileHTTP.onreadystatechange = function() {
	if (bootFileHTTP.readyState === 4) {
		if (bootFileHTTP.status === 200) {
			USERFILES = JSON.parse(bootFileHTTP.responseText);
			if (USERFILES === null) USERFILES = {};
		} else {
			alert("Failed to fetch your files. Web error " + bootFileHTTP.status);
		}

		doLog('Took ' + (perfCheck('masterInit') / 1000) + 'ms to fetch USERFILES.');
		perfStart("masterInit");
		m("init fileloader");
		getId("loadingInfo").innerHTML += "<br>Your OS key is " + SRVRKEYWORD;
		for (let app in apps) {
			getId("loadingInfo").innerHTML = "Loading your files...<br>Loading " + app;
			try {
				apps[app].signalHandler("USERFILES_DONE");
			} catch (err) {
				alert("Error initializing " + app + ":\n\n" + err);
			}
		}

		try {
			updateBgSize();
		} catch (err) {}

		requestAnimationFrame(function() {
			bootFileHTTP = null;
		});
		doLog('Took ' + (perfCheck('masterInit') / 1000) + 'ms to run startup apps.');
		doLog('Took ' + Math.round(performance.now() * 10) / 10 + 'ms grand total to reach desktop.');
		doLog(" ");
	}
};

c(function() {
	USERFILES = {};
	doLog('Took ' + (perfCheck('masterInit') / 1000) + 'ms to fetch USERFILES.');
	perfStart("masterInit");
	m("init fileloader");
	getId("loadingInfo").innerHTML += "<br>Your OS key is " + SRVRKEYWORD;
	for (let app in apps) {
		getId("loadingInfo").innerHTML = "Loading your files...<br>Your OS key is" + SRVRKEYWORD + "<br>Loading " + app;
		try {
			apps[app].signalHandler("USERFILES_DONE");
		} catch (err) {
			alert("Error initializing " + app + ":\n\n" + err);
		}
	}

	try {
		updateBgSize();
	} catch (err) {}
	requestAnimationFrame(function() {
		bootFileHTTP = null;
	});
	doLog('Took ' + (perfCheck('masterInit') / 1000) + 'ms to exec USERFILES_DONE.');
	doLog('Took ' + Math.round(performance.now() * 10) / 10 + 'ms grand total to reach desktop.');
});

c(function() {
	window.iframeblurcheck = function() {
		try {
			if (document.activeElement.getAttribute("data-parent-app")) {
				if (currTopApp !== document.activeElement.getAttribute("data-parent-app")) {
					toTop(apps[document.activeElement.getAttribute("data-parent-app")]);
				}
			}
		} catch (err) {}
	};

	setInterval(iframeblurcheck, 500);
	addEventListener("blur", iframeblurcheck);
});

window.resetOS = function() {
	// TODO: Call this somewhere
	document.cookie = 'keyword=; Max-Age=-99999999;';
	window.location = 'index.php';
};

window.shutDown = function (arg, logout) {
	getId('isLoading').style.opacity = '0';
	getId('loadingBg').style.opacity = '0';
	getId('isLoading').style.transition = '1s';
	getId('isLoading').style.display = 'block';
	getId('loadingBg').style.display = 'block';
	window.shutDownPercentComplete = 0;
	window.shutDownTotalPercent = 1;
	getId('isLoading').classList.remove('cursorLoadDark');
	getId('isLoading').classList.add('cursorLoadLight');
	
	if (arg === 'restart') {
		getId('isLoading').innerHTML = `<div id="isLoadingDiv"><h1>Restarting ${websiteTitle}</h1><hr><div id="loadingInfoDiv"><div id="loadingInfo" class="liveElement" data-live-eval="shutDownPercentComplete / shutDownTotalPercent * 100 + \'%\'" data-live-target="style.width">Shutting down...</div></div></div>`;
		requestAnimationFrame(function() {
			getId('isLoading').style.opacity = '1';
			getId('loadingBg').style.opacity = '1';
		});
		window.setTimeout(function() {
			getId('isLoading').classList.remove('cursorLoadLight');
			getId('isLoading').classList.add('cursorLoadDark');
			shutDownPercentComplete = codeToRun.length;
			for (let app in apps) {
				c(function (args) {
					m('THERE WAS AN ERROR SHUTTING DOWN THE APP ' + args + '. SHUTDOWN SHOULD CONTINUE WITH NO ISSUE.');
					shutDownPercentComplete++;
					apps[args].signalHandler('shutdown');
				}, app);
			}
			shutDownTotalPercent = codeToRun.length - shutDownPercentComplete;
			shutDownPercentComplete = 0;
			c(function() {
				getId('isLoading').innerHTML = `<div id="isLoadingDiv"><h1>Restarting ${websiteTitle}</h1><hr><div id="loadingInfoDiv"><div id="loadingInfo" class="liveElement" data-live-eval="shutDownPercentComplete / shutDownTotalPercent * 100 + \'%\'" data-live-target="style.width">Goodbye!</div></div></div>`;
				if (logout) {
					document.cookie = "logintoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
				}
				window.location = 'blackScreen.html';
			});
		}, 1005);
	} else {
		getId('isLoading').innerHTML = `<div id="isLoadingDiv"><h1>Shutting Down ${websiteTitle}</h1><hr><div id="loadingInfoDiv"><div id="loadingInfo" class="liveElement" data-live-eval="shutDownPercentComplete / shutDownTotalPercent * 100 + \'%\'" data-live-target="style.width">Shutting down...</div></div></div>`;
		requestAnimationFrame(function() {
			getId('isLoading').style.opacity = '1';
			getId('loadingBg').style.opacity = '1';
		});
		window.setTimeout(function() {
			getId('isLoading').classList.remove('cursorLoadLight');
			getId('isLoading').classList.add('cursorLoadDark');
			shutDownPercentComplete = codeToRun.length;
			for (let app in apps) {
				c(function (args) {
					m('THERE WAS AN ERROR SHUTTING DOWN THE APP ' + args + '. SHUTDOWN SHOULD CONTINUE WITH NO ISSUE.');
					shutDownPercentComplete++;
					apps[args].signalHandler('shutdown');
				}, app);
			}
			shutDownTotalPercent = codeToRun.length - shutDownPercentComplete;
			shutDownPercentComplete = 0;
			c(function() {
				getId('isLoading').innerHTML = `<div id="isLoadingDiv"><h1>Shutting Down ${websiteTitle}</h1><hr><div id="loadingInfoDiv"><div id="loadingInfo" class="liveElement" data-live-eval="shutDownPercentComplete / shutDownTotalPercent * 100 + \'%\'" data-live-target="style.width">Goodbye!</div></div></div>`;
				if (logout) {
					document.cookie = "logintoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
				}
				window.location = 'blackScreen.html';
			});
		}, 1005);
	}
};

// Open apps on startup
c(function() {
	//openapp(apps.accreditation, 'dsktp');
	//openapp(apps.viewCount, 'dsktp');
	//openapp(apps.musicPlayer, 'dsktp');
});