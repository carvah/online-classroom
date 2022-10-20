const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
const TICK_RATE = 60;

const getGravity = () => {
    const meterInPixels = 3779.5275590551; // 9.2 meters per second
    const gravity = 100 / meterInPixels;
    return gravity;
}

const GRAVITY = getGravity();
const TILE_SIZE = 48;
const PLAYER_SIZE = 24;

app.use(express.static('client/public'));

const playersSocketMap = {};
const socketMap = {};
const controlsMap = {};
let players = [];
const CONTROLS = {
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
    JUMP: "jump",
};

const map = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
];

const collidables = [];
for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] !== 0) {
            collidables.push({
                y: row * TILE_SIZE,
                x: col * TILE_SIZE,
            });
        }
    }
}

//Whenever someone connects this gets executed
io.on('connection', function (client) {
    console.log('A user connected');

    //Whenever someone disconnects this piece of code executed
    client.on('disconnect', function () {
        console.log('A user disconnected');
        delete playersSocketMap[client.id];
        players = players.filter((player) => player.id !== client.id);
    });

    client.on('join', (player) => {
        console.log(`${player.name} connected`);

        const newPlayer = {
            x: 100,
            y: 100,
            vx: 5,
            vy: 0,
            name: player.name,
            id: client.id,
            color: `#${Math.floor(Math.random() * (0xffffff + 1)).toString(16)}`,
            canJump: true,
        }

        playersSocketMap[client.id] = newPlayer;
        socketMap[client.id] = client;

        players.push(newPlayer);

        io.emit('sendMap', map);
    });

    client.on("controls", (controls) => {
        controlsMap[client.id] = controls;
    });

    client.on('ping', ping => {
        client.emit('pong', ping);
    })
});

const getBoundingBoxFactory = (STATIC_SIZE) => (entity) => {
    return {
        width: STATIC_SIZE,
        height: STATIC_SIZE,
        x: entity.x,
        y: entity.y,
    };
};

const getPlayerBoundingBox = getBoundingBoxFactory(PLAYER_SIZE);
const getTileBoundingBox = getBoundingBoxFactory(TILE_SIZE);

const isOverlap = (rect1, rect2) => {
    return !(rect1.x > rect2.x + rect2.width || rect1.x + rect1.width < rect2.x || rect1.y > rect2.y + rect2.height || rect1.y + rect1.height < rect2.y);
};

const isCollidingWithTile = (player) => {
    for (const collidable of collidables) {
        if (isOverlap(getPlayerBoundingBox(player), getTileBoundingBox(collidable))) {
            return true;
        }
    }
    return false;
};

function gameLoop(delta) {
    players.forEach(player => {
        const playerControls = controlsMap[player.id] ?? {};
        player.vy += GRAVITY * delta;
        player.y += player.vy;

        if (isCollidingWithTile(player)) {
            player.y -= player.vy;
            player.vy = 0;
            // means he's on a surface
            player.canJump = true;
        }

        if (playerControls[CONTROLS.RIGHT]) {
            player.vx = 5;
            player.x += player.vx;

            if (isCollidingWithTile(player)) {
                player.x -= player.vx;
            }
        } else if (playerControls[CONTROLS.LEFT]) {
            player.vx = -5;
            player.x += player.vx;
            if (isCollidingWithTile(player)) {
                player.x -= player.vx;
            }
        }

        if (playerControls[CONTROLS.JUMP] && player.canJump) {
            player.vy = -10;
            player.canJump = false;
        }

        // reset player
        if (player.y > 1024) {
            player.y = 100;
            player.x = 100;
            player.vy = 0;
        }
    });

    io.emit('players', players);
}

let lastUpdated = Date.now();
setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdated;
    gameLoop(delta);
    lastUpdated = now;
}, 1000 / TICK_RATE);

http.listen(PORT, function () {
    console.log(`listening on *:${PORT}`);
});