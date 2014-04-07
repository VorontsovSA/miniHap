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
  $scope.tariff_groups = TariffGroup.query();
}]);
hapControllers.controller('TariffGroupsEditCtrl', ['$scope', '$routeParams', '$location', 'TariffGroup', '$http', '$timeout', '$dialogs',
  function($scope, $routeParams, $location, TariffGroup, $http, $timeout, $dialogs) {
  var self = this;
  $scope.tariff_group = TariffGroup.get({id: $routeParams.tariff_group_id}, function(tariff_group) {
    //self.original = tariff_group;
    //$scope.tariff_group = new TariffGroup(self.original).tariff_group;
  });

  $scope.isClean = function() {
    // return angular.equals(self.original, $scope.tariff_group);
  }

  $scope.delete = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите удалить группу тарифов и все связанные объекты?');
    dlg.result.then(function(btn){
      $scope.tariff_group.$delete(function() {
        $location.path('/tariffGroups');
      });
    },function(btn){
      //$scope.confirmed = 'Shame on you for not thinking this is awesome!';
    });
  };

  $scope.save = function() {
    console.log($scope.tariff_group._id);
    $scope.tariff_group.$update(function() {
      $location.path('/tariffGroups');
    });
  };
}]);
hapControllers.controller('TariffGroupsNewCtrl', ['$scope', '$routeParams', '$location', 'TariffGroup', '$http', function($scope, $routeParams, $location, TariffGroup, $http) {
  $scope.tariff_group = {};
  $scope.save = function(tariff_group) {
    console.log(tariff_group);
    TariffGroup.save(tariff_group, function() {
      $location.path('/tariffGroups');
    });
  };
}]);
