'use strict';


var myMenu = [
	{name: 'ORDERS', href: '/orders'},
	{name: 'CLIENTS', href: '/clients'},
	{name: 'LOGS', href: '/logs'}
];

/* Controllers */

function AppCtrl($scope, api, $location) {
	$scope.menu = myMenu;
}

function ClientsCtrl($scope, api) {
	api.clientAll().then(function(data) {
		$scope.clients = data.clients;
	});
}

function OrdersCtrl($scope, api) {
	api.orderAll().then(function(data) { //get all orders
		var orders = data.orders;
		api.orderStatusList().then(function(data) { //get order status list
			var statuslist = data;
			$scope.orders = orders;
			$scope.statuslist = statuslist;
			
			//order status filter
			$scope.selectedOrderStatus = [];
			$scope.setSelectedOrder = function () {
				var id = this.status.id;
				if (_.contains($scope.selectedOrderStatus, id)) {
					$scope.selectedOrderStatus = _.without($scope.selectedOrderStatus, id);
				} else {
					$scope.selectedOrderStatus.push(id);
				}
				return false;
			};

			$scope.isChecked = function (id) {
				if (_.contains($scope.selectedOrderStatus, id)) {
					return 'glyphicon glyphicon-ok pull-right';
				}
				return false;
			};

			$scope.checkAll = function () {
				$scope.selectedOrderStatus = _.pluck($scope.statuslist, 'id');
			};

			//returns div class for gift section
			$scope.isGift = function(gift) {
				if (gift && gift.isGift) {
					return 'visible';
				}
				return 'hidden';
			}

			//delete order
			$scope.orderDelete = function(orderId) {
				console.log('delete order: ' + orderId);
				api.orderDelete(orderId).then(function(data) {
					if (data.success) {
						$scope.orders = _.reject($scope.orders, function(order) {
							return order._id === data.data._id;
						});
						//$scope.$apply();
					} else {
						console.log(data.error);
					}
				});
			}

		});
		
	});
}


function LogsCtrl($scope, api) {
	api.appLogs().then(function(data) {
		$scope.logs = data.logs;
	});
}