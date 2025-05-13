import './MessageHistoryViewer.css';
import { Button, Card, Table } from 'react-bootstrap';
import dateFormat from 'dateformat';
import { useSubscription } from '../websockets/hooks';
import { ChatMessageLetter } from '../api/dtos.gen';
import api from '../api';
import LoadingBanner from '../../components/LoadingBanner';
import MessageConnectionDisplay from './MessageConnectionDisplay';

export default function MessageHistoryViewer({ className, connectionId }: { className?: string; connectionId?: string }) {
    const { events } = useSubscription<ChatMessageLetter>({
        subscription: {
            type: 'ChatMessages',
            filter: {
                connectionId: connectionId ?? null,
            },
        },
        maxEvents: 250,
    });

    return (
        <>
            <Card className={className ?? ''} style={{ margin: '0.5em' }}>
                <Card.Body className="d-flex flex-column h-100" style={{ gap: '1em' }}>
                    <div className="flex-grow-1" style={{ overflowY: 'scroll' }}>
                        <Table style={{ minWidth: '50em' }} size="sm" className="message-history-viewer">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    {
                                        !connectionId
                                            ? <th>Connection</th>
                                            : <></>
                                    }
                                    <th>Chat</th>
                                    <th>Author</th>
                                    <th>Message</th>
                                    <th>Attachments</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events && events.length > 0
                                    ? events.map(message => (
                                            <tr key={message.content.id} className={`message-history-message ${message.content.isDirect ? 'message-history-direct' : 'message-history-normal'}`}>
                                                <td className="message-history-timestamp font-monospace">{dateFormat(new Date(message.content.timestamp), 'yyyy-mm-dd HH:MM:ss')}</td>
                                                {
                                                    !connectionId
                                                        ? (
                                                                <td className="message-history-connection">
                                                                    <MessageConnectionDisplay connectionId={message.content.connectionId} />
                                                                </td>
                                                            )
                                                        : <></>
                                                }
                                                <td className="message-history-chat message-history-clip">{message.content.chat.name}</td>
                                                <td className="message-history-author message-history-clip">{message.content.author.name}</td>
                                                <td className={`message-history-content ${message.content.textContent ? '' : 'text-secondary'}`}>{message.content.textContent ?? '(no text)'}</td>
                                                <td className="message-history-attachments">
                                                    <div className="d-flex flex-column" style={{ gap: '0.5rem' }}>
                                                        {
                                                            message.content.attachments.map(attachment => (
                                                                <Button key={attachment.id} className="w-100" size="sm" as="a" target="_blank" rel="noreferrer" href={api.connections.getAttachmentUrl(message.content.connectionId, attachment.id)}>
                                                                    {attachment.name ?? 'no name'}
                                                                </Button>
                                                            ))
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    : (
                                            <tr>
                                                <td colSpan={!connectionId ? 6 : 5} className="text-center">
                                                    {
                                                        events
                                                            ? <em className="text-secondary fst-italic">(no messages)</em>
                                                            : <LoadingBanner />
                                                    }
                                                </td>
                                            </tr>
                                        )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
}
