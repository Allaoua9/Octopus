/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Hapi = require('hapi');
const Routes = require('./routes/watermarkRoutes.js');
const Inert = require('inert');

const server = new Hapi.Server();
const port = process.env.port || 8888;

server.connection({
    port: port
});

server.register(Inert, () => { });

server.register(Routes, (err) => {

    if (err) {
        console.log(err);
        process.exit(1);
    }
});

server.start();

exports.server = server;
