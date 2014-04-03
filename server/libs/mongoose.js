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

var Tariff = new Schema({
  number: String,
  rate: 
});

var TariffGroup = new Schema({
  name: String,
  use_space: Boolean,
  use_common_space: Boolean,
  use_residents: Boolean,
  norm_dimension: ['-', 'м3/чел.', 'кВтч/чел.', 'ГКал/м2'],
  value_dimension: ['м2', 'м3', 'кВтч', 'ГКал'],
  executor: ['Обслуживание МКД', 'Дальтеплоэнерго', 'Водоканал'],
  tariffs: [Tariff]
});

var Images = new Schema({
    kind: {
        type: String,
        enum: ['thumbnail', 'detail'],
        required: true
    },
    url: { type: String, required: true }
});

var Article = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    images: [Images],
    modified: { type: Date, default: Date.now }
});

// validation
Article.path('title').validate(function (v) {
    return v.length > 5 && v.length < 70;
});

var ArticleModel = mongoose.model('Article', Article);
var CurrentMonthModel = mongoose.model('CurrentMonth', CurrentMonth);
var TariffGroupModel = mongoose.model('TariffGroup', TariffGroup);

module.exports.ArticleModel = ArticleModel;
module.exports.CurrentMonthModel = CurrentMonthModel;
module.exports.TariffGroupModel = TariffGroupModel;