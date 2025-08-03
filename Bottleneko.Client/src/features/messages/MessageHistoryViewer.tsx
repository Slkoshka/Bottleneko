import './messages.scss';
import { Button } from 'react-bootstrap';
import dateFormat from 'dateformat';
import { useSubscription } from '../websockets/hooks';
import { ChatMessageLetter } from '../api/dtos.gen';
import api from '../api';
import { TableColumn } from '../../components/table';
import ScrollableTable from '../../components/table/ScrollableTable';
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

    const columns: TableColumn[] = [];
    columns.push({ id: 'timestamp', header: 'Timestamp' });
    if (!connectionId) {
        columns.push({ id: 'connection', header: 'Connection' });
    }
    columns.push({ id: 'chat', header: 'Chat' });
    columns.push({ id: 'author', header: 'Author' });
    columns.push({ id: 'message', header: 'Message' });
    columns.push({ id: 'attachments', header: 'Attachments' });

    const renderRow = (message: ChatMessageLetter) => ({
        id: message.content.id,
        className: `message-history-message ${message.content.isDirect ? 'message-history-direct' : 'message-history-normal'}`,
        columns: {
            timestamp: {
                className: 'message-history-timestamp font-monospace',
                content: dateFormat(new Date(message.content.timestamp), 'yyyy-mm-dd HH:MM:ss'),
            },
            connection: {
                className: 'message-history-connection',
                content: <MessageConnectionDisplay connectionId={message.content.connectionId} />,
            },
            chat: {
                className: 'message-history-chat message-history-clip',
                content: message.content.chat.name,
            },
            author: {
                className: 'message-history-author message-history-clip',
                content: message.content.author.name,
            },
            message: {
                className: `message-history-content ${message.content.textContent ? '' : 'text-secondary'}`,
                content: message.content.textContent ?? '(no text)',
            },
            attachments: {
                className: 'message-history-attachments',
                content: (
                    <div className="d-flex flex-column" style={{ gap: '0.5rem' }}>
                        {
                            message.content.attachments.map(attachment => (
                                <Button key={attachment.id} className="w-100" size="sm" as="a" target="_blank" rel="noreferrer" href={api.connections.getAttachmentUrl(message.content.connectionId, attachment.id)}>
                                    {attachment.name ?? 'no name'}
                                </Button>
                            ))
                        }
                    </div>
                ),
            },
        },
    });

    return (
        <div className="h-100" style={{ padding: '0.5em' }}>
            <ScrollableTable
                columns={columns}
                render={renderRow}
                data={events}
                placeholder={() => <em className="text-secondary fst-italic">(no messages)</em>}
                className={`message-history ${className ?? ''}`}
                title="Message history"
                highlightHeader
            />
        </div>
    );
}
