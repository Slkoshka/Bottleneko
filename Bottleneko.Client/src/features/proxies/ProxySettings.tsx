import { useCallback, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useAsync } from '../../app/hooks';
import { ProxyDto, ProxyType } from '../api/dtos.gen';
import api from '../api';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog';
import { useProxies } from './context';
import ProxyEditor from './ProxyEditor';
import ProxyInfoCard from './ProxyInfoCard';
import { proxyTypeMap } from '.';

export default function ProxySettings() {
    const proxies = useProxies();
    const [editorState, setEditorState] = useState({ shown: false, editing: null as (ProxyDto | null) });
    const [deletingProxy, setDeletingProxy] = useState<ProxyDto | undefined>();

    const [addProxy, isAdding] = useAsync(useCallback(async (proxy: ProxyDto) => {
        proxies?.actions.added((await api.proxies.add(proxy.name, proxy.type, proxy.hostname, proxy.port, proxy.isAuthRequired
            ? {
                    username: proxy.username,
                    password: proxy.type === ProxyType.Socks4 || proxy.type == ProxyType.Socks4a ? undefined : proxy.password,
                }
            : undefined)).proxy);
    }, [proxies]));

    const [saveProxy, isSaving] = useAsync(useCallback(async (proxy: ProxyDto) => {
        proxies?.actions.updated((await api.proxies.update(proxy.id, {
            name: proxy.name,
            type: proxy.type,
            hostname: proxy.hostname,
            port: proxy.port,
            auth: proxy.isAuthRequired
                ? {
                        username: proxy.username,
                        password: proxy.type === ProxyType.Socks4 || proxy.type == ProxyType.Socks4a ? undefined : proxy.password,
                    }
                : undefined,
        })).proxy);
    }, [proxies]));

    const [deleteProxy, isDeleting] = useAsync(useCallback(async () => {
        if (!deletingProxy) {
            return;
        }

        try {
            await api.proxies.delete(deletingProxy.id);
            proxies?.actions.deleted(deletingProxy.id);
        }
        finally {
            setDeletingProxy(undefined);
        }
    }, [deletingProxy, proxies]));

    const getProxyInfo = (proxy: ProxyDto) => {
        return {
            id: {
                name: 'ID',
                value: proxy.id,
            },
            name: {
                name: 'Name',
                value: proxy.name,
            },
            type: {
                name: 'Type',
                value: proxyTypeMap[proxy.type].name,
            },
            address: {
                name: 'Address',
                value: `${proxy.hostname}:${proxy.port.toString()}`,
            },
        };
    };

    const isLoading = isAdding || isSaving || isDeleting;

    return (
        <>
            <DeleteConfirmationDialog
                item={deletingProxy}
                itemTypeName="proxy"
                onDelete={() => { void deleteProxy(); }}
                onCancel={() => { setDeletingProxy(undefined); }}
                itemInfoBuilder={getProxyInfo}
            />

            <ProxyEditor
                show={editorState.shown}
                proxy={editorState.editing}
                onSuccess={(proxy) => {
                    if (editorState.editing) {
                        void saveProxy(proxy);
                    }
                    else {
                        void addProxy(proxy);
                    }
                    setEditorState({ shown: false, editing: proxy });
                }}
                onCancel={() => { setEditorState({ shown: false, editing: editorState.editing }); }}
            />

            <h2 className="pb-3">Proxy servers</h2>
            <div className="d-flex flex-column" style={{ gap: '10px', width: 'calc(min(100%, 600px))', maxWidth: '600px' }}>
                <Button
                    onClick={() => {
                        setEditorState({ shown: true, editing: null });
                    }}
                    disabled={isLoading}
                    size="lg"
                >
                    Add Proxy
                </Button>

                {
                    proxies?.state.list?.map(proxy => (
                        <ProxyInfoCard
                            key={proxy.id}
                            proxy={proxy}
                            onEdit={() => { setEditorState({ shown: true, editing: proxy }); }}
                            onDelete={() => { setDeletingProxy(proxy); }}
                        />
                    ))
                }
            </div>
        </>
    );
}
