'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('phonecatServices', ['ngResource']).
  value('version', '0.1');

angular.module('hap.services', ['ngResource']).
  factory('TariffGroup', function($resource){
    return $resource('http://localhost:1337/api/tariff_group/:id', {id: '@_id'}, {
      query:  {method:'GET', isArray:true},
      get:    {method:'GET', isArray:false},
      update: {method:'PUT', isArray:false},
      delete: {method:'DELETE', isArray:false},
    });
  }).
  factory('CurrentMonth', function($resource){
    return $resource('http://localhost:1337/api/current_month/', {}, {
      update: {method:'PUT', isArray:false}
    });
  });
