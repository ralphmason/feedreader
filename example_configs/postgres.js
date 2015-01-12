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
    postgres: {
        hostname: "localhost",
        database: "pvt",
        user: "pvt",
        password: "pvt"
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
    return ['pvt', {
        ID: record.Id,
        SERIAL_NO: (record.SerialNumber.toString(16)),
        TAG: (record.VehicleTag),
        SPEED: record.SpeedKph,
        HEADING: record.Heading,
        LATITUDE: record.Latitude,
        LONGITUDE: record.Longitude,
        LOCATION_TIMESTAMP: q(record.Time),
        MILEAGE: record.OdometerKm,
        NUMBER: record.StreetNumber,
        STREET: (record.StreetName),
        SUBURB: (record.Suburb),
        CITY: (record.City),
        STATE: (record.Region),
        ZIP: record.PostCode,
        COUNTY: (record.County),
        COUNTRY: (record.Country)
    }];
};
//# sourceMappingURL=postgres.js.map