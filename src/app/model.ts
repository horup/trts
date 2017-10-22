import * as PIXI from 'pixi.js';
import {vec2} from 'gl-matrix';

export class State
{
    players:Player[] = [];
    units:Unit[] = [];
    effects:Effect[] = [];
}

export abstract class Effect
{
    life = 60;
    pos:vec2 = vec2.create();
    abstract draw(g:PIXI.Graphics);
}

export class Damage extends Effect
{
    readonly startLife = 5;
    constructor(x:number, y:number)
    {
        super();
        this.life = this.startLife;
        this.pos[0] = x;
        this.pos[1] = y;
    }

    draw(g:PIXI.Graphics)
    {
        this.life--;
        g.lineStyle(3, 0xFF0000);
        g.beginFill(0x0, this.life / this.startLife);
        g.drawCircle(this.pos[0], this.pos[1], 12);
    }
}

export class AI
{
    unit:Unit;
    pattern:((state:State)=>boolean)[] = [];
    constructor(unit:Unit)
    {
        this.unit = unit;
    }

    think(state:State)
    {
        for (let f of this.pattern)
        {
            if (!f(state))
            {
                break;
            }
        }
    }

    attackClosest()
    {
        this.pattern.push((state:State)=>
        {
            for (let u of state.units)
            {
                if (u != this.unit)
                {
                    let vx = u.pos[0] - this.unit.pos[0];
                    let vy = u.pos[1] - this.unit.pos[1];
                    let l = Math.sqrt(vx * vx + vy * vy);
                    if (u.owner != this.unit.owner && u.health > 0)
                    {
                        // ATTACK
                        if (l < this.unit.attackRadius)
                        {
                            if (this.unit.attackCooldown <= 0)
                            {
                                u.health--;
                                let damage = new Damage(u.pos[0], u.pos[1]);
                                state.effects.push(damage);
                                this.unit.attackCooldown = 10;
                            }
                        }
                    }
                }
            }
            return true;
        })

        return this;
    }

    followOrder()
    {
        this.pattern.push((state:State)=>
        {
            if (this.unit.order != null)
            {
                this.unit.order.execute(this.unit);
            }

            return true;
        });
        return this;
    }

    moveToAttackRange()
    {
        return this;
    }

    delay(length:number)
    {
        let timer = 0;
        this.pattern.push(()=>
        {
            if (timer == length)
            {
                timer = 0;
                return true;
            }
            else
            {
                timer++;
            }
            
            return false;
        });

        return this;
    }
}

export class Unit
{
    owner:Player;
    pos:vec2 = vec2.create();
    health:number = 5;
    radius:number = 8;
    selected = false;
    order:Order = null;
    attackRadius:number = 8 * 10;
    scoutRadius:number = 8 * 16 * 4;
    attackCooldown = 0;
    thinkTime = Math.floor(Math.random() * 60);
    ai:AI = new AI(this);

    constructor()
    {
       this.ai
       .followOrder()
       .delay(15)
       .attackClosest()
       .moveToAttackRange()
    }

    think(state:State)
    {
        if (this.attackCooldown > 0)
        {
            this.attackCooldown--;
        }

        this.ai.think(state);
    }
}

export abstract class Order
{
    abstract execute(unit:Unit);
}

export class MoveOrder extends Order
{
    pos = {x:0, y:0};
    execute(unit:Unit)
    {
        let vx = this.pos.x - unit.pos[0];
        let vy = this.pos.y - unit.pos[1];
        let l = Math.sqrt(vx*vx + vy*vy);
        vx /= l;
        vy /= l;
        unit.pos[0] += vx;
        unit.pos[1] += vy;
        if (l < 16)
        {
            unit.order = null;
        }
    }
}

export class Player
{
    constructor(color:number)
    {
        this.color = color = color;
    }
    
    color:number = 0xFFFFFF;
}