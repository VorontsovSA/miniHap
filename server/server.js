'use strict';
(function() {
/**
 * Module dependencies.
 */
var express            = require('express');
var path               = require('path'); // модуль для парсинга пути
var log                = require('./libs/log')(module);
var TariffGroupModel   = require('./libs/mongoose').TariffGroupModel;
var TariffModel        = require('./libs/mongoose').TariffModel;
var BuildingModel      = require('./libs/mongoose').BuildingModel;
var ApartmentModel     = require('./libs/mongoose').ApartmentModel;
var PeriodModel        = require('./libs/mongoose').PeriodModel;
var ChargeModel        = require('./libs/mongoose').ChargeModel;
var app                = express();

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

//#################################
//##### independent commands ######
//#################################

app.get('/ErrorExample', function(req, res, next){
    next(new Error('Random error!'));
});

app.get('/api', function (req, res) {
    res.send('API is running');
});
// TariffGroups for building
app.get('/api/tariff_groups_for_building/:id', function(req, res) {
    return BuildingModel.findById(req.params.id).exec(function (err, building) {
        if (!err) {
            building.populate({ path: 'tariffs', options: { sort: 'number' }, model: TariffModel }, function(err, building) {
                building.populate({ path: 'tariffs._tariff_group', model: TariffGroupModel }, function(err, building) {
                    return res.send(building);
                });
            });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});
// Charges for building
app.get('/api/charges_for_building/:id/:tariff_groups/:period', function(req, res) {
  var tariff_groups_ids = req.params.tariff_groups.split(',');
  var apartments_ids = [];
  // Get apt ids
  ApartmentModel.find({'_building' : req.params.id, 'period' : req.params.period}).select('_id').sort('number').exec(function (err, apartments) {
    if (!err) {
      apartments.forEach(function(apartment, key){
        apartments_ids.push(apartment._id.toString());
      });
      // Remove charges for unexisted tariff groups
      ChargeModel.remove({ _apartment: { $in: apartments_ids }, _tariff_group: { $nin: tariff_groups_ids }, 'period' : req.params.period }, function() {
        console.log('Charges removed');
        // console.log(apartments_ids);
        function processTariffGroup(tg_ids, apt_ids)
        {
          console.log('processTariffGroup');
          // console.log(apartments_ids);
          var tariff_group_id = tg_ids.pop();
          // console.log({1: apartments_ids, 2: tariff_group_id, 3: req.params.period});
          ChargeModel.find({ _apartment: { $in: apartments_ids }, _tariff_group: tariff_group_id, 'period' : req.params.period }, function(err, charges) {
            if (!err) {
              // console.log(apartments_ids);
              // console.log(charges);
              // console.log('charges for ' + tariff_group_id + ': ' + charges.length);
              if(charges)
              {
                // console.log('apt_ids before ' + apt_ids);
                charges.forEach( function(charge) {
                  // console.log(charge._apartment.toHexString());
                  var index = apt_ids.indexOf(charge._apartment.toHexString());
                  // console.log('index = ' + index);
                  if(index != -1) apt_ids.splice(index, 1);
                });
                // console.log('apt_ids after ' + apt_ids);
              }
              // console.log('tariff_group_id = ' + tariff_group_id);
              processCreateingCharges(tg_ids, apt_ids, tariff_group_id);
            }
            else
            {
              console.log(err);
            }
          });
        };
        function processCreateingCharges(tg_ids, apt_ids, tariff_group_id)
        {
          console.log('processCreateingCharges');
          // console.log(apartments_ids);
          var to_create = [];
          apt_ids.forEach(function(id){
            to_create.push({
              has_counter:         false,
              norm:                null,
              volume:              0,
              value:               null,
              reappraisal_auto:    0,
              reappraisal_manual:  0,
              _apartment:          id,
              _tariff_group:       tariff_group_id,
              period:              req.params.period
            });
          });
          // console.log(to_create);
          ChargeModel.create(to_create, function(charges) {
            console.log('Charges created');
            if(tg_ids.length) {
              processTariffGroup(tg_ids, apartments_ids.concat());
            }
            else
            {
              ChargeModel.find({ _apartment: { $in: apartments_ids }, _tariff_group: { $in: tariff_groups_ids }, 'period' : req.params.period }, function(err, charges) {
                // console.log(apartments_ids);
                // console.log({ _apartment: apartments_ids, _tariff_group: tariff_groups_ids, 'period' : req.params.period });
                return res.send(charges);
              });
            }
          });
        };
        processTariffGroup(tariff_groups_ids.concat(), apartments_ids.concat());
      })
    } else {
      console.log({ error: 'Internal error(%d): %s' + res.statusCode + err.message });
    }
  });
  // Init charges if doesn't exist
  //return res.send({status: 'OK'});
  // 1.  Получить список групп тарифов, которых нет в доме.
  // 2.  Получить и удалить записи по начислению по группам тарифов, которых нет в доме.
  // 3.  Инициировать начисления по группам тарифов, если какие-то отсутствуют.
  // 4.  Получить все начисления по существующим группам тарифов
  // 5.  Переход в фронтенд
  // 6.  Заполнить структуры для вывода во вкладки групп тарифов
  // 7.  Отслеживать изменение структуры групп тарифов
  // 8.  Отправить измененную группу тарифов на сохранение
  // 9.  Получить в бэкенде структуру. Разобрать и сохранить
});
// Saving charges
app.post('/api/save_charges_for_building', function(req, res) {
  var charges = req.body.charges;
  console.log(charges);
  function saveCharge(charges) {
    var charge = charges.pop();
    ChargeModel.findById(charge._id, function (err, gotcharge) {
      if(!gotcharge) {
          res.statusCode = 404;
          return res.send({ error: 'Not found' });
      }

      gotcharge.has_counter =        charge.has_counter;
      gotcharge.norm =               charge.norm;
      gotcharge.volume =             charge.volume;
      gotcharge.value =              charge.value;
      gotcharge.reappraisal_auto =   charge.reappraisal_auto;
      gotcharge.reappraisal_manual = charge.reappraisal_manual;

      return gotcharge.save(function (err) {
          if (!err) {
              log.info("charge updated");
              console.log('Charge updated');
              if(charges.length) {
                saveCharge(charges);
              }
              else
              {
                res.send('OK');
              }
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
  }
  saveCharge(charges);
});
// Clear Period
app.get('/api/clear_period/:period', function(req, res) {
  console.log('/api/clear_period/:period');
  console.log(req.params.period);
  return ChargeModel.remove({ 'period' : req.params.period }, function(err) {
    if (!err) {
      ApartmentModel.remove({ 'period' : req.params.period }, function(err) {
        if (!err) {
          return res.send({ status: 'OK' });
        } else {
          res.statusCode = 500;
          log.error('Internal error(%d): %s',res.statusCode,err.message);
          return res.send({ error: 'Server error' });
        }
      });
    } else {
      res.statusCode = 500;
      log.error('Internal error(%d): %s',res.statusCode,err.message);
      return res.send({ error: 'Server error' });
    }
  });
});
// New period
app.get('/api/new_period/:from/:to', function(req, res) {
  console.log('/api/new_period/:from/:to');
  console.log(req.params.from);
  console.log(req.params.to);
  function cloneApartment(apts)
  {
    console.log('cloneApartment');
    var apt = apts.pop();
    console.log(apt.contractor);
    console.log(apt.contractor.first_name);
    console.log(apt.contractor.second_name);
    console.log(apt.contractor.last_name);
    var fn = apt.contractor.first_name.toString();
    // Saving new apt
    var apartment = new ApartmentModel({
        number           : apt.number,
        // contractor       : apt.contractor,
        contractor       : {
          first_name  : unescape(escape(apt.contractor.first_name)),
          second_name : unescape(escape(apt.contractor.second_name)),
          last_name   : unescape(escape(apt.contractor.last_name))
        },
        space            : apt.space,
        common_space     : apt.common_space,
        residents        : apt.residents,
        _building        : apt._building,
        period           : req.params.to,
    });

    apartment.save(function (err) {
      if (!err) {
        log.info("apartment created");
        // Cloning charges
        ChargeModel.find({ '_apartment' : apt._id, 'period' : req.params.from }, function (err, charges) {
          if (!err) {
            cloneCharges(charges, apts, apartment._id);
          } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Internal error(%d): %s' + res.statusCode + err.message });
          }
        });
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
  }
  function cloneCharges(charges, apts, aid) {
    console.log('cloneCharges ' + charges.length + ' ' + apts.length + ' ' + aid);
    var charge = charges.pop();
    // Saving new charge
    var new_charge = new ChargeModel({
          has_counter:         charge.has_counter,
          norm:                null,
          volume:              0,
          value:               null,
          reappraisal_auto:    0,
          reappraisal_manual:  0,
          _apartment:          aid,
          _tariff_group:       charge._tariff_group,
          period:              req.params.to
    });

    new_charge.save(function (err) {
      if (!err) {
        if (charges.length) return cloneCharges(charges, apts, aid);
        if (apts.length) return cloneApartment(apts);
        res.send({ 'status' : 'OK' });
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
  }
  ApartmentModel.find({'period' : req.params.from }).sort('number').exec(function (err, apartments) {
    if (!err) {
      console.log("DDDD")
      cloneApartment(apartments);
    } else {
      res.statusCode = 500;
      log.error('Internal error(%d): %s',res.statusCode,err.message);
      return res.send({ error: 'Internal error(%d): %s' + res.statusCode + err.message });
    }
  });
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
//########   Apartment   ##########
//#################################

app.get('/api/apartment', function(req, res) {
    console.log(req);
    console.log(req.params.building_id);
    return ApartmentModel.find({'_building' : req.query.building_id, 'period' : req.query.period}).sort('number').exec(function (err, apartments) {
        if (!err) {
          console.log("DDDD")
            return res.send(apartments);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Internal error(%d): %s' + res.statusCode + err.message });
        }
    });
});

app.post('/api/apartment', function(req, res) {
    var apartment = new ApartmentModel({
        number           : req.body.number,
        contractor       : req.body.contractor,
        space            : req.body.space,
        common_space     : req.body.common_space,
        residents        : req.body.residents,
        _building        : req.body._building,
        period           : req.body.period,
    });

    apartment.save(function (err) {
        if (!err) {
            log.info("apartment created");
            return res.send({ status: 'OK', apartment:apartment });
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

app.get('/api/apartment/:id', function(req, res) {
    return ApartmentModel.findById(req.params.id, function (err, apartment) {
        if(!apartment) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send(apartment);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/apartment/:id', function (req, res){
    console.log('id = ' + req.params.id);
    return ApartmentModel.findById(req.params.id, function (err, apartment) {
        if(!apartment) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        apartment.number           = req.body.number;
        apartment.contractor       = req.body.contractor ;
        apartment.space            = req.body.space;
        apartment.common_space     = req.body.common_space;
        apartment.residents        = req.body.residents;
        apartment._building        = req.body._building;
        apartment.period           = req.body.period;

        return apartment.save(function (err) {
            if (!err) {
                log.info("apartment updated");
                return res.send({ status: 'OK', apartment:apartment });
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

app.delete('/api/apartment/:id', function (req, res){
    return ApartmentModel.findById(req.params.id, function (err, apartment) {
        if(!apartment) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return apartment.remove(function (err) {
            if (!err) {
                log.info("apartment removed");
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
        use_norm         : req.body.use_norm,
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
        tariff_group.use_norm         = req.body.use_norm;
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
//#######     Periods    ##########
//#################################

app.get('/api/period/date', function(req, res) {
    return PeriodModel.findOne({ date: req.query.date }).exec(function (err, period) {
        if (!err) {
            return res.send(period);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            console.log(err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.get('/api/period/current', function(req, res) {
    return PeriodModel.findOne({ finished: false }).exec(function (err, period) {
        if (!err) {
          if(period)
          {
            return res.send(period);
          }
          else
          {
            var date = new Date();
            var period = new PeriodModel({
              date:  new Date(date.getFullYear(), date.getMonth(), 1)
            });
            period.save(function (err) {
              if (!err) {
                return res.send(period);
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
            console.log(err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/period/one', function(req, res) {
    var period = new PeriodModel({
        date             : req.body.date,
        finished         : req.body.finished,
    });

    period.save(function (err) {
        if (!err) {
            log.info("period created");
            return res.send(period);
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

app.get('/api/period/one/:id', function(req, res) {
    return PeriodModel.findById(req.params.id, function (err, period) {
        if(!period) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send(period);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/period/one/:id', function (req, res){
    console.log('id = ' + req.params.id);
    return PeriodModel.findById(req.params.id, function (err, period) {
        if(!period) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        period.date             = req.body.date;
        period.finished         = req.body.finished;

        return period.save(function (err) {
            if (!err) {
                log.info("period updated");
                return res.send(period);
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

app.delete('/api/period/one/:id', function (req, res){
    return PeriodModel.findById(req.params.id, function (err, period) {
        if(!period) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return period.remove(function (err) {
            if (!err) {
                log.info("period removed");
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
//#################################
//#################################

app.listen(1337, function(){
    console.log('Express server listening on port 1337');
});

console.log("Server has started.");
})();
