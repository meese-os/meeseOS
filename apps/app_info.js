const AppInfo = () => {

apps.appInfo = new Application({
	title: "Application Info Viewer",
	abbreviation: "Nfo",
	codeName: "appInfo",
	image: 'appicons/systemApp.png',
	hideApp: 2,
	launchTypes: 1,
	main: function (launchtype) {
		if (launchtype === 'dsktp') {
			openapp(apps.appInfo, 'appInfo');
		} else if (launchtype !== 'tskbr') {
			this.appWindow.setDims("auto", "auto", 400, 500);
			getId('win_appInfo_html').style.overflowY = 'auto';
			try {
				this.appWindow.setCaption('App Info: ' + apps[launchtype].appName);
				this.appWindow.setContent(
					'<div style="font-size:12px;font-family:W95FA, monospace;top:0;right:0;color:#7F7F7F">' + apps[launchtype].dsktpIcon + '</div>' +
					'<div style="font-size:12px;font-family:W95FA, monospace;top:0;left:0;color:#7F7F7F">' + launchtype + '</div>' +
					buildSmartIcon(256, apps[launchtype].appWindow.appImg, 'margin-left:calc(50% - 128px);margin-top:16px;') +
					'<h1 style="text-align:center;">' + apps[launchtype].appName + '</h1>' +
					'<hr>' + (apps[launchtype].vars.appInfo || "There is no help page for this app.")
				);
			} catch (e) {
				apps.prompt.vars.alert('There was an error generating the information for app ' + launchtype + '.', 'OK', function() {
					apps.appInfo.signalHandler('close')
				}, 'App Info Viewer');
			}
		}
		this.appWindow.openWindow();
	},
	vars: {
		appInfo: 'This app is used to show information and help pages for applications.'
	}
});

} // End initial variable declaration