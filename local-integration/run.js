'use strict';

const {spawnSync} = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const image = 'cica-experian-bank-wizard:local-integration';

function docker(args) {
    const result = spawnSync('docker', args, {cwd: root, stdio: 'inherit'});
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`docker ${args[0]} failed (${result.signal || result.status})`);
    }
}

try {
    docker(['build', '-t', image, '.']);
    docker([
        'run',
        '--rm',
        '--init',
        '--network',
        'none',
        '--tmpfs',
        '/usr/src/app/ssl:ro',
        ...['local-integration', 'stubs', 'testing'].flatMap((directory) => [
            '--mount',
            `type=bind,source=${path.join(root, directory)},target=/usr/src/app/${directory},readonly`,
        ]),
        image,
        'node',
        'local-integration/checks.js',
    ]);
} catch (err) {
    console.error(`Local Docker integration test failed: ${err.message}`);
    process.exitCode = 1;
}
