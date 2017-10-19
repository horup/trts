export class State
{
    players:Player[] = [];
    units:Unit[] = [];
}

export class Unit
{
    owner:Player;
    pos:{x:number, y:number} = {x:0, y:0};
    health:number = 100;
    radius:number = 8;
    selected = false;
    order:Order = null;
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
        let vx = Math.sign(this.pos.x - unit.pos.x);
        let vy = Math.sign(this.pos.y - unit.pos.y);
        unit.pos.x += vx;
        unit.pos.y += vy;
    }
}

export class Player
{
    color:number = 0xFFFFFF;
}