const fs = require('fs-extra');
const dir = './screenshots';

exports.config = {
    runner: 'local',
    framework: 'jasmine',
    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000,
    },
    sync: true,
    logLevel: 'silent',
    deprecationWarnings: true,
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 90000,
    connectionRetryCount: 3,
    // reporters: ['spec', 'allure'],
    reporters: ['spec'],

    // ====================
    // Appium Configuration
    // ====================
    // Default port for Appium
    port: 4723,
    maxInstances: 1,
    appium: {
        args: {
            address: '127.0.0.1',
            port: 4723,
        },
    },

    // ====================
    // Some hooks
    // ====================
    beforeSession: (config, capabilities, specs) => {
        require('@babel/register');
        fs.ensureDirSync(dir);
        fs.emptyDirSync(dir);
    },

    afterTest: function (test) {
        if (test.error !== undefined) {
            driver.takeScreenshot();
            browser.saveScreenshot(`${dir}/${new Date().valueOf()}.png`);
        }
    }
};
