import type { Player } from "src/models/player.model";
import { io, Socket } from "socket.io-client";
import  {CanvasRenderer} from "../renderers/canvas-renderer";
import JoyStick from "../libs/joystick";

export class ClientController {
    // elements
    loginButton: HTMLElement;
    loginControls: HTMLElement;
    gameControl: HTMLElement;
    nameEl: HTMLInputElement;
    canvas: HTMLCanvasElement;
    jumpButton: HTMLElement;
    player: Player = {
        x: 0,
        y: 0,
        name: 'none',
        color: '',    
        canJump: false
    };
    joyStick: JoyStick;
    clientSocket: Socket;
    canvasRenderer: CanvasRenderer;

    constructor() {
        this.loginButton = document.getElementById('loginButton') as HTMLElement;
        this.loginControls = document.getElementById('loginControls') as HTMLElement;
        this.gameControl = document.getElementById('gameControl') as HTMLElement;
        this.nameEl = document.getElementById('name') as HTMLInputElement;
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.jumpButton = document.getElementById('jumpButton') as HTMLElement;

        this.clientSocket = io('localhost:3000');

        this.joyStick = new JoyStick('joyDiv', {            
            title: 'joystick',            
            internalFillColor: '#FFFFF0',            
            internalLineWidth: 2,            
            internalStrokeColor: '#090000',            
            externalLineWidth: 2,            
            externalStrokeColor: '#000000',            
            autoReturnToCenter: true
        });
        this.canvasRenderer = new CanvasRenderer(this.canvas, this.joyStick, this.clientSocket);

        this.addEventListeners();
    }

    private addEventListeners() {
        this.loginButton.addEventListener('click', () => this.login());
    }

    private login() {        
        this.loginControls.style.display = 'none';
        this.gameControl.style.display = 'block';
        this.player.name = this.nameEl.value;

        this.clientSocket.emit('join', this.player);
    }
}