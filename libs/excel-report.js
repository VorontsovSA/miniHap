var $  = require ('jQuery');
var fs = require('fs');

var excelbuilder = require('msexcel-builder');

function generateSaldo (data, notify_anchor) {
  var default_filename = '(' + data.date + ')' + data.street + ' ' + data.number  + (data.description ? '(' + data.description + ')' : '') + '.xlsx';
  $("#template-save-file-dialog")
    .clone()
      .attr("nwsaveas", default_filename)
      .change(function() {
        console.log($(this).val());
        console.log(default_filename.replace(/^.*[\\\/]/, ''));
        var filename = default_filename.replace(/^.*[\\\/]/, '');
        var workbook = excelbuilder.createWorkbook(default_filename.slice(0, default_filename.length - filename.length), filename);

        // Create a new worksheet with 10 columns and 12 rows
        var sheet = workbook.createSheet('Ведомость', data.head.length + 3, data.apts.length + 4);

        // Fill some data
        // sheet.fill(1, 1, {type:'solid',fgColor:'FF0000',bgColor:'FF0000'});
        sheet.set(1, 1, data.street + ' ' + data.number + ', ВЕДОМОСТЬ коммунальных платежей за ' + data.date_text);
        sheet.merge({col:1,row:1},{col:data.head.length + 3,row:1});

        var row = 3;
        sheet.set(1, row, '№');
        sheet.border(1, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});
        sheet.width(1, 5);
        sheet.height(3, 30);
        sheet.set(2, row, 'ФИО');
        sheet.width(2, 20);
        sheet.border(2, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});
        var totals = [];
        for (var column = 0; column <= data.head.length; column++) {
          sheet.set(column+3, row, data.head[column]);
          sheet.border(column+3, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});
          sheet.width(column+3, 15);
          sheet.wrap(column+3, row, 'true');
          totals[column] = 0;
        }
        // sheet.font(data.head.length + 3, row, {bold:'true'});
        sheet.set(data.head.length + 3, row, 'ИТОГО');
        sheet.border(data.head.length + 3, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});

        console.log(data.apts);
        for (var row = 0; row < data.apts.length; row++) {
          sheet.set(1, row+4, data.apts[row].number);
          sheet.border(1, row+4, {left:'thin',top:'thin',right:'thin',bottom:'thin'});
          sheet.set(2, row+4, data.apts[row].contractor);
          sheet.border(2, row+4, {left:'thin',top:'thin',right:'thin',bottom:'thin'});
          for (var column = 0; column < data.head.length; column++) {
            sheet.set(column+3, row+4, (data.apts[row].tariff_groups[column]) ? (data.apts[row].tariff_groups[column]).replace('.', ',') : '-');
            sheet.border(column+3, row+4, {left:'thin',top:'thin',right:'thin',bottom:'thin'});
            if(!isNaN(data.apts[row].tariff_groups[column])) totals[column] += Number(data.apts[row].tariff_groups[column]);
          }
          sheet.font(data.head.length + 3, row, {bold:'true'});
          sheet.set(data.head.length + 3, row+4, (data.apts[row].total).toFixed(2).replace('.', ','));
          sheet.border(data.head.length + 3, row+4, {left:'thin',top:'thin',right:'medium',bottom:'thin'});
        }

        row = data.apts.length+4;
        sheet.set(1, row, 'ИТОГО');
        sheet.border(1, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});
        sheet.border(2, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});
        sheet.merge({ col:1, row:row },{ col:2, row:row });
        var total = 0;
        for (var column = 0; column <= data.head.length; column++) {
          sheet.set(column+3, row, (totals[column]).toFixed(2).replace('.', ','));
          sheet.border(column+3, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});
          sheet.width(column+3, 15);
          sheet.wrap(column+3, row, 'true');
          if(!isNaN(totals[column])) total += Number(totals[column]);
        }
        sheet.set(data.head.length + 3, row, total.toFixed(2).replace('.', ','));
        sheet.border(data.head.length + 3, row, {left:'medium',top:'medium',right:'medium',bottom:'medium'});

        // Save it
        workbook.save(function(err){
          if (err) {
            workbook.cancel();
            console.log('your workbook canceled');
            notify_anchor.notify("Не удалось сохранить ведомость по " + 'ул. ' + data.street + ' дом ' + data.number, 'error');
          }
          else {
            console.log('congratulations, your workbook created');
            notify_anchor.notify("Ведомость по " + 'ул. ' + data.street + ' дом ' + data.number + " сохранена", 'success');
          }
        });
      })
      .click()
  ;
}

function generateAct (data, notify_anchor) {
  var default_filename = 'Сверка ' + data.street + ' ' + data.number + '-' + data.apt_number  + (data.description ? '(' + data.description + ')' : '') + '.xlsx';
  $("#template-save-file-dialog")
    .clone()
      .attr("nwsaveas", default_filename)
      .change(function() {
        console.log($(this).val());
        console.log(default_filename.replace(/^.*[\\\/]/, ''));
        var filename = default_filename.replace(/^.*[\\\/]/, '');
        var workbook = excelbuilder.createWorkbook(default_filename.slice(0, default_filename.length - filename.length), filename);

        // Create a new worksheet with 10 columns and 12 rows
        var sheet = workbook.createSheet('Сверка ', data.head.length, data.body.length + 1);

        var row = 1;
        sheet.height(1, 30);
        for (var column = 1; column <= data.head.length; column++) {
          sheet.set(column, row, data.head[column-1]);
          sheet.border(column, row, {left:'thin',top:'thin',right:'thin',bottom:'thin'});
          sheet.width(column, 15);
          sheet.wrap(column, row, 'true');
        }

        for (var row = 0; row < data.body.length; row++) {
          for (var column = 0; column < data.head.length; column++) {
            sheet.set(column+1, row+2, (column > 0) ? Number(data.body[row][column]).toFixed(2).replace('.', ',') : (data.body[row][column]));
            sheet.border(column+1, row+2, {left:'thin',top:'thin',right:'thin',bottom:'thin'});
          }
        }

        // Save it
        workbook.save(function(err){
          if (err) {
            workbook.cancel();
            console.log('your workbook canceled');
            notify_anchor.notify("Не удалось сохранить сверку по " + 'ул. ' + data.street + ' дом ' + data.number + ' к.' + data.apt_number, {className: 'error'});
          } else {
            console.log('congratulations, your workbook created');
            notify_anchor.notify("Сверка по " + 'ул. ' + data.street + ' дом ' + data.number + ' к.' + data.apt_number + " сохранена", 'success');
          }
        });
      })
      .click()
  ;
}

module.exports.generateSaldo = generateSaldo;
module.exports.generateAct   = generateAct;
