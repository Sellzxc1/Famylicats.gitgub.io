const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Игровые данные
const players = {};
const mobs = [];
const items = [];

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка подключений Socket.io
io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);
    
    // Отправка текущего состояния игры новому игроку
    socket.emit('gameState', {
        players: players,
        mobs: mobs,
        items: items
    });
    
    // Обработка входа игрока
    socket.on('playerJoin', (data) => {
        players[socket.id] = {
            id: socket.id,
            username: data.username,
            x: data.x,
            y: data.y
        };
        
        // Оповещение всех игроков о новом игроке
        socket.broadcast.emit('playerJoined', players[socket.id]);
        
        // Отправка сообщения в чат
        io.emit('chatMessage', {
            username: 'Система',
            message: `${data.username} присоединился к игре`
        });
    });
    
    // Обработка движения игрока
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            
            // Передача движения другим игрокам
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                y: data.y
            });
        }
    });
    
    // Обработка сообщений чата
    socket.on('chatMessage', (message) => {
        if (players[socket.id]) {
            io.emit('chatMessage', {
                username: players[socket.id].username,
                message: message
            });
        }
    });
    
    // Обработка появления моба
    socket.on('mobSpawn', (mob) => {
        mobs.push(mob);
        socket.broadcast.emit('mobSpawned', mob);
    });
    
    // Обработка движения моба
    socket.on('mobMove', (data) => {
        const mob = mobs.find(m => m.id === data.id);
        if (mob) {
            mob.x = data.x;
            mob.y = data.y;
            socket.broadcast.emit('mobMoved', data);
        }
    });
    
    // Обработка убийства моба
    socket.on('mobKilled', (id) => {
        const index = mobs.findIndex(m => m.id === id);
        if (index !== -1) {
            mobs.splice(index, 1);
            io.emit('mobKilled', id);
        }
    });
    
    // Обработка создания предмета
    socket.on('itemCreated', (item) => {
        items.push(item);
        socket.broadcast.emit('itemCreated', item);
    });
    
    // Обработка подбора предмета
    socket.on('itemPicked', (id) => {
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            io.emit('itemPicked', id);
        }
    });
    
    // Обработка отключения игрока
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            const username = players[socket.id].username;
            delete players[socket.id];
            
            // Оповещение всех игроков об отключении
            io.emit('playerLeft', socket.id);
            
            // Отправка сообщения в чат
            io.emit('chatMessage', {
                username: 'Система',
                message: `${username} покинул игру`
            });
        }
        console.log('Пользователь отключился:', socket.id);
    });
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});