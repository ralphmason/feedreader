
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />

/*
 Feed reader config file
 */

exports.config = {

    feed: {
        company: 'telogis',
        user: 'demo',
        password: 'password',
        topic: 'realtime_feed'
    },
    mongo: {
        connectstring: "mongodb://localhost/pvt"
    },
    logs:{
        Console: {
            colorize: true,
            prettyprint:true,
            timestamp:true,
            level:"debug"
        },
        File:{
            maxsize:4000000,
            maxfiles:10,
            level:"silly",
            timestamp:true,
            filename:"feedreader.log"
        }
    }
};

exports.transform_UnitMessage = function (record) {

    record.LatLong={ loc: { type: "Point", coordinates: [ record.Longitude,record.Latitude ] } };
    delete  record.Longitude
    delete record.Latitude;


    return ['pvt', record];
}
