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
    oracle: {
        hostname: "oracle",
        port: 1521,
        database: "orcl",
        user: "system",
        password: "oracle"
    },
    logs: {
        Console: {
            colorize: true,
            prettyprint: true,
            timestamp: true,
            level: "debug"
        },
        File: {
            maxsize: 4000000,
            maxfiles: 10,
            level: "silly",
            timestamp: true,
            filename: "feedreader.log"
        }
    }
};
var moment = require('moment');
var q = require('../sqlutil').escapeQuote;
function toOracleDate(m) {
    var time = m.toISOString().split('.')[0];
    return "TO_DATE('" + time.replace('T', ' ') + "','YYYY-MM-DD HH24:MI:SS')";
}
exports.transform_UnitMessage = function (record) {
    return ['pvt', {
        SEQ_ID: record.Id,
        ILM_SEQ_ID: 0,
        SERIAL_NO: q(record.SerialNumber.toString(16)),
        //CLIENT_ID: 'NULL',
        PVT_TYPE: record.SpeedKPH > 0 ? '\'MOVING\'' : '\'STOPPED\'',
        PVT_DESC: q(''),
        VEHICLE_LABEL: q(record.VehicleTag),
        SPEED: record.SpeedKph,
        SPEED_UOM: '\'KPH\'',
        DIRECTION: q(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(((record.Heading + 22) % 360) / 45)]),
        //DURATION: 'NULL',
        LATITUDE: record.Latitude,
        LONGITUDE: record.Longitude,
        //GPS_STATUS: 'NULL',
        LOCATION_TIMESTAMP: toOracleDate(moment(record.time)),
        //LOCATION_DATE: 'NULL',
        //LOCATION_TIME: 'NULL',
        //LOCATION_TIMEZONE: q(''),
        MILEAGE: record.OdometerKm,
        BUILDING_NUMBER: record.StreetNumber,
        STREET: q(record.StreetName),
        CITY: q(record.City),
        STATE: q(record.Region),
        ZIP: record.PostCode,
        //CROSS_STREET: 'NULL',
        COUNTY: q(record.County),
        //CUSTOMER_LANDMARK: 'NULL',
        //LANDMARK_TYPE_ID: 'NULL',
        COUNTRY: q(record.Country),
        //LOAD_TIME: 'NULL',
        LOCAL_TIME: toOracleDate(moment(record.Time).add(record.TimeZoneOffsetMinutes, 'm'))
    }];
};
//# sourceMappingURL=oracle.js.map