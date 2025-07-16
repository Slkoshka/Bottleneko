import { ReactNode } from 'react';
import { Card } from 'react-bootstrap';
import FullscreenPageTitle from './FullscreenPageTitle';
import FullscreenPageButton from './FullscreenPageButton';

export default function FullscreenPage({ children }: { children?: ReactNode }) {
    let childList: ReactNode[] = children === undefined ? [] : typeof children === 'object' && typeof (children as Iterable<ReactNode>)[Symbol.iterator] === 'function' ? [...(children as Iterable<ReactNode>)] : [children];
    const title: ReactNode = childList.find(child => typeof child === 'object' && (child as { type: object }).type === FullscreenPageTitle);
    const buttons: ReactNode[] = childList.filter(child => typeof child === 'object' && (child as { type: object }).type === FullscreenPageButton);
    childList = childList.filter(child => child !== title && !buttons.includes(child));

    return (
        <div className="d-flex vw-100 vh-100 align-items-center justify-content-center">
            <Card className="shadow" style={{ width: '560px' }}>
                {title}

                <Card.Body>
                    <Card.Text as="div">
                        {childList}
                    </Card.Text>
                </Card.Body>
                {
                    buttons.length > 0
                        ? (
                                <Card.Footer>
                                    <div className="float-end">
                                        {buttons}
                                    </div>
                                </Card.Footer>
                            )
                        : null
                }
            </Card>
        </div>
    );
}

FullscreenPage.Title = FullscreenPageTitle;
FullscreenPage.Button = FullscreenPageButton;
