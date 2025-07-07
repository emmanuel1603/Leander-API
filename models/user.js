'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var argon2 = require('argon2'); // Importar argon2
var jwt = require('jwt-simple');
var moment = require('moment');

var UserSchema = Schema({
    name: String,
    surname: String,
    nick: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'ROLE_USER' },
    image: String,
    created_at: { type: Date, default: Date.now },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Método para cifrar la contraseña antes de guardar
UserSchema.pre('save', async function(next) {
    var user = this;

    if (!user.isModified('password')) return next();

    try {
        // Hash de la contraseña usando argon2
        user.password = await argon2.hash(user.password);
        next();
    } catch (err) {
        next(err);
    }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Comparar la contraseña proporcionada con la almacenada
        return await argon2.verify(this.password, candidatePassword);
    } catch (err) {
        throw err;
    }
};

// Método para crear token JWT
UserSchema.methods.createToken = function() {
    var payload = {
        sub: this._id,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    };

    return jwt.encode(payload, process.env.JWT_SECRET || 'secret_key');
};

module.exports = mongoose.model('User', UserSchema);
