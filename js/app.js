'use strict';


// Declare app level module which depends on filters, and services
angular.module('hap', [
  'ngRoute',
  'hap.filters',
  'hap.services',
  'hap.directives',
  'hap.controllers',
  'ui.bootstrap',
  'dialogs'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/objects', {templateUrl: 'partials/objects/index.html', controller: 'ObjectsCtrl'});
  $routeProvider.when('/tariffGroups', {templateUrl: 'partials/tariffGroups/index.html', controller: 'TariffGroupsCtrl'});
  $routeProvider.when('/tariffGroups/new', {templateUrl: 'partials/tariffGroups/new.html', controller: 'TariffGroupsNewCtrl'});
  $routeProvider.when('/tariffGroups/edit/:tariff_group_id', {templateUrl: 'partials/tariffGroups/edit.html', controller: 'TariffGroupsEditCtrl'});
  $routeProvider.when('/tariffs', {templateUrl: 'partials/tariffs/index.html', controller: 'TariffsIndexCtrl'});
  $routeProvider.when('/tariffs/new', {templateUrl: 'partials/tariffs/new.html', controller: 'TariffsNewCtrl'});
  $routeProvider.when('/tariffs/edit/:tariff_id', {templateUrl: 'partials/tariffs/edit.html', controller: 'TariffsEditCtrl'});
  //$routeProvider.otherwise({redirectTo: '/objects'});
}]);
