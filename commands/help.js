const getRandomColor = require('../utils/getRandomColor');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'help', // Nombre del comando
    description: 'Comando de ayuda sobre el server.',
    async execute(message) {

        const helpEmbed = new EmbedBuilder()
        .setColor(`#${getRandomColor()}`) // Color
        .setTitle(`**__Comandos de Cisu__**`)
        .setDescription(`\n<:world:1363239428268621875> **» Menú Ayuda**`)
        .setFooter({ text: '© Cisu Assistant' })
        .addFields({ name: '`c!help`', value: '¡Para ver mis comandos disponibles!', inline: true })
        .addFields({ name: '`c!gstart`', value: '¡Para relizar un sorteo!', inline: true })
        .addFields({ name: '`c!clean`', value: '¡Para limpiar canales!', inline: true })
        .addFields({ name: '`c!suggest`', value: '¡Para sugerir alguna idea!', inline: true })
        .addFields({ name: '', value: '' })
        .addFields({ name: '<:enlace:1363238480855044117> **» Enlaces**', value: '[Tienda](https://zondeplay.us/tienda) - [Soporte](https://discord.gg/D9X3bFfcuR) - [Twitter (X)](https://x.com/zondelay)' })
        .setTimestamp()

        try {
            await message.channel.send({ embeds: [helpEmbed]});
        } catch (err) {
            console.error('Error al responder al help:', err);
            message.channel.send('Hubo un error al intentar ejectutar help.');
        }

    },
};