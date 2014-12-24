
/// <reference path="../d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="../d.ts/DefinitelyTyped/lodash/lodash.d.ts" />

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
    postgres: {
        hostname: "localhost",
        database: "pvt",
        user: "pvt",
        password: "pvt"
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

var q = require('../sqlutil').escapeQuote;

exports.transform_UnitMessage = function (record) {

    return ['pvt', {
        ID: record.Id,
        SERIAL_NO: q(record.SerialNumber.toString(16)),
        TAG: q(record.VehicleTag),
        SPEED:  record.SpeedKph,
        HEADING:record.Heading,
        LATITUDE: record.Latitude,
        LONGITUDE: record.Longitude,
        LOCATION_TIMESTAMP:q(record.Time),
        MILEAGE: record.OdometerKm,
        NUMBER: record.StreetNumber,
        STREET: q(record.StreetName),
        SUBURB: q(record.Suburb),
        CITY: q(record.City),
        STATE: q(record.Region),
        ZIP: record.PostCode,
        COUNTY: q(record.County),
        COUNTRY: q(record.Country)
    }];
}

/*
Example schema

create table pvt(
 ID varchar,
 SERIAL_NO varchar,
 TAG varchar,
 SPEED int,
 HEADING int,
 LATITUDE float,
 LONGITUDE float,
 LOCATION_TIMESTAMP timestamp,
 MILEAGE int,
 NUMBER int,
 STREET varchar,
 SUBURB varchar,
 CITY varchar,
 STATE varchar,
 ZIP varchar,
 COUNTY varchar,
 COUNTRY varchar
)

 */