import * as React from 'react';
import { Container, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { DatetimePicker } from '../extensions';
import { HashRouter, Route, Link } from 'react-router-dom';
import * as PIXI from 'pixi.js';

export default class App extends React.Component<any, any>
{
    canvas:HTMLCanvasElement;
    app:PIXI.Application;
    constructor(props:any)
    {
        super();
    }

    componentDidMount()
    {
        //this.app = new PIXI.Application(_;
        let renderer = PIXI.autoDetectRenderer(800, 600, {view: this.canvas, antialias:false}); 
        let graphics = new PIXI.Graphics();
        
        graphics.beginFill(0xFF3300);
        graphics.lineStyle(4, 0xffd900, 1);
        graphics.moveTo(50,50);
        graphics.lineTo(250, 50);
        graphics.lineTo(100, 100);
        graphics.lineTo(50, 50);
        graphics.endFill();
        
        let stage = new PIXI.Container();
        stage.addChild(graphics);

        let f = () =>
        {
            renderer.render(stage);
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