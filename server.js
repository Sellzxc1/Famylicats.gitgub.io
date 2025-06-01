const WebSocket = require('ws');
const http = require('http');
const uuid = require('uuid'); // Для генерации уникальных ID

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const players = {};

// Генерация случайного цвета
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

wss.on('connection', (ws) => {
    // Создаем временного игрока (ждем данные от клиента)
    const playerId = uuid.v4();
    let player = null;
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case "join":
                // Создаем нового игрока
                player = {
                    id: playerId,
                    x: Math.floor(Math.random() * 800), // Начальная позиция X
                    y: Math.floor(Math.random() * 600), // Начальная позиция Y
                    width: 50,
                    height: 50,
                    name: data.name || "Игрок",
                    color: data.color || getRandomColor()
                };
                
                players[playerId] = player;
                
                // Отправляем игроку его ID и начальную позицию
                ws.send(JSON.stringify({
                    type: "init",
                    id: playerId,
                    x: player.x,
                    y: player.y
                }));
                
                // Отправляем информацию о всех игроках
                ws.send(JSON.stringify({
                    type: "players",
                    players: players
                }));
                
                // Оповещаем всех о новом игроке
                broadcast({
                    type: "join",
                    id: playerId,
                    x: player.x,
                    y: player.y,
                    name: player.name,
                    color: player.color
                }, ws);
                break;
                
            case "position":
                // Обновляем позицию игрока
                if (player) {
                    player.x = data.x;
                    player.y = data.y;
                    
                    // Отправляем обновление всем, кроме отправителя
                    broadcast({
                        type: "position",
                        id: playerId,
                        x: data.x,
                        y: data.y
                    }, ws);
                }
                break;
        }
    });
    
    ws.on('close', () => {
        if (player) {
            // Удаляем игрока и оповещаем остальных
            delete players[playerId];
            broadcast({
                type: "leave",
                id: playerId
            });
        }
    });
});

// Функция для отправки сообщения всем клиентам, кроме указанного
function broadcast(data, excludeWs = null) {
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Запуск сервера
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
