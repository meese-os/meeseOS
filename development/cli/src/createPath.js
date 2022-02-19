const path = require("path");

/** https://stackoverflow.com/a/63251716/6456163 */
const toPosixPath = (windowsPath) => {
	const posixPath = windowsPath.split(path.sep).join(path.posix.sep);

	// Removes the drive letter
	return posixPath.replace(/^[a-zA-Z]:/, "");
};

const isWin = process.platform === "win32";
const createPath = (root, subPath) => {
	const newPath = subPath ? path.resolve(root, subPath) : path.resolve(root);

	if (isWin) return toPosixPath(newPath);
	return newPath;
};

module.exports = { createPath };
