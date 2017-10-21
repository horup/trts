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
        let vx = this.pos.x - unit.pos.x;
        let vy = this.pos.y - unit.pos.y;
        let l = Math.sqrt(vx*vx + vy*vy);
        unit.pos.x += Math.sign(vx);
        unit.pos.y += Math.sign(vy);
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