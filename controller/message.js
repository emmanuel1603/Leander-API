'use strict';

const mongoose = require('mongoose');
const Message = require('../models/message');
const Notification = require('../models/notification'); // Importar modelo de Notificación

// Guardar mensaje
async function saveMessage(req, res) {
    const { text, receiver } = req.body;

    if (!text || !receiver) {
        return res.status(400).send({ message: 'Envía los datos necesarios' });
    }

    try {
        // Crear instancia de mensaje
        const message = new Message({
            text,
            viewed: false,
            created_at: new Date(),
            emitter: req.user.sub,
            receiver
        });

        // Guardar en la base de datos
        const messageStored = await message.save();

        if (!messageStored) {
            return res.status(404).send({ message: 'El mensaje no ha sido enviado' });
        }

        // ✅ Popula el emisor (quien envía)
        const populatedMessage = await Message.findById(messageStored._id)
            .populate('emitter', 'name surname image _id')
            .populate('receiver', 'name surname image _id'); // Opcional si quieres también el receptor

        // Obtener instancia de Socket.IO
        const io = req.app.get('socketio');

        // ✅ Emitir el mensaje al receptor con los datos del emisor incluidos
        io.to(receiver).emit('newMessage', populatedMessage);
        console.log('📨 Mensaje enviado por WebSocket:', JSON.stringify(populatedMessage, null, 2));

        // Crear notificación relacionada al mensaje
        const notification = new Notification({
            type: 'message',
            read: false,
            created_at: new Date(),
            emitter: req.user.sub,
            receiver,
            message: messageStored._id
        });

        const notificationStored = await notification.save();

        // ✅ Popula emisor en la notificación para que incluya nombre e imagen
        const populatedNotification = await Notification.findById(notificationStored._id)
            .populate('emitter', 'name surname image _id');

        // ✅ Emitir la notificación
        io.to(receiver).emit('newNotification', populatedNotification);
        console.log(`🔔 Notificación de mensaje enviada a `,JSON.stringify(populatedMessage, null, 2));

        // Devolver mensaje al cliente
        return res.status(200).send({ message: populatedMessage });

    } catch (err) {
        console.error('❌ Error al enviar mensaje:', err);
        return res.status(500).send({ message: 'Error al enviar el mensaje', error: err.message });
    }
}



// Mensajes recibidos
async function getReceivedMessages(req, res) {
    const userId = req.user.sub;

    try {
        const messages = await Message.find({ receiver: userId })
            .populate('emitter', 'name surname image _id');
            
        if (!messages || messages.length === 0) {
            return res.status(404).send({ message: 'No hay mensajes' });
        }

        return res.status(200).send({ messages });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

// Mensajes enviados
async function getEmittedMessages(req, res) {
    const userId = req.user.sub;

    try {
        const messages = await Message.find({ emitter: userId })
            .populate('emitter', 'name surname image _id')
            .populate('receiver', 'name surname image _id')
            .sort('-created_at');

        if (!messages || messages.length === 0) {
            return res.status(404).send({ message: 'No hay mensajes' });
        }

        // Si deseas mostrar solo campos personalizados
        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            text: msg.text,
            created_at: msg.created_at,
            viewed: msg.viewed,
            emitter: {
                _id: msg.emitter._id,
                name: msg.emitter.name,
                surname: msg.emitter.surname,
                image: msg.emitter.image
            },
            receiver: {
                _id: msg.receiver._id,
                name: msg.receiver.name,
                surname: msg.receiver.surname,
                image: msg.receiver.image
            }
        }));

        return res.status(200).send({ messages: formattedMessages });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}


// Contador de no vistos
async function getUnviewedMessages(req, res) {
    const userId = req.user.sub;

    try {
        const count = await Message.countDocuments({ receiver: userId, viewed: false });
        return res.status(200).send({ unviewed: count });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

// Marcar como vistos
async function setViewedMessages(req, res) {
    const userId = req.user.sub;

    try {
        const result = await Message.updateMany(
            { receiver: userId, viewed: false },
            { viewed: true }
        );

        return res.status(200).send({ messages: result });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

module.exports = {
    saveMessage,
    getReceivedMessages,
    getEmittedMessages,
    getUnviewedMessages,
    setViewedMessages
};
