'use strict';

/* Services */

// converting mongo _id into Date
String.prototype.getTimestamp = function() {
    return new Date(parseInt(this.slice(0,8), 16)*1000);
}

String.prototype.datePretty = function() {
	var d = this.getTimestamp();
	return moment(d).format('lll');
}

angular.module('myApp.services', [])
	.factory('api', function($http) {
		return {
			clientAll: function(){
				return $http.get('/v1/client/find?query={}').then(function(result){
					return result.data;
				});
			},
			orderAll: function() {
				return $http.get('/v1/order/all?query={}').then(function(result){
					return result.data;
				});
			},
			orderDelete: function(orderId) {
				return $http.delete('/v1/order/remove?_id='+orderId).then(function(result) {
					return result.data;
				});
			},
			orderStatusList: function() {
				return $http.get('/v1/order/status_list').then(function(result){
					return result.data;
				});
			},
			appLogs: function() {
				return $http.get('/v1/logs').then(function(result){
					return result.data;
				});
			}
		}
	});

