'use strict';

var User = require('../models/user');
var jwt = require('jwt-simple');
var moment = require('moment');
var fs = require('fs');
var path = require('path');

// Función para registrar usuario
async function saveUser(req, res) {
    var params = req.body;

    if (!params.name || !params.surname || !params.nick || !params.email || !params.password) {
        return res.status(400).send({ message: 'Envía todos los campos necesarios' });
    }

    try {
        // Verificar si el email o nick ya existen
        const existingUser = await User.findOne({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).send({ message: 'El usuario ya existe' });
        }

        // Crear nuevo usuario
        var user = new User({
            name: params.name,
            surname: params.surname,
            nick: params.nick.toLowerCase(),
            email: params.email.toLowerCase(),
            password: params.password, // Será cifrada en pre-save
            image: null,
            role: params.role || 'ROLE_USER' // 👈 asignar rol si viene, sino usar por defecto
        });

        // Si se subió una imagen
        if (req.file) {
            const image_path = `/uploads/user/${req.file.filename}`;
            user.image = image_path;
        }

        // Guardar usuario
        const userStored = await user.save();
        return res.status(201).send({ user: userStored });

    } catch (err) {
        return res.status(500).send({ message: 'Error al guardar el usuario', error: err.message });
    }
}

// Función para iniciar sesión
// Función para iniciar sesión
async function login(req, res) {
    var params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({ message: 'Envía el email y la contraseña' });
    }

    try {
        const user = await User.findOne({ email: params.email.toLowerCase() });

        if (!user) {
            return res.status(404).send({ message: 'El usuario no existe' });
        }

        const isMatch = await user.comparePassword(params.password); // <- usar await

        if (!isMatch) {
            return res.status(401).send({ message: 'Contraseña incorrecta' });
        }

        // Crear y devolver el token
        const token = user.createToken();
        return res.status(200).send({
            token,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                nick: user.nick,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).send({ message: 'Error en la petición', error: err.message });
    }
}

// Función para subir imagen de usuario
async function uploadImage(req, res) {
    const userId = req.params.id;

    if (!req.file) {
        return res.status(400).send({ message: 'No se ha subido ninguna imagen' });
    }

    const file_name = req.file.filename;
    const image_path = `/uploads/user/${file_name}`;

    try {
        const userUpdated = await User.findByIdAndUpdate(
            userId,
            { image: image_path },
            { new: true }
        );

        if (!userUpdated) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        return res.status(200).send({ user: userUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al guardar la imagen', error: err.message });
    }
}

// Función para seguir a un usuario
async function followUser(req, res) {
    const userId = req.params.id;
    const followerId = req.user.sub;

    if (userId === followerId) {
        return res.status(400).send({ message: 'No puedes seguirte a ti mismo' });
    }

    try {
        const userToFollow = await user.findById(userId);
        const follower = await user.findById(followerId);

        if (!userToFollow || !follower) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        // Evitar duplicados
        if (!userToFollow.followers.includes(followerId)) {
            userToFollow.followers.push(followerId);
        }

        if (!follower.following.includes(userId)) {
            follower.following.push(userId);
        }

        await userToFollow.save();
        await follower.save();

        return res.status(200).send({ message: 'Ahora sigues a ' + userToFollow.nick });
    } catch (err) {
        console.error('Error al seguir al usuario:', err);
        return res.status(500).send({ message: 'Error al seguir al usuario', error: err.message });
    }
}

// Función para dejar de seguir a un usuario
async function unfollowUser (req, res) {
    var userId = req.params.id;
    var followerId = req.user.sub;

    if (userId === followerId) {
        return res.status(400).send({ message: 'No puedes dejar de seguirte a ti mismo' });
    }

    try {
        const userToUnfollow = await user.findById(userId);
        const follower = await user.findById(followerId);

        if (!userToUnfollow || !follower) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        // Eliminar al usuario de la lista de seguidores
        userToUnfollow.followers.pull(followerId);
        follower.following.pull(userId);

        await userToUnfollow.save();
        await follower.save();

        return res.status(200).send({ message: 'Has dejado de seguir a ' + userToUnfollow.nick });
    } catch (err) {
        return res.status(500).send({ message: 'Error al dejar de seguir al usuario' });
    }
}
async function getUsers(req, res) {
    try {
        const users = await user.find().select('-password'); // Excluye la contraseña
        return res.status(200).send({ users });
    } catch (err) {
        return res.status(500).send({ message: 'Error al obtener los usuarios', error: err.message });
    }
}
async function getFollowers(req, res) {
    const userId = req.params.id;

    try {
        const userData = await user.findById(userId)
            .populate('followers', 'name surname nick email image')
            .select('followers');

        if (!userData) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        return res.status(200).send({ followers: userData.followers });
    } catch (err) {
        return res.status(500).send({ message: 'Error al obtener los seguidores', error: err.message });
    }
}
// Obtener lista de seguidos por el usuario
async function getFollowing(req, res) {
    const userId = req.params.id;

    try {
        const userData = await user.findById(userId)
            .populate('following', 'name surname nick email image')
            .select('following');

        if (!userData) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        return res.status(200).send({ following: userData.following });
    } catch (err) {
        return res.status(500).send({ message: 'Error al obtener los seguidos', error: err.message });
    }
}
async function getUser(req, res) {
    const userId = req.params.id;

    try {
        const userData = await user.findById(userId)
            .select('-password'); // Excluye la contraseña

        if (!userData) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        return res.status(200).send({ user: userData });
    } catch (err) {
        return res.status(500).send({ message: 'Error al obtener el usuario', error: err.message });
    }
}
async function updateUserRole(req, res) {
    const userId = req.params.id;
    const { role } = req.body;

    const allowedRoles = ['ROLE_USER', 'ROLE_ADMIN'];

    if (!allowedRoles.includes(role)) {
        return res.status(400).send({ message: 'Rol no permitido' });
    }

    try {
        const userUpdated = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!userUpdated) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        return res.status(200).send({ user: userUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al actualizar el rol', error: err.message });
    }
}

// Exportar funciones
module.exports = {
    saveUser ,
    login,
    uploadImage,
    followUser ,
    unfollowUser,
    getUsers,
    getFollowers,
    getFollowing,
    getUser,
    updateUserRole
     
};
