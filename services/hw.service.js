const logger = require('./logger.service');
var _bobHandler;

function log(msg) {
    logger.log(`hw.service | ${msg}`);
}

const pilotState = {
    Available: 0,
    Preparing: 1,
    Charging: 2,
    SuspendedEV: 3,
    SuspendedEVSE: 4,
    Finishing: 5,
    0: "Available",
    1: "Preparing",
    2: "Charging",
    3: "SuspendedEV",
    4: "SuspendedEVSE",
    5: "Finishing"
};
var _onConnectorStatusUpdateCallback;

var service = {
    setBobHandler: function (handler, config) {
        _bobHandler = handler;
        _bobHandler.init(config);
        _bobHandler.setOnBobStringChangedCallback(payload => {
            log(`OnBobStringChangedCallback: ${payload}`);
            _onConnectorStatusUpdateCallback(pilotState[payload[1]]);
        });
    },
    setConnectorStatus: function (payload) {
        log(`setConnectorStatus: ${payload}`);
        let bobString = _bobHandler.readBobString();
        bobString[1] = pilotState[payload];
        _bobHandler.setBobString(bobString);
    },
    readConnectorStatus: function () {
        let bobString = _bobHandler.readBobString();
        log(`readConnectorStatus bobString:${bobString}`);
        return pilotState[bobString[1]];
    },
    readMeterReading: function () {
        let bobString = _bobHandler.readBobString();
        log(`readMeterReading bobString:${bobString}`);
        return bobString[2];
    },
    setAvailable: function () {
        this.setConnectorStatus('Available');
    },
    setPreparing: function () {
        this.setConnectorStatus('Preparing');
    },
    setCharging: function () {
        this.setConnectorStatus('Charging');
    },
    setFinishing: function () {
        this.setConnectorStatus('Finishing');
    },
    setSuspendedEVSE: function () {
        this.setConnectorStatus('SuspendedEVSE');
    },
    onConnectorStatusUpdate: function (cb) {
        _onConnectorStatusUpdateCallback = cb;
    }

}

module.exports = service;