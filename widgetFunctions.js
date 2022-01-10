var totalWidgets = 0;
var widgets = {};
var Widget = function (name, code, clickFunc, startFunc, frameFunc, endFunc, vars) {
	this.name = name;
	this.codeName = code;
	this.main = clickFunc;
	this.start = startFunc;
	this.frame = frameFunc;
	this.end = endFunc;
	this.vars = vars;
	this.place = -1;
	this.element = null;
	this.setWidth = function (width) {
		if (this.element !== null) {
			this.element.style.width = width;
		}
	}
	this.setContent = function (content) {
		if (this.element !== null) {
			this.element.innerHTML = content;
		}
	}
}

function addWidget(widgetName, nosave) {
	if (widgets[widgetName]) {
		if (widgets[widgetName].place === -1) {
			getId('time').innerHTML += '<div id="widget_' + widgetName + '" class="widget" data-widget-name="' + widgetName + '" onclick="widgets.' + widgetName + '.main()"></div>';
			widgets[widgetName].element = getId('widget_' + widgetName);
			widgets[widgetName].place = totalWidgets;
			totalWidgets++;
			widgets[widgetName].start();
			widgetsList[widgetName] = widgetName;

			if (!nosave) ufsave('system/taskbar/widget_list', JSON.stringify(widgetsList));
		}
	}
};

function widgetMenu(title, content) {
	// TODO: Abstract with parameters
	getId('widgetMenu').style.bottom = 'auto';
	getId('widgetMenu').style.top = '0';
	getId('widgetMenu').style.left = '';
	getId('widgetMenu').style.right = '';
	getId('widgetMenu').style.borderBottom = '';
	getId('widgetMenu').style.borderLeft = '';
	getId('widgetMenu').style.borderRight = '';
	getId('widgetMenu').style.borderTop = 'none';
	getId('widgetMenu').style.borderBottomLeftRadius = '';
	getId('widgetMenu').style.borderBottomRightRadius = '';
	getId('widgetMenu').style.borderTopLeftRadius = '0';
	getId('widgetMenu').style.borderTopRightRadius = '0';

	getId('widgetMenu').style.opacity = '';
	getId('widgetMenu').style.pointerEvents = '';
	getId('widgetTitle').innerHTML = title;
	getId('widgetContent').innerHTML = '<hr>' + content;
}

function closeWidgetMenu() {
	getId('widgetMenu').style.bottom = 'auto';
	getId('widgetMenu').style.top = '-350px';
	getId('widgetMenu').style.left = '';
	getId('widgetMenu').style.right = '';

	getId('widgetMenu').style.opacity = '0';
	getId('widgetMenu').style.pointerEvents = 'none';
	getId('widgetTitle').innerHTML = '';
	getId('widgetContent').innerHTML = '';
}