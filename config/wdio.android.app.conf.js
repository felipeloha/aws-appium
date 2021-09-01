const path = require('path');
const config = require('./wdio.shared.conf').config;
config.specs = [
    './tests/android/specs/**/app*.spec.js',
];
config.capabilities = [
    {
        // The defaults you need to have in your config
        automationName: 'UiAutomator2',
        deviceName: 'emulator-5554',
        platformName: 'Android',
        platformVersion: '10',
        orientation: 'PORTRAIT',
        app: path.join(process.cwd(), './apps/ApiDemos-debug.apk'),
        noReset: true,
        newCommandTimeout: 240,
    },
];

exports.config = config;
