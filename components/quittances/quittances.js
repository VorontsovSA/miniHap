//begin private closure
(function(){

    //this is a private static member that is only available in this closure
    var fs = require('fs');
    var margin = 100,
        font_size = 10,
        font_size_large = 12;
    var PDFDocument = require ('pdfkit');
    var global_margin = 30;
    var doc = new PDFDocument({
        margins: {
          top: global_margin,
          bottom: global_margin,
          left: global_margin,
          right: global_margin
        }
    })

    //this is a private static method that can be used internally
    function q_header(doc) {
      doc.font('fonts/times.ttf');
      doc.fontSize(font_size);
      doc.text('УФК по Приморскому краю (федеральное государственное казенное учреждение "2 отряд федеральной противопожарной службы по Приморскому краю)', margin);
      doc.moveDown();
      doc.text('ИНН 2536047692     КПП 253601001     ОКТМО 05701000     БИК 040507001', margin);
      doc.text('р/сч 40101810900000010002 в ГРКЦ ГУ Банка России по Приморскому краю г.Владивосток', margin);
      doc.font('fonts/timesbd.ttf');
      doc.fontSize(font_size_large);
      doc.text('Код бюджетной классификации КБК: 177 113 0206101 7000 130', margin);
      doc.font('fonts/times.ttf');
      doc.fontSize(font_size);
      doc.moveDown();
      doc.text('ПЛАТЕЛЬЩИК', 200);
      doc.text('ФИО:', margin).moveUp().text('Иванов В.М.', 200);
      doc.text('Адрес:', margin).moveUp().font('fonts/timesbd.ttf').text('ул. Русская, 73-а, ком.24', 200);
      doc.moveUp().text('Январь 2014 год', 455, doc.y, { width: 120, align: 'right' });
      doc.font('fonts/times.ttf');
      doc.text('Проживающих:', margin).moveUp().text('3 чел.', 200);
      doc.text('Площадь:', margin).moveUp().text('33 м2 (2,3 м2 МОП)', 200);
      return doc;
    }
    //Define SomeClass (js uses functions as class constructors, utilized with the "new" keyword)
    this.Quittances = function(options) {
        //if the function is called directly, return an instance of SomeClass
        if (!(this instanceOf Quittances))
            return new Quittances(options);

        //call static method
        doc.pipe(fs.createWriteStream('file.pdf'));
        doc = q_header(doc);

        doc.end();
        //handle the options initialization here
    }

    //create a public static method for SomeClass
    this.Quittances.getInstanceCount = function() {
        return instances; //returns the private static member value
    }

    //create an instance method for SomeClass
    this.Quittances.prototype.doSomething = function() {
      /*Do Something Here*/
    }

//end private closure then run the closure, localized to My.Namespace
}).();
