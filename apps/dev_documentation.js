const DeveloperDocumentation = () => {

apps.devDocumentation = new Application({
	title: "Developer Documentation",
	abbreviation: "DD",
	codeName: "devDocumentation",
	image: {
		backgroundColor: "#303947",
		foreground: "smarticons/aOS/fg.png",
		backgroundBorder: {
			thickness: 2,
			color: "#252F3A"
		}
	},
	hideApp: 0,
	main: function() {
		if (!this.appWindow.appIcon) {
			this.appWindow.paddingMode(0);
			this.appWindow.setContent('<iframe data-parent-app="devDocumentation" id="DDframe" style="border:none; display:block; width:100%; height:100%; overflow:hidden;" src="documentation/"></iframe>');
			getId("icn_devDocumentation").style.display = "inline-block";
			requestAnimationFrame(() => {
				this.appWindow.appIcon = 1;
			});
		}
		this.appWindow.setCaption('Developer Documentation');
		this.appWindow.setDims("auto", "auto", 1000, 600);
		if (this.appWindow.appIcon) {
			this.appWindow.openWindow();
		}
	},
	vars: {
		appInfo: '',
	}
});

} // End initial variable declaration