/**
 * Created by ralphmason on 21/12/14.
 */
/// <reference path="./d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="./d.ts/DefinitelyTyped/lodash/lodash.d.ts" />
import http = require('https');
import fs=require('fs');
var winston = require('winston');
import _ = require('lodash');



var format = exports['format']=function (str:string, ...args:any[]):string {
        return str.replace(/{(\d+)}/g, (match, number)=> {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    }

var fetch=exports['fetch']=function (url:string, then:(err:string, data)=>void) {

    url = "https://" + url;

    winston.debug(url);

    try {

        var req =http.get(url, res=> {

            var json = '';
            var err = null;

            if ((<any>res).statusCode != 200) {
                err = 'Invalid response from server:' + (<any>res).statusCode;
            }

            res.on("data", d=> json += d);
            res.on("end", e => {
                winston.debug('<result>'+json.substring(0, 256).replace(/\r\n/g,''));
                winston.silly(json);

                if (err) {
                    then(err + " data:" + json,null);
                    return;
                }

                then(null, json);
            });
        });

        req.on('error', e=> {
           winston.error(e);
            then(e,null);
        });

    }
    catch (err) {
        then(err, null);
    }
}

var session = null;
var sessionCreateTime=Date.now();
var REFRESH_TIMEOUT = 1000*60*60*12;

function getSession(config,then:(err,dat)=>void ){

    if ( session == null || Date.now() - sessionCreateTime > REFRESH_TIMEOUT){

        winston.info('requesting new session');

          fetch(format('api.telogis.com/rest/login/{0}/{1}/{2}',config.company,config.user,config.password),(err,ret)=>{

              if ( err){
                  then(err,null);
                  return;
              }

              var parsed = JSON.parse(ret);
              session = parsed.token;
              sessionCreateTime=Date.now();

              then(null,session);
        });
    }
    else{
        then(null,session);
    }
}
var SAVE_FILE='incomming.feed.message';

var pull=exports['pull']=function(config,then:(err,dat)=>void){

    if ( fs.existsSync(SAVE_FILE) ){
        fs.readFile (SAVE_FILE,'utf8',then);
        return;
    }

    getSession(config,(err,ret)=>{
            if ( err ){ then(err,null);return; }

        fetch(format('integration.telogis.com/XmlDataFeed/reports.aspx?token={0}&feed=topic-{1}&element_mode=true',ret,config.topic),
            (err,ret)=>{

                if ( err ){   //tolerate transient issues
                    winston.error(err);
                    ret='<?xml version="1.0" encoding="UTF-8"?><DataFeedReport />';
                }

                 fs.writeFile(SAVE_FILE,ret,(err,t)=>{
                     then(err,ret);
                 });
            }
        );
    })

}

var ack=exports['ack']=function(){

    fs.unlinkSync(SAVE_FILE);

}

var isNumber = /^[+-]?\d+$/;
var isFloat = /^[+-]?\d+\.\d+$/;

function clean(x) {
    if (Array.isArray(x) && x.length == 1) {
        x = x[0];
    }
    if (!Array.isArray(x)) {
        var ret = x;
        if (ret.indexOf('\r\n') == 0) {
            ret = '';
        } else if (isNumber.test(ret)) {
            ret = parseInt(ret);
        } else if (isFloat.test(ret)) {
            ret = parseFloat(ret)
        }
        return ret;
    }
    else if (Array.isArray(x) && x.length > 1) {
        x = _.map(x, clean);
    }
    ;

    return x;
}

exports.cleanObject=function(data){
        for (var v in data) {
            data[v] = clean(data[v]);
        }
   return data;
}
