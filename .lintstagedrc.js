'use strict';

const config = {
    '*.js': ['eslint --fix --color'],
    '*.{json,yml,yaml}': ['prettier --write'],
};

config['openapi/*.json'] = ['redocly lint'];

module.exports = config;
