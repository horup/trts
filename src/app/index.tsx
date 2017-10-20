import * as React from 'react';
import { Container, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { DatetimePicker } from '../extensions';
import { HashRouter, Route, Link } from 'react-router-dom';
import * as PIXI from 'pixi.js';
import {State, Unit, Player, MoveOrder} from './model';

export default class App extends React.Component<any, any>
{
    
    text:PIXI.Text;
    roundTimer:number = 0;
    mouseStart:PIXI.Point;
    mouseEnd:PIXI.Point;
    graphics:PIXI.Graphics;
    state:State = new State();
    stage:PIXI.Container;
    canvas:HTMLCanvasElement;
    app:PIXI.Application;
    constructor(props:any)
    {
        super();
        document.addEventListener('contextmenu', e=> event.preventDefault());
        
    }

    isPlanningPhase = ()=> { return this.roundTimer == 0; };

    componentDidMount()
    {
        let x = 300;
        {
            let p = new Player();
            p.color = 0x00FF00;
            let u = new Unit();
            u.owner = p;
            u.pos.x = x;
            u.pos.y = 50;
            this.state.players.push(p);
            this.state.units.push(u);
        }
        {
            let p = new Player();
            p.color = 0xFF0000;
            let u = new Unit();
            u.owner = p;
            u.pos.x = x;
            u.pos.y = 400;
            this.state.players.push(p);
            this.state.units.push(u);
        }

        this.stage = new PIXI.Container();
        let renderer = PIXI.autoDetectRenderer(640, 480, {view: this.canvas, antialias:false}); 
        let interaction = new PIXI.interaction.InteractionManager(renderer);
        this.graphics = new PIXI.Graphics();
        
        this.stage.addChild(this.graphics);

        this.text = new PIXI.Text("hello world", {fontFamily : 'Arial', fontSize: 24, fill : 0xff1010, align : 'center'});
        
        this.stage.addChild(this.text);
        this.canvas.addEventListener('mousedown', (e)=>
        {
            if (e.button == 0)
            {
                if (this.mouseStart == null)
                {
                    this.mouseStart = interaction.mouse.global.clone();
                    this.mouseEnd = interaction.mouse.global.clone();
                }
            }
            else
            {
                for (let u of this.state.units)
                {
                    if (u.selected)
                    {
                        let order = new MoveOrder();
                        order.pos.x = interaction.mouse.global.x;
                        order.pos.y = interaction.mouse.global.y;
                        u.order = order;
                    }
                }
            }
        });

        this.canvas.addEventListener('mousemove', ()=>
        {
            if (this.mouseStart != null)
            {
                this.mouseEnd = interaction.mouse.global.clone();
            }
        });

        document.addEventListener('keypress', ()=>
        {
            if (this.roundTimer == 0)
            {
                this.roundTimer = 60;
            }

            console.log("test");
        });

        this.canvas.addEventListener('mouseup', (e) =>
        {
            if (e.button == 0)
            {
                if (this.isPlanningPhase())
                {
                    for (let u of this.state.units)
                        u.selected = false;

                    for (let u of this.state.units)
                    {
                        let w = Math.abs(this.mouseStart.x - this.mouseEnd.x);
                        let h = Math.abs(this.mouseStart.y - this.mouseEnd.y);
                        let x = Math.min(this.mouseStart.x, this.mouseEnd.x);
                        let y = Math.min(this.mouseStart.y, this.mouseEnd.y);
                        let rect = new PIXI.Rectangle(x, y, w, h);
                        if (rect.contains(u.pos.x, u.pos.y))
                        {
                            u.selected = true;
                        }
                    }

                    this.mouseEnd = null;
                    this.mouseStart = null;
                }
            }
        });

        let conquer = () =>
        {
            for (let u of this.state.units)
            {
                if (u.order != null)
                {
                    u.order.execute(u);
                }
            }
        }

        let f = () =>
        {
            if (this.roundTimer > 0)
            {
                conquer();
                this.roundTimer--;
            }

            this.text.text = this.roundTimer == 0 ? "Command" : "";
            this.graphics.clear();
            for (let u of this.state.units)
            {
                if (u.selected)
                {
                    this.graphics.lineStyle(1, 0xFFFFFF);
                }
                else
                {
                    this.graphics.lineStyle(0, 0xFFFFFF);
                }

                for (let u2 of this.state.units)
                {
                    if (u != u2)
                    {
                        let vx = u.pos.x - u2.pos.x;
                        let vy = u.pos.y - u2.pos.y;
                        let l = Math.sqrt(vx * vx + vy * vy);
                        let diff = (u.radius + u2.radius - l) / 2;
                        if (l < u.radius + u2.radius)
                        {
                            u.pos.x += vx / l * diff;
                            u.pos.y += vy / l * diff;
                            u2.pos.x -= vx / l * diff;
                            u2.pos.y -= vy / l * diff;
                        }
                    }
                }

                this.graphics.beginFill(u.owner.color);
                this.graphics.drawCircle(u.pos.x, u.pos.y, u.radius);
                this.graphics.endFill();

                if (u.order != null)
                {
                    if (u.order instanceof MoveOrder)
                    {
                        this.graphics.beginFill(0xFF0000);
                        this.graphics.moveTo(u.pos.x, u.pos.y);
                        this.graphics.lineTo(u.order.pos.x, u.order.pos.y);
                        this.graphics.endFill();
                    }
                }
            }

            if (this.mouseStart != null && this.mouseEnd != null)
            {
                this.graphics.lineStyle(1, 0xFFFFFF);
                this.graphics.beginFill(0, 0);
                let w = Math.abs(this.mouseStart.x - this.mouseEnd.x);
                let h = Math.abs(this.mouseStart.y - this.mouseEnd.y);
                let x = Math.min(this.mouseStart.x, this.mouseEnd.x);
                let y = Math.min(this.mouseStart.y, this.mouseEnd.y);
                this.graphics.drawRect(x, y, w, h);
                this.graphics.endFill();
            }
           
            renderer.render(this.stage);
            requestAnimationFrame(f);
        };

        f();
    }

    render() {
        return (
            <div>
                <canvas width={400} height={400} ref={(ref)=>this.canvas = ref} />
            </div>
        )
    }
}