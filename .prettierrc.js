'use strict';

/*! m0-start */
const config = {
    tabWidth: 4,
    singleQuote: true,
    printWidth: 100,
    bracketSpacing: false,
};
/*! m0-end */

config.overrides = [
    {
        files: ['*.yaml', '*.yml'],
        options: {
            tabWidth: 2,
        },
    },
];

/*! m0-start */
module.exports = config;
/*! m0-end */
