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
    // $location.path('/buildings');
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

hapControllers.controller('BuildingsCtrl', ['$scope', 'Building', function($scope, Building) {
  $scope.buildings = Building.query();

  $scope.quittances = function (building_id) {
    // var doc = new jsPDF();
    // doc.setFont("Times", "Bold");
    // doc.setFontType("Roman");
    // doc.text(20, 20, 'Привет Олег!');
    // doc.text(20, 30, 'This is client-side Javascript, pumping out a PDF.');
    // doc.addPage();
    // doc.text(20, 20, 'Do you like that?');
    // doc.save('q.pdf');
    var fs = require('fs');
    var margin = 90,
        font_size = 10,
        font_size_large = 12;
    var PDFDocument = require ('pdfkit');
    var doc = new PDFDocument({
        margins: {
          top: 45,
          bottom: 45,
          left: margin,
          right: 45
        }
    });
    doc.pipe(fs.createWriteStream('file.pdf'));
    function q_header(doc) {
      doc.font('fonts/times.ttf');
      doc.fontSize(font_size);
      doc.text('УФК по Приморскому краю (федеральное государственное казенное учреждение "2 отряд федеральной противопожарной службы по Приморскому краю)');
      doc.moveDown();
      doc.text('ИНН 2536047692     КПП 253601001     ОКТМО 05701000');
      doc.text('р/сч 40101810900000010002 в ГРКЦ ГУ Банка России по Приморскому краю г.Владивосток');
      doc.text('БИК 040507001');
      doc.font('fonts/timesbd.ttf');
      doc.fontSize(font_size_large);
      doc.text('Код бюджетной классификации КБК: 177 113 0206101 7000 130');
      doc.font('fonts/times.ttf');
      doc.fontSize(font_size);
      doc.moveDown();
      doc.text('ПЛАТЕЛЬЩИК', 200);
      doc.text('ФИО:', margin).moveUp().text('Иванов В.М.', 200);
      doc.text('Адрес:', margin).moveUp().text('ул. Русская, 73-а, ком.24', 200);
      doc.text('Проживающих:', margin).moveUp().text('3', 200);
      doc.text('Площадь:', margin).moveUp().text('33', 200).moveUp().text('Январь 2014 год', 450);
      return doc;
    }
    doc = q_header(doc);
    doc.moveDown();
    doc.text('ОПЛАЧЕНО: _________________', 150);
    doc.moveDown();
    var table = [[ 'Ремонт жилья', '1000.00' ],[ 'Содержание жилья', '1000.00' ],[ 'Водоотведение', '1000.00' ]];
    var head = [ 'Вид услуги', 'Сумма'];
    var footer = [];
    var columns = [ 200, 72 ];
    var head_align = ['center', 'center'];
    var body_align = ['left', 'right'];
    var footer_align = [];
    var size = [ 2, 3 ];
    function q_table(table, head, columns, footer, head_align, body_align, footer_align, size, doc) {
      var shift = 0;
      var head_height = Number(1);
      for (var i = 0; i < size[0]; i++) {
        var y_before = doc.y;
        doc.text(head[i], 3 + margin + shift, doc.y, {width: columns[i] - 6, align: head_align[i]});
        var cell_height = ((doc.y - y_before) / doc.currentLineHeight(true)).toFixed();
        console.log('ch=' + cell_height + ' '+ head[i]);
        head_height = ((cell_height > head_height) ? cell_height : head_height);
        console.log('hh=' + head_height);
        doc.moveUp(cell_height);
        shift += (columns[i]) ? columns[i] : 0;
      };
      doc.moveDown(head_height);
      for (var i = 0; i < size[1]; i++) {
        shift = 0;
        for (var j = 0; j < size[0]; j++) {
          doc.text(table[i][j], 3 + margin + shift, doc.y, {width: columns[j] - 6, align: body_align[j]}).moveUp();
          shift += (columns[j]) ? columns[j] : 0;
        }
        doc.moveDown();
      };
      var shift = 0;
      if(footer.length){
        for (var i = 0; i < size[0]; i++) {
              doc.text(footer[i], 3 + margin + shift, doc.y, {width: columns[i] - 6, align: footer_align[i]});
              doc.moveUp();
              shift += (columns[i]) ? columns[i] : 0;
        }
        doc.moveDown();
      }
      doc.moveUp(Number(head_height) + size[1] + ((footer.length) ? 1 : 0));
      var x = margin;
      var y = doc.y;
      var shift = 0;
      doc.lineWidth(0.5);
      console.log('hh=' + head_height);
      for (var i = 0; i <= size[0]; i++) {
        doc.moveTo(x + shift, y + 0)
           .lineTo(x + shift, y + doc.currentLineHeight(true) * (size[1] + Number(head_height) + ((footer.length) ? 1 : 0)) + 0)
           .stroke();
        shift += (columns[i]) ? columns[i] : 0;
      };
      //var shift = 0;
      console.log('hh=' + head_height);
      for (var i = 0; i <= size[1] + 1 + ((footer.length) ? 1 : 0); i++) {
        console.log('line');
        console.log(y + doc.currentLineHeight(true) * (i + ((i == 0) ? 0 : Number(head_height)-1)) + 0);
        doc.moveTo(x, y + doc.currentLineHeight(true) * (i + ((i == 0) ? 0 : Number(head_height)-1)) + 0)
           .lineTo(x + shift, y + doc.currentLineHeight(true) * (i + ((i == 0) ? 0 : Number(head_height)-1)) + 0)
           .stroke();
      };
      doc.x = x;
      doc.y = y;
      doc.moveDown(size[1] + Number(head_height) + ((footer.length) ? 1 : 0));
      return doc;
    }
    doc = q_table(table, head, columns, footer, head_align, body_align, footer_align, size, doc);
    doc.font('fonts/timesbd.ttf');
    doc.text('Сумма к оплате:', margin).moveUp().text('12000,00', 200).moveUp().text('Общая задолженность:', 350).moveUp().text('72000,12', 500);
    doc.moveDown();
    doc.font('fonts/times.ttf');
    doc.text('Дата платежа __________________  Подпись ____________', margin);
    doc.moveDown();
    doc = q_header(doc);
    doc.text('Сумма к оплате:', margin).moveUp().text('12000,00', 200);
    doc.moveDown();
    doc.font('fonts/timesbi.ttf');
    doc.text('Обслуживание жилого фонда:', margin);
    doc.font('fonts/times.ttf');
    var table = [
                  [ 'Ремонт жилья', '1000.00', '1000.00', '1000.00', '1000.00', '1000.00', '1000.00', '1000.00' ],
                  [ 'Содержание жилья', '1000.00', '1000.00', '1000.00', '1000.00', '1000.00', '1000.00', '1000.00' ]
                ];
    var head = [ 'Вид услуги', 'Норматив', 'Ед. изм. норматива', 'Объем', 'Ед. изм. объема', 'Тариф руб./ед. изм.', 'Пере-расчеты', 'Итого к оплате'];
    var footer = [ 'Итого', ' ', ' ', ' ', ' ', ' ', ' ', '1300,12'];
    var columns = [ 100, 60, 60, 50, 50, 50, 50, 50 ];
    var head_align = ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'];
    var body_align = ['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right'];
    var footer_align = ['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right'];
    var size = [ 8, 2 ];
    doc = q_table(table, head, columns, footer, head_align, body_align, footer_align, size, doc);
    doc.font('fonts/timesbi.ttf');
    doc.text('Водоснабжение и водоотведение:', margin);
    doc.font('fonts/times.ttf');
    doc.font('fonts/timesbi.ttf');
    doc.text('Дальэнерго:', margin);
    doc.font('fonts/times.ttf');
    doc.moveDown();
    doc.font('fonts/timesbd.ttf');
    doc.text('Задолженность за коммунальные услуги:', margin).moveUp().text('12000,00', 450);
    doc.text('Общая задолженность за коммунальные услуги:', margin).moveUp().text('12000,00', 450);
    doc.moveDown();
    doc.font('fonts/times.ttf');
    doc.text('ОПЛАЧЕНО:__________ Дата платежа: ___________ Подпись: __________', margin);
    doc.end();
    // doc.save();
  }
}]);

hapControllers.controller('BuildingsNewCtrl', ['$scope', '$routeParams', '$location', 'Building', 'Tariff', '$http',
  function($scope, $routeParams, $location, Building, Tariff, $http) {
  $scope.tariffs  = Tariff.query();
  $scope.building = {};
  $scope.save = function(building) {
    console.log(building);
    Building.save(building, function() {
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
        $location.path('/buildings');
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.building.$update(function() {
      $location.path('/buildings');
    });
  };
}]);

//#################################
//#######   Apartments  ##########
//#################################

hapControllers.controller('ApartmentsCtrl', ['$scope', '$rootScope', '$routeParams', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, Building, Apartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id});
  $scope.apartments = Apartment.query({building_id: $routeParams.building_id, period: $rootScope.current_period.date});
}]);

hapControllers.controller('ApartmentsNewCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http) {
  $scope.building = Building.get({id: $routeParams.building_id}, function(building) {
    $scope.apartment = { _building: $scope.building._id, residents: 1, period: $rootScope.current_period.date };
  });
  $scope.save = function(apartment) {
    console.log(apartment);
    Apartment.save(apartment, function() {
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
        $location.path('/apartments/' + $scope.building._id);
      });
    },function(btn){});
  };

  $scope.save = function() {
    $scope.apartment.$update(function() {
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
      $scope.tariff_group.$delete(function() {
        $location.path('/tariffGroups');
      });
    },function(btn){
      //$scope.confirmed = 'Shame on you for not thinking this is awesome!';
    });
  };

  $scope.save = function() {
    console.log($scope.tariff_group._id);
    $scope.tariff_group.$update(function() {
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
      $scope.tariff.$delete(function() {
        $location.path('/tariffs');
      });
    },function(btn){
      //$scope.confirmed = 'Shame on you for not thinking this is awesome!';
    });
  };

  $scope.save = function() {
    console.log($scope.tariff._id);
    $scope.tariff.$update(function() {
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

hapControllers.controller('ChargesBuildingCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http', '$dialogs',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http, $dialogs) {
  $scope.building = Building.get({id: $routeParams.building_id});

  $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + $routeParams.building_id}).
  success(function(data, status) {
    var tariff_group_ids = [];
    angular.forEach(data.tariffs, function(tariff, key){
      tariff_group_ids.push(tariff._tariff_group._id);
    });
    // console.log(data);
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
        var total_volume = {};
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
            reappraisal_manual:  charge.reappraisal_manual
          };
          if(total_volume[charge._tariff_group])
            total_volume[charge._tariff_group] += Number(charge.volume);
          else
            total_volume[charge._tariff_group] = Number(charge.volume);
        })
        // console.log('total_volume');
        // console.log(total_volume);
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
            norm: 0,
            calc_var: calc_var
          };

          // console.log('tab');
          // console.log($scope.tabs[tariff._tariff_group._id]);
          // Wathing common trigger
          var updateCharges = function() {
            // console.log($scope.apts);
            if(!tariff._tariff_group.use_norm) {
              // console.log('Not Use norm');
              angular.forEach($scope.apts, function(apt, key){
                var calc_var = 0;
                if(tariff._tariff_group.use_residents) calc_var    += $scope.apts[key].residents;
                if(tariff._tariff_group.use_space) calc_var        += $scope.apts[key].space;
                if(tariff._tariff_group.use_common_space) calc_var += $scope.apts[key].common_space;
                $scope.apts[key].charges[tariff._tariff_group._id].has_counter = false;
                $scope.apts[key].charges[tariff._tariff_group._id].norm = '';
                $scope.apts[key].charges[tariff._tariff_group._id].volume = (calc_var).toFixed(4);
                $scope.apts[key].charges[tariff._tariff_group._id].value = ($scope.apts[key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
              });
            }
            else
            {
              // console.log('Use norm');
              if($scope.tabs[tariff._tariff_group._id].by_volume == 1) {
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
                  $scope.apts[key].charges[tariff._tariff_group._id].value = ($scope.apts[key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
                });
                if (real_sum != $scope.tabs[tariff._tariff_group._id].volume) {
                  // console.log($scope.tabs[tariff._tariff_group._id].volume);
                  // console.log(real_sum);
                  // console.log(max_key);
                  // console.log('Repaired float error ' + ($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4) + ' for ' + $scope.apts[max_key].number);
                  $scope.apts[max_key].charges[tariff._tariff_group._id].volume = (Number($scope.apts[max_key].charges[tariff._tariff_group._id].volume) + Number(($scope.tabs[tariff._tariff_group._id].volume - real_sum).toFixed(4))).toFixed(4);
                  $scope.apts[max_key].charges[tariff._tariff_group._id].value = ($scope.apts[max_key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
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
                  $scope.apts[key].charges[tariff._tariff_group._id].value = ($scope.apts[key].charges[tariff._tariff_group._id].volume * $scope.tabs[tariff._tariff_group._id].tariff.rate).toFixed(2);
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
  $scope.save = function(tariff_group_id) {
    console.log('Saving tariff_group');
    // console.log(tariff_group_id);
    var charges = [];
    angular.forEach($scope.apts, function(apt, key){
      charges.push({
        _id:                 apt.charges[tariff_group_id]._id,
        has_counter:         apt.charges[tariff_group_id].has_counter,
        norm:                apt.charges[tariff_group_id].norm,
        volume:              apt.charges[tariff_group_id].volume,
        value:               apt.charges[tariff_group_id].value,
        reappraisal_auto:    apt.charges[tariff_group_id].reappraisal_auto,
        reappraisal_manual:  apt.charges[tariff_group_id].reappraisal_manual
      });
    });
    // console.log(charges);
    $http({method: 'POST', url: 'http://localhost:1337/api/save_charges_for_building', data: {charges: charges}}).
    success(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
    });
  };
  $scope.clearReappraisal = function() {
    var dlg = $dialogs.confirm('Внимание','Действительно хотите обнулить проведенные перерасчеты?');
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

hapControllers.controller('ReappraisalsBuildingCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Building', 'Apartment', '$http',
  function($scope, $rootScope, $routeParams, $location, Building, Apartment, $http) {
  $scope.date = $routeParams.period;
  $scope.building = Building.get({id: $routeParams.building_id});

  $http({method: 'GET', url: 'http://localhost:1337/api/tariff_groups_for_building/' + $routeParams.building_id}).
  success(function(data, status) {
    var tariff_group_ids = [];
    angular.forEach(data.tariffs, function(tariff, key){
      tariff_group_ids.push(tariff._tariff_group._id);
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
            new_norm:            charge.new_norm,
            new_volume:          charge.new_volume,
            new_value:           charge.new_value,
          };
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
            norm: 0,
            calc_var: calc_var
          };
          // console.log('tab');
          // console.log($scope.tabs[tariff._tariff_group._id]);
          // console.log($scope.tabs[tariff._tariff_group._id]);
          // Wathing common trigger
          var updateCharges = function() {
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
                  $scope.apts[key].charges[tariff._tariff_group._id].reappraisal_auto = $scope.apts[key].charges[tariff._tariff_group._id].new_value - $scope.apts[key].charges[tariff._tariff_group._id].value;
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

hapControllers.controller('DebtsCtrl', ['$scope', 'Building', function($scope, Building) {
  $scope.buildings = Building.query();
}]);

hapControllers.controller('LoadingCtrl', ['$scope', function($scope) {
}]);
