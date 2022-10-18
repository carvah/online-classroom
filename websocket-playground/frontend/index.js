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

function update(delta) {
    socket.emit("controls", controls);
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    players.forEach(player => {
        // is mine
        if (player.id === socket.id) {
            console.log(player);
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, 50, 50);
        }

        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, 50, 50);
        ctx.fillStyle = "#000000";
        ctx.fillText(player.name, player.x + (50 / 2), player.y - 10);
    });
}


function loop(timestamp) {
    const delta = timestamp - lastRender;

    update(delta);
    draw();

    lastRender = timestamp;
    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);