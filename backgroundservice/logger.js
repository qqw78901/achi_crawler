const winston = require('winston');
const moment = require('moment');
const {
    createLogger,
    format,
    transports
} = require('winston');
const {
    combine,
    json,
    prettyPrint
} = format;
const myTimeStamp = format((info) => {
    info.timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
    return info;
});

function Logger(fileName) {
    return winston.createLogger({
        format: combine(
            json(),
            myTimeStamp(),
            prettyPrint()
        ),
        transports: [
            // new winston.transports.Console(),
            new winston.transports.File({
                filename: `${fileName}.log`
            })
        ]
    });
}
module.exports = Logger;