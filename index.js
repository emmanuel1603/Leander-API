'use strict';
const path = require('path');
var mongoose = require('mongoose');
var app = require('./app');
var http = require('http'); // Importar módulo http
var socketIo = require('socket.io'); // Importar Socket.IO
var port = 3800;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/Leander_db')
    .then(() => {
        console.log("La conexión a la base de datos ha sido exitosa");

        // Crear servidor HTTP
        const server = http.createServer(app);

        // Inicializar Socket.IO
        const io = socketIo(server, {
            cors: {
                origin: "*", // Permitir todas las conexiones CORS para WebSockets
                methods: ["GET", "POST"]
            }
        });

        // Manejar conexiones de Socket.IO
        io.on('connection', (socket) => {
            console.log('Nuevo cliente conectado:', socket.id);

            // Aquí puedes añadir lógica para autenticar el socket
            // y asociarlo a un usuario específico.
            // Por ejemplo, si el cliente envía un token JWT:
            socket.on('authenticate', (token) => {
                try {
                    var jwt = require('jwt-simple');
                    var moment = require('moment');
                    var payload = jwt.decode(token, process.env.JWT_SECRET || 'secret_key');

                    if (payload.exp <= moment().unix()) {
                        socket.emit('auth_error', { message: 'Token expirado' });
                        socket.disconnect();
                        return;
                    }
                    socket.userId = payload.sub; // Asignar el ID de usuario al socket
                    console.log(`Usuario ${socket.userId} autenticado con Socket ID: ${socket.id}`);
                    socket.join(socket.userId); // Unir al usuario a una sala con su ID
                    socket.emit('authenticated', { message: 'Autenticación exitosa' });
                } catch (err) {
                    socket.emit('auth_error', { message: 'Token no válido o manipulado' });
                    socket.disconnect();
                }
            });

            socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
            });
        });

        // Pasar la instancia de io a la aplicación Express para que los controladores puedan usarla
        app.set('socketio', io);

        // Iniciar el servidor HTTP
        server.listen(port, () => {
            console.log("Servidor corriendo en http://localhost:" + port);
        });
    })
    .catch(err => console.log(err));

