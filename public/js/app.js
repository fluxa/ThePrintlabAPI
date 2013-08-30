'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ui.bootstrap']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/clients', {
			templateUrl: 'partial/clients', 
			controller: ClientsCtrl
		})
		.when('/orders', {
			templateUrl: 'partial/orders', 
			controller: OrdersCtrl
		})
		.when('/logs', {
			templateUrl: 'partial/logs', 
			controller: LogsCtrl
		})
		.otherwise({
			redirectTo: '/orders'
		});
	$locationProvider.html5Mode(true);
  }]);