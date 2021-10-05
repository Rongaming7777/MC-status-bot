const { PingMC } = require("pingmc");
const logger = require('./logger.js');
const channupd = require('./channupd.js');
const Server = require('../database/ServerSchema');

module.exports = {
    async execute(client) {
        // TODO: Make this get its info from cache
        Server.find({}, (err, servers) => {
            if (err) {
                console.error(err);
                return;
            }

            for (const server of servers) {
                if (!server.IP) continue;

                new PingMC(server.IP)
                    .ping()
                    .then((result) => {
                        // Aternos servers stay online and display Offline in their MOTD when they are actually offline
                        if (server.IP.includes('aternos.me') && result.version.name == '● Offline') {
                            // server is offline
                            if (server.Logging == true) {
                                logger.execute('', server);
                            }
                            channupd.execute(client, server, '');
                        }
                        else if (result) {
                            // server is online
                            if (server.Logging == true) {
                                logger.execute(result, server);
                            }
                            channupd.execute(client, server, result);
                        } else {
                            // server is offline
                            if (server.Logging == true) {
                                logger.execute('', server);
                            }
                            channupd.execute(client, server, '');
                        }
                    })
                    .catch((error) => {
                        // server is offline
                        if (server.Logging == true) {
                            logger.execute('', server);
                        }
                        channupd.execute(client, server, '');

                        // Console log errors exept the ones that indiacte that a server is offline
                        if (!(error.code == "ENOTFOUND" || error.code == "ECONNREFUSED" || error.code == "EHOSTUNREACH" || error.code == "ECONNRESET" || error.message == "Timed out")) {
                            console.error('An error occured in the pinger module:' + error);
                        }
                        return;
                    })
            }
        })
    }
}