const fs = require('fs')
const logPath = './log.txt';

function loggify(msg){
    return `[${new Date().toISOString()}] ${msg}`;
}

var service = {
    init: function () {
        fs.writeFile(logPath, loggify('log initialized' + '\n'), (err) => {
            if (err) throw err;
        });
    },
    log: function (msg) {
        let _ms = loggify(msg);
        console.log(_ms);
        fs.appendFile(logPath, _ms + '\n', (x) => {});
    }
}

module.exports = service;