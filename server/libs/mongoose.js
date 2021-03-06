var mongoose    = require('mongoose');
// var mongo       = require('mongodb');
// var SyncMDB     = require('mongo-sync').Server;
var log         = require('./log')(module);
var config      = require('./config');

mongoose.connect(config.get('mongoose:uri'));
// mongoose.connect('mongodb://localhost/miniHap');
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
    console.log('connection error: ' + err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
    console.log("Connected to DB!");
});

var Schema = mongoose.Schema;

// Schemas

var Period = new Schema({
  date:                Date,
  finished:            { type: Boolean, default: false }
});

var Options = new Schema({
  quittance_line1:     String,
  quittance_line2:     String,
  quittance_line3:     String,
  quittance_line4:     String
});

var TariffGroup = new Schema({
  name:                String,
  use_norm:            { type: Boolean, default: false},
  volume_precision:    { type: Number, default: 2},
  use_space:           { type: Boolean, default: false},
  use_common_space:    { type: Boolean, default: false},
  use_residents:       { type: Boolean, default: false},
  norm_dimension:      { type: String, enum: ['-', 'м3/чел.', 'кВтч/м2', 'ГКал/м2'] },
  value_dimension:     { type: String, enum: ['м2', 'м3', 'кВтч', 'ГКал'] },
  executor:            { type: String, enum: ['Обслуживание жилого фонда', 'Водоснабжение и водоотведение', 'Дальэнерго'] },
  sort:                { type: Number, default: 1}
});

var Tariff = new Schema({
  number:              String,
  rate:                Number,
  static_norm:         { type: Boolean, default: false },
  _tariff_group:       { type: Schema.Types.ObjectId, ref: 'TariffGroup' }
});

Tariff.virtual('tariff_group_sort').get(function () {
  this.populate({ path: '_tariff_group', model: TariffGroupModel }, function(err, building) {
      return res.send(this._tariff_group.sort);
  });
});

var Apartment = new Schema({
  number:              String,
  contractor:          {
                         first_name: String,
                         second_name: String,
                         last_name: String
                       },
  space:               { type: Number, default: 0 },
  common_space:        { type: Number, default: 0 },
  residents:           { type: Number, default: 1 },
  new_space:           { type: Number, default: null },
  new_common_space:    { type: Number, default: null },
  new_residents:       { type: Number, default: null },
  debt:                { type: Number, default: 0 },
  _building:           { type: Schema.Types.ObjectId, ref: 'Building' },
  period:              Date
});

var Building = new Schema({
  street:              String,
  number:              String,
  description:         String,
  tariffs:             [{ type: Schema.Types.ObjectId, ref: 'Tariff' }]
});

var Charge = new Schema({
  has_counter:         { type: Boolean, default: false },
  norm:                { type: Number, default: null },
  volume:              { type: Number, default: 0 },
  value:               { type: Number, default: null },
  reappraisal_auto:    { type: Number, default: 0 },
  reappraisal_manual:  { type: Number, default: 0 },
  _apartment:          { type: Schema.Types.ObjectId, ref: 'Apartment' },
  _tariff_group:       { type: Schema.Types.ObjectId, ref: 'TariffGroup' },
  _tariff:             { type: Schema.Types.ObjectId, ref: 'Tariff', default: null },
  period:              Date
});

var OptionsModel       = mongoose.model('Options', Options);
var TariffGroupModel   = mongoose.model('TariffGroup', TariffGroup);
var TariffModel        = mongoose.model('Tariff', Tariff);
var BuildingModel      = mongoose.model('Building', Building);
var ApartmentModel     = mongoose.model('Apartment', Apartment);
var PeriodModel        = mongoose.model('Period', Period);
var ChargeModel        = mongoose.model('Charge', Charge);

module.exports.OptionsModel      = OptionsModel;
module.exports.TariffGroupModel  = TariffGroupModel;
module.exports.TariffModel       = TariffModel;
module.exports.BuildingModel     = BuildingModel;
module.exports.ApartmentModel    = ApartmentModel;
module.exports.PeriodModel       = PeriodModel;
module.exports.ChargeModel       = ChargeModel;
