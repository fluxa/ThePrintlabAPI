'use strict';

/* Directives */


angular.module('myApp.directives', [])
.directive('activeLink', ['$location', function(location) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs, controller) {
			var clazz = attrs.activeLink;
			var path = function() {
				return attrs.href;
			}
			scope.location = location;
			scope.$watch('location.path()', function(newPath) {
				if (path() === newPath) {
					element.addClass(clazz);
				} else {
					element.removeClass(clazz);
				}
			});
		}
	};
}])
.directive('confirmDelete', function() {
	return {
		restrict: 'E',
		templateUrl: 'partial/confirm-delete',
		replace: true,
		link: function(scope, element, attrs, controller) {
			//create popover with options
			$(element).popover({
				html: true,
				placement: 'right',
				trigger: 'manual',
				container: 'body',
				content: "<p>Are you sure?</p> \
				<div class='btn-group'> \
				<a class='btn btn-primary cancel-btn'>NO</a> \
				<a class='btn btn-danger confirm-btn'>YES</a> \
				</div>"
			});

			// Handle close all popover if clicked outside 
			$('body').on('click', function (e) {
				$('.confirm-delete').each(function () {
					//the 'is' for buttons that trigger popups
					//the 'has' for icons within a button that triggers a popup
					if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
						$(this).popover('hide');
					}
				});
			});

		},
		controller: function($scope, $element, $attrs, $location) {  
			$scope.togglePopover = function() {
				
				//my element
				var el = $($element);

				//hide all other popover first
				// $(document).find('.confirm-delete').each(function() {
				// 	if ($(this)[0] === el[0]) {
				// 		//don't close this
				// 	} else {
				// 		$(this).popover('hide');
				// 	}
				// });

				// now toggle current popover state
				el.popover('toggle');
				
				// manage events
				var popover = $(document).find('.popover');
				if (popover) {
					//cancel
					popover.find('.cancel-btn').off('click');
					popover.find('.cancel-btn').on('click', function() {
						el.popover('hide');
					});
					//confirm
					popover.find('.confirm-btn').off('click');
					popover.find('.confirm-btn').on('click', function() {
						eval('$scope.' + el.attr('deletefx'));
						el.popover('hide');
					});
				};
			}
		}
	}
});


  
