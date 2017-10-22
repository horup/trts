import * as React from 'react';
import { Container, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { DatetimePicker } from '../extensions';
import { HashRouter, Route, Link } from 'react-router-dom';
import * as PIXI from 'pixi.js';
import {State, Unit, Player, MoveOrder} from './model';

export default class App extends React.Component<any, any>
{
    roundTimer:number = 0;
    roundLength:number = 60 * 3;
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
    
    spawnSet(y:number, player:Player)
    {
        this.state.players.push(player);
        for (let i = 0; i < 3; i++)
        {
            for (let x = 200; x <= 400; x += 32)
            {
                let u = new Unit();
                u.owner = player;
                u.pos[0] = x;
                u.pos[1] = y + i * 32; 
                this.state.units.push(u);
            }
        }
    }

    componentDidMount()
    {
        this.spawnSet(28, new Player(0xFF0000));
        this.spawnSet(392, new Player(0x00FF00));
        this.stage = new PIXI.Container();
        let renderer = PIXI.autoDetectRenderer(640, 480, {view: this.canvas, antialias:false}); 
        let interaction = new PIXI.interaction.InteractionManager(renderer);
        this.graphics = new PIXI.Graphics();
        
        this.stage.addChild(this.graphics);

        this.canvas.addEventListener('mousedown', (e)=>
        {
            if (!this.isPlanningPhase())
                return;

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
                        order.pos[0] = interaction.mouse.global.x;
                        order.pos[1] = interaction.mouse.global.y;
                        u.order = order;
                    }
                }
            }
        });

        this.canvas.addEventListener('mousemove', ()=>
        {
            if (!this.isPlanningPhase())
                return;
            
                if (this.mouseStart != null)
            {
                this.mouseEnd = interaction.mouse.global.clone();
            }
        });

        document.addEventListener('keypress', ()=>
        {
            if (!this.isPlanningPhase())
                return;

            if (this.roundTimer == 0)
            {
                this.roundTimer = this.roundLength;
            }
        });

        this.canvas.addEventListener('mouseup', (e) =>
        {
            if (!this.isPlanningPhase())
                return;
            if (e.button == 0)
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
                    if (rect.contains(u.pos[0], u.pos[1]))
                    {
                        u.selected = true;
                    }
                }

                this.mouseEnd = null;
                this.mouseStart = null;
            }
        });

        let conquer = () =>
        {
            for (let u of this.state.units)
            {
                u.update(this.state);
            }
        }

        let f = () =>
        {
            if (this.roundTimer > 0)
            {
                conquer();
                
                this.roundTimer--;
            }

            this.graphics.clear();
            for (let u of this.state.units)
            {
                
                if (u.selected && this.isPlanningPhase())
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
                        let vx = u.pos[0] - u2.pos[0];
                        let vy = u.pos[1] - u2.pos[1];
                        let l = Math.sqrt(vx * vx + vy * vy);
                        let diff = (u.radius + u2.radius - l) / 2;
                        if (l < u.radius + u2.radius)
                        {
                            u.pos[0] += vx / l * diff;
                            u.pos[1] += vy / l * diff;
                            u2.pos[0] -= vx / l * diff;
                            u2.pos[1] -= vy / l * diff;
                        }
                    }
                }

                this.graphics.beginFill(u.owner.color);
                this.graphics.drawCircle(u.pos[0], u.pos[1], u.radius);
                this.graphics.endFill();

                if (u.order != null && this.isPlanningPhase())
                {
                    if (u.order instanceof MoveOrder)
                    {
                        this.graphics.beginFill(0xFF0000);
                        this.graphics.moveTo(u.pos[0], u.pos[1]);
                        this.graphics.lineTo(u.order.pos[0], u.order.pos[1]);
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

            if (!this.isPlanningPhase())
            {
                this.graphics.lineStyle(1, 0xFFFFFF);
                this.graphics.beginFill(0x00FF00);
                let w = renderer.width;
                w *= (this.roundTimer / this.roundLength);
                let margin = 4;
                w -= margin * 2;
                if (w < 0)
                    w = 0;
                this.graphics.drawRect(margin, margin, w, 8);
            }

            if (this.isPlanningPhase())
            {
                for (let u of this.state.units)
                {
                    if (u.selected)
                    {
                        this.graphics.lineStyle(1, 0xFF0000, 0.5);
                        this.graphics.drawCircle(u.pos[0], u.pos[1], u.attackRadius);
                        this.graphics.lineStyle(1, 0xFFFFFF, 0.5);
                        this.graphics.drawCircle(u.pos[0], u.pos[1], u.scoutRadius);
                    }
                }
            }

            if (!this.isPlanningPhase())
            {
                for (let u of this.state.effects)
                {
                    u.draw(this.graphics);
                }
            }

            let deadUnits = this.state.units.filter((u)=>u.health <= 0);
            for (let u of deadUnits)
            {
                this.state.units.splice(this.state.units.indexOf(u), 1);
            }

            let deadEffects = this.state.effects.filter((u)=>u.life <= 0);
            for (let u of deadEffects)
            {
                this.state.effects.splice(this.state.effects.indexOf(u), 1);
            }

            if (!this.isPlanningPhase())
            {
            }
            else
            {
                
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