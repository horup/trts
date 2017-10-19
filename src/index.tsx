require("bootstrap/dist/css/bootstrap.css");
require('react-datetime/css/react-datetime.css')
require("./style.css");
import { Container } from 'reactstrap';
import { HashRouter } from 'react-router-dom';
import * as React from 'react';
import * as Dom from 'react-dom';
import App from './app';

const Index = () => {
    return (
        <HashRouter>
            <Container fluid={true}>
                <App />
            </Container>
        </HashRouter>)
}

var div = document.createElement("div");
document.body.appendChild(div);
Dom.render(<Index />, div);