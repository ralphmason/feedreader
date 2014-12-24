/**
 * Created by ralphmason on 23/12/14.
 */
/// <reference path="./d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="./d.ts/DefinitelyTyped/lodash/lodash.d.ts" />
var utils = require('./util');
var _ = require('lodash');
exports.makeSqInserts = function (transformed) {
    return _.map(transformed, function (v) {
        var values = v[1];
        var keys = _.keys(values);
        return utils.format('insert into {0}({1})values({2});', v[0], keys.join(','), _.map(keys, function (k) { return values[k]; }).join(','));
    });
};
exports.escapeQuote = function q(x) {
    x = x.replace(/'/g, '\'');
    return "'" + x + "'";
};
//# sourceMappingURL=sqlutil.js.map