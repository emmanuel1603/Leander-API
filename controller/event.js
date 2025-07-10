'use strict'

const mongoose = require('mongoose');
const Event = require('../models/event');
const Notification = require('../models/notification');
const User = require('../models/user');

async function saveEvent(req, res) {
    const params = req.body;

    if (!params.title || !params.description || !params.date || !params.location) {
        return res.status(400).send({ message: 'Envía todos los campos necesarios' });
    }

    try {
        const event = new Event({
            title: params.title,
            description: params.description,
            date: params.date,
            location: params.location,
            image: params.image || null, // Asegúrate de permitir una imagen si existe
            created_at: new Date(),
            user: req.user.sub
        });

        const eventStored = await event.save();
        if (!eventStored) {
            return res.status(404).send({ message: 'El evento no ha sido guardado' });
        }

        // 🔁 Obtener datos del creador para la notificación
        const emitter = await User.findById(req.user.sub).select('name surname image');

        // 🔁 Crear y guardar notificación para el nuevo evento
        const notification = new Notification({
            type: 'event',
            read: false,
            created_at: new Date(),
            emitter: req.user.sub,
            event: eventStored._id
        });

        const savedNotification = await notification.save();

        // 🔁 Popula la notificación con datos del usuario y evento
        const populatedNotification = await Notification.findById(savedNotification._id)
            .populate('emitter', 'name surname image _id')
            .populate('event', 'title image _id');

        // ✅ Emitir notificación por WebSocket a todos los usuarios (o puedes personalizarlo)
        const io = req.app.get('socketio');
        io.emit('newNotification', populatedNotification);

        console.log('📢 Notificación de evento enviada por WebSocket:', JSON.stringify(populatedNotification, null, 2));

        return res.status(201).send({ event: eventStored });

    } catch (err) {
        console.error('❌ Error al guardar el evento y enviar notificación:', err);
        return res.status(500).send({ message: 'Error al guardar el evento', error: err.message });
    }
}

async function getEvents(req, res) {
    try {
        const events = await Event.find({})
            .populate('user', 'name surname image _id')
            .populate('attendees', 'name surname image _id')
            .exec();
        if (!events) {
            return res.status(404).send({ message: 'No hay eventos' });
        }
        return res.status(200).send({ events });
    } catch (err) {
        return res.status(500).send({ message: 'Error al devolver eventos', error: err.message });
    }
}

async function getEvent(req, res) {
    var eventId = req.params.id;
    try {
        const event = await Event.findById(eventId)
            .populate('user', 'name surname image _id')
            .populate('attendees', 'name surname image _id')
            .exec();
        if (!event) {
            return res.status(404).send({ message: 'No existe el evento' });
        }
        return res.status(200).send({ event });
    } catch (err) {
        return res.status(500).send({ message: 'Error al devolver el evento', error: err.message });
    }
}

async function deleteEvent(req, res) {
    var eventId = req.params.id;
    var userId = req.user.sub;
    try {
        const result = await Event.deleteOne({ _id: eventId, user: userId });
        if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'No se encontró el evento o no tienes permiso para borrarlo' });
        }
        return res.status(200).send({ message: 'Evento eliminado' });
    } catch (err) {
        return res.status(500).send({ message: 'Error al borrar el evento', error: err.message });
    }
}

async function attendEvent(req, res) {
    var eventId = req.params.id;
    var userId = req.user.sub;
    try {
        const eventUpdated = await Event.findByIdAndUpdate(
            eventId,
            { $addToSet: { attendees: userId } },
            { new: true }
        );
        if (!eventUpdated) {
            return res.status(404).send({ message: 'No se ha podido confirmar asistencia' });
        }
        return res.status(200).send({ event: eventUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al confirmar asistencia', error: err.message });
    }
}

async function unattendEvent(req, res) {
    var eventId = req.params.id;
    var userId = req.user.sub;
    try {
        const eventUpdated = await Event.findByIdAndUpdate(
            eventId,
            { $pull: { attendees: userId } },
            { new: true }
        );
        if (!eventUpdated) {
            return res.status(404).send({ message: 'No se ha podido cancelar asistencia' });
        }
        return res.status(200).send({ event: eventUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al cancelar asistencia', error: err.message });
    }
}

module.exports = {
    saveEvent,
    getEvents,
    getEvent,
    deleteEvent,
    attendEvent,
    unattendEvent
};
