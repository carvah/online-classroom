import type { Socket } from "socket.io-client";
import type { Player } from "src/models/player.model";
import type JoyStick from "../libs/joystick";

export class CanvasRenderer {    
    lastRender: number = 0;    
    width: number;
    height: number;
    ctx: CanvasRenderingContext2D;
    controls: any =  {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false
    };    
    keyMap: any = {
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        " ": "jump",
    };
    map: any = [[]];
    cameraX: number = 0; 
    cameraY: number  = 0;
    latency: number = 0;
    isUsingKeyboard: boolean = false;
    players: Player[] = [];

    // consts
    private readonly TILE_SIZE = 48;
    private readonly PLAYER_SIZE = 24;
    
    constructor(private canvas: HTMLCanvasElement, private joyStick: JoyStick, private socket: Socket) {
        window.requestAnimationFrame((delta) => this.gameLoop(delta));
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.addSocketListeners();
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.resizeCanvas();

        document.addEventListener("keydown", (e) => {
            this.controls[this.keyMap[e.key]] = true;
            this.isUsingKeyboard = true;
        });
        
        document.addEventListener("keyup", (e) => {
            this.controls[this.keyMap[e.key]] = false;
            if (Object.values(this.controls).some(x => x == true)) {
                this.isUsingKeyboard = true;
            } else {
                this.isUsingKeyboard = false;
            }
        });

        window.addEventListener('resize',() => this.resizeCanvas(), false);
    }

    private gameLoop(timestamp: number) {
        const delta = timestamp - this.lastRender;
    
        this.update(delta);
        this.draw();        
    
        this.lastRender = timestamp;
        window.requestAnimationFrame((deltaT) => this.gameLoop(deltaT));                      
    }

    private update(delta: number) {
        this.socket.emit("controls", this.controls);
    }

    private draw() {        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawPlayers();
        this.drawMap();
    } 
    
    private resizeCanvas() {               
        this.canvas.width = this.width - 25;
        this.canvas.height = this.height - 25;    
    }

    private drawMap() {
        this.ctx.fillStyle = "#000000";
        for (let row = 0; row < this.map.length; row++) {
            for (let col = 0; col < this.map[row].length; col++) {
                const tileType = this.map[row][col];
                if (tileType === 1) {
                    this.ctx.fillRect(
                        col * this.TILE_SIZE - this.cameraX,
                        row * this.TILE_SIZE - this.cameraY,
                        this.TILE_SIZE + 1,
                        this.TILE_SIZE + 1
                    );
                }
            }
        }
    }

    private addSocketListeners() {
        this.socket.on('players', (serverPlayers) => {
            this.players = serverPlayers;
        });
        
        this.socket.on('sendMap', (serverMap) => {            
            this.map = serverMap;
        });
    
        this.socket.on('pong', (pong) => {
            this.latency = Date.now() - pong;            
            const fpsStatEl = document.getElementById('fps_stat');
            if (fpsStatEl) {
                fpsStatEl.innerHTML = `Latency: ${this.latency} ms`;
            }
        }); 

        setInterval(() => {
            this.socket.emit('ping', Date.now());
        }, 1000);

        setInterval(() => {
            this.getControlFromJoyStick();
        }, 50);
    }
                    
    private getControlFromJoyStick() {
        if (this.isUsingKeyboard) return;
    
        const direction = this.joyStick?.GetDir();
        if (direction) {
            switch (direction) {
                case 'N':
                    this.controls.up = true;
                    this.controls.down = false;
                    this.controls.left = false;
                    this.controls.right = false;
                    break;
                case 'NE':
                    this.controls.up = true;
                    this.controls.down = false;
                    this.controls.left = false;
                    this.controls.right = true;
                    break;
                case 'NW':
                    this.controls.up = true;
                    this.controls.down = false;
                    this.controls.left = true;
                    this.controls.right = false;
                    break;
                case 'W':
                    this.controls.up = false;
                    this.controls.down = false;
                    this.controls.left = true;
                    this.controls.right = false;
                    break;
                case 'S':
                    this.controls.up = false;
                    this.controls.down = true;
                    this.controls.left = false;
                    this.controls.right = false;
                    break;
                case 'SE':
                    this.controls.up = false;
                    this.controls.down = true;
                    this.controls.left = false;
                    this.controls.right = true;
                    break;
                case 'SW':
                    this.controls.up = false;
                    this.controls.down = true;
                    this.controls.left = true;
                    this.controls.right = false;
                    break;
                case 'E':
                    this.controls.up = false;
                    this.controls.down = false;
                    this.controls.left = false;
                    this.controls.right = true;
                    break;
                default:
                    this.controls.up = false;
                    this.controls.down = false;
                    this.controls.left = false;
                    this.controls.right = false;
                    break;
            }
        }
    }
                         
    private drawPlayers() {
        this.ctx.save();
        this.players.forEach(player => {
            // is mine        
            if (player.id === this.socket.id) {
                this.cameraX = (player.x - (this.canvas.width ) / 2);
                this.cameraY = (player.y - this.canvas.height / 2);
                this.ctx.fillStyle = '#FFF301';                
                this.ctx.fillRect(player.x + 1 - this.cameraX, player.y - 1  - this.cameraY, this.PLAYER_SIZE + 2, this.PLAYER_SIZE + 2);
            } else {
                this.ctx.fillStyle = player.color;
                this.ctx.fillRect(player.x + 1 - this.cameraX, player.y - 1  - this.cameraY, this.PLAYER_SIZE + 2, this.PLAYER_SIZE + 2);
            }
    
            this.ctx.fillStyle = "#000000";
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name, player.x - this.cameraX, (player.y - 10) - this.cameraY);
        });
        this.ctx.restore();
    }             
}