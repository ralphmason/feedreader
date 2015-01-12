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
exports.transform_UnitMessage = function (record) {
    var local = new Date();
    local.setTime(record.Time.getTime() + record.TimeZoneOffsetMinutes * 60000);
    return ['pvt', {
        SEQ_ID: record.Id,
        ILM_SEQ_ID: 0,
        SERIAL_NO: (record.SerialNumber.toString(16)),
        PVT_TYPE: record.SpeedKph > 0 ? "MOVING" : "STOPPED",
        PVT_DESC: '',
        VEHICLE_LABEL: (record.VehicleTag),
        SPEED: record.SpeedKph,
        SPEED_UOM: 'KPH',
        DIRECTION: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(((record.Heading + 22) % 360) / 45)],
        LATITUDE: record.Latitude,
        LONGITUDE: record.Longitude,
        LOCATION_TIMESTAMP: record.Time,
        MILEAGE: record.OdometerKm,
        BUILDING_NUMBER: record.StreetNumber,
        STREET: record.StreetName,
        CITY: record.City,
        STATE: record.Region,
        ZIP: record.PostCode,
        COUNTY: record.County,
        COUNTRY: record.Country,
        LOCAL_TIME: local
    }];
};
//# sourceMappingURL=oracle.js.map