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
    $location.path('/buildings');
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
      // Удалить всю информацию и перейти на прошлый период
      $http({ method: 'GET', url: 'http://localhost:1337/api/clear_period/' + moment($rootScope.current_period.date).format() }).
        success(function(data, status) {
          $scope.status = status;
          $scope.data = data;
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
          $('.navbar').notify("Информация за следующий период удалена", 'success');
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
      $http({method: 'GET', url: 'http://localhost:1337/api/new_period/' + moment($rootScope.current_period.date).add('months', -1).format() + '/' + moment($rootScope.current_period.date).format()}).
        success(function(data, status) {
          $scope.status = status;
          $scope.data = data;
          $('.navbar').notify("Создан новый период для проведения начислений", 'success');
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

hapControllers.controller('BuildingsCtrl', ['$scope', '$rootScope', 'Building', '$http', 'Apartment', 'moment', 'Options', 'Tariff',
  function($scope, $rootScope, Building, $http, Apartment, moment, Options, Tariff) {
  $scope.buildings = Building.query();

  $scope.quittances = function (building_id) {
    var tariffs = Tariff.query(function() {
      $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + building_id + '/' + $rootScope.current_period.date}).
      success(function(building_data, status) {
        console.log ('building_data', building_data);
        var date = moment($rootScope.current_period.date).format('MMMM YYYY');
        var data = {
          options      : null,
          tariffs      : {},
          street       : building_data.street,
          number       : building_data.number,
          description  : building_data.description,
          date         : moment($rootScope.current_period.date).format('YYYY.MM'),
          apts         : {}
        };
        angular.forEach(tariffs, function(tariff, key){
          data.tariffs[tariff._id] = tariff;
        });
        var tariff_group_ids = [];
        var tariff_groups = {};
        var tariff_group_executor = {};
        var executors = [];
        angular.forEach(building_data.tariffs, function(tariff, key){
          console.log(tariff._tariff_group.executor);
          if(executors.indexOf(tariff._tariff_group.executor) == -1) executors.push(tariff._tariff_group.executor);
          tariff_group_executor[tariff._tariff_group._id] = executors.indexOf(tariff._tariff_group.executor);
          tariff_group_ids.push(tariff._tariff_group._id);
        });
        var apartments = Apartment.query({building_id: building_id, period: $rootScope.current_period.date}, function(apartments)
        {
          angular.forEach(apartments, function(apt, key){
            data.apts[apt._id] = {
              address        : 'ул. ' + building_data.street + ', д. ' + building_data.number + ', к. ' + apt.number,
              number         : apt.number,
              contractor     : apt.contractor.last_name + ' ' + apt.contractor.first_name + ' ' + apt.contractor.second_name,
              residents      : apt.residents,
              b_residents    : building_data.residents,
              space          : apt.space,
              common_space   : apt.common_space,
              b_space        : building_data.space,
              b_common_space : building_data.common_space,
              date           : date,
              total          : 0,
              total_debt     : apt.debt,
              executors      : []
            };
            angular.forEach(building_data.tariffs, function(tariff, key){
              data.apts[apt._id].executors[executors.indexOf(tariff._tariff_group.executor)] = {
                name: tariff._tariff_group.executor,
                total: 0,
                tariff_groups: {}
              }
            });
            angular.forEach(building_data.tariffs, function(tariff, key){
              data.apts[apt._id].executors[executors.indexOf(tariff._tariff_group.executor)].tariff_groups[tariff._tariff_group._id] = {
                tariff_group: tariff._tariff_group,
                tariff: tariff,
                total_volume: 0,
                charge: null
              }
            });
          });
          if(!tariff_group_ids.length) {
            $('.navbar').notify('Не привязан ни один тариф', 'error');
          }
          else
          $http({method: 'GET', url: 'http://localhost:1337/api/charges_for_reappraisal/' + building_id + '/' + tariff_group_ids + '/' + $rootScope.current_period.date}).
          success(function(charges, status) {
            angular.forEach(charges, function(charge, key){
              data.apts[charge._apartment].executors[tariff_group_executor[charge._tariff_group]].tariff_groups[charge._tariff_group].charge = charge;
              data.apts[charge._apartment].total += charge.value + charge.reappraisal_auto + charge.reappraisal_manual;
              // data.apts[charge._apartment].total_debt += charge.debt;
              data.apts[charge._apartment].executors[tariff_group_executor[charge._tariff_group]].total += charge.value + charge.reappraisal_auto + charge.reappraisal_manual;
              angular.forEach(data.apts, function(apt, key){
                data.apts[key].executors[tariff_group_executor[charge._tariff_group]].tariff_groups[charge._tariff_group].total_volume += charge.volume;
              })
            })
            console.log(data);
            Options.get(function(options){
              data.options = options;
              console.log(data);
              var ready2send = true;
              angular.forEach(data.apts, function(apt, aid){
                angular.forEach(apt.executors, function(executor, eid){
                  angular.forEach(executor.tariff_groups, function(tariff_group, tid){
                    if(!tariff_group.charge || tariff_group.charge.value == null) {
                      console.log(tariff_group.charge);
                      ready2send = false;
                      $('.navbar').notify("Нет начисления по " + tariff_group.tariff_group.name + ' (' + apt.address + ')', 'error');
                    }
                  });
                });
              });
              if(ready2send) require('./libs/quittances').generate(data, $('.navbar'), localStorage);
            });
          }).
          error(function(data, status) {
            console.log("Request failed");
          });
        });
      }).
      error(function(data, status) {
        console.log("Request failed");
      });
    });
  }

  $scope.saldo = function (building_id) {
    var data = {};
    $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + building_id + '/' + $rootScope.current_period.date}).
    success(function(building_data, status) {
      var date = moment($rootScope.current_period.date).format('MMMM YYYY');
      var data = {
        street      : building_data.street,
        number      : building_data.number,
        description : building_data.description,
        date_text   : moment($rootScope.current_period.date).format('MMMM YYYY'),
        date        : moment($rootScope.current_period.date).format('YYYY.MM'),
        head        : [],
        apts        : []
      };
      var tariff_group_ids = [];
      angular.forEach(building_data.tariffs, function(tariff, key){
        data.head.push(tariff._tariff_group.name);
        tariff_group_ids.push(tariff._tariff_group._id);
      });
      var apartments = Apartment.query({building_id: building_id, period: $rootScope.current_period.date}, function(apartments)
      {
        var apartment_ids = [];
        angular.forEach(apartments, function(apt, key){
          apartment_ids.push(apt._id);
          data.apts.push({
            address      : 'ул. ' + building_data.street + ', д. ' + building_data.number + ', к. ' + apt.number,
            number       : apt.number,
            contractor   : apt.contractor.last_name + ' ' + apt.contractor.first_name + ' ' + apt.contractor.second_name,
            total        : 0,
            total_debt   : 0,
            tariff_groups: []
          });
        });
        $http({method: 'GET', url: 'http://localhost:1337/api/charges_for_reappraisal/' + building_id + '/' + tariff_group_ids + '/' + $rootScope.current_period.date}).
        success(function(charges, status) {
          console.log(apartment_ids);
          console.log(data);
          angular.forEach(charges, function(charge, key){
            data.apts[apartment_ids.indexOf(charge._apartment)].total += charge.value + charge.reappraisal_auto + charge.reappraisal_manual;
            data.apts[apartment_ids.indexOf(charge._apartment)].total_debt += charge.debt;
            data.apts[apartment_ids.indexOf(charge._apartment)].tariff_groups[tariff_group_ids.indexOf(charge._tariff_group)] = (charge.value + charge.reappraisal_auto + charge.reappraisal_manual).toFixed(2);
          })
          console.log(data);
          require('./libs/excel-report').generateSaldo(data, $('.navbar'), localStorage);
        }).
        error(function(data, status) {
          console.log("Request failed");
        });
      });
    }).
    error(function(data, status) {
      console.log("Request failed");
    });
  }
}]);

hapControllers.controller('BuildingsNewCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Tariff', '$http',
  function($scope, $routeParams, $location, Building, Tariff, $http) {
  $scope.tariffs  = Tariff.query();
  $scope.building = {};
  $scope.save = function(building) {
    console.log(building);
    Building.save(building, function() {
      $('.navbar').notify("Дом добавлен", 'success');
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
        $('.navbar').notify("Дом удален", 'success');
        $location.path('/buildings');
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.building.$update(function() {
      $('.navbar').notify("Информация о доме обновлена", 'success');
      $location.path('/buildings');
    });
  };
}]);

//#################################
//#######   Apartments  ##########
//#################################

hapControllers.controller('ApartmentsCtrl', ['$scope', '$rootScope', '$routeParams', 'Building', 'Apartment', '$http', 'moment', 'TariffGroup', 'Period',
  function($scope, $rootScope, $routeParams, Building, Apartment, $http, moment, TariffGroup, Period) {
  $scope.building = Building.get({id: $routeParams.building_id});
  $scope.apartments = Apartment.query({building_id: $routeParams.building_id, period: $rootScope.current_period.date});

  $scope.act = function (apartment_id, apt_number) {
    var data = {};
    $http({method: 'GET', url: 'http://localhost:1337/api/charges_for_apt/' + apartment_id}).
    success(function(charges, status) {
      var tariff_group_ids = [];
      var data = {
        street: $scope.building.street,
        number: $scope.building.number,
        apt_number: apt_number,
        head: [],
        body: []
      };
      angular.forEach(charges, function(charge, key){
        tariff_group_ids.push(charge._tariff_group);
      });
      Period.getAll(function (periods) {
        data.head.push('Период');
        TariffGroup.query({ 'ids': tariff_group_ids.join(',') }, function (tariff_groups) {
          var tariff_group_map = [];
          angular.forEach(tariff_groups, function(tariff_group, key){
            data.head.push(tariff_group.name);
            tariff_group_map.push(tariff_group._id);
          });
          var period_map = [];
          angular.forEach(periods, function(period, key){
            var row = [];
            period_map.push(moment(period.date).format('MM.YYYY'))
            row.push(moment(period.date).format('MMMM YYYY'))
            angular.forEach(tariff_groups, function(tariff_group, key){
              row.push(0);
            });
            data.body.push(row);
          });
          console.log(period_map);
          console.log(tariff_group_map);
          angular.forEach(charges, function(charge, key){
            console.log(period_map.indexOf(moment(charge.period).format('MM.YYYY')) + ' ' + moment(charge.period).format('MM.YYYY'));
            console.log(tariff_group_map.indexOf(charge._tariff_group) + 1);
            data.body[period_map.indexOf(moment(charge.period).format('MM.YYYY'))][tariff_group_map.indexOf(charge._tariff_group) + 1] = (charge.value + charge.reappraisal_auto + charge.reappraisal_manual).toFixed(2);
          })
          console.log(data);
          require('./libs/excel-report').generateAct(data, $('.navbar'), localStorage);
        });
      });
    }).
    error(function(data, status) {
      console.log("Request failed");
    });
  }
}]);

hapControllers.controller('ApartmentsNewCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id}, function(building) {
    $scope.apartment = { _building: $scope.building._id, residents: 1, period: $rootScope.current_period.date };
  });
  $scope.save = function(apartment) {
    console.log(apartment);
    Apartment.save(apartment, function() {
      $('.navbar').notify("Квартира добавлена", 'success');
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
        $('.navbar').notify("Квартира удалена", 'success');
        $location.path('/apartments/' + $scope.building._id);
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.apartment.$update(function() {
      $('.navbar').notify("Информация о квартире обновлена", 'success');
      $location.path('/apartments/' + $scope.building._id);
    });
  };
}]);

hapControllers.controller('ApartmentsEditChangesCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Apartment', '$http', '$timeout', '$dialogs',
  function($scope, $routeParams, $location, Building, Apartment, $http, $timeout, $dialogs) {
  $scope.apartment  = Apartment.get({id: $routeParams.apartment_id}, function(apartment){
    console.log(apartment);
    $scope.building = Building.get({id: apartment._building});
  });

  $scope.save = function() {
    $scope.apartment.$update(function() {
      $('.navbar').notify("Информация о квартире обновлена", 'success');
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
      $scope.tariff_group.$delete(function(res) {
          $('.navbar').notify("Группа тарифов удалена", 'success');
          $location.path('/tariffGroups');
        }, function(res) {
          if(res.data.status == "BUSY") {
            $('.navbar').notify("Невозможно удалить. Группа тарифов используется.", 'error');
          }
          if(res.data.status == "FAIL") {
            $('.navbar').notify("Ошибка при попытке удалить", 'error');
          }
        }
      );
    },function(btn){
      //$scope.confirmed = 'Shame on you for not thinking this is awesome!';
    });
  };

  $scope.save = function() {
    console.log($scope.tariff_group._id);
    $scope.tariff_group.$update(function() {
      $('.navbar').notify("Группа тарифов сохранена", 'success');
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
      $('.navbar').notify("Тариф создан", 'success');
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
      $scope.tariff.$delete(function(res) {
          $('.navbar').notify("Тариф удален", 'success');
          $location.path('/tariffs');
        }, function(res) {
          if(res.data.status == "BUSY") {
            $('.navbar').notify("Невозможно удалить. Тариф используется.", 'error');
          }
          if(res.data.status == "FAIL") {
            $('.navbar').notify("Ошибка при попытке удалить", 'error');
          }
        }
      );
    },function(btn){
      //$scope.confirmed = 'Shame on you for not thinking this is awesome!';
    });
  };

  $scope.save = function() {
    console.log($scope.tariff._id);
    $scope.tariff.$update(function() {
      $('.navbar').notify("Тариф сохранен", 'success');
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

hapControllers.controller('ChargesBuildingCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http', '$dialogs', 'Tariff',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http, $dialogs, Tariff) {
  $scope.building = Building.get({id: $routeParams.building_id});

  var tariffs = Tariff.query(function() {
    $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + $routeParams.building_id + '/' + $rootScope.current_period.date}).
    success(function(data, status) {
      var tariff_group_ids = [];
      $scope.tariffs = {};
      angular.forEach(data.tariffs, function(tariff, key){
        tariff_group_ids.push(tariff._tariff_group._id);
        $scope.tariffs[tariff._tariff_group._id] = {};
        angular.forEach(tariffs, function(global_tariff, key){
          if(global_tariff._tariff_group._id == tariff._tariff_group._id)
          {
            $scope.tariffs[tariff._tariff_group._id][global_tariff._id] = (global_tariff);
          }
        });
      });
      console.log($scope.tariffs);
      var apartments = Apartment.query({building_id: $routeParams.building_id, period: $rootScope.current_period.date}, function(apartments)
      {
        $scope.apts         = {};
        $scope.residents    = 0;
        $scope.space        = 0;
        $scope.common_space = 0;
        angular.forEach(apartments, function(apt, key){
        // apartments.forEach(function(apt) {
          // console.log(apt.number);
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
          console.log(charges);
          var total_volume = {};
          var total_norm = {};
          angular.forEach(charges, function(charge, key){
          // charges.forEach(function(charge) {
            // console.log(charge);
            // console.log($scope.apts);
            $scope.apts[charge._apartment].charges[charge._tariff_group] = {
              _id:                 charge._id,
              has_counter:         charge.has_counter,
              norm:                charge.norm,
              volume:              charge.volume,
              value:               charge.value,
              reappraisal_auto:    charge.reappraisal_auto,
              reappraisal_manual:  charge.reappraisal_manual,
              _tariff:             (charge._tariff) ? charge._tariff : ""
            };
            if(!charge.has_counter && charge.norm != null)
              total_norm[charge._tariff_group] = Number(charge.norm);

            if(total_volume[charge._tariff_group])
              total_volume[charge._tariff_group] += Number(charge.volume);
            else
              total_volume[charge._tariff_group] = Number(charge.volume);
          })
          // console.log('total_volume');
          // console.log(total_volume);
          console.log($scope.apts);
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
              norm: (total_norm[tariff._tariff_group._id]) ? total_norm[tariff._tariff_group._id] : 0,
              calc_var: calc_var
            };

            console.log('tab');
            console.log($scope.tabs[tariff._tariff_group._id]);
            console.log($scope.tabs[tariff._tariff_group._id].tariff.static_norm);
            // Wathing common trigger
            var updateCharges = function() {
              // console.log($scope.apts);
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
                  $scope.apts[key].charges[tariff._tariff_group._id].value =
                    ($scope.apts[key].charges[tariff._tariff_group._id].volume *
                      (($scope.apts[key].charges[tariff._tariff_group._id]._tariff)
                        ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[key].charges[tariff._tariff_group._id]._tariff].rate
                        : $scope.tabs[tariff._tariff_group._id].tariff.rate
                      )
                    ).toFixed(2);
                });
              }
              else
              {
                console.log('Use norm');
                if(!$scope.tabs[tariff._tariff_group._id].tariff.static_norm) {
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
                    $scope.apts[key].charges[tariff._tariff_group._id].value =
                      ($scope.apts[key].charges[tariff._tariff_group._id].volume *
                        (($scope.apts[key].charges[tariff._tariff_group._id]._tariff)
                          ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[key].charges[tariff._tariff_group._id]._tariff].rate
                          : $scope.tabs[tariff._tariff_group._id].tariff.rate
                        )
                      ).toFixed(2);
                  });
                  if (real_sum != $scope.tabs[tariff._tariff_group._id].volume) {
                    // console.log($scope.tabs[tariff._tariff_group._id].volume);
                    // console.log(real_sum);
                    // console.log(max_key);
                    // console.log('Repaired float error ' + ($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4) + ' for ' + $scope.apts[max_key].number);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].volume = (Number($scope.apts[max_key].charges[tariff._tariff_group._id].volume) + Number(($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4))).toFixed(4);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].value =
                      ($scope.apts[max_key].charges[tariff._tariff_group._id].volume *
                        (($scope.apts[max_key].charges[tariff._tariff_group._id]._tariff)
                          ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[max_key].charges[tariff._tariff_group._id]._tariff].rate
                          : $scope.tabs[tariff._tariff_group._id].tariff.rate
                        )
                      ).toFixed(2);
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
                    $scope.apts[key].charges[tariff._tariff_group._id].value =
                      ($scope.apts[key].charges[tariff._tariff_group._id].volume *
                        (($scope.apts[key].charges[tariff._tariff_group._id]._tariff)
                          ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[key].charges[tariff._tariff_group._id]._tariff].rate
                          : $scope.tabs[tariff._tariff_group._id].tariff.rate
                        )
                      ).toFixed(2);
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
              console.log('Update charges for norm field');
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
              $scope.$watch("apts['" + key +"'].charges['" + tariff._tariff_group._id + "']._tariff", function( newValue ) {
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
  });
  $scope.save = function() {
    console.log('Saving tariff_group');
    // console.log(tariff_group_id);
    var charges = [];
    angular.forEach($scope.apts, function(apt, key){
      angular.forEach(apt.charges, function(charge, tariff_group_id){
        charges.push({
          _id:                 charge._id,
          has_counter:         charge.has_counter,
          norm:                charge.norm,
          volume:              charge.volume,
          value:               charge.value,
          reappraisal_auto:    charge.reappraisal_auto,
          reappraisal_manual:  charge.reappraisal_manual,
          _tariff:             charge._tariff
        });
      });
    });
    // console.log(charges);
    $http({method: 'POST', url: 'http://localhost:1337/api/save_charges_for_building', data: {charges: charges}}).
    success(function(data, status) {
      $('.navbar').notify("Информация о начислениях сохранена", 'success');
      $scope.data = data || "Request failed";
      $scope.status = status;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
    });
  };
  $scope.clearReappraisal = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите обнулить проведенные перерасчеты?', 'success');
    dlg.result.then(function(btn){
      console.log('Clearing reappraisal');
      var charges = [];
      angular.forEach($scope.apts, function(apt, key){
        angular.forEach(apt.charges, function(charge, cid){
          charges.push({
            _id: charge._id,
          });
          // console.log($scope.apts[key].charges[cid].reappraisal_auto);
          $scope.apts[key].charges[cid].reappraisal_auto = 0;
        });
      });
      // console.log(charges);
      $http({method: 'POST', url: 'http://localhost:1337/api/clear_reappraisal', data: {charges: charges}}).
      success(function(data, status) {
        $('.navbar').notify("Перерасчеты за прошлые периоды обнулены", 'success');
        $scope.data = data || "Request failed";
        $scope.status = status;
      }).
      error(function(data, status) {
        $scope.data = data || "Request failed";
        $scope.status = status;
      });
    },function(btn){});
  };
}]);

//#################################
//#######  Reappraisals  ##########
//#################################

hapControllers.controller('ReappraisalsCtrl', ['$scope', 'Building', function($scope, Building) {
  $scope.buildings = Building.query();
}]);

hapControllers.controller('ReappraisalsSelectPeriodCtrl', ['$routeParams', '$scope', 'Building', 'Period', '$location', function($routeParams, $scope, Building, Period, $location) {
  $scope.buildings = Building.query();
  $scope.periods = Period.query();
  $scope.date = null;
  $scope.continue = function() {
    $location.path('/reappraisals/building/' + $routeParams.building_id + '/' + $scope.date);
  }
}]);

hapControllers.controller('ReappraisalsBuildingCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http', 'Tariff',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http, Tariff) {
  $scope.date = $routeParams.period;
  $scope.building = Building.get({id: $routeParams.building_id});

  var tariffs = Tariff.query(function() {
    $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + $routeParams.building_id + '/' + $rootScope.current_period.date}).
    success(function(data, status) {
      var tariff_group_ids = [];
      $scope.tariffs = {};
      angular.forEach(data.tariffs, function(tariff, key){
        tariff_group_ids.push(tariff._tariff_group._id);
        $scope.tariffs[tariff._tariff_group._id] = {};
        angular.forEach(tariffs, function(global_tariff, key){
          if(global_tariff._tariff_group._id == tariff._tariff_group._id)
          {
            $scope.tariffs[tariff._tariff_group._id][global_tariff._id] = (global_tariff);
          }
        });
      });
      // console.log(data);
      var apartments = Apartment.query({building_id: $routeParams.building_id, period: $scope.date}, function(apartments)
      {
        console.log(apartments);
        $scope.apts         = {};
        $scope.residents    = 0;
        $scope.space        = 0;
        $scope.common_space = 0;
        apartments.forEach(function(apt) {
          $scope.apts[apt._id] = {
            number: apt.number,
            contractor: apt.contractor.last_name + ' ' + apt.contractor.first_name + ' ' + apt.contractor.second_name,
            residents    : (apt.new_residents != null) ? apt.new_residents : apt.residents,
            space        : (apt.new_space != null) ? apt.new_space : apt.space,
            common_space : (apt.new_common_space != null) ? apt.new_common_space : apt.common_space,
            charges: {}
          };
          $scope.residents    += (apt.new_residents != null) ? apt.new_residents : apt.residents;
          $scope.space        += (apt.new_space != null) ? apt.new_space : apt.space;
          $scope.common_space += (apt.new_common_space != null) ? apt.new_common_space : apt.common_space;
        });
        // console.log('apts');
        console.log($scope.apts);
        $http({method: 'GET', url: 'http://localhost:1337/api/charges_for_reappraisal/' + $routeParams.building_id + '/' + tariff_group_ids + '/' + $scope.date}).
        success(function(charges, status) {
          // console.log('STARTED');
          var total_volume = {};
          var total_norm = {};
          charges.forEach(function(charge) {
            console.log(charge);
            // console.log($scope.apts);
            $scope.apts[charge._apartment].charges[charge._tariff_group] = {
              _id:                 charge._id,
              has_counter:         charge.has_counter,
              norm:                charge.norm,
              volume:              charge.volume,
              value:               charge.value,
              reappraisal_auto:    charge.reappraisal_auto,
              reappraisal_manual:  charge.reappraisal_manual,
              _tariff:             (charge._tariff) ? charge._tariff : "",
              new_norm:            charge.new_norm,
              new_volume:          charge.new_volume,
              new_value:           charge.new_value,
            };
            if(!charge.has_counter && charge.norm != null)
              total_norm[charge._tariff_group] = Number(charge.norm);

            if(total_volume[charge._tariff_group])
              total_volume[charge._tariff_group] += Number(charge.volume);
            else
              total_volume[charge._tariff_group] = Number(charge.volume);
          })
          console.log('total_volume');
          console.log(total_volume);
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
              norm: (total_norm[tariff._tariff_group._id]) ? total_norm[tariff._tariff_group._id] : 0,
              calc_var: calc_var
            };
            // console.log('tab');
            // console.log($scope.tabs[tariff._tariff_group._id]);
            // console.log($scope.tabs[tariff._tariff_group._id]);
            // Wathing common trigger
            /*var updateCharges = function() {
              if(!tariff._tariff_group.use_norm) {
                console.log('Not Use norm');
                angular.forEach($scope.apts, function(apt, key){
                  var calc_var = 0;
                  if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                  if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                  if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                  // $scope.apts[key].charges[tariff._tariff_group._id].has_counter = false;
                  $scope.apts[key].charges[tariff._tariff_group._id].new_norm         = '';
                  $scope.apts[key].charges[tariff._tariff_group._id].new_volume       = (calc_var).toFixed(4);
                  $scope.apts[key].charges[tariff._tariff_group._id].new_value        = ($scope.apts[key].charges[tariff._tariff_group._id].new_volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
                  $scope.apts[key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[key].charges[tariff._tariff_group._id].new_value - $scope.apts[key].charges[tariff._tariff_group._id].value).toFixed(2);
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
                  // console.log('new to_share = ' + to_share);
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
                  // console.log('new to_share = ' + to_share);
                  // console.log('new calc_var = ' + calc_var);
                  // console.log('new norm = ' + norm);
                  angular.forEach($scope.apts, function(apt, key){
                    var calc_var = 0;
                    if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                    if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                    if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                    // console.log('new calc_var = ' + calc_var);
                    $scope.apts[key].charges[tariff._tariff_group._id].new_norm   = (apt.charges[tariff._tariff_group._id].has_counter) ? '' : norm;
                    $scope.apts[key].charges[tariff._tariff_group._id].new_volume = (!apt.charges[tariff._tariff_group._id].has_counter) ? (norm * calc_var).toFixed(4) : $scope.apts[key].charges[tariff._tariff_group._id].volume;
                    if(!apt.charges[tariff._tariff_group._id].has_counter && ($scope.apts[key].charges[tariff._tariff_group._id].new_volume > max_value || max_value == null))
                    {
                      max_value = $scope.apts[key].charges[tariff._tariff_group._id].new_volume;
                      max_key   = key;
                    }
                    real_sum += Number($scope.apts[key].charges[tariff._tariff_group._id].new_volume);
                    $scope.apts[key].charges[tariff._tariff_group._id].new_value = ($scope.apts[key].charges[tariff._tariff_group._id].new_volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
                    // console.log('new new_value = ' + $scope.apts[key].charges[tariff._tariff_group._id].new_volume);
                    $scope.apts[key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[key].charges[tariff._tariff_group._id].new_value - $scope.apts[key].charges[tariff._tariff_group._id].value).toFixed(2);
                  });
                  if (real_sum != $scope.tabs[tariff._tariff_group._id].volume) {
                    // console.log($scope.tabs[tariff._tariff_group._id].volume);
                    // console.log(real_sum);
                    // console.log(max_key);
                    // console.log('Repaired float error ' + ($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4) + ' for ' + $scope.apts[max_key].number);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].new_volume       = (Number($scope.apts[max_key].charges[tariff._tariff_group._id].new_volume) + Number(($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4))).toFixed(4);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].new_value        = ($scope.apts[max_key].charges[tariff._tariff_group._id].new_volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[max_key].charges[tariff._tariff_group._id].new_value - $scope.apts[max_key].charges[tariff._tariff_group._id].value).toFixed(2);
                  };
                }
              }
            };*/
            var updateCharges = function() {
              // console.log($scope.apts);
              if(!tariff._tariff_group.use_norm) {
                console.log('Not Use norm');
                angular.forEach($scope.apts, function(apt, key){
                  var calc_var = 0;
                  if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                  if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                  if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                  $scope.apts[key].charges[tariff._tariff_group._id].has_counter = false;
                  $scope.apts[key].charges[tariff._tariff_group._id].new_norm = '';
                  $scope.apts[key].charges[tariff._tariff_group._id].new_volume = (calc_var).toFixed(4);
                  $scope.apts[key].charges[tariff._tariff_group._id].new_value =
                    ($scope.apts[key].charges[tariff._tariff_group._id].new_volume *
                      (($scope.apts[key].charges[tariff._tariff_group._id]._tariff)
                        ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[key].charges[tariff._tariff_group._id]._tariff].rate
                        : $scope.tabs[tariff._tariff_group._id].tariff.rate
                      )
                    ).toFixed(2);
                  $scope.apts[key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[key].charges[tariff._tariff_group._id].new_value - $scope.apts[key].charges[tariff._tariff_group._id].value).toFixed(2);
                });
              }
              else
              {
                console.log('Use norm');
                if(!$scope.tabs[tariff._tariff_group._id].tariff.static_norm) {
                  // console.log('Update charges for volume');
                  var max_value = null;
                  var max_key   = null;
                  var real_sum  = 0;
                  var to_share  = $scope.tabs[tariff._tariff_group._id].volume;
                  // console.log('new to_share = ' + to_share);
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
                  var new_norm = (to_share/calc_var).toFixed(4);
                  // console.log(to_share + " | " + calc_var);
                  // console.log(new_norm);
                  angular.forEach($scope.apts, function(apt, key){
                    var calc_var = 0;
                    if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                    if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                    if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                    $scope.apts[key].charges[tariff._tariff_group._id].new_norm = (apt.charges[tariff._tariff_group._id].has_counter) ? '' : new_norm;
                    $scope.apts[key].charges[tariff._tariff_group._id].new_volume = (!apt.charges[tariff._tariff_group._id].has_counter) ? (new_norm * calc_var).toFixed(4) : apt.charges[tariff._tariff_group._id].volume.toFixed(4);
                    if(!apt.charges[tariff._tariff_group._id].has_counter && ($scope.apts[key].charges[tariff._tariff_group._id].new_volume > max_value || max_value == null))
                    {
                      max_value = $scope.apts[key].charges[tariff._tariff_group._id].new_volume;
                      // console.log("INIT max_value = " + max_value);
                      max_key   = key;
                    }
                    real_sum += Number($scope.apts[key].charges[tariff._tariff_group._id].new_volume);
                    $scope.apts[key].charges[tariff._tariff_group._id].new_value =
                      ($scope.apts[key].charges[tariff._tariff_group._id].new_volume *
                        (($scope.apts[key].charges[tariff._tariff_group._id]._tariff)
                          ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[key].charges[tariff._tariff_group._id]._tariff].rate
                          : $scope.tabs[tariff._tariff_group._id].tariff.rate
                        )
                      ).toFixed(2);
                    $scope.apts[key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[key].charges[tariff._tariff_group._id].new_value - $scope.apts[key].charges[tariff._tariff_group._id].value).toFixed(2);
                  });
                  if (real_sum != $scope.tabs[tariff._tariff_group._id].volume) {
                    // console.log("max_value = " + max_value);
                    // console.log("max_key = " + max_key);
                    // console.log("real_sum = " + real_sum);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].new_volume = (Number($scope.apts[max_key].charges[tariff._tariff_group._id].new_volume) + Number(($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4))).toFixed(4);
                    // console.log($scope.apts[max_key].charges[tariff._tariff_group._id].new_volume);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].new_value =
                      ($scope.apts[max_key].charges[tariff._tariff_group._id].new_volume *
                        (($scope.apts[max_key].charges[tariff._tariff_group._id]._tariff)
                          ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[max_key].charges[tariff._tariff_group._id]._tariff].rate
                          : $scope.tabs[tariff._tariff_group._id].tariff.rate
                        )
                      ).toFixed(2);
                    // console.log($scope.apts[max_key].charges[tariff._tariff_group._id].new_value);
                    $scope.apts[max_key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[max_key].charges[tariff._tariff_group._id].new_value - $scope.apts[max_key].charges[tariff._tariff_group._id].value).toFixed(2);
                  };
                }
                else
                {
                  angular.forEach($scope.apts, function(apt, key){
                    var calc_var = 0;
                    if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                    if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                    if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                    $scope.apts[key].charges[tariff._tariff_group._id].new_norm = (apt.charges[tariff._tariff_group._id].has_counter) ? '' : $scope.tabs[tariff._tariff_group._id].norm;
                    $scope.apts[key].charges[tariff._tariff_group._id].new_volume = (!apt.charges[tariff._tariff_group._id].has_counter) ? ($scope.tabs[tariff._tariff_group._id].norm * calc_var).toFixed(4) : apt.charges[tariff._tariff_group._id].volume.toFixed(4);
                    $scope.apts[key].charges[tariff._tariff_group._id].new_value =
                      ($scope.apts[key].charges[tariff._tariff_group._id].new_volume *
                        (($scope.apts[key].charges[tariff._tariff_group._id]._tariff)
                          ? $scope.tariffs[tariff._tariff_group._id][$scope.apts[key].charges[tariff._tariff_group._id]._tariff].rate
                          : $scope.tabs[tariff._tariff_group._id].tariff.rate
                        )
                      ).toFixed(2);
                    $scope.apts[key].charges[tariff._tariff_group._id].reappraisal_auto = ($scope.apts[key].charges[tariff._tariff_group._id].new_value - $scope.apts[key].charges[tariff._tariff_group._id].value).toFixed(2);
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
  });
  $scope.save = function() {
    console.log('Saving reappraisal');
    // console.log(tariff_group_id);
    var charges = [];
    angular.forEach($scope.apts, function(apt, aid){
      angular.forEach(apt.charges, function(charge, tariff_group_id){
        charges.push({
          building_id:         $routeParams.building_id,
          tariff_group_id:     tariff_group_id,
          number:              apt.number,
          reappraisal_auto:    charge.reappraisal_auto,
          period:              $rootScope.current_period.date
        });
      });
    });
    console.log(charges);
    $http({method: 'POST', url: 'http://localhost:1337/api/save_reappraisal_for_building', data: {charges: charges}}).
    success(function(data, status) {
      $('.navbar').notify("Информация о перерасчете добавлена к текущему начислению", 'success');
      $scope.data = data || "Request failed";
      $scope.status = status;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
    });
  };
}]);

//#################################
//#######     Debts      ##########
//#################################

hapControllers.controller('DebtsCtrl', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {
  $scope.file = null;
  $scope.default_dir = (localStorage.default_dir) ? localStorage.default_dir : '';
  $scope.ready2save = false;
  $scope.change = function(file) {
    $scope.ready2save = false;
    var XLSX = require('xlsx');
    var workbook = XLSX.readFile(file);
    var sheet_name_list = workbook.SheetNames;
    var result = [];
    function decode_col(c) { var d = 0, i = 0; for(; i !== c.length; ++i) d = 26*d + c.charCodeAt(i) - 64; return d - 1; }
    function decode_row(rowstr) { return Number(rowstr) - 1; }
    function split_cell(cstr) { return cstr.replace(/(\$?[A-Z]*)(\$?[0-9]*)/,"$1,$2").split(","); }
    function decode_cell(cstr) { var splt = split_cell(cstr); return { c:decode_col(splt[0]), r:decode_row(splt[1]) }; }
    function init_result(range) {
      var range_converted = range.split(":");
      console.log(range_converted);
      var cell_start = decode_cell(range_converted[0]);
      var cell_end   = decode_cell(range_converted[1]);
      var result = [];
      console.log(cell_end);
      for (var i = 0; i <= cell_end.r; i++) {
        result[i] = [];
        for (var j = 0; j <= cell_end.c; j++) {
          result[i][j] = '';
        };
      };
      return result;
    }
    var result = [];
    sheet_name_list.forEach(function(y) {
      var worksheet = workbook.Sheets[y];
      console.log(worksheet);
      result = init_result(worksheet["!ref"]);
      console.log(result);
      for (var z in worksheet) {
        if(z[0] === '!') continue;
        var cell = decode_cell(z);
        console.log(decode_cell(z));
        result[cell.r][cell.c] = worksheet[z].v;
        console.log(y + "!" + z + "=" + JSON.stringify(worksheet[z].v));
      }
      console.log(result);
    });
    var file_corrupted = false;
    result.forEach(function(row, key){
      if(row.length < 2)
      {
        $('.navbar').notify("Неверное количество полей в строке " + (key+1), {className: 'error'});
        file_corrupted = true;
      } else {
        row[2] = 'loading';
        row[3] = 'В обработке';
        row[4] = '';
      }
      if(isNaN(row[1]) || row[1] == "")
      {
        $('.navbar').notify("Неверно указана сумма в строке " + (key+1), {className: 'error'});
        file_corrupted = true;
      }
    });
    function processRow(i) {
      $http({method: 'POST', url: 'http://localhost:1337/api/find_apt', data: {period: moment($rootScope.current_period.date).format(), name: result[i][0]}}).
      success(function(data, status) {
        console.log("Success");
        if(data) {
          result[i][2] = 'ул. ' + data._building.street + ', дом. ' + data._building.number + ' к. ' + data.number;
          result[i][3] = 'Найден';
          result[i][4] = 'success';
          result[i][5] = data._id;
        } else {
          result[i][2] = '-';
          result[i][3] = 'Не найден';
          result[i][4] = 'danger';
        }
        if(result.length > ++i) {
          processRow(i);
        } else {
          $scope.ready2save = true;
        }
      }).
      error(function(data, status) {
        console.log("Request failed");
        result[i][2] = '-';
        result[i][3] = 'Ошибка при поиске';
        result[i][4] = 'danger';
        if(result.length > ++i) {
          processRow(i);
        } else {
          $scope.ready2save = true;
        }
      });
    };
    if(!file_corrupted)
    {
      $scope.table = result;
      if(result.length) processRow(0);
    }
  };
  $scope.save = function() {
    var data = [];
    angular.forEach($scope.table, function(row, key){
      if(row[4] == 'success') data.push([row[5], row[1]]);
    });
    console.log(data);
    $http({method: 'POST', url: 'http://localhost:1337/api/save_debts', data: {data: data}}).
    success(function(data, status) {
      console.log("Success");
      console.log(status);
      $('.navbar').notify("Долги для " + data.count + " квартир обновлены", 'success');
    }).
    error(function(data, status) {
      console.log("Request failed");
      console.log(status);
    });
  };
}]);

hapControllers.controller('LoadingCtrl', ['$scope', function($scope) {
}]);

//#################################
//#######    Options     ##########
//#################################

hapControllers.controller('OptionsCtrl', ['$scope', '$routeParams', '$location', 'Options',
  function($scope, $routeParams, $location, Options) {
  $scope.opts  = Options.get();

  $scope.save = function() {
    console.log($scope.opts);
    $scope.opts.$update(function() {
      $('.navbar').notify("Информация обновлена", 'success');
    });
  };
}]);
