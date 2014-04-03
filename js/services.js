'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('phonecatServices', ['ngResource']).
  value('version', '0.1');

angular.module('hap.services', ['ngResource']).
  factory('TariffGroup', function($resource){
    return $resource('http://localhost:1337/api/tariff_groups/:tariff_group_id', {}, {
      query: {method:'GET', params:{tariff_group_id: ''}, isArray:true}
    });
  }).
  factory('CurrentMonth', function($resource){
    return $resource('http://localhost:1337/api/current_month/', {}, {
      update: {method:'PUT', isArray:false}
    });
  });
