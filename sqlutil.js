/// <reference path="./typings/node/node.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
var utils = require('./util');
var _ = require('lodash');
function identity(x) {
    return x;
}
var formatSql = function (obj, translate) {
    for (var v in obj) {
        var val = obj[v];
        var t = translate(val);
        if (!t) {
            if (typeof (val) == 'string') {
                obj[v] = q(val);
            }
        }
        else {
            obj[v] = t;
        }
    }
};
exports.makeSqInserts = function (transformed, dbSpecificFormat) {
    if (dbSpecificFormat === void 0) { dbSpecificFormat = identity; }
    return _.map(transformed, function (v) {
        var values = v[1];
        formatSql(values, dbSpecificFormat);
        var keys = _.keys(values);
        return utils.format('insert into {0}({1})values({2});', v[0], keys.join(','), _.map(keys, function (k) { return values[k]; }).join(','));
    });
};
var q = exports.escapeQuote = function q(x) {
    x = x.replace(/'/g, '\'\'');
    return "'" + x + "'";
};
//# sourceMappingURL=sqlutil.js.map