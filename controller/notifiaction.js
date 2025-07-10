const mongoose = require('mongoose');
const Notification = require('../models/notification');
const User = require('../models/user');
// Obtener todas las notificaciones del usuario
async function getNotifications(req, res) {
    const userId = req.user.sub;

    try {
        const notifications = await Notification.find({ receiver: userId })
            .populate('emitter', 'name surname image _id')
            .populate('publication', '_id')
            .populate('event', '_id title')
            .sort('-created_at');

        if (!notifications || notifications.length === 0) {
            return res.status(404).send({ message: 'No hay notificaciones' });
        }

        return res.status(200).send({ notifications });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

// Obtener cantidad de notificaciones no vistas
async function getUnviewedNotifications(req, res) {
    const userId = req.user.sub;

    try {
        const count = await Notification.countDocuments({ receiver: userId, read: false });
        return res.status(200).send({ unviewed: count });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

// Marcar todas como vistas
async function setViewedNotifications(req, res) {
    const userId = req.user.sub;

    try {
        // Marcar todas como vistas
        const result = await Notification.updateMany(
            { receiver: userId, read: false },
            { read: true }
        );

        // Obtener datos del usuario receptor
        const user = await User.findById(userId).select('name surname image _id');

        if (!user) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        // Preparar respuesta para WebSocket
        const socketPayload = {
            userId: user._id,
            updatedCount: result.modifiedCount,
            user: {
                name: user.name,
                surname: user.surname,
                image: user.image
            }
        };

        // Emitir por WebSocket
        const io = req.app.get('socketio');
        io.to(userId).emit('notificationsViewed', socketPayload);

        // Log de depuración
        console.log('🔄 Notificaciones marcadas como vistas y enviadas por WebSocket:', JSON.stringify(socketPayload, null, 2));

        return res.status(200).send({ messages: result });

    } catch (err) {
        console.error('❌ Error al marcar notificaciones como vistas:', err);
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

module.exports = {
    getNotifications,
    getUnviewedNotifications,
    setViewedNotifications
};
