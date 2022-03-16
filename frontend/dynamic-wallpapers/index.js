/*
 * Exports all of the wallpapers in the src folder for use.
 */

import Matrix from "./src/matrix";

const defaultFunc = {
	effect: (canvas, options) => {},
	options: {},
}

export default {
	Matrix,
	default: defaultFunc,
};
