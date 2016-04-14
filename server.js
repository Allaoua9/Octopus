/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Hapi = require('hapi');
const Routes = require('./routes/watermarkRoutes.js');
const Inert = require('inert');
const Path = require('path');
const OpenCv = require('opencv');


const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    }
});
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

OpenCv.readImage('./cover.jpg', function (err, im) {

    im.save('./out.jpg');
});


exports.server = server;
