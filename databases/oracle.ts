/// <reference path="../d.ts/DefinitelyTyped/node/node.d.ts" />


/*
 --For osx
 if ( process.platform=='darwin' && ! process.env['DYLD_LIBRARY_PATH']){
 process.env['DYLD_LIBRARY_PATH']=process.cwd()+'/instantclient_11_2';
 }
 */

var makeSqInserts=require('../sqlutil').makeSqInserts;
var oracle=require('oracle');
var util=require('../util');

function toOracleDate(m){
    var time=util.toISOString(m).split('.')[0];
    return "TO_DATE('"+time.replace('T',' ')+"','YYYY-MM-DD HH24:MI:SS')";
}


module.exports=function (transformed,winston,config,next:(err,res)=>void) {

    var sql= makeSqInserts(transformed,toOracleDate);

    oracle.connect(config, (err, con)=> {
        if (err) {
            winston.error('connecting to oracle');
            winston.error(err.message);
            next(err,null);
            return;
        }

        var torun = 'BEGIN ' + sql.join('\n') + ' END;';

        winston.silly(torun);

        con.execute(torun, [], (err, ret)=> {
            if (err) {
                winston.error('executing sql');
                winston.error(err.message);
                winston.error(torun);
                next(err,null);
                return;
            }
            winston.info('inserted %d rows', sql.length);

            con.close();
            next(null,null);
        });
    });
}

