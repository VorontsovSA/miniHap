'use strict';

/* Controllers */

var hapControllers = angular.module('hap.controllers', []);

hapControllers.controller('NavCtrl', ['$scope', '$rootScope', '$location', 'CurrentMonth', 'Periods', '$dialogs', '$http',
  function($scope, $rootScope, $location, CurrentMonth, Periods, $dialogs, $http) {
  $scope.$location = $location;
  $rootScope.last_month = true;
  $rootScope.first_month = true;
  $rootScope.current_month = CurrentMonth.get(function (current_month) {
    var date = new Date(current_month.date);
    var date_next = new Date(date.getFullYear(), date.getMonth()+3, 1);
    var date_before = new Date(date.getFullYear(), date.getMonth()-3, 1);
    console.log($rootScope);
    // $rootScope.next_period = Periods.query({ date: date_next.toString()}, function (period) {
    //   if(period.date) $rootScope.last_month = false;
    //   console.log('last_month');
    //   console.log($rootScope.last_month);
    //   console.log(period);
    // });
    // $rootScope.current_period = Periods.query({ date: date.toString()}, function (period) {
    //   console.log(period);
    // });
    // $rootScope.last_period = Periods.query({ date: date_before.toUTCString()}, function (period) {
    //   if(period.date) $rootScope.first_month = false;
    //   console.log('first_month');
    //   console.log($rootScope.first_month);
    // });
  });
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
  $scope.clearMonth = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите очистить всю информацию за данный период и перейти к предыдущему периоду?');
    dlg.result.then(function(btn){
      var date = new Date($rootScope.current_month.date);
      var date_next = new Date(date.getFullYear(), date.getMonth()+1, 1);
      var date_before = new Date(date.getFullYear(), date.getMonth()-1, 1);
      // Удалить текущий период
      $rootScope.current_period.$delete();
      // Создать новый период
      // $rootScope.current_period = Period.save({ date });
      // Удалить всю информацию и перейти на прошлый период
      $http({method: 'GET', url: 'http://localhost:1337/api'}).
      success(function(data, status) {
        $scope.status = status;
        $scope.data = data;
        var date = new Date($rootScope.current_month.before_date);
        $rootScope.current_month.date = date_before;
        $rootScope.current_month.$update(function() {
          $location.path('/buildings');
        });
      }).
      error(function(data, status) {
        $scope.data = data || "Request failed";
        $scope.status = status;
      });
    },function(btn){});
  };
  $scope.closeMonth = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите закрыть данный период и перейти к следующему периоду?');
    dlg.result.then(function(btn){
      var date = new Date($rootScope.current_month.date);
      var date_next = new Date(date.getFullYear(), date.getMonth()+1, 1);
      var date_before = new Date(date.getFullYear(), date.getMonth()-1, 1);
      // Закрыть текущий период
      $rootScope.current_period.finished = true;
      $rootScope.current_period.$update();
      // Создать новый период
      $rootScope.current_period = Period.save({ date: date_next.toString() });
      // Удалить всю информацию и перейти на прошлый период
      $http({method: 'GET', url: 'http://localhost:1337/api'}).
      success(function(data, status) {
        $scope.status = status;
        $scope.data = data;
        var date = new Date($rootScope.current_month.date);
        $rootScope.current_month.date = date_next;
        $rootScope.current_month.$update(function() {
          $location.path('/buildings');
        });
      }).
      error(function(data, status) {
        $scope.data = data || "Request failed";
        $scope.status = status;
      });
    },function(btn){});
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
    $scope.appartment.$update(function() {
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
