'use strict';

/* Filters */

angular.module('hap.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('russian_date', [function() {
    return function(filter_date) {
      var months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      console.log('date1 = ' + filter_date);
      var result_date = new Date(filter_date);
      console.log(result_date.getMonth());
      console.log('date2 = ' + result_date);
      return (result_date == 'Invalid Date') ? ' ' : months[result_date.getMonth()] + ' ' + result_date.getFullYear();
    };
  }]);
