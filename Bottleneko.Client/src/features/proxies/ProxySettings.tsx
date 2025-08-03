import './proxy.scss';
import { useCallback, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { ProxyDto } from '../api/dtos.gen';
import { TableRow } from '../../components/table';
import ScrollableTable from '../../components/table/ScrollableTable';
import IconButton from '../../components/IconButton';
import { HamburgerMenu } from '../../components/HamburgerMenu';
import InlineIcon from '../../components/InlineIcon';
import { useEntityDeletion } from '../../app/hooks';
import { ProxyEntityConfig, useProxies } from './context';
import ProxyEditor from './ProxyEditor';
import { ProxyState } from './ProxiesProvider';
import { proxyTypeMap } from '.';

export default function ProxySettings() {
    const proxies = useProxies();
    const [editorState, setEditorState] = useState({ shown: false, editing: null as (ProxyDto | null) });
    const { deleteEntity, dialog } = useEntityDeletion<ProxyEntityConfig>(proxies);

    const columns = [
        { id: 'name', header: 'Proxy Name' },
        { id: 'type', header: 'Type', style: { width: '5em' } },
        { id: 'address', header: 'Address', style: { width: '15em' } },
        { id: 'actions', header: '', style: { width: '5em' } },
    ];

    const renderRow = useCallback((proxy: ProxyState): TableRow => ({
        id: proxy.data.id,
        className: 'proxy-list-row',
        onClick: () => { setEditorState({ shown: true, editing: proxy.data }); },
        columns: {
            name: {
                content: proxy.data.name,
                className: 'text-collapse',
                style: { verticalAlign: 'middle' },
            },
            type: {
                content: proxyTypeMap[proxy.data.type].name,
                style: { verticalAlign: 'middle' },
            },
            address: {
                content: `${proxy.data.hostname}:${proxy.data.port.toString()}`,
                className: 'font-monospace text-collapse',
                style: { verticalAlign: 'middle' },
            },
            actions: {
                content: (
                    <div className="w-100 d-flex justify-content-end gap-2">
                        <Dropdown>
                            <Dropdown.Toggle as={HamburgerMenu} />
                            <Dropdown.Menu>
                                <Dropdown.Item as="button" onClick={() => { setEditorState({ shown: true, editing: proxy.data }); }}>
                                    <InlineIcon icon="gear-fill" style={{ marginRight: '0.5em' }} />
                                    Edit
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item as="button" onClick={() => { deleteEntity(proxy); }}>
                                    <InlineIcon icon="trash3-fill" style={{ marginRight: '0.5em' }} />
                                    Delete
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                ),
                onClick: (e) => { e.stopPropagation(); },
            },
        },
    }), [deleteEntity]);

    return (
        <>
            {dialog}

            <ProxyEditor
                show={editorState.shown}
                proxy={editorState.editing}
                onSuccess={(proxy) => {
                    if (editorState.editing) {
                        void proxies?.state.list?.find(p => p.data.id === proxy.id)?.update(proxy);
                    }
                    else {
                        void proxies?.actions.add(proxy);
                    }
                    setEditorState({ shown: false, editing: proxy });
                }}
                onCancel={() => { setEditorState({ shown: false, editing: editorState.editing }); }}
            />

            <div className="proxy-list" style={{ height: '500px' }}>
                <ScrollableTable
                    columns={columns}
                    render={renderRow}
                    data={proxies?.state.list}
                    style={{ minWidth: '500px' }}
                    placeholder={() => <em className="text-secondary fst-italic">(no proxies)</em>}
                    title="Proxy servers"
                    highlightHeader
                >
                    <ScrollableTable.HeaderExtra position="end">
                        <IconButton icon="plus-lg" tooltip="Add proxy server" variant="dark" onClick={() => { setEditorState({ shown: true, editing: null }); }} />
                    </ScrollableTable.HeaderExtra>
                </ScrollableTable>
            </div>
        </>
    );
}
