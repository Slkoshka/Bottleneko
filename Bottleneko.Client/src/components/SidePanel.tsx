import { LinkContainer } from 'react-router-bootstrap';
import { Button, Dropdown, Nav, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CSSProperties, useEffect, useRef } from 'react';
import ProtocolIcon from '../features/connections/ProtocolIcon';
import ConnectionStatusIcon from '../features/connections/ConnectionStatusIcon';
import { useAuth } from '../features/auth/context';
import { useConnections } from '../features/connections/context';
import { branding } from '../props';
import IconButton from './IconButton';

// Nav links getting stuck active: https://github.com/react-bootstrap/react-router-bootstrap/issues/242

export default function SidePanel({ className = '', style = {}, props }: { className?: string; style?: CSSProperties; props?: object }) {
    const auth = useAuth();
    const connections = useConnections();
    const location = useLocation();
    const navigate = useNavigate();
    const sideBarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        document.querySelector('body')?.classList.remove('sidebar-shown');
        sideBarRef.current?.scrollTo({ top: 0, left: 0 });
    }, [location]);

    return (
        <aside className={`d-flex flex-column p-3 shadow ${className}`} style={{ backgroundColor: '#111', ...style }} ref={sideBarRef} {...props}>
            <Link to="/" className="text-white text-decoration-none branding">
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {
                        branding.formatted.map((element, idx) => (
                            <span key={`part-${idx.toString()}`} className={element.highlighted ? 'branding-highlight' : ''}>{element.text}</span>
                        ))
                    }
                </span>
                <IconButton
                    icon="list"
                    variant="outline-secondary"
                    tooltip={null}
                    className="sidebar-button float-end"
                    style={{ width: '3em', height: '3em' }}
                    onClick={(e) => {
                        document.querySelector('body')?.classList.toggle('sidebar-shown');
                        e.preventDefault();
                    }}
                />
            </Link>

            <hr />

            <Nav variant="pills" className="d-flex flex-column">
                <Nav.Item key="home">
                    <LinkContainer to="/"><Nav.Link active={false} className="text-white fs-5 fw-bold">Dashboard</Nav.Link></LinkContainer>
                </Nav.Item>

                <Nav.Item key="messages">
                    <LinkContainer to="/messages"><Nav.Link active={false} className="text-white fs-5 fw-bold">Messages</Nav.Link></LinkContainer>
                </Nav.Item>

                <Nav.Item key="connections">
                    <LinkContainer to="/connections">
                        <Nav.Link active={location.pathname === '/connections/add'} className="d-flex">
                            <span className="flex-grow-1 text-white fs-5 fw-bold">Connections</span>

                            <Button
                                variant={(location.pathname === '/connections' || location.pathname === '/connections/add') ? 'light' : 'primary'}
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate('/connections/add');
                                }}
                            >
                                +
                            </Button>
                        </Nav.Link>
                    </LinkContainer>
                </Nav.Item>

                <Nav.Item key="scripts">
                    <LinkContainer to="/scripts">
                        <Nav.Link active={location.pathname === '/scripts' || location.pathname.startsWith('/scripts/')} className="d-flex">
                            <span className="flex-grow-1 text-white fs-5 fw-bold">Scripting</span>

                            <Button
                                variant={(location.pathname === '/scripts' || location.pathname.startsWith('/scripts/')) ? 'light' : 'primary'}
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate('/scripts/add');
                                }}
                            >
                                +
                            </Button>
                        </Nav.Link>
                    </LinkContainer>
                </Nav.Item>

                <Nav.Item key="users">
                    <LinkContainer to="/users">
                        <Nav.Link active={location.pathname === '/users' || location.pathname.startsWith('/users/')} className="d-flex">
                            <span className="flex-grow-1 text-white fs-5 fw-bold">Users</span>

                            <Button
                                variant={(location.pathname === '/users' || location.pathname.startsWith('/users/')) ? 'light' : 'primary'}
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate('/users/add');
                                }}
                            >
                                +
                            </Button>
                        </Nav.Link>
                    </LinkContainer>
                </Nav.Item>

                <Nav.Item key="system">
                    <LinkContainer to="/system"><Nav.Link active={false} className="text-white fs-5 fw-bold">System</Nav.Link></LinkContainer>
                </Nav.Item>
            </Nav>

            <Nav variant="pills" className="d-flex mt-auto">
                {
                    !connections?.state.list
                        ? <Spinner animation="border" className="my-4 mx-auto" />
                        : connections.state.list.map(c => (
                                <Nav.Item key={`connection-${c.id}`} className="w-100">
                                    <LinkContainer to={`/connections/${c.id}`}>
                                        <Nav.Link active={false} className="text-white fs-6">
                                            <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
                                                <ProtocolIcon protocol={c.protocol} size="2em" className="flex-shrink-0 mt-0" />
                                                <span className="flex-grow-1 overflow-hidden" style={{ textOverflow: 'ellipsis' }}>{c.name}</span>
                                                <div className="flex-shrink-0"><ConnectionStatusIcon status={c.status} /></div>
                                            </div>
                                        </Nav.Link>
                                    </LinkContainer>
                                </Nav.Item>
                            ))
                }
            </Nav>

            <hr />

            <Dropdown>
                <Dropdown.Toggle as="a" href="#" className="d-flex align-items-center text-white text-decoration-none">
                    <span>
                        Logged in as
                        {' '}
                        <strong>{auth?.state.me?.displayName ?? '?'}</strong>
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu variant="dark" className="shadow">
                    <LinkContainer to={`/users/${auth?.state.me?.id ?? ''}`}><Dropdown.Item>Profile</Dropdown.Item></LinkContainer>
                    <Dropdown.Item onClick={() => { auth?.actions.logout(); }}>Sign out</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </aside>
    );
}
