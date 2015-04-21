nade
====

A meta task runner for Node.js packages. Finds folders with package.json files from sub-directories and executes a command in each directory.

Installation
------------

```
npm install -g nade
```

Examples
--------

Build all Node.js microservices in the current working directory's sub-directories, excludes traversing node_modules. This example assumes that the services can be built with grunt.
```
nade grunt build
```

Start all services
```
nade npm start
```

Development
--------

Fork and create a pull request. To build the ES5 JavaScript file, run:

```
npm run-script build
```
