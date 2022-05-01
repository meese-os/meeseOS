import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default [
	{
		input: "index.js",
		watch: {
			chokidar: false,
		},
		output: [
			{
				file: "dist/esm.js",
				format: "esm",
				sourcemap: true,
			},
		],
		plugins: [
			babel({
				runtimeHelpers: true,
				exclude: "node_modules/**",
			}),
			terser({
				comments: false,
				sourceMap: true,
			}),
			resolve({
				// modulesOnly: true, // Default: false
			}),
			commonjs(),
		],
	},
];
