/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
var pg = require('pg');
var util = require('../util');
var makeSqInserts = require('../sqlutil').makeSqInserts;
module.exports = function (transformed, winston, config, next) {
    var sql = makeSqInserts(transformed, function (x) {
        if (x instanceof Date) {
            return "'" + util.toISOString(x) + "'";
        }
    });
    var conString = util.format("postgres://{0}:{1}@{2}/{3}", config.user, config.password, config.hostname, config.database);
    var torun = 'BEGIN; ' + sql.join('\n') + ' END;';
    winston.silly(torun);
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return winston.error('error fetching client from pool', err);
        }
        client.query(torun, function (err, result) {
            //call `done()` to release the client back to the pool
            done();
            if (err) {
                winston.error('executing sql');
                winston.error(err.message);
                winston.error(err);
                winston.error(torun);
                next(err, null);
                return;
            }
            winston.info('inserted %d rows', sql.length);
            next(null, null);
        });
    });
};
//# sourceMappingURL=postgres.js.map