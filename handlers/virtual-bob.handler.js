const logger = require('./../services/logger.service');

function log(msg) {
    logger.log(`virtual-bob.handler | ${msg}`);
}

var meters = 0;
var bobString = [0,0,0];
var timer;
var _onBobStringChangedCallback;

function stopCharging() {
    if (timer) {
        clearTimeout(timer);
    }
}

function startCharging() {
    timer = setInterval(() => {
        meters++;
        bobString[2]=meters;
    }, 1000);
}

var service = {
    init: function (config) {
        log('initialized');

    },
    setOnBobStringChangedCallback: function (cb) {
        _onBobStringChangedCallback = cb;
    },
    setBobString: function (payload) {
        bobString = payload;
        if (bobString[1] == 2) {
            startCharging();
        }else if (bobString[1] == 5) {
            bobString[1]=1;
        }else{
            stopCharging();
        }
        _onBobStringChangedCallback(bobString);
    },
    readBobString: function (payload) {
        return bobString;
    }
}

module.exports = service;