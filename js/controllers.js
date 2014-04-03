'use strict';

/* Controllers */

var hapControllers = angular.module('hap.controllers', []);

hapControllers.controller('NavCtrl', ['$scope', '$rootScope', '$location', 'CurrentMonth', function($scope, $rootScope, $location, CurrentMonth) {
  $scope.$location = $location;
  $rootScope.current_month = CurrentMonth.get();
  $scope.previousMonth = function() {
    var date = new Date($rootScope.current_month.date);
    $rootScope.current_month.date = new Date(date.getFullYear(), date.getMonth()-1, 1);
    CurrentMonth.update($rootScope.current_month, function() {
      $location.path($location.path());
    });
  };
  $scope.nextMonth = function() {
    var date = new Date($rootScope.current_month.date);
    $rootScope.current_month.date = new Date(date.getFullYear(), date.getMonth()+1, 1);
    CurrentMonth.update($rootScope.current_month, function() {
      $location.path($location.path());
    });
  };
}]);
hapControllers.controller('ObjectsCtrl', ['$scope', function($scope) {
}]);
hapControllers.controller('TariffGroupsCtrl', ['$scope', 'TariffGroup', function($scope, TariffGroup) {
  $scope.tariff_groups = TariffGroup.query();//[{id:1, name: 'Содержание жилья'}, {id:2, name: 'Ремонт жилья'}];
}]);
hapControllers.controller('TariffGroupsEditCtrl', ['$scope', '$routeParams', 'TariffGroup', '$http', function($scope, $routeParams, TariffGroup, $http) {
  $scope.tariff_groups_id = $routeParams.tariff_group_id;
  $scope.tariff_group = TariffGroup.get({tariff_group_id: $routeParams.tariff_group_id});
  $http({method: 'GET', url: 'http://localhost:1337/api'}).
    success(function(data, status) {
      $scope.status = status;
      $scope.data = data;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
  });
}]);
