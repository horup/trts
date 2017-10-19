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
        let renderer = PIXI.autoDetectRenderer(400, 400, this.canvas); 
        var graphics = new PIXI.Graphics();
        
        graphics.beginFill(0xFFFF00);
        
        // set the line style to have a width of 5 and set the color to red
        graphics.lineStyle(5, 0xFF0000);
        
        // draw a rectangle
        graphics.drawRect(0, 0, 222, 222);
        
        let stage = new PIXI.Container();
        stage.addChild(graphics);

        renderer.render(stage);
    }

    render() {
        return (
            <div>
                <canvas width={400} height={400} ref={(ref)=>this.canvas = ref} />
            </div>
        )
    }
}