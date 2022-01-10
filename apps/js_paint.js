const JSPaint = () => {

apps.jsPaint = new Application({
	title: "JS Paint",
	abbreviation: "jsP",
	codeName: "jsPaint",
	image: "appicons/CSE.png",
	hideApp: 0,
	main: function() {
		this.appWindow.setDims("auto", "auto", 753, 507);
		this.appWindow.paddingMode(0);
		this.appWindow.setContent(`
			<iframe
				data-parent-app="jsPaint"
				id="jsPframe"
				src="https://jspaint.app/"
				style="width:100%;height:100%;border:none;"
			></iframe>
		`);
		
		getId("icn_jsPaint").style.display = "inline-block";
		this.appWindow.setCaption("JS Paint");
		this.appWindow.openWindow();
	}
});

} // End initial variable declaration