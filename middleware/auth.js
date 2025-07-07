'use strict';

var jwt = require('jwt-simple');
var moment = require('moment');

exports.ensureAuth = function(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabecera de autorización' });
    }

    var token = req.headers.authorization.replace('Bearer ', '').replace(/['"]+/g, '');

    try {
        var payload = jwt.decode(token, process.env.JWT_SECRET || 'secret_key');

        if (payload.exp <= moment().unix()) {
            return res.status(401).send({ message: 'El token ha expirado' });
        }

        // Aquí asignamos todo el payload para que req.user tenga .sub y más datos si quieres
        req.user = payload;

        next();
    } catch (ex) {
        return res.status(401).send({ message: 'Token no válido o manipulado' });
    }
};
