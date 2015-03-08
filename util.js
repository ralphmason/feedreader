/// <reference path="./typings/node/node.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/request/request.d.ts" />
var fs = require('fs');
var winston = require('winston');
var _ = require('lodash');
var request = require('request');
var format = exports.format = function (str) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return str.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};
var aProxy;
var proxy = exports.proxy = function (p) {
    aProxy = p;
};
var fetch = exports.fetch = function (url, then) {
    url = "https://" + url;
    winston.debug(url);
    var req = {
        url: url,
        gzip: true,
        timeout: 60000
    };
    if (aProxy) {
        req.proxy = aProxy;
        req.rejectUnauthorized = false;
        req.requestCert = true;
    }
    try {
        request(req, function (error, response, body) {
            var err = null;
            if (error) {
                err = 'Invalid response from server:' + error.message;
            }
            if (response && response.statusCode != 200) {
                err = 'response ' + response.statusCode + '  from server';
            }
            if (body) {
                winston.debug('<result>' + body.substring(0, 256).replace(/\r\n/g, ''));
                winston.silly(body);
            }
            if (err) {
                if (body) {
                    err.body = body;
                }
                then(err, null);
                return;
            }
            then(null, body);
        });
    }
    catch (err) {
        then(err, null);
    }
};
var session = null;
var sessionCreateTime = Date.now();
var REFRESH_TIMEOUT = 1000 * 60 * 60 * 12;
function getSession(config, then) {
    if (session == null || (Date.now() - sessionCreateTime) > REFRESH_TIMEOUT) {
        winston.info('requesting new session');
        fetch(format('api.telogis.com/rest/login/{0}/{1}/{2}', config.company, config.user, config.password), function (err, ret) {
            if (err) {
                then(err, null);
                return;
            }
            var parsed = JSON.parse(ret);
            session = parsed.token;
            if (!session) {
                then(ret, null);
                return;
            }
            sessionCreateTime = Date.now();
            then(null, session);
        });
    }
    else {
        then(null, session);
    }
}
exports.clearSession = function () {
    session = null;
};
var ACK_FILE = 'ack.id';
exports.pull = function (config, then) {
    getSession(config, function (err, ret) {
        if (err) {
            then(err, null);
            return;
        }
        var ackid;
        if (fs.existsSync(ACK_FILE + config.topic)) {
            ackid = fs.readFileSync(ACK_FILE + config.topic, 'utf8');
        }
        fetch(format('integration.telogis.com/XmlDataFeed/ackreports.aspx?token={0}&feed=topic-{1}&element_mode=true{2}', ret, config.topic, ackid ? '&ackid=' + ackid : ''), function (err, ret) {
            if (!err && ackid) {
                fs.unlinkSync(ACK_FILE + config.topic);
            }
            then(err, ret);
        });
    });
};
var ack = exports.ack = function (config, id, then) {
    if (id == 'noresults') {
        then(null);
        return;
    }
    fs.writeFile(ACK_FILE + config.topic, id, function (err, ret) {
        if (err) {
            then(err);
            return;
        }
        then(null);
    });
};
var isNumber = /^[+-]?\d+$/, isFloat = /^[+-]?\d+\.\d+$/, isBool = /^(true|false)$/, isIso = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var tests = [isNumber, isFloat, isIso, isBool];
var converters = [
    function (x) { return parseInt(x); },
    function (x) { return parseFloat(x); },
    function (x) { return new Date(x); },
    function (x) { return x == 'true'; }
];
function clean(x) {
    if (Array.isArray(x) && x.length == 1) {
        x = x[0];
    }
    if (!Array.isArray(x)) {
        var ret = x;
        if (ret.indexOf('\r\n') == 0) {
            ret = '';
        }
        else {
            var index = _.findIndex(tests, function (x) { return x.test(ret); });
            if (index != -1) {
                ret = converters[index](ret);
            }
        }
        return ret;
    }
    else if (Array.isArray(x) && x.length > 1) {
        x = _.map(x, clean);
    }
    ;
    return x;
}
exports.cleanObject = function (data) {
    for (var v in data) {
        data[v] = clean(data[v]);
    }
    return data;
};
function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}
exports.toISOString = function (d) {
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
};
//# sourceMappingURL=util.js.map