const Messaging = () => {

apps.messaging = new Application({
	title: "Messaging",
	abbreviation: "MSG",
	codeName: "messaging",
	desc: "Message me directly if you would like to connect!",
	image: "smarticons/messaging/fg.png",
	hideApp: 0,
	launchTypes: 1,
	main: function (launchType) {
		if (!this.appWindow.appIcon) {
			this.appWindow.paddingMode(0);
			this.appWindow.setDims("auto", "auto", 400, 325);
		}

		// TODO: Custom tooltips
		this.appWindow.setCaption('Messaging');
		this.appWindow.setContent('<div id="messagingDisplay"></div>');
		this.appWindow.openWindow();

		// Get the contents of messaging.html and load into the window
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				let elmnt = document.getElementById('messagingDisplay');
				if (this.status == 200) {elmnt.innerHTML = this.responseText;}
			}
		}
		xhttp.open("GET", "./apps/messaging.php", true);
		xhttp.send();
	},
	vars: {
		appInfo: 'Message me directly if you would like to connect!'
	}
});

} // End initial variable declaration