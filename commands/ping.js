const { PingMC } = require("pingmc");
const Discord = require('discord.js');
const { lookup } = require('../modules/cache.js');

module.exports = {
    name: 'ping',
    async execute(message, args) {
        var ip = "";
        if (!args[0]) {
            const data = await lookup('Server', message.guild.id);

            if (!data.IP) {
                message.channel.send('Please specify a IP adress to ping!');
                return;
            }

            ip = data.IP;
        } else {
            ip = args[0].split(':')[0].toLowerCase();
        }

        message.channel.sendTyping();

        new PingMC(ip)
            .ping()
            .then((result) => {
                if (result.version) online(result);
                else offline(`${ip} didn't return a ping.`, ip);
            })
            .catch((error) => {
                if (error.code == "ENOTFOUND") offline(`Unable to resolve ${ip}.\nCheck if you entered the correct ip!`, ip);
                else if (error.code == "ECONNREFUSED") offline(`Unable to resolve ${ip}.\nCan't find a route to the host!`, ip);
                else if (error.code == "EHOSTUNREACH") offline(`${ip} refused to connect.\nCheck if you specified the correct port!`, ip);
                else if (error.code == "ECONNRESET") offline(`${ip} abruptly closed the connection.\nThere is some kind of issue on the server side!`, ip);
                else if (error.message == "Timed out") offline(`${ip} didn't return a ping.\nTimed out.`, ip);
                else {
                    console.log("A error occurred while trying to ping: ", error);
                    offline(`${ip} refused to connect.`, ip);
                }
                return;
            })


        // Server is online
        function online(result) {
            // If there is no icon use pack.png
            if (result.favicon.icon == null) {
                var attachment = new Discord.MessageAttachment("https://i.ibb.co/YkRLWG8/down.png", "icon.png");
            } else {
                var attachment = new Discord.MessageAttachment(Buffer.from(result.favicon.icon.substr('data:image/png;base64,'.length), 'base64'), "icon.png")
            }
            const embed = new Discord.MessageEmbed()
                .setColor('#008000')
                .setTitle(`${ip} is online`)
                .setDescription(result.motd.clear);

            // Add a players connected field if available
            if (result.players.list.length > 0) {
                embed.addField('Players connected:', '`' + result.players.list.join(' ') + '`', false)
            }

            embed
                .addFields({
                    name: 'Players: ',
                    value: 'Online: ' + '`' + result.players.online + '`' + '\nMax: ' + '`' + result.players.max + '`',
                    inline: true
                }, {
                    name: 'Version: ',
                    value: '`' + result.version.name + '`',
                    inline: true
                })
                .setThumbnail("attachment://icon.png");

            message.channel.send({ embeds: [embed], files: [attachment] });
            
            return;
        }

        // Server is offline or error
        function offline(errortxt, ip) {
            const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle(`${ip} is offline`)
                .setDescription(errortxt)
                .setThumbnail("https://i.ibb.co/YkRLWG8/down.png")
            message.channel.send({ embeds: [embed] });
            return;
        }
    }
}