'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('phonecatServices', ['ngResource']).
  value('version', '0.1');

angular.module('hap.services', ['ngResource']).
  factory('Options', function($resource){
    return $resource('http://localhost:1337/api/options/:id', {id: '@_id'}, {
      get:    {method:'GET', isArray:false},
      update: {method:'PUT', isArray:false}
    });
  }).
  factory('Building', function($resource){
    return $resource('http://localhost:1337/api/building/:id', {id: '@_id'}, {
      query:  {method:'GET', isArray:true},
      get:    {method:'GET', isArray:false},
      update: {method:'PUT', isArray:false},
      delete: {method:'DELETE', isArray:false},
    });
  }).
  factory('Apartment', function($resource){
    return $resource('http://localhost:1337/api/apartment/:id', {id: '@_id'}, {
      query:  {method:'GET', isArray:true},
      get:    {method:'GET', isArray:false},
      update: {method:'PUT', isArray:false},
      delete: {method:'DELETE', isArray:false},
    });
  }).
  factory('TariffGroup', function($resource){
    return $resource('http://localhost:1337/api/tariff_group/:id', {id: '@_id'}, {
      query:  {method:'GET', isArray:true},
      get:    {method:'GET', isArray:false},
      update: {method:'PUT', isArray:false},
      delete: {method:'DELETE', isArray:false},
    });
  }).
  factory('Tariff', function($resource){
    return $resource('http://localhost:1337/api/tariff/:id', {id: '@_id'}, {
      query:  {method:'GET', isArray:true},
      get:    {method:'GET', isArray:false},
      update: {method:'PUT', isArray:false},
      delete: {method:'DELETE', isArray:false},
    });
  }).
  factory('Period', function($resource){
    return $resource('http://localhost:1337/api/period/:query_type/:id', {id: '@_id'}, {
      getCurrent: {method:'GET', params:{query_type:'current'}, isArray:false},
      getByDate:  {method:'GET', params:{query_type:'date'}, isArray:false},
      getAll:     {method:'GET', params:{query_type:'all'}, isArray:true},
      query:      {method:'GET', params:{query_type:'many'}, isArray:true},
      get:        {method:'GET', params:{query_type:'one'}, isArray:false},
      save:       {method:'POST', params:{query_type:'one'}, isArray:false},
      update:     {method:'PUT', params:{query_type:'one'}, isArray:false},
      delete:     {method:'DELETE', params:{query_type:'one'}, isArray:false},
    });
  });
