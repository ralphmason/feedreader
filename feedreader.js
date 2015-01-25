/// <reference path="./typings/node/node.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
var _ = require('lodash');
var parseXML = require('xml2js').parseString;
var async = require('async');
var utils = require('./util');
var winston = require('winston');
var fs = require('fs');
process.chdir(__dirname);
var opts = require('node-getopt').create([
    ['c', 'config=ARG', 'Set config file, defaults to ./config'],
    ['s', 'setting=ARG+', 'Replace a setting in the config section of the config file'],
    ['f', 'file=ARG', 'load configuration overrides from a json file (must be proper json, not javascript)']
]).bindHelp().parseSystem();
var handledMessages, messageHandlers, runDb, config;
function run() {
    winston.info('Feedreader started', function () {
        async.forever(function (next) {
            winston.debug('Fetching data');
            utils.pull(config.feed, function (err, ret) {
                if (err) {
                    next(err);
                    return;
                }
                winston.silly('Parsing XML');
                parseXML(ret, function (err, data) {
                    if (err) {
                        next(err);
                        return;
                    }
                    var report = data.DataFeedReport;
                    var types = _.keys(report);
                    var toProcess = _.intersection(handledMessages, types);
                    if (toProcess.length == 0) {
                        if (types.length == 0) {
                            winston.debug('No data returned');
                        }
                        else {
                            winston.warn('No handlers for returned message types (%s)', types.join(','));
                        }
                        utils.ack();
                        setTimeout(next, 15000);
                        return;
                    }
                    winston.silly(report);
                    var transformed = [];
                    _.forEach(toProcess, function (aType) {
                        var transform = messageHandlers[aType];
                        var data = report[aType];
                        winston.debug('%d \'%s\' returned', data.length, aType);
                        var v = _.map(data, function (d) { return transform(utils.cleanObject(d)); });
                        transformed = transformed.concat(v);
                    });
                    runDb(transformed, winston, config.db, function (err, res) {
                        if (err) {
                            next(err);
                            return;
                        }
                        utils.ack();
                        next(null);
                    });
                });
            });
        }, function (err) {
            winston.error(err);
            winston.error(err.message);
            winston.error('Feedreader exiting with error', function (err) {
                setTimeout(function () {
                    process.exit(1);
                }, 1000); //winston bug doesn't flush on process exit
            });
        });
    });
}
function loadConfiguration() {
    var configFileName = opts.options.config || './config';
    var configFile = require(configFileName);
    config = configFile.config;
    if (opts.options.setting) {
        _.forEach(opts.options.setting, function (val) {
            try {
                var settings = val.split('=');
                var objs = settings[0].split('.');
                config[objs[0]][objs[1]] = settings[1];
            }
            catch (e) {
                console.log("error applying setting");
                console.log(e);
                process.exit(1);
            }
        });
    }
    if (opts.options.file) {
        try {
            var text = fs.readFileSync(opts.options.file, 'utf8');
            text = text.toString().replace(/\/\*.*?\*\//g, ''); //Support single line c style comments
            var fileConfig = JSON.parse(text);
            config = _.merge(config, fileConfig);
        }
        catch (err) {
            console.log("error loading config json");
            console.log(err);
            process.exit(1);
        }
    }
    winston.remove(winston.transports.Console);
    _.keys(config.logs).forEach(function (k) {
        var settings = config.logs[k];
        if (!_.isArray(settings)) {
            settings = [settings];
        }
        var i = 0;
        settings.forEach(function (s) { return winston.add(winston.transports[k], _.extend(s, { name: k + ':' + i++ })); });
    });
    winston.info('using config \'%s\'', configFileName);
    handledMessages = _.keys(configFile).filter(function (t) { return /transform_/.test(t); }).map(function (t) { return t.substring(10); });
    messageHandlers = _.zipObject(handledMessages, _.map(handledMessages, function (h) { return configFile['transform_' + h]; }));
    if (handledMessages.length == 0) {
        winston.error('no handlers found');
        process.exit(1);
    }
    winston.info('found handlers for (%s)', handledMessages.join(','));
    var dbsupport = _.filter(fs.readdirSync('./databases'), function (x) { return /\.js$/.test(x); }).map(function (x) { return x.substring(0, x.length - 3); });
    var db = _.find(dbsupport, function (h) { return config[h]; });
    if (!db) {
        winston.error('could not find a database handler config');
        process.exit(1);
    }
    runDb = require('./databases/' + db);
    config.db = config[db];
    winston.info('using database handler (%s)', db);
    if (config.feed.proxy) {
        winston.info('using proxy %s', config.feed.proxy);
        utils.proxy(config.feed.proxy);
    }
}
loadConfiguration();
run();
//# sourceMappingURL=feedreader.js.map