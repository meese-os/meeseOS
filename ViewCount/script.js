const viewCountElement = document.getElementById("viewerCount");
const rawFile = new XMLHttpRequest();

rawFile.open("GET", "../counter.txt", false);
rawFile.onreadystatechange = function () {
	if (rawFile.readyState === 4) {
		if (rawFile.status === 200 || rawFile.status == 0) {
			const numbers = rawFile.responseText.padStart(6, "0").split("");
			let newHTML = "";

			numbers.forEach((number) => {
				const numberElement = document.createElement("div");
				numberElement.classList.add("number");
				numberElement.innerText = number;
				newHTML += numberElement.outerHTML;
			});

			viewCountElement.innerHTML = newHTML;
		}
	}
};

rawFile.send(null);
