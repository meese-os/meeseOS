const FlowWidget = () => {
	widgets.flow = new Widget(
		"Flow Mode",
		"flow",
		function () {
			toggleFlowMode();
		},
		function () {
			getId("widget_flow").innerHTML = "~";
			getId("widget_flow").style.lineHeight = "150%";
			getId("widget_flow").style.paddingLeft = "6px";
			getId("widget_flow").style.paddingRight = "6px";
		},
		function () {},
		function () {},
		{}
	);
}; // End initial variable declaration
