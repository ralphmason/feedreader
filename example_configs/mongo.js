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
    mongo: {
        connectstring: "mongodb://localhost/pvt"
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
    return ['pvt', record];
};
//# sourceMappingURL=mongo.js.map