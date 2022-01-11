<?php ob_start(); ?>
<!DOCTYPE html>
<html>

<head>
	<title>Loading...</title>
	<?php
		echo '<link rel="stylesheet" type="text/css" href="style.css?ms='.round(microtime(true) * 1000).'">';
	?>

	<link rel="icon" href="favicon.png" type="image/x-icon">
	<style id="smartIconStyle"></style>
	<link rel="stylesheet" type="text/css" href="win95.css">
</head>

<body id="pagebody">
	<!-- helps JS find scrollbar stuff -->
	<div id="findScrollSize"></div>

	<!-- computer screen and content inside on startup -->
	<div id="monitor" class="cursorDefault">
		<div id="desktop" onclick="try{exitFlowMode()}catch(err){}" oncontextmenu="showEditContext(event)">
			<div id="hideall" onClick="toTop({dsktpIcon: 'DESKTOP'}, 1)"></div>
			<p id="timesUpdated">Oops!</p>
			<div id="widgetMenu" class="darkResponsive noselect">
				<div id="widgetTitle"></div>
				<div id="widgetContent" class="canselect"></div>
				<div class="winExit cursorPointer" onClick="closeWidgetMenu()">x</div>
			</div>
			<div id="notifContainer">
				<div id="notifications">

				</div>
			</div>
		</div>
		
		<div id="winmove" class="cursorOpenHand" onmouseup="winmove(event)" onmousemove="winmoving(event)"></div>
		<div id="icomove" class="cursorOpenHand" onclick="icomove(event)" onmousemove="icomoving(event)"></div>
		<div id="icnmove" class="cursorOpenHand" onclick="icnmove(event)" onmousemove="icnmoving(event)"></div>
		<div id="winres" class="cursorOpenHand" onmouseup="winres(event)" onmousemove="winresing(event)"></div>
		<div id="windowFrameOverlay"></div>
		<div id="taskbar" class="noselect">
			<div id="tskbrAero" class="winAero"></div>
			<div id="tskbrBimg" class="winBimg"></div>
			<div id="time"></div>
			<div id="icons">Loading, please wait...</div>
		</div>
		<div id="ctxMenu" onclick="getId('ctxMenu').style.display='none'" class="backdropFilterCtxMenu noselect"></div>
		<?php
			// TODO: This is where I can store the options for the terminal vs the desktop
			if (file_get_contents('USERFILES/'.$_COOKIE['keyword'].'/system/apps/settings/ugly_boot.txt') == '1') {
				// TODO: Test without background image code
				echo '<div id="loadingBg" style="background-image:url('.file_get_contents('USERFILES/'.$_COOKIE['keyword'].'/system/desktop/background_image.txt').');opacity:0"></div><script defer>requestAnimationFrame(function(){getId("desktop").style.display = "";getId("taskbar").style.display = "";});</script>';
			} else {
				echo '<div id="loadingBg" style="background-image:url('.file_get_contents('USERFILES/'.$_COOKIE['keyword'].'/system/desktop/background_image.txt').');"></div>';
			}
		?>
		<div id="isLoading" class="cursorLoadDark">
			<div
				data-lettercrap-text="Aaron Meese"
				data-lettercrap-aspect-ratio="0.3"
			></div>
			<hr id="loadingSeparator" />

			<h1>MeeseOS</h1>
			<div id="loadingBarDiv">
				<div id="loadingBar" class="liveElement"
					data-live-eval="currentQuip / quips.length * 100 + '%'" data-live-target="style.width">
					<!-- TODO: Make this transition smoother;
						- https://github.com/lucagez/bars
						- https://codepen.io/avstorm/pen/abdajMB
						- https://kimmobrunfeldt.github.io/progressbar.js/
						- https://loading.io/progress/
						- https://codepen.io/sleek-geek/pen/LVVEMY
					-->
					Initializing...
				</div>
			</div>
		</div>
	</div>
	<img id="bgSizeElement" src="images/background.jpg" onload="try{updateBgSize()}catch(err){}">
	<?php include "updateViewCounter.php"; ?>
</body>

<?php
	// Scripts down here to guarantee availability of DOM elements
	echo '<script src="ghostCursor.js"></script>';
	echo '<script src="lettercrap.js"></script>';

	echo '<script src="./helperFunctions.js"></script>';
	echo '<script src="./dateFunctions.js"></script>';
	echo '<script src="./smartIconFunctions.js"></script>';
	echo '<script src="./widgetFunctions.js"></script>';
	echo '<script src="./windowFunctions.js"></script>';

	echo '<script src="./widgets/flow.js"></script>';
	echo '<script src="./widgets/notifications.js"></script>';
	echo '<script src="./widgets/time.js"></script>';

	echo '<script src="./apps/accreditation.js"></script>';
	echo '<script src="./apps/app_info.js"></script>';
	echo '<script src="./apps/app_prompt.js"></script>';
	echo '<script src="./apps/bash.js"></script>';
	echo '<script src="./apps/dashboard.js"></script>';
	echo '<script src="./apps/file_manager.js"></script>';
	echo '<script src="./apps/help.js"></script>';
	echo '<script src="./apps/js_console.js"></script>';
	echo '<script src="./apps/js_paint.js"></script>';
	echo '<script src="./apps/messaging.js"></script>';
	echo '<script src="./apps/music_player.js"></script>';
	echo '<script src="./apps/nora.js"></script>';
	echo '<script src="./apps/old_site.js"></script>';
	echo '<script src="./apps/properties_viewer.js"></script>';
	echo '<script src="./apps/save_master.js"></script>';
	echo '<script src="./apps/smart_icon_settings.js"></script>';
	echo '<script src="./apps/view_count.js"></script>';

	echo '<script src="main.js?ms='.round(microtime(true) * 1000).'"></script>';
	echo '<script defer>';
	require 'filepreloaderBeta.php';
	echo '</script>';
?>

</html>
<?php ob_end_flush(); ?>