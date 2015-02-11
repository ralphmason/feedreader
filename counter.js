/// <reference path="typings/tsd.d.ts" />
var _ = require('lodash');
var counters = {};
var _beforeRollover;
function beforeRollover(x) {
    _beforeRollover = x;
}
exports.beforeRollover = beforeRollover;
exports.defaultInfervals = [1, 5, 15, 60, 120, 240, 1440];
var CounterImpl = (function () {
    function CounterImpl() {
        this.values = [];
        this.current = 0;
    }
    CounterImpl.prototype.rollover = function (mins) {
        this.values.push(this.current);
        if (this.values.length > 1440) {
            this.values.shift();
        }
        this.current = 0;
    };
    CounterImpl.prototype.inc = function () {
        this.add(1);
    };
    CounterImpl.prototype.add = function (value) {
        this.current += value;
    };
    CounterImpl.prototype.getValues = function (intervals) {
        var _this = this;
        var intv = intervals || exports.defaultInfervals;
        return intv.map(function (v) { return _.takeRight(_this.values, v).reduce(function (x, y) { return x + y; }, 0); });
    };
    CounterImpl.getCounter = function (name) {
        return counters[name] || (counters[name] = new CounterImpl);
    };
    CounterImpl.getCounters = function () {
        return _.clone(counters);
    };
    CounterImpl.startup = function () {
        var minutes = 0;
        setInterval(function () {
            minutes++;
            _.values(counters).map(function (y) { return y.rollover(minutes); });
            _beforeRollover(CounterImpl.getCounters());
        }, 60000);
    }();
    return CounterImpl;
})();
function getCounter(name) {
    return CounterImpl.getCounter(name);
}
exports.getCounter = getCounter;
function getCounters() {
    return CounterImpl.getCounters();
}
exports.getCounters = getCounters;
//# sourceMappingURL=counter.js.map