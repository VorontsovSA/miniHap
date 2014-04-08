'use strict';

/* Controllers */

var hapControllers = angular.module('hap.controllers', []);

hapControllers.controller('NavCtrl', ['$scope', '$rootScope', '$location', 'CurrentMonth', function($scope, $rootScope, $location, CurrentMonth) {
  $scope.$location = $location;
  $rootScope.current_month = CurrentMonth.get();
  console.log($rootScope.current_month);
  $scope.previousMonth = function() {
    var date = new Date($rootScope.current_month.date);
    $rootScope.current_month.date = new Date(date.getFullYear(), date.getMonth()-1, 1);
    $rootScope.current_month.$update(function() {
      $location.path($location.path());
    });
  };
  $scope.nextMonth = function() {
    var date = new Date($rootScope.current_month.date);
    $rootScope.current_month.date = new Date(date.getFullYear(), date.getMonth()+1, 1);
    $rootScope.current_month.$update(function() {
      $location.path($location.path());
    });
  };
}]);
//#################################
//#######    Buildings   ##########
//#################################

hapControllers.controller('BuildingsCtrl', ['$scope', 'Building', function($scope, Building) {
  $scope.buildings = Building.query();
}]);

hapControllers.controller('BuildingsNewCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Tariff', '$http', 
  function($scope, $routeParams, $location, Building, Tariff, $http) {
  $scope.tariffs  = Tariff.query();
  $scope.building = {};
  $scope.save = function(building) {
    console.log(building);
    Building.save(building, function() {
      $location.path('/buildings');
    });
  };
}]);

hapControllers.controller('BuildingsEditCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Tariff', '$http', '$timeout', '$dialogs',
  function($scope, $routeParams, $location, Building, Tariff, $http, $timeout, $dialogs) {
  $scope.tariffs  = Tariff.query(function(){
    $scope.building = Building.get({id: $routeParams.building_id});
  });

  $scope.delete = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите удалить дом и все связанные объекты?');
    dlg.result.then(function(btn){
      $scope.building.$delete(function() {
        $location.path('/buildings');
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.building.$update(function() {
      $location.path('/buildings');
    });
  };
}]);

//#################################
//#######   Appartments  ##########
//#################################

hapControllers.controller('AppartmentsCtrl', ['$scope', '$rootScope', '$routeParams', 'Building', 'Appartment', function($scope, $rootScope, $routeParams, Building, Appartment) {
  $scope.building = Building.get({id: $routeParams.building_id});
  $scope.appartments = Appartment.query({building_id: $routeParams.building_id, period: $rootScope.current_month.date});
}]);

hapControllers.controller('AppartmentsNewCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Appartment', '$http',
  function($scope, $rootScope, $routeParams, $location, Building, Appartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id}, function(building) {
    $scope.appartment = { _building: $scope.building._id, residents: 1, period: $rootScope.current_month.date };
  });
  $scope.save = function(appartment) {
    console.log(appartment);
    Appartment.save(appartment, function() {
      $location.path('/appartments/' + $scope.building._id);
    });
  };
}]);

hapControllers.controller('AppartmentsEditCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Appartment', '$http', '$timeout', '$dialogs',
  function($scope, $routeParams, $location, Building, Appartment, $http, $timeout, $dialogs) {
  $scope.appartment  = Appartment.get({id: $routeParams.appartment_id}, function(appartment){
    console.log(appartment);
    $scope.building = Building.get({id: appartment._building});
  });

  $scope.delete = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите удалить квартиру?');
    dlg.result.then(function(btn){
      $scope.appartment.$delete(function() {
        $location.path('/appartments/' + $scope.building._id);
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.building.$update(function() {
      $location.path('/appartments/' + $scope.building._id);
    });
  };
}]);
//#################################
//#######  Tariff Groups ##########
//#################################

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

//#################################
//#######     Tariffs    ##########
//#################################

hapControllers.controller('TariffsCtrl', ['$scope', 'TariffGroup', 'Tariff', function($scope, TariffGroup, Tariff) {
  $scope.tariffs       = Tariff.query();
  $scope.tariff_groups = TariffGroup.query();
}]);

hapControllers.controller('TariffsNewCtrl',
  ['$scope', '$routeParams', '$location', 'TariffGroup', 'Tariff', '$http',
  function($scope, $routeParams, $location, TariffGroup, Tariff, $http) {
  $scope.tariff_groups = TariffGroup.query();
  $scope.tariff = {};
  $scope.save = function(tariff) {
    console.log(tariff);
    Tariff.save(tariff, function() {
      $location.path('/tariffs');
    });
  };
}]);

hapControllers.controller('TariffsEditCtrl', ['$scope', '$routeParams', '$location', 'TariffGroup', 'Tariff', '$http', '$timeout', '$dialogs',
  function($scope, $routeParams, $location, TariffGroup, Tariff, $http, $timeout, $dialogs) {
  var self = this;
  $scope.tariff_groups = TariffGroup.query(function() {
    $scope.tariff = Tariff.get({id: $routeParams.tariff_id}, function(tariff) {
      console.log("tariff:");
      // console.log(err);
      console.log(tariff);
      //self.original = tariff_group;
      //$scope.tariff_group = new TariffGroup(self.original).tariff_group;
    });
  });

  $scope.isClean = function() {
    // return angular.equals(self.original, $scope.tariff_group);
  }

  $scope.delete = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите удалить тариф?');
    dlg.result.then(function(btn){
      $scope.tariff.$delete(function() {
        $location.path('/tariffs');
      });
    },function(btn){
      //$scope.confirmed = 'Shame on you for not thinking this is awesome!';
    });
  };

  $scope.save = function() {
    console.log($scope.tariff._id);
    $scope.tariff.$update(function() {
      $location.path('/tariffs');
    });
  };
}]);
