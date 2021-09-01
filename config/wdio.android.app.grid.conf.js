const path = require('path');
const config = require('./wdio.shared.conf').config;
config.specs = [
    './tests/android/specs/**/app*.spec.js',
];
config.capabilities = [
    {
        platformName: 'Android',
        'appium:automationName': 'UIAutomator2',
        'appium:app': '/apks/ApiDemos-debug.apk',
        'appium:deviceName': 'Android Emulator',
        'appium:noReset': false,
        'appium:optionalIntentArguments': `-t "text/plain"`,
    },
];
config.hostname = 'localhost';
config.port = 4444;
config.path = '/wd/hub';

exports.config = config;
