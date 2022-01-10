// Function to format a string into a date into a string
var tempDate;
var date;
var skipKey;
var tempDayt;
var dateDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var dateForms = {
	D: function() { // day number
		tempDate += date.getDate();
	},
	d: function() { // day of week
		tempDate += dateDays[date.getDay()];
	},
	y: function() { // 2-digit year
		tempDate += String(date.getFullYear() - 2000);
	},
	Y: function() { // 4-digit year
		tempDate += date.getFullYear();
	},
	h: function() { // 12-hour time
		if (date.getHours() > 12) {
			tempDayt = String((date.getHours()) - 12);
		} else {
			tempDayt = String(date.getHours());
		}
		if (tempDayt === "0") {
			tempDate += "12";
		} else {
			tempDate += tempDayt;
		}
	},
	H: function() { // 24-hour time
		tempDate += String(date.getHours());
	},
	s: function() { // milliseconds
		if (date.getMilliseconds() < 10) {
			tempDate += '00' + date.getMilliseconds();
		} else if (date.getMilliseconds() < 100) {
			tempDate += '0' + date.getMilliseconds();
		} else {
			tempDate += date.getMilliseconds();
		}
	},
	S: function() { // seconds
		tempDayt = String(date.getSeconds());
		if (tempDayt < 10) {
			tempDate += "0" + tempDayt;
		} else {
			tempDate += tempDayt;
		}
	},
	m: function() { // minutes
		tempDayt = date.getMinutes();
		if (tempDayt < 10) {
			tempDate += "0" + tempDayt;
		} else {
			tempDate += tempDayt;
		}
	},
	M: function() { // month
		tempDate += String(date.getMonth() + 1);
	},
	"-": function() { // escape character

	}
};

// Function to use above functions to form a date string
function formDate(dateStr) {
	tempDate = "";
	date = new Date();
	skipKey = 0;
	// Loops thru characters and replaces them with the date
	for (var dateKey in dateStr) {
		if (skipKey) skipKey = 0;
		if (dateForms[dateStr[dateKey]]) {
			dateForms[dateStr[dateKey]]();
		} else {
			tempDate += dateStr[dateKey];
		}
	}
	return tempDate;
}