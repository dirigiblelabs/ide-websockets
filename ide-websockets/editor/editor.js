/*
 * Copyright (c) 2010-2020 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */
angular.module('page', [])
	.controller('PageController', function ($scope) {

		let messageHub = new FramesMessageHub();
		let contents;

		function getResource(resourcePath) {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', resourcePath, false);
			xhr.send();
			if (xhr.status === 200) {
				return xhr.responseText;
			}
		}

		function loadContents(file) {
			if (file) {
				return getResource('/services/v4/ide/workspaces' + file);
			}
			console.error('file parameter is not present in the URL');
		}

		function getViewParameters() {
			if (window.frameElement.hasAttribute("data-parameters")) {
				let params = JSON.parse(window.frameElement.getAttribute("data-parameters"));
				$scope.file = params["file"];
			} else {
				let searchParams = new URLSearchParams(window.location.search);
				$scope.file = searchParams.get('file');
			}
		}

		function load() {
			getViewParameters();
			contents = loadContents($scope.file);
			$scope.websocket = JSON.parse(contents);
		}

		load();

		function saveContents(text) {
			console.log('Save called...');
			if ($scope.file) {
				let xhr = new XMLHttpRequest();
				xhr.open('PUT', '/services/v4/ide/workspaces' + $scope.file);
				xhr.onreadystatechange = function () {
					if (xhr.readyState === 4) {
						console.log('file saved: ' + $scope.file);
					}
				};
				xhr.send(text);
				messageHub.post({
					name: $scope.file.substring($scope.file.lastIndexOf('/') + 1),
					path: $scope.file.substring($scope.file.indexOf('/', 1)),
					contentType: 'application/json+websocket', // TODO: Take this from data-parameters
					workspace: $scope.file.substring(1, $scope.file.indexOf('/', 1)),
				}, 'ide.file.saved');
				messageHub.post({ message: `File '${$scope.file}' saved` }, 'ide.status.message');
			} else {
				console.error('file parameter is not present in the request');
			}
		}

		$scope.save = function () {
			contents = JSON.stringify($scope.websocket);
			saveContents(contents);
		};

		messageHub.subscribe(
			function () {
				let websocket = JSON.stringify($scope.websocket);
				if (contents !== websocket) {
					$scope.save();
				}
			},
			"editor.file.save.all",
		);

		messageHub.subscribe(
			function (msg) {
				let file = msg.data && typeof msg.data === 'object' && msg.data.file;
				let websocket = JSON.stringify($scope.websocket);
				if (file && file === $scope.file && contents !== websocket)
					$scope.save();
			},
			"editor.file.save",
		);

		$scope.$watch(function () {
			let websocket = JSON.stringify($scope.websocket);
			if (contents !== websocket) {
				messageHub.post({ resourcePath: $scope.file, isDirty: true }, 'ide-core.setEditorDirty');
			} else {
				messageHub.post({ resourcePath: $scope.file, isDirty: false }, 'ide-core.setEditorDirty');
			}
		});

	});