'use strict';

/* Controllers */

var hapControllers = angular.module('hap.controllers', []);

hapControllers.controller('NavCtrl', ['$scope', '$rootScope', '$location', 'Period', '$dialogs', '$http', 'moment',
  function($scope, $rootScope, $location, Period, $dialogs, $http, moment) {
  $scope.$location = $location;
  $rootScope.is_last_month = true;
  $rootScope.is_first_month = true;
  $rootScope.current_period = Period.getCurrent(function (period) {
    var date = moment(period.date);
    var date_next = moment(period.date).add('months', 1);
    var date_before = moment(period.date).add('months', -1);
    $rootScope.period_before = Period.getByDate({ 'date': date_before.format()}, function (period) {
      if(period.date) $rootScope.is_first_month = false;
    });
    $rootScope.period_next = Period.getByDate({ 'date': date_next.format()}, function (period) {
      if(period.date) $rootScope.is_last_month = false;
    });
  });
  console.log($rootScope.current_period);
  $scope.previousMonth = function() {
    $rootScope.period_next = $rootScope.current_period;
    $rootScope.is_last_month = false;
    $rootScope.is_first_month = true;
    $rootScope.current_period = $rootScope.period_before;
    $rootScope.period_before = Period.getByDate({ 'date': moment($rootScope.current_period.date).add('months', -1).format()}, function (period) {
      if(period.date) $rootScope.is_first_month = false;
      $location.path('/buildings');
    });
  };
  $scope.nextMonth = function() {
    $rootScope.period_before = $rootScope.current_period;
    $rootScope.is_first_month = false;
    $rootScope.is_last_month = true;
    $rootScope.current_period = $rootScope.period_next;
    $rootScope.period_next = Period.getByDate({ 'date': moment($rootScope.current_period.date).add('months', 1).format()}, function (period) {
      if(period.date) $rootScope.is_last_month = false;
      $location.path('/buildings');
    });
  };
  $scope.clearMonth = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите очистить всю информацию за данный период и перейти к предыдущему периоду?');
    dlg.result.then(function(btn){
      // Создать новый период
      $rootScope.period_next = false;
      $rootScope.is_last_month = true;
      $rootScope.current_period.$delete();
      $rootScope.current_period = $rootScope.period_before;
      $rootScope.current_period.finished = false;
      $rootScope.current_period.$update();
      // Проверить наличие следующего периода
      $rootScope.period_before = Period.getByDate({ 'date': moment($rootScope.current_period.date).add('months', -1).format()}, function (period) {
        if(!period.date) $rootScope.is_first_month = true;
      });
      // // Удалить всю информацию и перейти на прошлый период
      $http({method: 'GET', url: 'http://localhost:1337/api'}).
        success(function(data, status) {
          $scope.status = status;
          $scope.data = data;
          $location.path('/buildings');
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
      // Закрыть текущий период
      $rootScope.current_period.finished = true;
      $rootScope.current_period.$update();
      // Создать новый период
      $rootScope.period_before = $rootScope.current_period;
      $rootScope.is_first_month = false;
      $rootScope.current_period = Period.save({ date: moment($rootScope.current_period.date).add('months', 1).format(), finished: false });
      // Проверить наличие следующего периода
      $rootScope.period_next = false;
      $rootScope.is_last_month = true;
      // Удалить всю информацию и перейти на прошлый период
      $http({method: 'GET', url: 'http://localhost:1337/api'}).
        success(function(data, status) {
          $scope.status = status;
          $scope.data = data;
          $location.path('/buildings');
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
//#######   Apartments  ##########
//#################################

hapControllers.controller('ApartmentsCtrl', ['$scope', '$rootScope', '$routeParams', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, Building, Apartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id});
  $scope.apartments = Apartment.query({building_id: $routeParams.building_id, period: $rootScope.current_period.date});
}]);

hapControllers.controller('ApartmentsNewCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id}, function(building) {
    $scope.apartment = { _building: $scope.building._id, residents: 1, period: $rootScope.current_period.date };
  });
  $scope.save = function(apartment) {
    console.log(apartment);
    Apartment.save(apartment, function() {
      $location.path('/apartments/' + $scope.building._id);
    });
  };
}]);

hapControllers.controller('ApartmentsEditCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Apartment', '$http', '$timeout', '$dialogs',
  function($scope, $routeParams, $location, Building, Apartment, $http, $timeout, $dialogs) {
  $scope.apartment  = Apartment.get({id: $routeParams.apartment_id}, function(apartment){
    console.log(apartment);
    $scope.building = Building.get({id: apartment._building});
  });

  $scope.delete = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите удалить квартиру?');
    dlg.result.then(function(btn){
      $scope.apartment.$delete(function() {
        $location.path('/apartments/' + $scope.building._id);
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.apartment.$update(function() {
      $location.path('/apartments/' + $scope.building._id);
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

//#################################
//#######     Charges    ##########
//#################################

hapControllers.controller('ChargesCtrl', ['$scope', 'Building', function($scope, Building) {
  $scope.buildings = Building.query();
}]);

hapControllers.controller('ChargesBuildingCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id});

  $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + $routeParams.building_id}).
  success(function(data, status) {
    var tariff_group_ids = [];
    angular.forEach(data.tariffs, function(tariff, key){
      tariff_group_ids.push(tariff._tariff_group._id);
    });
    // console.log(data);
    var apartments = Apartment.query({building_id: $routeParams.building_id, period: $rootScope.current_period.date}, function(apartments)
    {
      $scope.apts         = {};
      $scope.residents    = 0;
      $scope.space        = 0;
      $scope.common_space = 0;
      apartments.forEach(function(apt) {
        $scope.apts[apt._id] = {
          number: apt.number,
          contractor: apt.contractor.last_name + ' ' + apt.contractor.first_name + ' ' + apt.contractor.second_name,
          residents    : apt.residents,
          space        : apt.space,
          common_space : apt.common_space,
          charges: {}
        };
        $scope.residents    += apt.residents;
        $scope.space        += apt.space;
        $scope.common_space += apt.common_space;
      });
      // console.log('apts');
      // console.log($scope.apts);
      $http({method: 'GET', url: 'http://localhost:1337/api/charges_for_building/' + $routeParams.building_id + '/' + tariff_group_ids + '/' + $rootScope.current_period.date}).
      success(function(charges, status) {
        // console.log('STARTED');
        var total_volume = {};
        charges.forEach(function(charge) {
          // console.log(charge);
          // console.log($scope.apts);
          $scope.apts[charge._apartment].charges[charge._tariff_group] = {
            _id:                 charge._id,
            has_counter:         charge.has_counter,
            norm:                charge.norm,
            volume:              charge.volume,
            value:               charge.value,
            reappraisal_auto:    charge.reappraisal_auto,
            reappraisal_manual:  charge.reappraisal_manual
          };
          if(total_volume[charge._tariff_group])
            total_volume[charge._tariff_group] += Number(charge.volume);
          else
            total_volume[charge._tariff_group] = Number(charge.volume);
        })
        // console.log('total_volume');
        // console.log(total_volume);
        // console.log($scope.apts);
        // console.log('FINISHED');
        $scope.tabs = {};
        angular.forEach(data.tariffs, function(tariff, key){
          var calc_var = 0;
          if(tariff._tariff_group.use_residents) calc_var    += $scope.residents;
          if(tariff._tariff_group.use_space) calc_var        += $scope.space;
          if(tariff._tariff_group.use_common_space) calc_var += $scope.common_space;
          $scope.tabs[tariff._tariff_group._id] = {
            title: tariff._tariff_group.name,
            tariff_group: tariff._tariff_group,
            tariff_group_id: tariff._tariff_group._id,
            tariff: tariff,
            by_volume: true,
            volume: total_volume[tariff._tariff_group._id],
            norm: 0,
            calc_var: calc_var
          };
          // console.log('tab');
          // console.log($scope.tabs[tariff._tariff_group._id]);
          // Wathing common trigger
          var updateCharges = function() {
            if(!tariff._tariff_group.use_norm) {
              console.log('Not Use norm');
              angular.forEach($scope.apts, function(apt, key){
                var calc_var = 0;
                if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                $scope.apts[key].charges[tariff._tariff_group._id].has_counter = false;
                $scope.apts[key].charges[tariff._tariff_group._id].norm = '';
                $scope.apts[key].charges[tariff._tariff_group._id].volume = (calc_var).toFixed(4);
                $scope.apts[key].charges[tariff._tariff_group._id].value = ($scope.apts[key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
              });
            }
            else
            {
              console.log('Use norm');
              if($scope.tabs[tariff._tariff_group._id].by_volume == 1) {
                // console.log('Update charges for volume');
                var max_value = null;
                var max_key   = null;
                var real_sum  = 0;
                var to_share  = $scope.tabs[tariff._tariff_group._id].volume;
                var calc_var  = $scope.tabs[tariff._tariff_group._id].calc_var;
                angular.forEach($scope.apts, function(apt, key){
                  if(apt.charges[tariff._tariff_group._id].has_counter)
                  {
                    to_share -= apt.charges[tariff._tariff_group._id].volume;
                    if(tariff._tariff_group.use_residents) calc_var    -= $scope.apts[key].residents;
                    if(tariff._tariff_group.use_space) calc_var        -= $scope.apts[key].space;
                    if(tariff._tariff_group.use_common_space) calc_var -= $scope.apts[key].common_space;
                  }
                });
                var norm = (to_share/calc_var).toFixed(4);
                angular.forEach($scope.apts, function(apt, key){
                  var calc_var = 0;
                  if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                  if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                  if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                  $scope.apts[key].charges[tariff._tariff_group._id].norm = (apt.charges[tariff._tariff_group._id].has_counter) ? '' : norm;
                  if(!apt.charges[tariff._tariff_group._id].has_counter) $scope.apts[key].charges[tariff._tariff_group._id].volume = (norm * calc_var).toFixed(4);
                  if(!apt.charges[tariff._tariff_group._id].has_counter && ($scope.apts[key].charges[tariff._tariff_group._id].volume > max_value || max_value == null))
                  {
                    max_value = $scope.apts[key].charges[tariff._tariff_group._id].volume;
                    max_key   = key;
                  }
                  real_sum += Number($scope.apts[key].charges[tariff._tariff_group._id].volume);
                  $scope.apts[key].charges[tariff._tariff_group._id].value = ($scope.apts[key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
                });
                if (real_sum != $scope.tabs[tariff._tariff_group._id].volume) {
                  // console.log($scope.tabs[tariff._tariff_group._id].volume);
                  // console.log(real_sum);
                  // console.log(max_key);
                  // console.log('Repaired float error ' + ($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4) + ' for ' + $scope.apts[max_key].number);
                  $scope.apts[max_key].charges[tariff._tariff_group._id].volume = (Number($scope.apts[max_key].charges[tariff._tariff_group._id].volume) + Number(($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4))).toFixed(4);
                };
              }
              else
              {
                angular.forEach($scope.apts, function(apt, key){
                  var calc_var = 0;
                  if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                  if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                  if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                  $scope.apts[key].charges[tariff._tariff_group._id].norm = (apt.charges[tariff._tariff_group._id].has_counter) ? '' : $scope.tabs[tariff._tariff_group._id].norm;
                  if(!apt.charges[tariff._tariff_group._id].has_counter)$scope.apts[key].charges[tariff._tariff_group._id].volume = ($scope.tabs[tariff._tariff_group._id].norm * calc_var).toFixed(4);
                  $scope.apts[key].charges[tariff._tariff_group._id].value = ($scope.apts[key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
                });
              }
            }
          };
          // updateCharges();
          $scope.$watch("tabs['" + tariff._tariff_group._id + "'].by_volume", function( newValue ) {
            // console.log( "$watch : " + newValue );
            updateCharges();
          });
          // Wathing common volume
          $scope.$watch("tabs['" + tariff._tariff_group._id + "'].volume", function( newValue ) {
            console.log('Update charges for volume field');
            // console.log( "$watch : " + newValue );
            updateCharges();
          });
          // Watching common norm
          $scope.$watch("tabs['" + tariff._tariff_group._id + "'].norm", function( newValue ) {
            // console.log( "$watch : " + newValue );
            updateCharges();
          });
          // Watching apts
          angular.forEach($scope.apts, function(apt, key){
            $scope.$watch("apts['" + key +"'].charges['" + tariff._tariff_group._id + "'].has_counter", function( newValue ) {
              // console.log( "$watch : " + newValue );
              updateCharges();
            });
            $scope.$watch("apts['" + key +"'].charges['" + tariff._tariff_group._id + "'].volume", function( newValue ) {
              // console.log( "$watch : " + newValue );
              updateCharges();
            });
          });
        });
      }).
      error(function(data, status) {
        $scope.data = data || "Request failed";
        $scope.status = status;
      });
    });
  }).
  error(function(data, status) {
    $scope.data = data || "Request failed";
    $scope.status = status;
  });
  $scope.save = function(tariff_group_id) {
    console.log('Saving tariff_group');
    console.log(tariff_group_id);
    var charges = [];
    angular.forEach($scope.apts, function(apt, key){
      charges.push({
        _id:                 apt.charges[tariff_group_id]._id,
        has_counter:         apt.charges[tariff_group_id].has_counter,
        norm:                apt.charges[tariff_group_id].norm,
        volume:              apt.charges[tariff_group_id].volume,
        value:               apt.charges[tariff_group_id].value,
        reappraisal_auto:    apt.charges[tariff_group_id].reappraisal_auto,
        reappraisal_manual:  apt.charges[tariff_group_id].reappraisal_manual
      });
    });
    console.log(charges);
    $http({method: 'POST', url: 'http://localhost:1337/api/save_charges_for_building', data: {charges: charges}}).
    success(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
    });
  };
}]);
