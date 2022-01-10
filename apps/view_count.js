const ViewCount = () => {

apps.viewCount = new Application({
	title: "View Counter",
	abbreviation: "vwC",
	codeName: "viewCount",
	image: 'appicons/systemApp.png',
	hideApp: 0,
	resizeable: false,
	main: function(launchtype) {
		const margins = 15;
		const size = 250;
		const x = parseInt(getId("desktop").style.width) - size - margins;
		const y = parseInt(getId("desktop").style.height) - size - margins;
		this.appWindow.setDims(x, y, size, size);

		this.appWindow.paddingMode(0);
		this.appWindow.setContent(`
			<iframe
				data-parent-app="viewCount"
				id="VWcframe"
				src="./ViewCount/index.php"
			></iframe>
		`);
		getId("icn_viewCount").style.display = "inline-block";
		this.appWindow.setCaption("View Counter");
		this.appWindow.openWindow();
	}
});

} // End initial variable declaration