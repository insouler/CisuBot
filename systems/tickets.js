const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getRandomColor = require('../utils/getRandomColor');
const config = require('../config');

// Enviar mensaje estático con botón de ticket
async function sendTicketMessage(client) {
    const channel = await client.channels.fetch(config.channels.support);

    const ticketButton = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Abrir Ticket')
        .setStyle(ButtonStyle.Primary);

    const aperturaButton = new ActionRowBuilder().addComponents(ticketButton);

    const aperturaEmbed = new EmbedBuilder()
        .setColor(`#${getRandomColor()}`)
        .setTitle('<:support:1363236139716055150> **__Soporte - Cisu__**')
        .setDescription('Si necesitas ayuda, haz clic en el botón de abajo para abrir un ticket. Un miembro del staff te atenderá lo antes posible.')
        .setFooter({ text: '© Cisu Assistant' })
        .setTimestamp();

    channel.send({
        embeds: [aperturaEmbed],
        components: [aperturaButton],
    });
}

// Gestión de interacciones relacionadas con tickets
async function handleTicketInteraction(interaction, client) {
    if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true }); // Defer la interacción para evitar que expire

        const existing = interaction.guild.channels.cache.find(c =>
            c.name === `ticket-${interaction.user.username.toLowerCase()}`
        );

        if (existing) {
            const ExistenteEmbed = new EmbedBuilder()
                .setColor(`#${getRandomColor()}`)
                .setTitle('🎟️ Ticket ya existente')
                .setDescription(`Ya tienes un ticket abierto: <#${existing.id}>`)
                .setFooter({ text: '¡Estamos aquí para ayudarte!' })
                .setTimestamp();
            return interaction.editReply({
                embeds: [ExistenteEmbed],
            });
        }

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: process.env.TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: process.env.STAFF_ROLE_ID,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ManageChannels,
                        ],
                    },
                ],
            });

            const staffRoleId = config.roles.staff;
            const asistenteRoleId = config.roles.asistente; // ID del rol de asistente

            const staff = staffRoleId ? `<@&${staffRoleId}>` : '@Staff';
            const asistente = asistenteRoleId ? `<@&${asistenteRoleId}>` : '@AsistenteTickets';

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Cerrar ticket')
                .setStyle(ButtonStyle.Danger);

            const botonCerrado = new ActionRowBuilder().addComponents(closeButton);

            const ticketEmbed = new EmbedBuilder()
                .setColor(`#${getRandomColor()}`)
                .setTitle('🎟️ Ticket Abierto')
                .setDescription(`Hola ${interaction.user.username}, este es tu ticket. Un miembro del staff te ayudará pronto.`)
                .setFooter({ text: '¡Estamos aquí para ayudarte!' })
                .setTimestamp();

            await ticketChannel.send({
                content: `${staff}, ${asistente}`, // Menciona los roles
                embeds: [ticketEmbed],
                components: [botonCerrado],
            });

            const respuestaEmbed = new EmbedBuilder()
                .setColor(`#${getRandomColor()}`)
                .setTitle('🎟️ Ticket Creado')
                .setDescription(`Tu ticket ha sido creado: <#${ticketChannel.id}>`)
                .setFooter({ text: '¡Estamos aquí para ayudarte!' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [respuestaEmbed],
            });
        } catch (error) {
            console.error('Error al crear el ticket:', error);

            const ErrorEmbed = new EmbedBuilder()
                .setColor(`#${getRandomColor()}`)
                .setTitle('❌ Error al crear el ticket')
                .setDescription('Hubo un error al intentar crear tu ticket. Por favor, inténtalo de nuevo más tarde.')
                .setFooter({ text: '¡Estamos aquí para ayudarte!' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [ErrorEmbed],
            });
        }
    } else if (interaction.customId === 'close_ticket') {
        const cerradoEmbed = new EmbedBuilder()
            .setColor(`#${getRandomColor()}`)
            .setTitle('🔒 Ticket Cerrado')
            .setDescription('Este ticket ha sido cerrado. Si necesitas más ayuda, abre un nuevo ticket.')
            .setFooter({ text: '¡Estamos aquí para ayudarte!' })
            .setTimestamp();

        await interaction.reply({
            embeds: [cerradoEmbed],
            ephemeral: true,
        });

        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: 100 });
        const messagesContent = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');

        const filePath = path.join(__dirname, '../transcripts', `${channel.name}-transcript.txt`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        try {
            fs.writeFileSync(filePath, messagesContent);
            console.log(`Archivo guardado en: ${filePath}`);
        } catch (err) {
            console.error('Error al escribir el archivo de transcript:', err);
            return;
        }

        const registroChannel = interaction.guild.channels.cache.find(c =>
            c.name === config.channels.transcriptLog && c.type === ChannelType.GuildText
        );
        if (registroChannel) {
            try {
                const transcriptEmbed = new EmbedBuilder()
                    .setColor(`#${getRandomColor()}`)
                    .setTitle('📜 Transcript del Ticket')
                    .setDescription(`El ticket <#${channel.id}> ha sido cerrado.`)
                    .setFooter({ text: 'Transcript hecho por Cisu!' })
                    .setTimestamp();
                await registroChannel.send({
                    embeds: [transcriptEmbed],
                    files: [filePath],
                });
                console.log('Archivo enviado al canal de registro');
            } catch (err) {
                console.error('Error al enviar el archivo al canal de registro:', err);
            }
        } else {
            console.error('No se encontró el canal de registro.');
        }

        setTimeout(() => {
            channel.delete().catch(console.error);
        }, 5000);
    }
}

module.exports = {
    sendTicketMessage,
    handleTicketInteraction,
};