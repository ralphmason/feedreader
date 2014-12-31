
/// <reference path="./d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="./d.ts/DefinitelyTyped/lodash/lodash.d.ts" />

var utils=require('./util')
import _ = require('lodash');


function identity(x){ return  x;}


var fixTS=exports.fixTimestamps=function(obj,translate:(x)=>any){

    for(var v in obj){
        var val =obj[v];

        if ( typeof(val)=='string'  ){
            obj[v]=q(val);
        } else if (val instanceof  Date ){
            obj[v]=translate(val);
        }
    }

}

exports.makeSqInserts = function(transformed,timeStampTransform=identity){
    return _.map(transformed, v=> {
        var values = v[1];
        fixTS(values,timeStampTransform);
        var keys = _.keys(values);
        return utils.format('insert into {0}({1})values({2});',
            v[0], keys.join(','), _.map(keys, k=>values[k]).join(','));
    });
}

var q=exports.escapeQuote=function q(x) {
    x = x.replace(/'/g, '\'\'');
    return "'" + x + "'";
}



