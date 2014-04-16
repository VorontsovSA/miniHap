'use strict';


// Declare app level module which depends on filters, and services
angular.module('hap', [
  'ngRoute',
  'hap.filters',
  'hap.services',
  'hap.directives',
  'hap.controllers',
  'ui.bootstrap',
  'checklist-model',
  'dialogs',
  'angularMoment'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/buildings', {templateUrl: 'partials/buildings/index.html', controller: 'BuildingsCtrl'});
  $routeProvider.when('/buildings/new', {templateUrl: 'partials/buildings/new.html', controller: 'BuildingsNewCtrl'});
  $routeProvider.when('/buildings/edit/:building_id', {templateUrl: 'partials/buildings/edit.html', controller: 'BuildingsEditCtrl'});
  $routeProvider.when('/apartments/:building_id', {templateUrl: 'partials/apartments/index.html', controller: 'ApartmentsCtrl'});
  $routeProvider.when('/apartments/new/:building_id', {templateUrl: 'partials/apartments/new.html', controller: 'ApartmentsNewCtrl'});
  $routeProvider.when('/apartments/edit/:apartment_id', {templateUrl: 'partials/apartments/edit.html', controller: 'ApartmentsEditCtrl'});
  $routeProvider.when('/tariffGroups', {templateUrl: 'partials/tariffGroups/index.html', controller: 'TariffGroupsCtrl'});
  $routeProvider.when('/tariffGroups/new', {templateUrl: 'partials/tariffGroups/new.html', controller: 'TariffGroupsNewCtrl'});
  $routeProvider.when('/tariffGroups/edit/:tariff_group_id', {templateUrl: 'partials/tariffGroups/edit.html', controller: 'TariffGroupsEditCtrl'});
  $routeProvider.when('/tariffs', {templateUrl: 'partials/tariffs/index.html', controller: 'TariffsCtrl'});
  $routeProvider.when('/tariffs/new', {templateUrl: 'partials/tariffs/new.html', controller: 'TariffsNewCtrl'});
  $routeProvider.when('/tariffs/edit/:tariff_id', {templateUrl: 'partials/tariffs/edit.html', controller: 'TariffsEditCtrl'});
  $routeProvider.when('/charges', {templateUrl: 'partials/charges/index.html', controller: 'ChargesCtrl'});
  $routeProvider.when('/charges/building/:building_id', {templateUrl: 'partials/charges/building.html', controller: 'ChargesBuildingCtrl'});
  $routeProvider.otherwise({redirectTo: '/buildings'});
}]).
run(['$window', function($window) { // instance-injector
  // This is an example of a run block.
  // You can have as many of these as you want.
  // You can only inject instances (not Providers)
  // into run blocks
  $window.moment.lang('ru');
}]);
