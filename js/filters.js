'use strict';

/* Filters */

angular.module('hap.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('russian_date', [function() {
    return function(date) {
      var months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      var date = new Date(date);
      return (date == 'Invalid Date') ? ' ' : months[date.getMonth()] + ' ' + date.getFullYear();
    };
  }]);
