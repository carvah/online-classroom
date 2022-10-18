const loginButton = document.getElementById('loginButton');
const loginControls = document.getElementById('loginControls');
const gameControl = document.getElementById('gameControl');
const nameEl = document.getElementById('name');


const player = {
    name: 'none'
};

const socket = io();
const canvas = document.getElementById('canvas');
const width = window.innerWidth;
const height = window.innerHeight;

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

socket.on('sendMap', serverMap => {
    map = serverMap;
});

setInterval(() => {
    socket.emit('ping', Date.now());    
}, 1000);

let latency = 0;
socket.on('pong', (pong) => {    
    latency = Date.now() - pong;
    console.log(latency);
});

function update(delta) {
    socket.emit("controls", controls);
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    drawMap();

    players.forEach(player => {
        // is mine
        if (player.id === socket.id) {
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
        }

        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
        ctx.fillStyle = "#000000";
        ctx.fillText(player.name, player.x + (PLAYER_SIZE / 2), player.y - 10);
    });
}

const drawMap = () => {
    ctx.fillStyle = "#000000";
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tileType = map[row][col];
            if (tileType === 1) {
                ctx.fillRect(
                    col * TILE_SIZE,
                    row * TILE_SIZE,
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