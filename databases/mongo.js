/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
var mongo = require('mongodb').MongoClient;
var _ = require('lodash');
var async = require('async');
module.exports = function (transformed, winston, config, next) {
    var tables = _.uniq(_.map(transformed, function (x) { return x[0]; }));
    var client = mongo.connect(config.connectstring, function (err, db) {
        if (err) {
            winston.error('Connect mongo');
            next(err, null);
            return;
        }
        async.eachLimit(tables, 1, function (table, next) {
            var data = _.filter(transformed, function (x) { return x[0] == table; }).map(function (x) { return x[1]; });
            db.collection(table).insert(data, function (err, res) {
                if (!err) {
                    winston.info('inserted %d document(s) into collection \'%s\'', data.length, table);
                }
                next(err, res);
            });
        }, function (err) {
            db.close();
            if (err) {
                winston.warn(err.message);
                next(err, null);
                return;
            }
            next(null, null);
        });
    });
};
//# sourceMappingURL=mongo.js.map