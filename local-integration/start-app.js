'use strict';

// Let Pino flush its transport when the integration runner stops the app.
process.on('SIGTERM', () => process.exit(0));

require('../bin/www');
