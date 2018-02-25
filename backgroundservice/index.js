const crawler = require('./Crawler');
const LOGGER = require('./logger');
const express = require('express');
const fs = require('fs');
const app = express();

const Crawler = new crawler();
const logger = new LOGGER('serverLog');
const connectlogger = new LOGGER('connectLog');
/**
 * Fast Middleware exposing user-agent for NodeJS,
 * @example req.useragent
 */
const useragent = require('express-useragent');
var UA = require('ua-device');
app.use(useragent.express());
app.use((req, res, next) => {
    req.ua = new UA(req.useragent.source);
    next();
})
const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); //自定义中间件，设置跨域需要的响应头。
    next();
};
app.use(allowCrossDomain); //运用跨域的中间件

/**
 * routers
 */
app.get('/', function(req, res) {
    logger.info('theres no place like home')
    res.send('Hello World!');
});

app.get('/do', function(req, res) {
    let {
        num,
        name,
        sheet
    } = req.query;
    Crawler.getAchievement(num, name, sheet).then((resp) => {
        res.send(resp);
    }).catch(() => {
        res.sendStatus(400)
    })
});
app.get('/cookie', (req, res) => {
    Crawler.getCookie().then(resp => {
        res.send(resp);
    }).catch(() => {
        res.sendStatus(400)
    })
});

let lastGetSheet = +new Date();
let intervalTime = 1000 * 60 * 60 * 12; //12 hour
app.get('/sheet', (req, res) => {
    const ua = req.ua;
    logger.info(req.ip, { ua });
    connectlogger.info(req.ip, {
        browser: ua.browser.name,
        device: ua.device.type == 'desktop' ? ua.os.name : ua.device.model
    })
    const getFromServer = () => {
        return Crawler.getSheet().then(resp => {
            logger.info(resp.status, { 'label': 'getsheet' });
            res.json(resp);
        }).catch(() => {
            res.sendStatus(400)
        })
    };
    const getFromFile = () => {
        return new Promise((resolve, reject) => {
            fs.readFile('./sheet.json', 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    res.send(JSON.parse(data));
                    resolve();
                }
            });
        })
    }
    let now = +new Date();
    if (now - lastGetSheet >= intervalTime) {
        getFromServer();
    } else {
        getFromFile().catch((err) => {
            logger.error(err);
            getFromServer();
        })
    }

    lastGetSheet = now;
})
var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('ldzx app listening at http://%s:%s', host, port);
});