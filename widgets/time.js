const TimeWidget = () => {

// TODO: MAKE THIS UPDATE EVERY SECOND
widgets.time = new Widget(
	'Time', // title
	'time', // name in widgets object
	function() { // onclick function
		var currentTime = (new Date().getTime() - bootTime);
		var currentDays = Math.floor(currentTime / 86400000);
		currentTime -= currentDays * 86400000;
		var currentHours = Math.floor(currentTime / 3600000);
		currentTime -= currentHours * 3600000;
		var currentMinutes = Math.floor(currentTime / 60000);
		currentTime -= currentMinutes * 60000;
		var currentSeconds = Math.floor(currentTime / 1000);
		widgetMenu('Time Widget', `${websiteTitle} has been running for:<br>${currentDays} days, ${currentHours} hours, ${currentMinutes} minutes, and ${currentSeconds} seconds.`);
	},
	function() { // start function
		widgets.time.vars.running = 1;
		widgets.time.frame();
	},
	function() { // frame function (this.vars.frame())
		if (widgets.time.vars.running) {
			if (String(new Date()) !== widgets.time.vars.lastTime) {
				getId('widget_time').innerHTML = '<div id="compactTime">' + formDate("M-/D-/y") + '<br>' + formDate("h-:m-:S") + '</div>';
				widgets.time.vars.lastTime = String(new Date());
			}
			requestAnimationFrame(widgets.time.frame);
		}
	},
	function() { // stop/cleanup function
		widgets.time.vars.running = 0;
	}, {
		running: 0,
		lastTime: String(new Date())
	}
);

} // End initial variable declaration