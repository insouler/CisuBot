module.exports = {
    name: 'clean', // Nombre del comando
    description: 'Limpia el canal actual.', 
    async execute(message) {
        const staffRoleId = process.env.STAFF_ROLE_ID; // ID del rol Staff puesto en .env
        if (!message.member.roles.cache.has(staffRoleId)) {
            return message.reply('<:bloqueado:1363232798932205749> - **No tienes permiso para hacer esto.**');
        }

        try {
            // Eliminar los ultimos 100 mensajes (Editable)
            await message.channel.bulkDelete(100, true);
            await message.channel.send('<:verificado:1363232889931563088> Canal limpiado correctamente.');
        } catch (err) {
            console.error('Error al limpiar mensajes:', err);
            message.channel.send('<:lock:1363233476865691728> - **Ha ocurrido un error al intentar limpiar el canal.**');
        }
    },
};