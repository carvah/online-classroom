const loginButton = document.getElementById('loginButton');
const loginControls = document.getElementById('loginControls');
const gameControl = document.getElementById('gameControl');
const nameEl = document.getElementById('name');
const canvas = document.getElementById('canvas');

const player = {
    name: 'none'
};

const socket = io();
const aspectRatio = 16 / 9;
const width = window.innerWidth;
const height = window.innerHeight - 150;

let fpsInMs = 0;
let latency = 0;

canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';

let lastRender = 0;
let players = [];
let map = [];

const TILE_SIZE = 32;
const PLAYER_SIZE = 16;

const controls = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
};

const keyMap = {
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    " ": "jump",
};


loginButton.addEventListener('click', () => {
    login();
});

document.addEventListener("keydown", (e) => {
    controls[keyMap[e.key]] = true;
});

document.addEventListener("keyup", (e) => {
    controls[keyMap[e.key]] = false;
});


function login() {
    loginControls.style.display = 'none';
    gameControl.style.display = 'block';
    player.name = nameEl.value;

    socket.emit('join', player);
}

socket.on('players', (serverPlayers) => {
    players = serverPlayers;
});

socket.on('sendMap', (serverMap) => {
    map = serverMap;
});

setInterval(() => {
    socket.emit('ping', Date.now());
}, 1000);


socket.on('pong', (pong) => {
    latency = Date.now() - pong;
    fpsInMs = latency;
    const fpsStatEl = document.getElementById('fps_stat');
    if (fpsStatEl) {
        fpsStatEl.innerHTML = `Latency: ${fpsInMs} ms`;
    }
});

function update(delta) {
    socket.emit("controls", controls);
}

let cameraX = 0;
let cameraY = 0;
const drawPlayers = () => {
    players.forEach(player => {
        // is mine        
        if (player.id === socket.id) {
            cameraX = player.x - canvas.width / 2;
            cameraY = player.y - canvas.height / 2;
            ctx.fillStyle = '#FFF301';
            ctx.fillRect(player.x - cameraX, player.y - cameraY, PLAYER_SIZE, PLAYER_SIZE);
        }

        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - cameraX, player.y - cameraY, PLAYER_SIZE, PLAYER_SIZE);
        ctx.fillStyle = "#000000";

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x - cameraX, (player.y - 10) - cameraY);
    });
};

function draw() {
    ctx.clearRect(0, 0, width, height);
    drawPlayers();
    drawMap();
}

const drawMap = () => {
    ctx.fillStyle = "#000000";
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tileType = map[row][col];
            if (tileType === 1) {
                ctx.fillRect(
                    col * TILE_SIZE - cameraX,
                    row * TILE_SIZE - cameraY,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
    }
};


function loop(timestamp) {
    const delta = timestamp - lastRender;

    update(delta);
    draw();

    lastRender = timestamp;
    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);