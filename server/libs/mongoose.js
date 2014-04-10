var mongoose    = require('mongoose');
var log         = require('./log')(module);
var config      = require('./config');

// console.log(config.get('mongoose:uri'));
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
var CurrentMonth = new Schema({
  date: Date
});

var Period = new Schema({
  date: Date,
  finished: { type: Boolean, default: false }
});


var TariffGroup = new Schema({
  name: String,
  use_space: { type: Boolean, default: false},
  use_common_space: { type: Boolean, default: false},
  use_residents: { type: Boolean, default: false},
  norm_dimension: { type: String, enum: ['-', 'м3/чел.', 'кВтч/чел.', 'ГКал/м2'] },
  value_dimension: { type: String, enum: ['м2', 'м3', 'кВтч', 'ГКал'] },
  executor: { type: String, enum: ['Обслуживание МКД', 'Дальтеплоэнерго', 'Водоканал'] },
  sort: { type: Number, default: 1}
});

var Tariff = new Schema({
  number: String,
  rate: Number,
  _tariff_group: { type: Schema.Types.ObjectId, ref: 'TariffGroup' }
});

var Appartment = new Schema({
  number: String,
  contractor: {
    first_name: String,
    second_name: String,
    last_name: String
  },
  space: { type: Number, default: 0 },
  common_space: { type: Number, default: 0 },
  residents: { type: Number, default: 1 },
  new_space: { type: Number, default: 0 },
  new_common_space: { type: Number, default: 0 },
  new_residents: { type: Number, default: 1 },
  _building: { type: Schema.Types.ObjectId, ref: 'Building' },
  period: Date
});

var Building = new Schema({
  street: String,
  number: String,
  description: String,
  tariffs: [{ type: Schema.Types.ObjectId, ref: 'Tariff' }]
});

// var Images = new Schema({
//     kind: {
//         type: String,
//         enum: ['thumbnail', 'detail'],
//         required: true
//     },
//     url: { type: String, required: true }
// });

// var Article = new Schema({
//     title: { type: String, required: true },
//     author: { type: String, required: true },
//     description: { type: String, required: true },
//     images: [Images],
//     modified: { type: Date, default: Date.now }
// });

// validation
// Article.path('title').validate(function (v) {
//     return v.length > 5 && v.length < 70;
// });

// var ArticleModel = mongoose.model('Article', Article);
var CurrentMonthModel = mongoose.model('CurrentMonth', CurrentMonth);
var TariffGroupModel = mongoose.model('TariffGroup', TariffGroup);
var TariffModel = mongoose.model('Tariff', Tariff);
var BuildingModel = mongoose.model('Building', Building);
var AppartmentModel = mongoose.model('Appartment', Appartment);
var PeriodModel = mongoose.model('Period', Period);

// module.exports.ArticleModel = ArticleModel;
module.exports.CurrentMonthModel = CurrentMonthModel;
module.exports.TariffGroupModel  = TariffGroupModel;
module.exports.TariffModel       = TariffModel;
module.exports.BuildingModel     = BuildingModel;
module.exports.AppartmentModel   = AppartmentModel;
module.exports.PeriodModel       = PeriodModel;
