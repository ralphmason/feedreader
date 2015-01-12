
/// <reference path="./typings/node/node.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />

var utils=require('./util')
import _ = require('lodash');


function identity(x){ return  x;}


var formatSql=function(obj,translate:(x)=>any){

    for(var v in obj){
        var val =obj[v];

        var v = translate(val);

        if ( v) {
            return v;
        }

        if ( typeof(val)=='string'  ){
            obj[v]=q(val);
        } else if ( typeof(val)=='boolean'){
            return val;
        }
    }
}

exports.makeSqInserts = function(transformed,dbSpecificFormat=identity){
    return _.map(transformed, v=> {
        var values = v[1];
        formatSql(values,dbSpecificFormat);
        var keys = _.keys(values);
        return utils.format('insert into {0}({1})values({2});',
            v[0], keys.join(','), _.map(keys, k=>values[k]).join(','));
    });
}

var q=exports.escapeQuote=function q(x) {
    x = x.replace(/'/g, '\'\'');
    return "'" + x + "'";
}



