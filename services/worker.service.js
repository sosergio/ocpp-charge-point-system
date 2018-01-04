var CronJob = require('cron').CronJob;
const logger = require('./logger.service');

function log(msg) {
    logger.log(`WorkerService | ${msg}`);
}

var _meterReadingJob;
var _heartbeatJob;

var service = {

    startMeterReadingJob: function (cb) {
        if (!_meterReadingJob) {
            _meterReadingJob = new CronJob('*/10 * * * * *', cb, null, true, 'America/Los_Angeles');
        }
    },
    startHeartbeatJob: function (cb) {
        if (!_heartbeatJob) {
            _heartbeatJob = new CronJob('*/60 * * * * *', cb, null, true, 'America/Los_Angeles');
        }
    },
    connectorNotPlugged: function (cb) {
        setTimeout(cb, 60000);
    },
    pauseHeatbeatJob: function () {
        if (_heartbeatJob) {
            _heartbeatJob.stop();
            _heartbeatJob = null;
        }
    }
}

module.exports = service;