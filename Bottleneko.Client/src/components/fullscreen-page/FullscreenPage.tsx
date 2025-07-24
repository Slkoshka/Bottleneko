import { ReactNode } from 'react';
import { Card } from 'react-bootstrap';
import { splitChildren } from '../../app/utils';
import FullscreenPageTitle from './FullscreenPageTitle';
import FullscreenPageButton from './FullscreenPageButton';

export default function FullscreenPage({ children }: { children?: ReactNode }) {
    const [title, buttons, rest] = splitChildren(children, [FullscreenPageTitle, FullscreenPageButton]);

    return (
        <div className="d-flex vw-100 vh-100 align-items-center justify-content-center">
            <Card className="shadow" style={{ width: '560px' }}>
                {title}

                <Card.Body>
                    <Card.Text as="div">
                        {rest}
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
