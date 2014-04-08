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
  'dialogs'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/buildings', {templateUrl: 'partials/buildings/index.html', controller: 'BuildingsCtrl'});
  $routeProvider.when('/buildings/new', {templateUrl: 'partials/buildings/new.html', controller: 'BuildingsNewCtrl'});
  $routeProvider.when('/buildings/edit/:building_id', {templateUrl: 'partials/buildings/edit.html', controller: 'BuildingsEditCtrl'});
  $routeProvider.when('/appartments/:building_id', {templateUrl: 'partials/appartments/index.html', controller: 'AppartmentsCtrl'});
  $routeProvider.when('/appartments/new/:building_id', {templateUrl: 'partials/appartments/new.html', controller: 'AppartmentsNewCtrl'});
  $routeProvider.when('/appartments/edit/:appartment_id', {templateUrl: 'partials/appartments/edit.html', controller: 'AppartmentsEditCtrl'});
  $routeProvider.when('/tariffGroups', {templateUrl: 'partials/tariffGroups/index.html', controller: 'TariffGroupsCtrl'});
  $routeProvider.when('/tariffGroups/new', {templateUrl: 'partials/tariffGroups/new.html', controller: 'TariffGroupsNewCtrl'});
  $routeProvider.when('/tariffGroups/edit/:tariff_group_id', {templateUrl: 'partials/tariffGroups/edit.html', controller: 'TariffGroupsEditCtrl'});
  $routeProvider.when('/tariffs', {templateUrl: 'partials/tariffs/index.html', controller: 'TariffsCtrl'});
  $routeProvider.when('/tariffs/new', {templateUrl: 'partials/tariffs/new.html', controller: 'TariffsNewCtrl'});
  $routeProvider.when('/tariffs/edit/:tariff_id', {templateUrl: 'partials/tariffs/edit.html', controller: 'TariffsEditCtrl'});
  $routeProvider.otherwise({redirectTo: '/buildings'});
}]);
