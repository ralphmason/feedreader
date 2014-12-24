var async = require("async");
async.map(["a", "b", "c"], function (item, cb) { return cb(null, [item.toUpperCase()]); }, function (err, results) {
});
//# sourceMappingURL=asyncamd-tests.js.map