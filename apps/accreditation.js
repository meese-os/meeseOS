const Accreditation = () => {
	apps.accreditation = new Application({
		title: "Accreditation",
		abbreviation: "aDN",
		codeName: "accreditation",
		desc: "Gives props to the awesome people that helped make this website possible :)",
		image: "smarticons/accreditation/fg.png",
		hideApp: 0,
		main: function () {
			const margins = 15;
			const width = 275;
			const height = 400;
			const x = parseInt(getId("desktop").style.width) - width - margins;

			this.appWindow.setCaption("Accreditation");
			if (!this.appWindow.appIcon) {
				this.appWindow.alwaysOnTop(1);
				this.appWindow.paddingMode(0);
				this.appWindow.setDims(x, margins, width, height);
				this.appWindow.setContent('<div id="accreditationDisplay"></div>');
				this.appWindow.alwaysOnTop(1);
			}
			this.appWindow.openWindow();

			// Get the contents of accreditation.html and load into the window
			const xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4) {
					const elmnt = document.getElementById("accreditationDisplay");
					if (this.status == 200) {
						elmnt.innerHTML = this.responseText;
					}
				}
			};
			xhttp.open("GET", "./apps/accreditation.html", true);
			xhttp.send();
		},
	});
}; // End initial variable declaration
