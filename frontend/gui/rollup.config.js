import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default [
	{
		input: "index.js",
		output: [
			{
				file: "dist/esm.js",
				format: "esm",
				sourcemap: true,
			},
		],
		plugins: [
			babel({
				babelHelpers: "runtime",
				skipPreflightCheck: true,
				exclude: /^(.+\/)?node_modules\/.+$/,
			}),
			terser({
				sourceMap: true,
			}),
			resolve({
				// modulesOnly: true, // Default: false
			}),
			commonjs(),
		],
	},
];
