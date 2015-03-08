/// <reference path="./typings/node/node.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
var _ = require('lodash');
var parseXML = require('xml2js').parseString;
var async = require('async');
var utils = require('./util');
var winston = require('winston');
var fs = require('fs');
var path = require('path');
var counter = require('./counter');
process.chdir(__dirname);
var opts = require('node-getopt').create([
    ['c', 'config=ARG', 'Set config file, defaults to ./config'],
    ['s', 'setting=ARG+', 'Replace a setting in the config section of the config file'],
    ['f', 'file=ARG', 'load configuration overrides from a json file (must be proper json, not javascript)'],
    ['1', 'runOnce', 'Run a single packet of xml tata through the transforms and database then exit'],
    ['x', 'xml=ARG', 'process xml in the given file and exit']
]).bindHelp().parseSystem();
var handledMessages, messageHandlers, runDb, config;
function run() {
    var shouldExit = false;
    function doExit() {
        if (shouldExit) {
            winston.info("Doing forced shutdown");
            process.exit(1);
        }
        winston.info("Caught interrupt signal - starting clean shutdown");
        winston.info("Signal again to force");
        shouldExit = true;
        setTimeout(function () {
            winston.error("process failed to shutdown cleanly");
            process.exit(1);
        }, 30000);
    }
    process.on('SIGINT', doExit);
    process.on('SIGTERM', doExit);
    counter.beforeRollover(function (c) {
        _.forOwn(c, function (v, n) {
            winston.info("count:%s-[%s]", n, v.getValues().join(','));
        });
    });
    winston.info('Feedreader started', function () {
        var xml;
        async.forever(function (next) {
            if (shouldExit) {
                winston.info('Shutdown complete');
                process.exit(0);
                return 0;
            }
            xml = null;
            pull(config.feed, function (err, ret) {
                if (err) {
                    winston.error(err);
                    utils.clearSession();
                    setTimeout(next, 15000);
                    return;
                }
                xml = ret;
                winston.silly('Parsing XML');
                parseXML(ret, function (err, data) {
                    if (err) {
                        next(err);
                        return;
                    }
                    var report = data.DataFeedReport;
                    var ackId = report.$.id;
                    delete report.$;
                    var types = _.keys(report);
                    var toProcess = _.intersection(handledMessages, types);
                    if (toProcess.length == 0) {
                        if (types.length == 0) {
                            winston.debug('No data returned');
                        }
                        else {
                            winston.warn('No handlers for returned message types (%s)', types.join(','));
                        }
                        utils.ack(config.feed, ackId, function (x) {
                            if (x) {
                                next(x);
                                return;
                            }
                            setTimeout(next, 15000);
                        });
                        return;
                    }
                    winston.silly(report);
                    var transformed = [];
                    var records = 0;
                    _.forEach(toProcess, function (aType) {
                        var transform = messageHandlers[aType];
                        var data = report[aType];
                        winston.debug('%d \'%s\' returned', data.length, aType);
                        records += data.length;
                        counter.getCounter(aType).add(data.length);
                        var v = _.map(data, function (d) { return transform(utils.cleanObject(d)); });
                        transformed = transformed.concat(v);
                    });
                    runDb(transformed, winston, config.db, function (err, res) {
                        if (err) {
                            next(err);
                            return;
                        }
                        if (opts.options.xml) {
                            next('exit after processing xml file');
                            return;
                        }
                        if (!opts.options.runOnce) {
                            xml = null; //We have success - so don't need to log on ack failure
                        }
                        utils.ack(config.feed, ackId, function (x) {
                            if (x) {
                                next(x);
                                return;
                            }
                            var timeout = 0;
                            if (records < 250) {
                                timeout = 7000;
                            }
                            setTimeout(function () { return next(opts.options.runOnce ? 'run once flag specified - exiting' : null); }, timeout);
                        });
                    });
                });
            });
        }, function (err) {
            winston.error(err);
            if (err.message) {
                winston.error(err.message);
            }
            if (config.errorDir && xml) {
                var md5 = require('crypto').createHash('md5');
                var sum = md5.update(xml).digest('hex');
                var p = path.join(config.errorDir, sum + ".xml");
                winston.error('xml written to (%s)', p);
                fs.writeFileSync(p, xml);
            }
            winston.error('Feedreader exiting with error', function (err) {
                setTimeout(function () {
                    process.exit(1);
                }, 1000); //winston bug doesn't flush on process exit
            });
        });
    });
}
function pull(config, then) {
    if (opts.options.xml) {
        winston.info('reading data from file (%s)', opts.options.xml);
        opts.options.runOnce = true;
        fs.readFile(opts.options.xml, 'utf8', then);
    }
    else {
        utils.pull(config, then);
    }
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
        winston.info('using proxy (%s)', config.feed.proxy.replace(/[^p]\:.*?@/, ':*******@'));
        utils.proxy(config.feed.proxy);
    }
}
loadConfiguration();
run();
//# sourceMappingURL=feedreader.js.map