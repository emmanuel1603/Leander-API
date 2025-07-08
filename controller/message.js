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
        const message = new Message({
            text,
            viewed: false,
            created_at: new Date(),
            emitter: req.user.sub,
            receiver
        });

        const messageStored = await message.save();

        if (!messageStored) {
            return res.status(404).send({ message: 'El mensaje no ha sido enviado' });
        }

        // Obtener la instancia de Socket.IO
        const io = req.app.get('socketio');

        // Emitir el mensaje en tiempo real al receptor
        // Asegúrate de que el receptor esté en una sala con su userId
        io.to(receiver).emit('newMessage', messageStored);
        console.log(`Mensaje enviado por WebSocket a ${receiver}`);

        // Crear una notificación para el mensaje
        const notification = new Notification({
            type: 'message',
            read: false,
            created_at: new Date(),
            emitter: req.user.sub,
            receiver: receiver,
            message: messageStored._id // Referencia al mensaje
        });
        await notification.save();

        // Emitir la notificación en tiempo real al receptor
        io.to(receiver).emit('newNotification', notification);
        console.log(`Notificación de mensaje enviada por WebSocket a ${receiver}`);


        return res.status(200).send({ message: messageStored });
    } catch (err) {
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
            .populate('emitter receiver', 'name surname image _id');

        if (!messages || messages.length === 0) {
            return res.status(404).send({ message: 'No hay mensajes' });
        }

        return res.status(200).send({ messages });
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
