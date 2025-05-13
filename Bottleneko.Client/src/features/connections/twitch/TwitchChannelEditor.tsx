import { useRef } from 'react';
import { Formik } from 'formik';
import { Card, Form } from 'react-bootstrap';
import ModalDialog from '../../../components/ModalDialog';
import { TwitchProtocolChannel } from '../../api/dtos.gen';
import { topicsInfo } from './topics';
import { TwitchProtocolChannelSchema } from '.';

export default function TwitchChannelEditor({ show, isMine, channel, onSuccess, onCancel }: { show: boolean; isMine: boolean; channel?: TwitchProtocolChannel; onSuccess: (auth: TwitchProtocolChannel) => void; onCancel: () => void }) {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <ModalDialog
            header="Twitch Channel"
            show={show}
            buttons={[
                { key: 'cancel', text: 'Cancel', onClick: onCancel, props: { variant: 'secondary' } },
                { key: 'save', text: 'Save', onClick: () => { formRef.current?.requestSubmit(); } },
            ]}
            onCancel={onCancel}
        >
            <Formik validationSchema={TwitchProtocolChannelSchema} onSubmit={(channel) => { onSuccess(channel); }} initialValues={channel ?? TwitchProtocolChannelSchema.getDefault()} validateOnChange={false}>
                {({ handleSubmit, handleChange, values, setFieldValue, errors }) => (
                    <Form
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSubmit();
                        }}
                        className="d-flex flex-column p-2"
                        style={{ gap: '1rem' }}
                        ref={formRef}
                    >
                        <Form.Group>
                            <Form.Label>Channel name</Form.Label>
                            <Form.Control name="name" value={values.name} onChange={handleChange} isInvalid={!!errors.name} readOnly={isMine} autoComplete="off" />
                            <Form.Text muted>
                                Twitch channel name. Should be the channel&apos;s non-localized name (i.e., the one displayed using the English alphabet). You can read more about localized display names
                                {' '}
                                <a href="https://help.twitch.tv/s/article/display-names-on-twitch?language=en_US#localized" target="_blank" rel="noreferrer">here</a>
                                .
                            </Form.Text>
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Card>
                            <Card.Header>Event subscriptions</Card.Header>
                            <Card.Body>
                                {
                                    [...topicsInfo.entries()].filter(([, v]) => v.target !== 'self' || isMine).map(([k, v]) => (
                                        <Form.Group key={`topic-${k}`} className="mb-1">
                                            <Form.Switch
                                                className="mb-0"
                                                label={v.name}
                                                checked={values.eventSubscriptions.includes(k)}
                                                onChange={() => {
                                                    const index = values.eventSubscriptions.indexOf(k);
                                                    const subs = [...values.eventSubscriptions];
                                                    if (index >= 0) {
                                                        subs.splice(index, 1);
                                                    }
                                                    else {
                                                        subs.push(k);
                                                    }
                                                    void setFieldValue('eventSubscriptions', subs);
                                                }}
                                            />
                                            <Form.Text muted>
                                                <span dangerouslySetInnerHTML={{ __html: v.description }} />
                                                {' '}
                                                <a href={v.infoUrl} target="_blank" rel="noreferrer">Docs</a>
                                                .
                                                {
                                                    !isMine && v.cost > 0
                                                        ? (
                                                                <strong>
                                                                    {' '}
                                                                    Cost:
                                                                    {' '}
                                                                    {v.cost}
                                                                </strong>
                                                            )
                                                        : <></>
                                                }
                                            </Form.Text>
                                        </Form.Group>
                                    ))
                                }
                            </Card.Body>
                        </Card>
                    </Form>
                )}
            </Formik>
        </ModalDialog>
    );
}
