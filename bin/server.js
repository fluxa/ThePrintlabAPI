#!/usr/bin/env node
const app = require('../app');

const server = app.listen(app.get('port'), function() {
    console.info('NodeJS server running on %s', app.get('port'));
});
