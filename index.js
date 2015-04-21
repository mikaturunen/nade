/*jshint node:true, nomen:true, esnext:true */
"use strict";

// Requires
require("babel/polyfill");
var fs = require("fs");
var path = require("path");

/**
 * Find all paths which include a package.json file from the searchPath, which defaults to the
 * current working directory.
 * @param {string} searchPath
 * @returns {Array<string>} Array of Node.js service paths
 */
var getNodePaths = (function (_getNodePaths) {
	function getNodePaths(_x) {
		return _getNodePaths.apply(this, arguments);
	}

	getNodePaths.toString = function () {
		return _getNodePaths.toString();
	};

	return getNodePaths;
})(function (searchPath) {
	searchPath = searchPath || process.cwd();
	// console.log("in " + searchPath);

	var promise = new Promise(function (resolve, reject) {
		fs.readdir(searchPath, function (error, files) {
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

			Promise.all(files.filter(function (file) {
				return path.basename(file) !== "node_modules";
			}).map(function (file) {
				return getNodePaths(path.join(searchPath, file));
			})).then(function (arrayOfPaths) {
				resolve(Array.concat.apply([], arrayOfPaths));
			}, function (error) {
				console.error(error);
				reject(error);
			});
		});
	});

	return promise;
});

getNodePaths().then(function (paths) {
	console.log("Woot.");
	console.log(paths);
}, function (error) {
	console.error(error);
});
