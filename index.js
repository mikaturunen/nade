/*jshint node:true, nomen:true, esnext:true */
"use strict";

// Requires
require("babel/polyfill");
var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;

/**
 * Find all paths which include a package.json file from the searchPath, which defaults to the
 * current working directory.
 * @param {string} searchPath Path to search package.json and folders from.
 * @returns {Promise} resolves to an array of Node.js package paths
 */
var getNodePackagePaths = (function (_getNodePackagePaths) {
	function getNodePackagePaths(_x) {
		return _getNodePackagePaths.apply(this, arguments);
	}

	getNodePackagePaths.toString = function () {
		return _getNodePackagePaths.toString();
	};

	return getNodePackagePaths;
})(function (searchPath) {
	searchPath = searchPath || process.cwd();

	var promise = new Promise(function (resolve, reject) {
		fs.readdir(searchPath, function (error, files) {
			if (error) {
				// If the target was not a directory, stop searching.
				if (error.code === "ENOTDIR") {
					resolve([]);
				} else {
					reject(error);
				}
			} else if (files.includes("package.json")) {
				// If the target includes a package.json file, resolve it and stop searching.
				resolve([searchPath]);
			} else {
				// Finally, search through all the files and sub-directories recursively, except node_modules.
				Promise.all(files.filter(function (file) {
					return path.basename(file) !== "node_modules";
				}).map(function (file) {
					return getNodePackagePaths(path.join(searchPath, file));
				})).then(function (arrayOfPathArrays) {
					// Convert [[path1, path2], [path3], ...] to [path1, path2, path3, ...] and resolve the promise.
					resolve(Array.concat.apply([], arrayOfPathArrays));
				}, function (error) {
					reject(error);
				});
			}
		});
	});

	return promise;
});

/**
 * Executes the process.argv command at nodePackagePath
 * @param {string} nodePackagePath The cwd of the spawned process.
 * @returns {Promise} Resolves to the exit code of the command.
 */
var executeCommandForNodePackage = function executeCommandForNodePackage(nodePackagePath) {
	var promise = new Promise(function (resolve, reject) {
		var packageName = path.basename(nodePackagePath);
		console.log("Executing " + process.argv.slice(2).join(" ") + " for " + packageName + "..");
		var childProcess = spawn(process.argv[2], process.argv.slice(3), {
			cwd: nodePackagePath
		});

		childProcess.stdout.on("data", function (data) {
			console.log(data.toString());
		});

		childProcess.stderr.on("data", function (data) {
			console.warn(data.toString());
		});

		childProcess.once("close", function (code) {
			if (code !== 0) {
				console.warn(nodePackagePath + " failed with code " + code + ".");
			} else {
				console.log(packageName + " task finished.");
			}
			resolve(code);
		});
	});

	return promise;
};

if (process.argv.length < 3 || !process.argv[2]) {
	console.error("You must supply at least one command to be executed.");
	process.exit(1);
}

getNodePackagePaths().then(function (nodePackagePaths) {
	console.log("Found " + nodePackagePaths.length + " Node.js packages:");
	nodePackagePaths.forEach(function (nodePackagePath) {
		console.log("* " + nodePackagePath);
	});
	console.log("---");

	Promise.all(nodePackagePaths.map(function (nodePackagePath) {
		return executeCommandForNodePackage(nodePackagePath);
	})).then(function (exitCodes) {
		var successCount = nodePackagePaths.length - exitCodes.filter(function (code) {
			return code !== 0;
		}).length;
		console.log(successCount + "/" + nodePackagePaths.length + " commands executed successfully.");
	});
}, function (error) {
	console.error(error);
});
