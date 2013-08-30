'use strict';

/* Filters */

angular.module('myApp.filters', [])
	.filter('orderStatusFilter', [function() {
		return function (orders, selectedOrderStatus) {
			if (angular.isDefined(orders) && angular.isDefined(selectedOrderStatus) && selectedOrderStatus.length > 0) {
				var tempOrders = [];
				angular.forEach(selectedOrderStatus, function(id){
					angular.forEach(orders, function(order){
						if (angular.equals(order.status, id)) {
							tempOrders.push(order);
						};
					});
				});
				return tempOrders;
			} else {
				return orders;
			}
		}
	}]);