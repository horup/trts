import * as React from 'react';
import { HashRouter, Route, Link } from 'react-router-dom';
import { Nav, Navbar, NavItem, NavLink} from 'reactstrap';
export default class Header extends React.Component<any, any>
{
    render()
    {
        return (
            <Nav>
                <NavItem>
                    <NavLink href="#/">Home</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink href="#/forms">Forms</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink href="#/charts">Charts</NavLink>
                </NavItem>
            </Nav>
        )
    }
}