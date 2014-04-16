'use strict';

/* Directives */

var hapDirectives = angular.module('hap.directives', []);

hapDirectives.directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

var INTEGER_REGEXP = /^\-?\d+$/;
hapDirectives.directive('integer', function() {
  console.log('Check integer');
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      console.log('Check INTEGER_REGEXP');
      ctrl.$parsers.unshift(function(viewValue) {
        if (viewValue == '' || INTEGER_REGEXP.test(viewValue)) {
          // it is valid
          ctrl.$setValidity('integer', true);
          return viewValue;
        } else {
          // it is invalid, return undefined (no model update)
          ctrl.$setValidity('integer', false);
          return undefined;
        }
      });
    }
  };
});

var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;
hapDirectives.directive('smartFloat', function() {
  console.log('Check float');
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        console.log('Check FLOAT_REGEXP');
        if (viewValue == '' || FLOAT_REGEXP.test(viewValue)) {
          ctrl.$setValidity('float', true);
          return parseFloat(viewValue.replace(',', '.'));
        } else {
          ctrl.$setValidity('float', false);
          return undefined;
        }
      });
    }
  };
});
