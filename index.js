/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Hapi = require('hapi');
const Routes = require('./routes/watermarkRoutes.js');

const server = new Hapi.Server();

server.connection({
    port: 8888
});

server.register(Routes, (err) => {

    if (err) {
        console.log(err);
        process.exit(1);
    }
});

server.start();

exports.server = server;
