import * as PIXI from 'pixi.js';
export class State
{
    players:Player[] = [];
    units:Unit[] = [];
    effects:Effect[] = [];
}

export abstract class Effect
{
    life = 60;
    pos = {x:0, y:0};
    abstract draw(g:PIXI.Graphics);
}

export class Damage extends Effect
{
    readonly startLife = 5;
    constructor(x:number, y:number)
    {
        super();
        this.life = this.startLife;
        this.pos.x = x;
        this.pos.y = y;
    }

    draw(g:PIXI.Graphics)
    {
        this.life--;
        g.lineStyle(3, 0xFF0000);
        g.beginFill(0x0, this.life / this.startLife);
        g.drawCircle(this.pos.x, this.pos.y, 12);
    }
}

export class Unit
{
    owner:Player;
    pos:{x:number, y:number} = {x:0, y:0};
    health:number = 5;
    radius:number = 8;
    selected = false;
    order:Order = null;
    attackRadius:number = 8 * 10;
    scoutRadius:number = 8 * 16;
    attackCooldown = 0;
    thinkTime = Math.floor(Math.random() * 60);

    think(state:State)
    {
        if (this.attackCooldown > 0)
        {
            this.attackCooldown--;
        }
        
        this.thinkTime++
        if ((this.thinkTime % 60) != 0)
            return;

        for (let u of state.units)
        {
            if (u != this)
            {
                let vx = u.pos.x - this.pos.x;
                let vy = u.pos.y - this.pos.y;
                let l = Math.sqrt(vx * vx + vy * vy);
                if (u.owner != this.owner && u.health > 0)
                {
                    // ATTACK
                    if (l < this.attackRadius)
                    {
                        if (this.attackCooldown <= 0)
                        {
                            u.health--;
                            let damage = new Damage(u.pos.x, u.pos.y);
                            state.effects.push(damage);
                            this.attackCooldown = 10;
                        }
                    }
                    else if (l < this.scoutRadius)
                    {
                        console.log('getting closer');
                    }
                }
            }
        }
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
        let vx = this.pos.x - unit.pos.x;
        let vy = this.pos.y - unit.pos.y;
        let l = Math.sqrt(vx*vx + vy*vy);
        vx /= l;
        vy /= l;
        unit.pos.x += vx;
        unit.pos.y += vy;
        if (l < 16)
        {
            unit.order = null;
        }
    }
}

export class Player
{
    color:number = 0xFFFFFF;
}