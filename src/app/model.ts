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
}

export class Player
{
    color:number = 0xFFFFFF;
}