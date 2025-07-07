'use strict'

var mongoose = require('mongoose');
var Event = require('../models/event');

async function saveEvent(req, res) {
    var params = req.body;
    
    if (!params.title || !params.description || !params.date || !params.location) {
        return res.status(400).send({ message: 'Envía todos los campos necesarios' });
    }

    try {
        var event = new Event();
        event.title = params.title;
        event.description = params.description;
        event.date = params.date;
        event.location = params.location;
        event.created_at = new Date();
        event.user = req.user.sub;
        
        const eventStored = await event.save();
        if (!eventStored) {
            return res.status(404).send({ message: 'El evento no ha sido guardado' });
        }
        
        return res.status(201).send({ event: eventStored });
    } catch (err) {
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
