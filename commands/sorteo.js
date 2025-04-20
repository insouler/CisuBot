const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config'); // Importar configuraciones

module.exports = {
    name: 'gstart',
    description: 'Inicia un sorteo con un premio, duración, número de ganadores y mensaje opcional.',
    async execute(message, args) {
        const staffRoleId = config.roles.staff;
        const logChannelId = config.channels.sorteoLog; // Canal para registrar sorteos

        // Validar si el usuario tiene el rol Staff
        if (!message.member.roles.cache.has(staffRoleId)) {
            return message.reply('<:bloqueado:1363232798932205749> - **No tienes permiso para hacer esto.**');
        }

        // Validar argumentos
        if (args.length < 3) {
            return message.reply('<:uncheck:1363243107516153977> - Usa: **c!gstart <premio> <duración> <ganadores> [mensaje opcional]**');
        }

        const premio = args[0]; // Primer argumento es el premio
        const duracion = args[1]; // Segundo argumento es la duración
        const numGanadores = parseInt(args[2]); // Tercer argumento es el número de ganadores
        const mensajePersonalizado = args.slice(3).join(' '); // Todo después del tercer argumento es el mensaje personalizado (opcional)

        // Validar duración (formato simple: 1h, 2d, 30m)
        const duracionRegex = /^(\d+)([smhd])$/; // Ejemplo: 1h, 30m, 2d
        const match = duracion.match(duracionRegex);
        if (!match) {
            return message.reply('<:uncheck:1363243107516153977> - Duración inválida. Usa **s** (segundos), **m** (minutos), **h** (horas) o **d** (días). Ejemplo: **1h**, **30m**, **2d**.');
        }

        const tiempo = parseInt(match[1]);
        const unidad = match[2];
        let duracionMs;

        switch (unidad) {
            case 's': duracionMs = tiempo * 1000; break; // Segundos a milisegundos
            case 'm': duracionMs = tiempo * 60 * 1000; break; // Minutos a milisegundos
            case 'h': duracionMs = tiempo * 60 * 60 * 1000; break; // Horas a milisegundos
            case 'd': duracionMs = tiempo * 24 * 60 * 60 * 1000; break; // Días a milisegundos
            default: return message.reply('> **Unidad de tiempo no reconocida.**');
        }

        // Validar número de ganadores
        if (isNaN(numGanadores) || numGanadores <= 0) {
            return message.reply('<:uncheck:1363243107516153977> - **El número de ganadores debe ser un número mayor a 0.**');
        }

        // Confirmación antes de iniciar el sorteo
        const confirmEmbed = new EmbedBuilder()
            .setTitle('<a:cargando:1363246228112146644> **__Confirmación del sorteo..__**')
            .setDescription(`> **Premio:** ${premio}\n> **Duración:** ${duracion}\n> **Ganadores:** ${numGanadores}\n> **Mensaje:** ${mensajePersonalizado || 'Ninguno'}\n\n¿Quieres iniciar el sorteo?`)
            .setColor('#00FF00');

        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_sorteo').setLabel('Confirmar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_sorteo').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
        );

        const confirmMessage = await message.channel.send({ embeds: [confirmEmbed], components: [confirmButtons] });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_sorteo') {
                // Iniciar el sorteo
                await interaction.update({ content: '<:confirmado:1363245774258831420> - **¡Sorteo iniciado correctamente!**', embeds: [], components: [] });

                const embed = new EmbedBuilder()
                    .setTitle('<a:giveaway:1363247699847024800> **__¡Sorteo Activo!__**')
                    .setDescription(`<:recompensa:1363251265391296584> **Premio:** ${premio}\n\n**¡Reacciona a** 🎁 **para participar!**\n\n<:duracion:1363248485805326366> **Duración:** ${duracion}\n<:corona:1363249313307951185> **Ganadores:** ${numGanadores}\n<:mensaje:1363249568015323177> **Mensaje:** ${mensajePersonalizado || 'Ninguno'}`)
                    .setColor('#ff3ad6')
                    .setFooter({ text: `Sorteado por ${message.author.tag}` })
                    .setTimestamp();

                const sorteoMessage = await message.channel.send({ embeds: [embed] });
                await sorteoMessage.react('🎁'); // Agregar la reacción de participación

                // Esperar la duración del sorteo
                setTimeout(async () => {
                    const reaccion = sorteoMessage.reactions.cache.get('🎉');
                    if (!reaccion) {
                        return message.channel.send('<:uncheck:1363243107516153977> - **No hubieron participantes en el sorteo.**');
                    }

                    const usuarios = await reaccion.users.fetch();
                    const participantes = usuarios.filter(u => !u.bot); // Excluir bots

                    if (participantes.size === 0) {
                        return message.channel.send('<:uncheck:1363243107516153977> - **No hubo participantes en el sorteo.**');
                    }

                    if (numGanadores > participantes.size) {
                        return message.channel.send('<:uncheck:1363243107516153977> - **El número de ganadores es mayor que el número de participantes.**');
                    }

                    const ganadores = participantes.random(numGanadores); // Elegir múltiples ganadores al azar

                    // Anunciar a los ganadores
                    const embedGanador = new EmbedBuilder()
                        .setTitle(' - **__¡Sorteo Finalizado!__**')
                        .setDescription(`> Los ganadores de **${premio}** son:\n${ganadores.map(g => `🎊 **${g.tag}**`).join('\n')}`)
                        .setColor('#FFD700')
                        .setFooter({ text: '¡Gracias a todos por participar!' })
                        .setTimestamp();

                    await message.channel.send({ embeds: [embedGanador] });

                    // Notificación directa a los ganadores
                    for (const ganador of ganadores) {
                        ganador.send(`<:ganador:1363245310435922071> - ¡Felicidades! Has ganado el sorteo de **${premio}** en el servidor **${message.guild.name}**. Reclama tus recompensas en ticket.`).catch(console.error);
                    }

                    // Registrar el sorteo en el canal de logs
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('📜 Registro de sorteo')
                            .setDescription(`**Premio:** ${premio}\n**Duración:** ${duracion}\n**Participantes:** ${participantes.size}\n**Ganadores:**\n${ganadores.map(g => `🎊 **${g.tag}**`).join('\n')}\n**Mensaje:** ${mensajePersonalizado || 'Ninguno'}`)
                            .setColor('#ADD8E6')
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });
                    } else {
                        console.error('No se encontró el canal de registro de sorteos.');
                    }
                }, duracionMs);
            } else if (interaction.customId === 'cancel_sorteo') {
                await interaction.update({ content: '❌ Sorteo cancelado.', embeds: [], components: [] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                confirmMessage.edit({ content: '⏳ Tiempo de confirmación agotado.', embeds: [], components: [] });
            }
        });
    },
};