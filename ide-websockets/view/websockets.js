/*
 * Copyright (c) 2010-2022 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */

const websocketsView = angular.module('websockets', ['ideUI', 'ideView']);

websocketsView.config(["messageHubProvider", function (messageHubProvider) {
	messageHubProvider.eventIdPrefix = 'websockets-view';
}]);

websocketsView.controller('WebsocketsController', ['$scope', '$http', function ($scope, $http) {

	$http.get('/services/v4/ops/websockets').then(function (response) {
		$scope.list = response.data;
	});

}]);