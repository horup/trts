import * as React from 'react';
import { Container, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { HashRouter, Route, Link } from 'react-router-dom';
import * as PIXI from 'pixi.js';
import {State, Unit, Player, MoveOrder} from './model';
import {vec2} from 'gl-matrix';

export default class App extends React.Component<any, any>
{
    attackMove = true;
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
        document.body.style.cursor = "crosshair";
        
    }

    isPlanningPhase = ()=> { return this.roundTimer == 0; };
    
    spawnSet(y:number, player:Player)
    {
        this.state.players.push(player);
        for (let i = 0; i < 3; i++)
        {
            for (let x = 100; x <= 700; x += 32)
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
        this.spawnSet(492, new Player(0x00FF00));
        this.stage = new PIXI.Container();
        let renderer = PIXI.autoDetectRenderer(800, 600, {view: this.canvas, antialias:false}); 
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
                let i = 0;
                let start = vec2.create();
                let end = vec2.create();
                end[0] = interaction.mouse.global.x;
                end[1] = interaction.mouse.global.y;
                let v = vec2.create();
                for (let u of this.state.units)
                {
                    if (u.selected)
                    {
                        vec2.add(start, start, u.pos);
                        i++;
                    }
                }

                if (i > 0)
                {
                    vec2.divide(start, start, [i, i]);
                    vec2.subtract(v, end, start);
                }

                let moveRadius = 64;
                let numSelected = this.state.units.filter((u)=>u.selected == true).length;
                let row = 0;
                let col = 0;
                if (numSelected > 0)
                {
                    let s = Math.sqrt(numSelected);
                    console.log(s);
                    for (let u of this.state.units)
                    {
                        if (u.selected)
                        {
                            let order = new MoveOrder(this.attackMove);
                            order.pos[0] = end[0] + col;
                            order.pos[1] = end[1] + row;
                            u.order = order;

                            let space = 32;
                            col += space;
                            if (col >= s * space)
                            {
                                col = 0;
                                row += space;
                            }

                        }
                    }
                }
            }
        });

        document.addEventListener('mousemove', ()=>
        {
            if (!this.isPlanningPhase())
                return;
            
                if (this.mouseStart != null)
                {
                    this.mouseEnd = interaction.mouse.global.clone();
                }
        });

        document.addEventListener('keypress', (e)=>
        {
            if (e.keyCode == 32)
            {
                if (!this.isPlanningPhase())
                    return;

                if (this.roundTimer == 0)
                {
                    this.roundTimer = this.roundLength;
                }
            }
            else if (e.keyCode == 115) // S
            {
                for (let u of this.state.units)
                {
                    if (u.selected)
                    {
                        u.order = null;
                        u.stop();
                    }
                }
            }
            else if (e.keyCode == 97) // A
            {
                
               this.attackMove = !this.attackMove;
                if (!this.attackMove)
                    document.body.style.cursor = "move";
                else
                    document.body.style.cursor = "crosshair";

            }
        });

        document.addEventListener('mouseup', (e) =>
        {
            if (!this.isPlanningPhase())
                return;
            if (e.button == 0)
            {
                if (this.mouseStart != null && this.mouseEnd != null)
                {
                    for (let u of this.state.units)
                        u.selected = false;
                    let w = Math.abs(this.mouseStart.x - this.mouseEnd.x);
                    let h = Math.abs(this.mouseStart.y - this.mouseEnd.y);
                    let x = Math.min(this.mouseStart.x, this.mouseEnd.x);
                    let y = Math.min(this.mouseStart.y, this.mouseEnd.y);

                    let v = vec2.create();
                    v[0] = this.mouseStart.x;
                    v[1] = this.mouseStart.y;
                    this.state.grid.getUnitsWithinRect(x, y, w, h).forEach((u)=>u.selected = true);

                    this.mouseEnd = null;
                    this.mouseStart = null;
                }
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
            this.state.grid.update(this.state);
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

            /*    for (let u2 of this.state.units)
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
                }*/

                this.graphics.beginFill(u.owner.color);
                this.graphics.drawCircle(u.pos[0], u.pos[1], u.radius);
                this.graphics.endFill();

                if (u.order != null && this.isPlanningPhase())
                {
                    if (u.order instanceof MoveOrder)
                    {
                        if (u.order.attackMove)
                            this.graphics.lineStyle(1, 0xFF0000);
                        else
                            this.graphics.lineStyle(1, 0xFFFFFF);

                        this.graphics.beginFill(0xFFFFFF);
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
                u.target = null;
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
            <div style={{width:'100%'}}>
                <div style={{width:'800px', margin:'0 auto'}}>
                    <div>
                        <h3>TRTS Concept Test</h3>
                        <ul>
                            <li>Left click and drag to select units.</li>
                            <li>Right click to issue move orders.</li>
                            <li>Press S to stop and cancel any orders issued.</li>
                            <li>Press A to cycle between attack move or normal move.</li>
                            <li>Press Space to execute.</li>
                            <li>Press F5 to refresh concept test.</li>
                        </ul>
                    </div>
                    <canvas width={800} height={600} ref={(ref)=>this.canvas = ref} />
                   
                </div>
            </div>
        )
    }
}