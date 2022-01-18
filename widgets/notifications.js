const NotificationsWidget = () => {
	widgets.notifications = new Widget(
		"Notifications",
		"notifications",
		function () {
			if (apps.prompt.vars.notifsVisible) {
				apps.prompt.vars.hideNotifs();
			} else {
				apps.prompt.vars.checkNotifs();
			}
			if (apps.prompt.vars.lastNotifsFound.length === 0) {
				widgetMenu(
					"Notifications",
					"You have no notifications waiting.<br><br>New notifications will show automatically."
				);
			}
		},
		function () {
			// Startup func
			widgets.notifications.running = 1;
			getId("widget_notifications").style.paddingLeft = "6px";
			getId("widget_notifications").style.paddingRight = "6px";
			getId("widget_notifications").style.lineHeight = "26px";
			widgets.notifications.frame();
		},
		function () {
			// Frame func
			if (!widgets.notifications.running) return;

			requestAnimationFrame(widgets.notifications.frame);
			const notifCount = apps.prompt.vars.lastNotifsFound.length;
			if (
				notifCount + ":" + apps.prompt.vars.notifsVisible ==
				widgets.notifications.vars.lastDisplay
			) {
				return;
			}

			if (notifCount === 0) {
				getId("widget_notifications").innerHTML =
					'<img style="width:10px;filter:invert(1) brightness(1.5) drop-shadow(0px 0px 1px #000);" src="ctxMenu/popup.png">';
			} else if (apps.prompt.vars.notifsVisible) {
				getId("widget_notifications").innerHTML =
					'<img style="width:10px;filter:invert(1) brightness(1.5) drop-shadow(0px 0px 1px #000);" src="ctxMenu/message.png">';
			} else {
				getId("widget_notifications").innerHTML =
					'<img style="width:10px;filter:invert(1) brightness(1.5) drop-shadow(0px 0px 1px #000);" src="ctxMenu/notification.png">';
			}

			widgets.notifications.vars.lastDisplay =
				notifCount + ":" + apps.prompt.vars.notifsVisible;
		},
		function () {
			// Disable func
			widgets.notifications.vars.running = 0;
		},
		{
			// Vars
			running: 0,
			lastDisplay: [],
		}
	);
}; // End initial variable declaration
