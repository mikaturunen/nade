#!/usr/bin/env node

/*jshint node:true, nomen:true, esnext:true */
"use strict";

// Requires
require("babel/polyfill");
const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

/**
 * Find all paths which include a package.json file from the searchPath, which defaults to the
 * current working directory.
 * @param {string} searchPath Path to search package.json and folders from.
 * @returns {Promise} resolves to an array of Node.js package paths
 */
const getNodePackagePaths = searchPath => {
    searchPath = searchPath || process.cwd();

    const promise = new Promise((resolve, reject) => {
        fs.readdir(searchPath, (error, files) => {
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
                // Finally, search through all the files and sub-directories recursively,
                // except node_modules.
                Promise.all(files
                    .filter(file => path.basename(file) !== "node_modules")
                    .map(file => getNodePackagePaths(path.join(searchPath, file)))
                ).then(arrayOfPathArrays => {
                    // Convert [[path1, path2], [path3], ...] to [path1, path2, path3, ...]
                    // and resolve the promise.
                    resolve(Array.concat.apply([], arrayOfPathArrays));
                }, error => {
                    reject(error);
                });
            }
        });
    });

    return promise;
};

/**
 * Executes the process.argv command at nodePackagePath
 * @param {string} nodePackagePath The cwd of the spawned process.
 * @returns {Promise} Resolves to the exit code of the command.
 */
const executeCommandForNodePackage = nodePackagePath => {
    const promise = new Promise((resolve, reject) => {
        const packageName = path.basename(nodePackagePath);
        console.log("Executing " + process.argv.slice(2).join(" ") + " for " + packageName + "..");
        const childProcess = spawn(process.argv[2], process.argv.slice(3), {
            cwd: nodePackagePath
        });

        childProcess.stdout.on("data", data => {
            console.log(data.toString());
        });

        childProcess.stderr.on("data", data => {
            console.warn(data.toString());
        });

        childProcess.once("close", code => {
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

getNodePackagePaths().then(nodePackagePaths => {
    console.log("Found " + nodePackagePaths.length + " Node.js packages:");
    nodePackagePaths.forEach(nodePackagePath => {
        console.log("* " + nodePackagePath);
    });
    console.log("---");

    Promise.all(
        nodePackagePaths.map(nodePackagePath => executeCommandForNodePackage(nodePackagePath))
    ).then(exitCodes => {
        const successCount = nodePackagePaths.length - exitCodes.filter(code => code !== 0).length;
        console.log(successCount+ "/" + nodePackagePaths.length + " commands executed successfully.");
    });
}, error => {
    console.error(error);
});

