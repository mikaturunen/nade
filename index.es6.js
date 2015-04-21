/*jshint node:true, nomen:true, esnext:true */
"use strict";

// Requires
require("babel/polyfill");
const fs = require("fs");
const path = require("path");

/**
 * Find all paths which include a package.json file from the searchPath, which defaults to the
 * current working directory.
 * @param {string} searchPath
 * @returns {Array<string>} Array of Node.js service paths
 */
const getNodePaths = (searchPath) => {
	searchPath = searchPath || process.cwd();
	// console.log("in " + searchPath);

	const promise = new Promise((resolve, reject) => {
		fs.readdir(searchPath, (error, files) => {
			if (error) {
				// console.warn("Error from readdir");
				console.error(error);
				resolve([]);
				return;
			}

			// console.log("Found " + files.length + " files from " + searchPath);
			if (files.includes("package.json")) {
				resolve([searchPath]);
				return;
			}

			Promise.all(files
				.filter(file => path.basename(file) !== "node_modules")
				.map(file => getNodePaths(path.join(searchPath, file)))
			).then(arrayOfPaths => {
				resolve(Array.concat.apply([], arrayOfPaths));
			}, error => {
				console.error(error);
				reject(error);
			});
		});
	});

	return promise;
};


getNodePaths().then(paths => {
	console.log("Woot.");
	console.log(paths);
}, error => {
	console.error(error);
});

