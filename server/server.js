'use strict';
(function() {
/**
 * Module dependencies.
 */
var express            = require('express');
var path               = require('path'); // модуль для парсинга пути
var log                = require('./libs/log')(module);
// var ArticleModel       = require('./libs/mongoose').ArticleModel;
var CurrentMonthModel  = require('./libs/mongoose').CurrentMonthModel;
var TariffGroupModel   = require('./libs/mongoose').TariffGroupModel;
var TariffModel        = require('./libs/mongoose').TariffModel;
var BuildingModel      = require('./libs/mongoose').BuildingModel;
var AppartmentModel    = require('./libs/mongoose').AppartmentModel;
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
//#######    Buildings   ##########
//#################################

app.get('/api/building', function(req, res) {
    return BuildingModel.find().sort('street number').exec(function (err, buildings) {
        if (!err) {
            return res.send(buildings);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/building', function(req, res) {
    var building = new BuildingModel({
        street           : req.body.street,
        number           : req.body.number,
        description      : req.body.description,
        tariffs          : req.body.tariffs
    });

    building.save(function (err) {
        if (!err) {
            log.info("building created");
            return res.send({ status: 'OK', building:building });
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

app.get('/api/building/:id', function(req, res) {
    return BuildingModel.findById(req.params.id, function (err, building) {
        if(!building) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send(building);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/building/:id', function (req, res){
    console.log('id = ' + req.params.id);
    return BuildingModel.findById(req.params.id, function (err, building) {
        if(!building) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        building.street           = req.body.street;
        building.number           = req.body.number;
        building.description      = req.body.description;
        building.tariffs          = req.body.tariffs;

        return building.save(function (err) {
            if (!err) {
                log.info("building updated");
                return res.send({ status: 'OK', building:building });
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

app.delete('/api/building/:id', function (req, res){
    return BuildingModel.findById(req.params.id, function (err, building) {
        if(!building) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return building.remove(function (err) {
            if (!err) {
                log.info("building removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

//#################################
//#######   Appartment   ##########
//#################################

app.get('/api/appartment', function(req, res) {
    console.log(req);
    console.log(req.params.building_id);
    return AppartmentModel.find({'_building' : req.query.building_id, 'period' : req.query.period}).sort('number').exec(function (err, appartments) {
        if (!err) {
          console.log("DDDD")
            return res.send(appartments);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Internal error(%d): %s' + res.statusCode + err.message });
        }
    });
});

app.post('/api/appartment', function(req, res) {
    var appartment = new AppartmentModel({
        number           : req.body.number,
        contractor       : req.body.contractor,
        space            : req.body.space,
        common_space     : req.body.common_space,
        residents        : req.body.residents,
        _building        : req.body._building,
        period           : req.body.period,
    });

    appartment.save(function (err) {
        if (!err) {
            log.info("appartment created");
            return res.send({ status: 'OK', appartment:appartment });
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

app.get('/api/appartment/:id', function(req, res) {
    return AppartmentModel.findById(req.params.id, function (err, appartment) {
        if(!appartment) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send(appartment);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/appartment/:id', function (req, res){
    console.log('id = ' + req.params.id);
    return AppartmentModel.findById(req.params.id, function (err, appartment) {
        if(!appartment) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        appartment.number           = req.body.number;
        appartment.contractor       = req.body.contractor ;
        appartment.space            = req.body.space;
        appartment.common_space     = req.body.common_space;
        appartment.residents        = req.body.residents;
        appartment._building        = req.body._building;
        appartment.period           = req.body.period;

        return appartment.save(function (err) {
            if (!err) {
                log.info("appartment updated");
                return res.send({ status: 'OK', appartment:appartment });
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

app.delete('/api/appartment/:id', function (req, res){
    return AppartmentModel.findById(req.params.id, function (err, appartment) {
        if(!appartment) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return appartment.remove(function (err) {
            if (!err) {
                log.info("appartment removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

//#################################
//#######  Tariff Groups ##########
//#################################

app.get('/api/tariff_group', function(req, res) {
    return TariffGroupModel.find().sort('sort').exec(function (err, tariff_groups) {
        if (!err) {
            return res.send(tariff_groups);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/tariff_group', function(req, res) {
    var tariff_group = new TariffGroupModel({
        name             : req.body.name,
        use_space        : req.body.use_space,
        use_common_space : req.body.use_common_space,
        use_residents    : req.body.use_residents,
        norm_dimension   : req.body.norm_dimension,
        value_dimension  : req.body.value_dimension,
        executor         : req.body.executor,
        tariffs          : req.body.tariffs,
        sort             : req.body.sort
    });

    tariff_group.save(function (err) {
        if (!err) {
            log.info("tariff_group created");
            return res.send({ status: 'OK', tariff_group:tariff_group });
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

app.get('/api/tariff_group/:id', function(req, res) {
    return TariffGroupModel.findById(req.params.id, function (err, tariff_group) {
        if(!tariff_group) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send(tariff_group);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/tariff_group/:id', function (req, res){
    console.log('id = ' + req.params.id);
    return TariffGroupModel.findById(req.params.id, function (err, tariff_group) {
        if(!tariff_group) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        tariff_group.name             = req.body.name;
        tariff_group.use_space        = req.body.use_space;
        tariff_group.use_common_space = req.body.use_common_space;
        tariff_group.use_residents    = req.body.use_residents;
        tariff_group.norm_dimension   = req.body.norm_dimension;
        tariff_group.value_dimension  = req.body.value_dimension;
        tariff_group.executor         = req.body.executor;
        tariff_group.tariffs          = req.body.tariffs;
        tariff_group.sort             = req.body.sort;

        return tariff_group.save(function (err) {
            if (!err) {
                log.info("tariff_group updated");
                return res.send({ status: 'OK', tariff_group:tariff_group });
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

app.delete('/api/tariff_group/:id', function (req, res){
    return TariffGroupModel.findById(req.params.id, function (err, tariff_group) {
        if(!tariff_group) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return tariff_group.remove(function (err) {
            if (!err) {
                log.info("tariff_group removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

//#################################
//#######    Tariffs      #########
//#################################

app.get('/api/tariff', function(req, res) {
    return TariffModel.find().sort('number')
      .populate('_tariff_group')
      .exec(function (err, tariffs) {
        if (!err) {
            return res.send(tariffs);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/tariff', function(req, res) {
    var tariff = new TariffModel({
        number           : req.body.number,
        rate             : req.body.rate,
        _tariff_group    : req.body._tariff_group,
    });

    tariff.save(function (err) {
        if (!err) {
            log.info("tariff created");
            return res.send({ status: 'OK', tariff:tariff });
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

app.get('/api/tariff/:id', function(req, res) {
    var tariff = TariffModel.findById(req.params.id, function (err, tariff) {
        if(!tariff) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            console.log(tariff)
            return res.send(tariff);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
    // var tariff = TariffModel
    // .findById(req.params.id)
    // .populate('_tariff_group')
    // .exec(function (err, tariff) {
    //     if (!err) {
    //         console.log(tariff)
    //         return res.send(tariff);
    //     }
    //   // console.log(tariff);
    //   // console.log('The tariff_grour is %s', tariff._tariff_group);
    // });

    // return res.send(tariff);
});

app.put('/api/tariff/:id', function (req, res){
    console.log('id = ' + req.params.id);
    return TariffModel.findById(req.params.id, function (err, tariff) {
        if(!tariff) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        tariff.number           = req.body.number;
        tariff.rate             = req.body.rate;
        tariff._tariff_group    = req.body._tariff_group;

        return tariff.save(function (err) {
            if (!err) {
                log.info("tariff updated");
                return res.send({ status: 'OK', tariff:tariff });
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

app.delete('/api/tariff/:id', function (req, res){
    return TariffModel.findById(req.params.id, function (err, tariff) {
        if(!tariff) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return tariff.remove(function (err) {
            if (!err) {
                log.info("tariff removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

//#################################
//#######   Current Date   ########
//#################################

app.get('/api/current_month', function(req, res) {
    return CurrentMonthModel.findOne({}, 'date', function (err, current_month) {
        if (!err) {
          if(current_month)
          {
            return res.send(current_month);
          }
          else
          {
            var date = new Date();
            var current_month = new CurrentMonthModel({
              date:  new Date(date.getFullYear(), date.getMonth(), 1)
            });
            current_month.save(function (err) {
              if (!err) {
                return res.send(current_month);
              }
              else
              {
                console.log("Error");
              }
            });
          }
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
                return res.send(current_month);
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
