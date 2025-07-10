'use strict'


var Publication = require('../models/publication');
var Notification = require('../models/notification'); // Importar modelo de Notificación
var UserModel = require('../models/user'); // Importar modelo de Usuario para obtener datos del emisor
const path = require('path');
const moment = require('moment');

//Verificar Tipo de Archivo
function getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('application/') || mimetype === 'text/plain') return 'document';
    return 'other';
}


// Guardar publicación con archivos


async function savePublication(req, res) {
    const { title, text } = req.body;
    const userId = req.user.sub;

    if (!title || !text) {
        return res.status(400).send({ message: 'Título y texto son requeridos.' });
    }

    try {
        const filesData = [];

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                filesData.push({
                    path: file.path.replace(/\\/g, '/'),
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    fileType: getFileType(file.mimetype)
                });
            });
        }

        const publication = new Publication({
            title,
            text,
            user: userId,
            files: filesData,
            created_at: moment().format()
        });

        const publicationStored = await publication.save();

        const io = req.app.get('socketio');

        const user = await UserModel.findById(userId).populate('followers', '_id name surname image');

        const populatedPublication = await Publication.findById(publicationStored._id)
            .populate('user', 'name surname image _id');

        if (user?.followers?.length > 0) {
            user.followers.forEach(async follower => {
                const dataToSend = {
                    publication: populatedPublication,
                    author: {
                        _id: user._id,
                        name: user.name,
                        surname: user.surname,
                        image: user.image
                    }
                };

                io.to(follower._id.toString()).emit('newPublication', dataToSend);
                console.log(`📢 Publicación enviada a ${follower.name} ${follower.surname} (${follower._id})`);
                console.log(dataToSend);

                const notification = new Notification({
                    type: 'publication',
                    read: false,
                    created_at: new Date(),
                    emitter: userId,
                    receiver: follower._id,
                    publication: populatedPublication._id
                });
                const savedNotification = await notification.save();

                const populatedNotification = await Notification.findById(savedNotification._id)
                    .populate('emitter', 'name surname image _id')
                    .populate('publication', '_id');

                io.to(follower._id.toString()).emit('newNotification', populatedNotification);
                console.log(`🔔 Notificación enviada a ${follower.name} (${follower._id})`);
                console.log(populatedNotification);
            });
        }

        return res.status(200).send({ publication: populatedPublication });

    } catch (err) {
        return res.status(500).send({ message: 'Error al guardar publicación', error: err.message });
    }
}



async function getPublications(req, res) {
    try {
        const publications = await Publication.find()
            .populate('user', 'name surname image _id') // Autor de la publicación
            .populate('comments.user', 'name surname image _id') // Autor de cada comentario
            .sort('-created_at');

        return res.status(200).send({ publications });

    } catch (err) {
        return res.status(500).send({ message: 'Error al obtener publicaciones', error: err.message });
    }
}

async function getPublication(req, res) {
    const publicationId = req.params.id;

    try {
        const publication = await Publication.findById(publicationId)
            .populate('user', 'name surname image _id')
            .populate('comments.user', 'name surname image _id');

        if (!publication)
            return res.status(404).send({ message: 'No existe la publicación' });

        return res.status(200).send({ publication });
    } catch (err) {
        return res.status(500).send({ message: 'Error al devolver publicación', error: err.message });
    }
}

async function deletePublication(req, res) {
    const publicationId = req.params.id;
    const userId = req.user.sub;

    try {
        const result = await Publication.deleteOne({ _id: publicationId, user: userId });

        if (result.deletedCount === 0)
            return res.status(404).send({ message: 'No se encontró la publicación o no tienes permiso' });

        return res.status(200).send({ message: 'Publicación eliminada' });
    } catch (err) {
        return res.status(500).send({ message: 'Error al borrar la publicación', error: err.message });
    }
}

async function likePublication(req, res) {
    const publicationId = req.params.id;
    const userId = req.user.sub;

    try {
        const publicationUpdated = await Publication.findByIdAndUpdate(
            publicationId,
            { $addToSet: { likes: userId } },
            { new: true }
        ).populate('user', '_id');

        if (!publicationUpdated)
            return res.status(404).send({ message: 'No se ha podido dar like' });

        if (publicationUpdated.user._id.toString() !== userId) {
            const notification = new Notification({
                type: 'like',
                read: false,
                created_at: new Date(),
                emitter: userId,
                receiver: publicationUpdated.user._id,
                publication: publicationUpdated._id
            });
            const savedNotification = await notification.save();

            const populatedNotification = await Notification.findById(savedNotification._id)
                .populate('emitter', 'name surname image _id')
                .populate('publication', '_id');

            const io = req.app.get('socketio');
            io.to(publicationUpdated.user._id.toString()).emit('newNotification', populatedNotification);
            console.log(`🔔 Notificación de like enviada a ${publicationUpdated.user._id}`);
            console.log(populatedNotification);
        }

        return res.status(200).send({ publication: publicationUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al dar like', error: err.message });
    }
}

async function unlikePublication(req, res) {
    const publicationId = req.params.id;
    const userId = req.user.sub;

    try {
        const publicationUpdated = await Publication.findByIdAndUpdate(
            publicationId,
            { $pull: { likes: userId } },
            { new: true }
        );

        if (!publicationUpdated)
            return res.status(404).send({ message: 'No se ha podido quitar like' });

        // Opcional: Eliminar la notificación de like si se quita el like
        await Notification.deleteOne({
            type: 'like',
            emitter: userId,
            publication: publicationId
        });

        return res.status(200).send({ publication: publicationUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al quitar like', error: err.message });
    }
}

async function addComment(req, res) {
    const publicationId = req.params.id;
    const params = req.body;

    if (!params.text)
        return res.status(400).send({ message: 'Debes enviar un comentario' });

    const comment = {
        user: req.user.sub,
        text: params.text,
        created_at: new Date()
    };

    try {
        const publicationUpdated = await Publication.findByIdAndUpdate(
            publicationId,
            { $push: { comments: comment } },
            { new: true }
        ).populate('user', '_id');

        if (!publicationUpdated)
            return res.status(404).send({ message: 'No se ha podido comentar' });

        if (publicationUpdated.user._id.toString() !== req.user.sub) {
            const notification = new Notification({
                type: 'comment',
                read: false,
                created_at: new Date(),
                emitter: req.user.sub,
                receiver: publicationUpdated.user._id,
                publication: publicationUpdated._id
            });
            const savedNotification = await notification.save();

            const populatedNotification = await Notification.findById(savedNotification._id)
                .populate('emitter', 'name surname image _id')
                .populate('publication', '_id');

            const io = req.app.get('socketio');
            io.to(publicationUpdated.user._id.toString()).emit('newNotification', populatedNotification);
            console.log(`🔔 Notificación de comentario enviada a ${publicationUpdated.user._id}`);
            console.log(populatedNotification);
        }

        return res.status(200).send({ publication: publicationUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al comentar', error: err.message });
    }
}

async function deleteComment(req, res) {
    const publicationId = req.params.id;
    const commentId = req.params.commentId;

    try {
        const publicationUpdated = await Publication.findByIdAndUpdate(
            publicationId,
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        );

        if (!publicationUpdated) {
            return res.status(404).send({ message: 'No se ha podido borrar el comentario' });
        }

        // Opcional: Eliminar la notificación de comentario si se borra el comentario
        await Notification.deleteOne({
            type: 'comment',
            'comments._id': commentId // Asumiendo que la notificación guarda el ID del comentario
        });

        return res.status(200).send({ publication: publicationUpdated });
    } catch (err) {
        return res.status(500).send({ message: 'Error al borrar comentario', error: err.message });
    }
}
// Obtener publicaciones del usuario autenticado
async function getMyPublications(req, res) {
    const userId = req.user.sub;

    try {
        const myPublications = await Publication.find({ user: userId })
            .populate('user', 'name surname image _id')
            .sort('-created_at');

        return res.status(200).send({ publications: myPublications });
    } catch (err) {
        return res.status(500).send({ message: 'Error al obtener tus publicaciones', error: err.message });
    }
}
async function updatePublication(req, res) {
    const publicationId = req.params.id;
    const userId = req.user.sub;
    const { title, text } = req.body;

    try {
        const publication = await Publication.findOne({ _id: publicationId, user: userId });

        if (!publication) {
            return res.status(404).send({ message: 'Publicación no encontrada o no tienes permisos' });
        }

        publication.title = title || publication.title;
        publication.text = text || publication.text;
        publication.updated_at = moment().format();

        const updatedPublication = await publication.save();

        return res.status(200).send({ publication: updatedPublication });
    } catch (err) {
        return res.status(500).send({ message: 'Error al actualizar publicación', error: err.message });
    }
}
async function updateComment(req, res) {
    const { id: publicationId, commentId } = req.params;
    const userId = req.user.sub;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).send({ message: 'Debes enviar el nuevo texto del comentario' });
    }

    try {
        // Buscar publicación
        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).send({ message: 'Publicación no encontrada' });
        }

        // Buscar comentario dentro de la publicación
        const comment = publication.comments.id(commentId);
        if (!comment) {
            return res.status(404).send({ message: 'Comentario no encontrado' });
        }

        // Verificar si el comentario pertenece al usuario autenticado
        if (comment.user?.toString() !== userId) {
            return res.status(403).send({ message: 'No tienes permiso para editar este comentario' });
        }

        // Actualizar el texto del comentario
        comment.text = text;
        comment.updated_at = new Date(); // Opcional: añade esta propiedad en el schema si no existe

        // Guardar los cambios
        await publication.save();

        return res.status(200).send({ message: 'Comentario actualizado', comment });
    } catch (err) {
        console.error('Error al actualizar comentario:', err);
        return res.status(500).send({ message: 'Error al actualizar el comentario', error: err.message });
    }
}

module.exports = {
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    likePublication,
    unlikePublication,
    addComment,
    deleteComment,
    getMyPublications,
    updatePublication,
    updateComment
};
