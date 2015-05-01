var $           = require ('jQuery');
var fs          = require ('fs');
var PDFDocument = require ('pdfkit');
var margin = 100,
    font_size = 10,
    font_size_large = 12,
    global_margin = 30;

function q_header(doc, apt, options) {
  doc.font('fonts/times.ttf');
  doc.fontSize(font_size);
  doc.text(options.quittance_line1, margin);
  doc.moveDown();
  doc.text(options.quittance_line2, margin);
  doc.text(options.quittance_line3, margin);
  doc.font('fonts/timesbd.ttf');
  doc.fontSize(font_size_large);
  doc.text(options.quittance_line4, margin);
  doc.font('fonts/times.ttf');
  doc.fontSize(font_size);
  doc.moveDown();
  doc.text('ПЛАТЕЛЬЩИК', 200);
  doc.text('ФИО:', margin).moveUp().text(apt.contractor, 200);
  doc.text('Адрес:', margin).moveUp().font('fonts/timesbd.ttf').text(apt.address, 200);
  doc.font('fonts/times.ttf');
  doc.moveUp().text('ИТОГО ПО ДОМУ', 380);
  doc.font('fonts/timesbd.ttf');
  doc.moveUp().text(apt.date, 455, doc.y, { width: 120, align: 'right' });
  doc.font('fonts/times.ttf');
  doc.text('Проживающих:', margin).moveUp().text(apt.residents + ' чел.', 200);
  doc.moveUp().text('Проживающих:', 380).moveUp().text(apt.b_residents + ' чел.', 450);
  doc.text('Площадь:', margin).moveUp().text(apt.space + ' ' + ((apt.common_space) ? '(МОП: ' + apt.common_space + ')' : '' ), 200);
  doc.moveUp().text('Площадь:', 380).moveUp().text(apt.b_space + ' ' + ((apt.b_common_space) ? '(МОП: ' + apt.b_common_space + ')' : '' ), 450);
  return doc;
}

function q_table(table, head, columns, footer, head_align, body_align, footer_align, size, doc) {
  var shift = 0;
  var head_height = Number(1);
  doc.fontSize(8);
  for (var i = 0; i < size[0]; i++) {
    var y_before = doc.y;
    doc.text(head[i], margin + shift, doc.y, {width: columns[i] - 6, align: head_align[i]});
    var cell_height = ((doc.y - y_before) / doc.currentLineHeight(true)).toFixed();
    // console.log('ch=' + cell_height + ' '+ head[i]);
    head_height = ((cell_height > head_height) ? cell_height : head_height);
    // console.log('hh=' + head_height);
    doc.moveUp(cell_height);
    shift += (columns[i]) ? columns[i] : 0;
  };
  doc.fontSize(9);
  doc.moveDown(head_height);
  for (var i = 0; i < size[1]; i++) {
    shift = 0;
    for (var j = 0; j < size[0]; j++) {
      doc.text(table[i][j], margin + shift, doc.y, {width: columns[j] - 6, align: body_align[j]}).moveUp();
      shift += (columns[j]) ? columns[j] : 0;
    }
    doc.moveDown();
  };
  var shift = 0;
  if(footer.length){
    doc.font('fonts/timesbd.ttf');
    for (var i = 0; i < size[0]; i++) {
          doc.text(footer[i], margin + shift, doc.y, {width: columns[i] - 6, align: footer_align[i]});
          doc.moveUp();
          shift += (columns[i]) ? columns[i] : 0;
    }
    doc.font('fonts/times.ttf');
    doc.moveDown();
  }
  doc.moveUp(Number(head_height) + size[1] + ((footer.length) ? 1 : 0));
  var x = margin;
  var y = doc.y;
  var shift = 0;
  doc.lineWidth(0.5);
  // console.log('hh=' + head_height);
  for (var i = 0; i <= size[0]; i++) {
    doc.moveTo(x + shift - 3, y + 0)
       .lineTo(x + shift - 3, y + doc.currentLineHeight(true) * (size[1] + Number(head_height) + ((footer.length) ? 1 : 0)) + 0)
       .stroke();
    shift += (columns[i]) ? columns[i] : 0;
  };
  //var shift = 0;
  // console.log('hh=' + head_height);
  for (var i = 0; i <= size[1] + 1 + ((footer.length) ? 1 : 0); i++) {
    // console.log('line');
    // console.log(y + doc.currentLineHeight(true) * (i + ((i == 0) ? 0 : Number(head_height)-1)) + 0);
    doc.moveTo(x - 3, y + doc.currentLineHeight(true) * (i + ((i == 0) ? 0 : Number(head_height)-1)) + 0)
       .lineTo(x + shift - 3, y + doc.currentLineHeight(true) * (i + ((i == 0) ? 0 : Number(head_height)-1)) + 0)
       .stroke();
  };
  doc.x = x;
  doc.y = y;
  doc.moveDown(size[1] + Number(head_height) + ((footer.length) ? 1 : 0));
  return doc;
}

function q_body(apt, is_first_page, options, tariffs, doc) {
  if(!is_first_page) {
    doc.addPage();
  }
  doc = q_header(doc, apt, options);
  doc.moveDown();
  doc.text('ОПЛАЧЕНО: _________________', 150);
  doc.moveDown();
  var table = [];
  apt.executors.forEach(function(executor, key){
    table.push([
      executor.name,
      (executor.total).toFixed(2),
    ]);
  });
  table.push([
    'Задолженность за коммунальные услуги',
    (apt.total_debt).toFixed(2),
  ]);
  var head = [ 'Вид услуги', 'Сумма'];
  var footer = [];
  var columns = [ 250, 72 ];
  var head_align = ['center', 'center'];
  var body_align = ['left', 'right'];
  var footer_align = [];
  var size = [ 2, table.length ];

  doc = q_table(table, head, columns, footer, head_align, body_align, footer_align, size, doc);
  doc.font('fonts/timesbd.ttf');
  doc.text('Начислено за месяц:', margin).moveUp().text((apt.total).toFixed(2), 200).moveUp().text('Итого к оплате:', 270).moveUp().text((apt.total + apt.total_debt >= 0) ? (apt.total + apt.total_debt).toFixed(2) : '0.00', 350, doc.y, {width: 72-6, align: 'right'});
  doc.moveDown();
  doc.font('fonts/times.ttf');
  doc.text('Дата платежа __________________  Подпись ____________', margin);
  doc.moveDown();
  doc.lineWidth(0.5)
     .dash(8, {space: 5})
     .moveTo(global_margin, doc.y)
     .lineTo(doc.page.width - global_margin, doc.y)
     .stroke()
     .undash();
  doc.moveDown();
  doc = q_header(doc, apt, options);

  apt.executors.forEach(function(executor, key){
    doc.font('fonts/timesbi.ttf');
    doc.text( executor.name + ':', margin);
    doc.font('fonts/times.ttf');
    var table = [];
    for (var prop in executor.tariff_groups) {
      table.push([
        executor.tariff_groups[prop].tariff_group.name,
        (executor.tariff_groups[prop].charge.norm == null) ? '-' : executor.tariff_groups[prop].charge.norm,
        executor.tariff_groups[prop].tariff_group.norm_dimension,
        executor.tariff_groups[prop].charge.volume,
        executor.tariff_groups[prop].total_volume,
        executor.tariff_groups[prop].tariff_group.value_dimension,
        (executor.tariff_groups[prop].charge._tariff) ? tariffs[executor.tariff_groups[prop].charge._tariff].rate : executor.tariff_groups[prop].tariff.rate,
        (executor.tariff_groups[prop].charge.value).toFixed(2),
        (executor.tariff_groups[prop].charge.reappraisal_auto + executor.tariff_groups[prop].charge.reappraisal_manual).toFixed(2),
        (executor.tariff_groups[prop].charge.reappraisal_auto + executor.tariff_groups[prop].charge.reappraisal_manual + executor.tariff_groups[prop].charge.value).toFixed(2)
      ]);
    }
    var head = [ 'Вид услуги', 'Норма-тив', 'Ед. изм. норм.', 'Объем', 'Объем по дому', 'Ед. изм. объема', 'Тариф руб./ед.', 'Итого', 'Пере-расчеты', 'Итого к оплате'];
    var footer = [ 'Итого', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', (executor.total).toFixed(2)];
    var columns = [ 110, 36, 40, 35, 35, 37, 40, 45, 45, 55 ];
    var head_align = ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'];
    var body_align = ['left', 'right', 'center', 'right', 'right', 'center', 'right', 'right', 'right', 'right'];
    var footer_align = ['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right'];
    var size = [ columns.length, table.length ];
    doc.fontSize(9);
    doc = q_table(table, head, columns, footer, head_align, body_align, footer_align, size, doc);
    doc.fontSize(10);
  });

  doc.moveDown();
  doc.font('fonts/timesbd.ttf');
  doc.text('Начислено за месяц:', margin).moveUp().text((apt.total).toFixed(2), 455, doc.y, { width: 120, align: 'right' });
  doc.text('Задолженность за коммунальные услуги:', margin).moveUp().text((apt.total_debt).toFixed(2), 455, doc.y, { width: 120, align: 'right' });
  doc.text('ИТОГО к оплате за коммунальные услуги:', margin).moveUp().text((apt.total + apt.total_debt >= 0) ? (apt.total + apt.total_debt).toFixed(2) : '0.00', 455, doc.y, { width: 120, align: 'right' });
  doc.moveDown();
  doc.font('fonts/times.ttf');
  doc.text('ОПЛАЧЕНО:__________ Дата платежа: ___________ Подпись: __________', margin);
  doc.text('ИЗВЕЩЕНИЕ', global_margin, 150);
  doc.text('КВИТАНЦИЯ', global_margin, 480);
  doc.lineWidth(1);
  doc.moveTo(margin - 3, global_margin)
     .lineTo(margin - 3, doc.page.height - global_margin)
     .stroke();
  return doc;
}

function generate (data, notify_anchor, localStorage) {
  //var stream = doc.pipe(blobStream());
  // stream.on('finish', function() {
  var default_filename = '(' + data.date + ')' + data.street + ' ' + data.number  + (data.description ? '(' + data.description + ')' : '') + '.pdf';
  $("#template-save-file-dialog")
    .clone()
      .attr("nwsaveas", default_filename)
      .attr("nwworkingdir", (localStorage.default_dir) ? localStorage.default_dir : '')
      .change(function() {
        console.log($(this).val());
        var filename = $(this).val().replace(/^.*[\\\/]/, '');
        localStorage.default_dir = $(this).val().slice(0, $(this).val().length - filename.length);
        var path = $(this).val();
        var doc = new PDFDocument({
            margins: {
              top: global_margin,
              bottom: global_margin,
              left: global_margin,
              right: global_margin
            }
        });
        var is_first_page = true;
        fs.writeFile(path, data, 'binary', function(err){
          if (err) {
            console.log('your pdf canceled');
            notify_anchor.notify("Не удалось сохранить файл квитанций по " + 'ул. ' + data.street + ' дом ' + data.number, {className: 'error'});
            return err;
          }
          else
          {
            doc.pipe(fs.createWriteStream(path, function(err){
                if (err) {
                  console.log('your pdf canceled');
                  notify_anchor.notify("Не удалось сохранить файл квитанций по " + 'ул. ' + data.street + ' дом ' + data.number, {className: 'error'});
                }
              })
            );

            for(var key in data['apts']){
              doc = q_body(data['apts'][key], is_first_page, data.options, data.tariffs, doc);
              is_first_page = false;
            };

            doc.end();
            console.log('Document saved');
            notify_anchor.notify("Файл квитанций по " + 'ул. ' + data.street + ' дом ' + data.number + " сохранен", 'success');
          }
        });
      })
      .click()
  ;
}

module.exports.generate = generate;
