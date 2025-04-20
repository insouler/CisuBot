const { EmbedBuilder } = require('discord.js');
const getRandomColor = require('../utils/getRandomColor');
const config = require('../config');

async function handleWelcome(member) {
    const welcomeChannelId = config.channels.welcome; // ID del canal de bienvenida
    const channel = member.guild.channels.cache.get(welcomeChannelId); // Obtener el objeto del canal

    if (!channel) {
        console.error('No se encontró el canal de bienvenida.');
        return;
    }

    // Actualizar contador de usuarios
    const updateGuild = await member.guild.fetch();

    // Crear embed
    const embed = new EmbedBuilder()
        .setColor(`#${getRandomColor()}`) // Color
        .setTitle(`**__Bienvenido a ZondePlay__**`)
        .setDescription(`> Hola <@${member.id}>, estamos felices de tenerte en el servidor. Eres el miembro número **${updateGuild.memberCount}**.\n> Recuerda leer el apartado de <#1349073436571336714>`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Foto del usuario
        .setTimestamp()
        .setFooter({ text: `© Cisu Assistant` });

    // Enviar el mensaje
    channel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = {
    handleWelcome,
};