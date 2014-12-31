
/// <reference path="../d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="../d.ts/DefinitelyTyped/lodash/lodash.d.ts" />

var mongo       = require('mongodb').MongoClient;
import _        = require('lodash');
import async    = require('async');

var m = require('moment');

module.exports=function (transformed,winston,config,next:(err,res)=>void) {

    var tables = _.uniq(_.map(transformed, x=>x[0]));

    var client = mongo.connect(config.connectstring, (err, db)=> {

        if ( err ){
            winston.error('Connect mongo');
            next(err,null);
            return;
        }

        async.eachLimit(tables, 1, (table, next)=> {

                var data = _.filter(transformed, x=>x[0] == table).map(x=>x[1]);
                db.collection(table).insert(data, (err,res)=>{
                    if ( ! err ){
                        winston.info('inserted %d document(s) into collection \'%s\'',data.length,table) ;
                    }
                    next(err,res);
                });

            },err=> {

                db.close();
                if (err) {
                    winston.warn(err.message);
                    next(err, null);
                    return;
                }

                next(null, null);

            });

    });
}


