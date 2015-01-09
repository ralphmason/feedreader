/// <reference path="../d.ts/DefinitelyTyped/node/node.d.ts" />
/*
 --For osx
 if ( process.platform=='darwin' && ! process.env['DYLD_LIBRARY_PATH']){
 process.env['DYLD_LIBRARY_PATH']=process.cwd()+'/instantclient_11_2';
 }
 */
var makeSqInserts = require('../sqlutil').makeSqInserts;
var util = require('../util');
var path = require('path');
var fs = require('fs');
function translate(m) {
    if (m instanceof Date) {
        var time = util.toISOString(m).split('.')[0];
        return "TO_DATE('" + time.replace('T', ' ') + "','YYYY-MM-DD HH24:MI:SS')";
    }
    if (typeof (m) == 'boolean') {
        return m ? "'Y'" : "'N'";
    }
}
module.exports = function (transformed, winston, config, next) {
    var sql = makeSqInserts(transformed, translate);
    var torun = 'BEGIN ' + sql.join('\n') + ' END;';
    winston.silly(torun);
    if (!config.sqlplus) {
        require('oracle').connect(config, function (err, con) {
            if (err) {
                winston.error('connecting to oracle');
                winston.error(err.message);
                next(err, null);
                return;
            }
            con.execute(torun, [], function (err, ret) {
                if (err) {
                    winston.error('executing sql');
                    winston.error(err.message);
                    winston.error(torun);
                    next(err, null);
                    return;
                }
                winston.info('inserted %d rows', sql.length);
                con.close();
                next(null, null);
            });
        });
    }
    else {
        /*
         oracle: {
         hostname: "oracle",
         port: 1521,
         database: "orcl",
         user: "system",
         password: "oracle",

         */
        var opts = {};
        if (process.platform == 'darwin' && !process.env['DYLD_LIBRARY_PATH']) {
            opts.env = { DYLD_LIBRARY_PATH: path.dirname(config.sqlplus) };
        }
        var isError = null;
        if (!fs.existsSync(config.sqlplus)) {
            winston.error('sqlplus application does not exist at %s', config.sqlplus);
            next('error', null);
            return;
        }
        var spawn = require('child_process').spawn;
        var sqlplus = spawn(config.sqlplus, [util.format('{0}/{1}@{2}{3}{4}', config.user, config.password, config.hostname, config.port ? ':' + config.port : '', config.database ? '/' + config.database : '')], opts);
        sqlplus.on('close', function (code) {
            if (!isError) {
                winston.info('inserted %d rows', sql.length);
            }
            next(isError, null);
        });
        sqlplus.on('error', function (err) {
            isError = err.message;
            return;
        });
        sqlplus.stderr.on('data', function (d) {
            winston.error(d.toString());
            next(d.toString(), null);
        });
        var sentSql = false;
        sqlplus.stdout.on('data', function (d) {
            var str = d.toString();
            if (!/^( *\d+ *)+$/.test(str)) {
                winston.debug(str);
            }
            if (/ERROR/.test(str)) {
                winston.error(str);
                isError = str;
                sqlplus.kill();
                return;
            }
            if (!sentSql && /SQL>/.test(d.toString())) {
                sentSql = true;
                sqlplus.stdin.write(torun + '\n/\nexit\n', 'utf8', function () {
                });
            }
        });
    }
};
//# sourceMappingURL=oracle.js.map