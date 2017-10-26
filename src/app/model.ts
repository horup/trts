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
    scoutRadius:number = 8 * 16;
    attackCooldown = 0;

    target:Unit = null;
    waypoint:vec2 = null;

    moving = false;
    attacking = false;
    
    updates = Math.floor(Math.random() * 60);

    constructor()
    {
    }

    update(state:State)
    {
        if (this.updates % 10 == 0)
        {
            this.think(state);
        }

        this.tick(state);
        this.updates++;
    }

    tick(state:State)
    {
        if (this.target != null && this.target.health <= 0)
            this.target = null;

        if (this.attackCooldown > 0)
            this.attackCooldown--;

        if (this.moving)
        {
            if (this.waypoint != null)
            {
                let v = vec2.create();
                vec2.sub(v, this.waypoint, this.pos);
                vec2.normalize(v, v);
                vec2.add(this.pos, this.pos, v);
            }
        }

        if (this.attacking)
        {
            if (this.attackCooldown == 0)
            {
                if (this.target != null)
                {
                    state.effects.push(new Damage(this.target.pos[0], this.target.pos[1]));
                
                    this.target.health--;
                    if (this.target.health <= 0)
                    {
                        this.target = null;
                    }

                    this.attackCooldown = 30;       
                }
            }

            if (this.attackCooldown > 0)
            {
                this.attackCooldown--;
            }
        }
    }

    think(state:State)
    {
        if (this.hasMoveOrder() || this.hasNoTarget())
        {
            this.findTarget(state);
            if (this.hasNoTarget())
            {
                this.followOrders(state);
                this.ceaseFire();
            }
        }
        else
        {
            if (this.isTargetVisible(state))
            {
                if (this.isTargetInRange(state))
                {
                    this.stop();
                    this.fire();
                }
                else
                {
                    this.ceaseFire();
                    this.plotWaypoint(this.target.pos);
                    this.move();
                }
            }
            else
            {
                this.ceaseFire();
                this.stop();
                this.untarget();
            }
        }
    }

    stop()
    {
        this.moving = false;
    }

    move()
    {
        this.moving = true;
    }

    hasNoTarget()
    {
        return this.target == null;
    }

    hasMoveOrder()
    {
        if (this.order != null && this.order instanceof MoveOrder)
        {
            return !this.order.attackMove;
        }

        return false;
    }

    untarget()
    {
        this.target = null;
    }

    followOrders(state:State)
    {
        if (this.order != null)
        {
            if (this.order instanceof MoveOrder)
            {
                this.waypoint = this.order.pos;
                this.move();
            }
        }
    }

    isTargetInRange(state:State)
    {
        if (this.target != null)
        {
            let v = vec2.create();
            vec2.sub(v, this.pos, this.target.pos);
            if (vec2.length(v) <= this.attackRadius)
            {
                return true;
            }
        }

        return false;
    }

    isTargetVisible(state:State)
    {
        return true;
    }

    findTarget(state:State)
    {
        let enemy = this.getClosestVisibleEnemy(state);
        if (enemy != null)
        {
            this.target = enemy;
        }
    }

    
    getClosestVisibleEnemy(state:State):Unit
    {
        let v = vec2.create();
        let enemies = state.units.filter((u) => 
        {
            if (u.owner != this.owner)
            {
                vec2.sub(v, this.pos, u.pos);
                let l = vec2.length(v);
                
                if (l < this.scoutRadius)
                {
                    return u;
                }
            }
        });

        if (enemies.length > 0)
        {
            let lastLength = Number.MAX_VALUE;
            let candidate  = 0;
            for (let i = 0; i < enemies.length; i++)
            {
                let l = vec2.length(vec2.sub(v, this.pos, enemies[i].pos));
                if (l < lastLength)
                {
                    lastLength = l;
                    candidate = i;
                }
            }

            return enemies[candidate];
        }

        return null;
    }

    fire()
    {
        this.attacking = true;
    }

    ceaseFire()
    {
        this.attacking = false;
    }

    plotWaypoint(waypoint:vec2)
    {
        this.waypoint = waypoint;
    }
}

export abstract class Order
{
    abstract execute(unit:Unit);
}

export class MoveOrder extends Order
{
    attackMove = false;
    pos = vec2.create();
    constructor(attackMove = false)
    {
        super();
        this.attackMove = attackMove;
    }
    execute(unit:Unit)
    {
       /* let vx = this.pos.x - unit.pos[0];
        let vy = this.pos.y - unit.pos[1];
        let l = Math.sqrt(vx*vx + vy*vy);
        vx /= l;
        vy /= l;
        unit.pos[0] += vx;
        unit.pos[1] += vy;
        if (l < 16)
        {
            unit.order = null;
        }*/
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