/**
 * Created by zuowenqi on 2018/1/19 0019
 */
const http = require('http');
// const stringifyObject = require('stringify-object');
const querystring = require('querystring');
const iconv = require('iconv-lite');
var urlencode = require('urlencode');
const url = require('url');
const fs = require("fs");

const cheerio = require("cheerio");
// const JSON = require('qs')
const LOGGER = require('./logger');
const util  =require('util');

const logger = new LOGGER('combined');

function writeFile(content, filePath) {
    fs.writeFile(filePath, content, (err) => {})
}


class Crawler {
    constructor() {}
    getCookie(homeUrl) {
        return new Promise(resolve => {
            let bufferHtml;
            homeUrl = homeUrl ? homeUrl : "http://www.gdldzx.net/";
            let options = url.parse(homeUrl);
            http.get(options, (res) => {
                res.setEncoding('utf-8');
                console.log(res.statusCode);
                console.log(res.headers);
                if (res.statusCode === 302) {
                    return this.getCookie(homeUrl + res.headers.location)
                }

                res.on("data", (chunk) => {
                    bufferHtml += chunk;
                });
                res.on("end", () => {
                    // writeFile(bufferHtml, './output.html')
                    if (bufferHtml) {
                        let $ = cheerio.load(bufferHtml, {
                            decodeEntities: false
                        });
                        if (!$('title').html()) {
                            let location = $("script").eq(0).html().split("\"")[1];
                            return this.getCookie(homeUrl + location);
                        }
                        resolve(res.headers['set-cookie'])
                    } else {
                        reject("爬虫获取数据失败")
                    }
                });
            })
        })

    }
    getAchievement(xh, xm, selenj) {
        return this.getCookie().then((cookies) => {
            //数据处理 start
            const getAchievementUrl = "http://125.90.170.3/cjgl/look_cj.asp";
            this.getAchievementUrl = getAchievementUrl;
            let options = url.parse(getAchievementUrl);
            const contents = querystring.stringify({ xh, xm: urlencode(xm, 'gbk'), selenj }, null, null, {
                encodeURIComponent: (value) => { return value }
            });
            Object.assign(options, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': contents.length,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Encoding": "gzip, deflate",
                    "Cache-Control": "no-cache",
                    "Host": "125.90.170.3",
                    "Origin": "http://125.90.170.3",
                    "Cookie": cookies[0],
                    "Pragma": "no-cache",
                    "Referer": "http://125.90.170.3/cjgl/",
                    "Upgrade-Insecure-Requests": "1",
                    "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
                }
            });
            //数据处理 end
            return this._postrequest(options, contents).then((str) => {
                //请求之后的dom筛选以及数据构造
                let $ = cheerio.load(str, {
                    decodeEntities: false
                });
                let rows = this._handleAchievementToJson($)
                logger.info(rows);
                return this._successResponse({ rows });
            }).catch((err) => {
                logger.error(err)
                return this._errorResponse(err)
            });

        }).catch(() => {
            logger.info('获取cookie失败');
            return this._errorResponse('获取cookie失败')
        })

    }
    getSheet(homeUrl) {
        return new Promise(resolve => {
            let bufferHtml;
            homeUrl = homeUrl ? homeUrl : "http://125.90.170.3/cjgl/";
            let options = url.parse(homeUrl);
            let getRequest = http.get(options, (res) => {
                res.setEncoding('binary');
                if (res.statusCode === 302) {
                    return this.getSheet(homeUrl + res.headers.location)
                }
                res.on("data", (chunk) => {
                    bufferHtml += chunk;
                });
                res.on("end", () => {
                    var buf = new Buffer(bufferHtml, 'binary');
                    var str = iconv.decode(buf, 'gbk');
                    if (str) {
                        let $ = cheerio.load(str, {
                            decodeEntities: false
                        });
                        if (!$('title').html()) {
                            let location = $("script").eq(0).html().split("\"")[1];
                            return this.getCookie(homeUrl + location);
                        }
                        let rows = this._handleSheetToJson($);
                        // writeFile 缓存
                        let resultMap =  this._successResponse({ rows });
                        // writeFile(util.inspect(resultMap,{depth: null,maxArrayLength :null }), './sheet.json');
                        if(rows.length){
                            writeFile(JSON.stringify(resultMap), './sheet.json');
                        }
                        resolve(resultMap);
                    } else {
                        resolve(this._errorResponse("爬虫获取成绩库数据失败"))
                    }
                });
            })
            getRequest.on('error',()=>{
                logger.error('爬虫获取成绩库数据失败')
                resolve(this._errorResponse("爬虫获取成绩库数据失败"))
            })
        })


    }
    _postrequest(options, contents) {
        return new Promise((resolve, reject) => {
            let times = 0;
            let bufferHtml = "";
            const resultData = http.request(options, res => {
                if (res.statusCode !== 200) {
                    logger.info("_postrequest状态码：" + res.statusCode);
                    if (times > 5) {
                        return this._errorResponse('爬虫页面获取失败或重定向次数过多');
                    }
                    if (res.statusCode == 302) {
                        // resirect
                        let redirectUrl = url.resolve(this.getAchievementUrl, res.headers.location)
                        Object.assign(options, url.parse(redirectUrl));
                    }
                    times++;
                    return this._postrequest(options, contents);
                }
                res.setEncoding('binary');
                res.on("data", function(chunk) {
                    bufferHtml += chunk;
                });
                res.on("end", () => {
                    var buf = new Buffer(bufferHtml, 'binary');
                    var str = iconv.decode(buf, 'gbk');
                    writeFile(str, `./out/output_${new Date().getTime()}.html`)
                    let $ = cheerio.load(str, {
                        decodeEntities: false
                    });
                    if (!$('title').html()) {
                        let location = $("script").eq(0).html().split("\"")[1];
                        let redirectUrl = url.resolve(this.getAchievementUrl, location)
                        Object.assign(options, url.parse(redirectUrl));
                        return this._postrequest(options, contents);
                    }
                    if (str) {
                        resolve(str);
                    } else {
                        reject("爬虫获取数据失败,获取到的页面为空")
                    }

                });
            });
            resultData.write(contents);
            console.log(contents);
            console.log(options);
            resultData.end();
            resultData.on('error', () => {
                console.log("error");
                reject("请求成绩结果页面错误")
            });
        })

    }
    _handleSheetToJson($) {
        let result = [];
        $('select[name=selenj]').find('option').each((i, option) => {
            result.push({
                val: $(option).val(),
                name: $(option).text()
            })
        })
        return result;
    }
    _handleAchievementToJson($) {
        let Obj = {};
        let $table = $("table[border=1]");
        const reg = /<\/?[^>]*>|\s/gim;
        let resultKey = [];
        let resultVal = [];
        if (!$table.length) {
            logger.info("解析出错");
            return{};
        }
        $table.find("th").each((i, th) => {
                let $th = $(th);
                let thVal = $th.find("font").html().replace(reg, "");
                resultKey.push(thVal);
            })
            // $table.find('tr').eq(1)
        $table.find("span").each((i, td) => {
                let $td = $(td);
                let tdVal = $td.html().replace(reg, "");
                resultVal.push(tdVal);
            })
            // writeFile(stringifyObject({
            //     resultKey,
            //     resultVal
            // }), './output.txt');
        return {
            resultKey,
            resultVal
        };
    }
    _successResponse(Obj) {
        return Object.assign({
            status: 200
        }, Obj);
    }
    _errorResponse(message) {
        return {
            status: 100,
            message
        }
    }
}
module.exports = Crawler;