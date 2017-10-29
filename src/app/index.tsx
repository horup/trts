import * as React from 'react';
import { Container, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { HashRouter, Route, Link } from 'react-router-dom';
import * as PIXI from 'pixi.js';
import {State, Unit, Player, MoveOrder} from './model';
import {vec2} from 'gl-matrix';

export default class App extends React.Component<any, any>
{
    mouseDirection:vec2 = vec2.create();
    mouseRightDown = false;
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
        let iiii = 0;
        this.spawnSet(28, new Player(0xFF0000));
        this.spawnSet(492, new Player(0x00FF00));
        this.stage = new PIXI.Container();
        let renderer = PIXI.autoDetectRenderer(800, 600, {view: this.canvas, antialias:false}); 
        let interaction = new PIXI.interaction.InteractionManager(renderer);
        this.graphics = new PIXI.Graphics();
        
        this.stage.addChild(this.graphics);

        let orderUnits = ()=>
        {
            let selected = this.state.units.filter((u)=>u.selected == true);

            if (selected.length == 0)
                return;
            
            if (vec2.length(this.mouseDirection) == 0)
            {
                this.mouseDirection[0] = this.mouseEnd.x - selected[0].pos[0];
                this.mouseDirection[1] = this.mouseEnd.y - selected[0].pos[1];
                vec2.normalize(this.mouseDirection, this.mouseDirection);
            }

            let numSelected = selected.length;
            let start = vec2.create();
            let end = vec2.create();
            end[0] = interaction.mouse.global.x;
            end[1] = interaction.mouse.global.y;
            let vx = vec2.create();
            let vy = vec2.create();
            vec2.copy(vx, this.mouseDirection);
            vec2.normalize(vx, vx);
            vec2.copy(vy, vx);
            vec2.set(vx, -vx[1], vx[0]);

            let space = 24;
            let y = 1;
            let maxWidth = 8;
            for (let i = 0; i < selected.length; i++)
            {
                let width = Math.min(selected.length, maxWidth);
                let pos = vec2.create();
                vec2.copy(pos, vx);
                let offset = (i % width) - (width / 2);
                vec2.multiply(pos, pos, [space * offset, space * offset]);
                vec2.add(pos, pos, end);
                vec2.add(pos, pos, vy);
                vec2.add(pos, pos,  [-vy[0] * y, -vy[1] * y])
                
                let u = selected[i];
                let order = new MoveOrder(this.attackMove);
                order.pos = pos;
                u.order = order;
                
                y = Math.floor(i / maxWidth) * space;
            }
        }

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
                this.mouseEnd = interaction.mouse.global.clone();
                vec2.set(this.mouseDirection, 0, 0);
                this.mouseRightDown = true;
            }
        });

        document.addEventListener('mousemove', (e)=>
        {
            if (!this.isPlanningPhase())
                return;
            
            if (this.mouseStart != null)
            {
                this.mouseEnd = interaction.mouse.global.clone();
            }

            if (this.mouseRightDown && this.mouseEnd != null)
            {
                let current = interaction.mouse.global.clone();
                this.mouseDirection[0] = current.x - this.mouseEnd.x;
                this.mouseDirection[1] = current.y - this.mouseEnd.y;
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
            if (e.button != 0)
            {
                if (this.mouseRightDown && this.mouseEnd != null)
                {
                    orderUnits();
                    this.mouseRightDown = false;
                }
            }

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

                    this.mouseStart = null;
                }
            }

            this.mouseEnd = null;
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
            /*    for (let u of this.state.units)
                {
                    if (u.selected)
                    {
                        this.graphics.lineStyle(1, 0xFF0000, 0.5);
                        this.graphics.drawCircle(u.pos[0], u.pos[1], u.attackRadius);
                        this.graphics.lineStyle(1, 0xFFFFFF, 0.5);
                        this.graphics.drawCircle(u.pos[0], u.pos[1], u.scoutRadius);
                    }
                }*/

                if (this.mouseStart == null && this.mouseEnd != null)
                {
                    this.graphics.lineStyle(1, 0xFFFFFF, 0.5);
                    this.graphics.drawCircle(this.mouseEnd.x, this.mouseEnd.y, 8);
                    this.graphics.moveTo(this.mouseEnd.x, this.mouseEnd.y);
                    this.graphics.lineTo(this.mouseDirection[0] + this.mouseEnd.x, this.mouseDirection[1] + this.mouseEnd.y);
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