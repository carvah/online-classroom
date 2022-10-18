const { Console } = require('console');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
const TICK_RATE = 128;

const getGravity = () => {
    const meterInPixels = 3779.5275590551; // 9.2 meters per second
    const gravity = TICK_RATE / meterInPixels;
    return gravity;
}

const GRAVITY = 0;

const PLAYER_SPEED = 5.0;

app.use(express.static('frontend'));

const playersSocketMap = {};
const socketMap = {};
const controlsMap = {};
const players = [];
const CONTROLS = {
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
    JUMP: "jump"
};

//Whenever someone connects this gets executed
io.on('connection', function(socket) {
    console.log('A user connected');

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function() {
        console.log('A user disconnected');
    });

    socket.on('join', (player) => {
        console.log(`${player.name} connected`);

        const newPlayer = {
            x: 100,
            y: 100,
            vx: 0,
            vy: 0,
            name: player.name,
            id: socket.id,
            color: `#${Math.floor(Math.random() * (0xffffff + 1)).toString(16)}`,
        }

        playersSocketMap[socket.id] = newPlayer;
        socketMap[socket.id] = socket;

        players.push(newPlayer);
    });

    socket.on("controls", (controls) => {
        controlsMap[socket.id] = controls;
    });
});


function tick(delta) {
    players.forEach(player => {
        const playerControls = controlsMap[player.id] ?? {};        
        player.vy += GRAVITY * delta;
        player.y += player.vy;


        if (playerControls[CONTROLS.RIGHT]) {
            player.x += PLAYER_SPEED;
        }

        if (playerControls[CONTROLS.LEFT]) {
            player.x -= PLAYER_SPEED;
        }
    });

    io.emit('players', players);
}

let lastUpdated = Date.now();
setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdated;
    tick(delta);
    lastUpdated = now;
}, 1000 / TICK_RATE);

http.listen(PORT, function() {
    console.log(`listening on *:${PORT}`);
});