'use strict';
(function() {
/**
 * Module dependencies.
 */
var express         = require('express');
var path            = require('path'); // модуль для парсинга пути
var log             = require('./libs/log')(module);
var ArticleModel    = require('./libs/mongoose').ArticleModel;
var CurrentMonthModel    = require('./libs/mongoose').CurrentMonthModel;
var app = express();

app.use(express.logger('dev')); // выводим все запросы со статусами в консоль
// app.use(express.bodyParser()); // стандартный модуль, для парсинга JSON в запросах
// connect.multipart() will be removed in connect 3.0
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride()); // поддержка put и delete
app.use(app.router); // модуль для простого задания обработчиков путей
app.use(express.static(path.join(__dirname, "public"))); // запуск статического файлового сервера, который смотрит на папку public/ (в нашем случае отдает index.html)

app.use(function(req, res, next){
    res.status(404);
    // log.debug('Not found URL: %s',req.url);
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    // log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
    return;
});

app.get('/ErrorExample', function(req, res, next){
    next(new Error('Random error!'));
});

app.get('/api', function (req, res) {
    res.send('API is running');
});

//#################################
//#######  Tariff Groups ##########
//#################################

app.get('/api/tariff_group', function(req, res) {
    return ArticleModel.find(function (err, articles) {
        if (!err) {
            return res.send(articles);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/tariff_group', function(req, res) {
    res.send('This is not implemented now');
});

app.get('/api/tariff_group/:id', function(req, res) {
    res.send({id:1, name: 'Содержание жилья'});
});

app.put('/api/tariff_group/:id', function (req, res){
    res.send('This is not implemented now');    
});

app.delete('/api/tariff_group/:id', function (req, res){
    res.send('This is not implemented now');
});

//#################################
//#######   Current Date   ########
//#################################

app.get('/api/current_month', function(req, res) {
    return CurrentMonthModel.findOne({}, 'date', function (err, current_month) {
        if (!err) {
            return res.send(current_month);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/current_month', function(req, res) {
    var current_month = new CurrentMonthModel({
        date: req.body.date,
    });

    current_month.save(function (err) {
        if (!err) {
            log.info("current_month created");
            return res.send({ status: 'OK', current_month:current_month });
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });
});

app.put('/api/current_month', function (req, res){
    return CurrentMonthModel.findById(req.body._id, function (err, current_month) {
        if(!current_month) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        current_month.date = req.body.date;
        return current_month.save(function (err) {
            if (!err) {
                log.info("current_month updated");
                return res.send({ status: 'OK', current_month:current_month });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});

app.listen(1337, function(){
    console.log('Express server listening on port 1337');
});

console.log("Server has started.");
})();
