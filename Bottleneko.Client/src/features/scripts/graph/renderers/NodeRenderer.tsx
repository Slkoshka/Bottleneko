import { CSSProperties } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ClassicScheme, RenderEmit, Presets } from 'rete-react-plugin';
import Icon from '../../../../components/Icon';

const { RefSocket, RefControl } = Presets.classic;

interface NodeExtraData { width?: number; height?: number; isEvent: boolean }

function sortByIndex(entries: [string, undefined | { index?: number }][]) {
    entries.sort((a, b) => {
        const ai = a[1]?.index ?? 0;
        const bi = b[1]?.index ?? 0;

        return ai - bi;
    });
}

interface Props<Scheme extends ClassicScheme> {
    data: Scheme['Node'] & NodeExtraData;
    styles?: () => CSSProperties;
    emit: RenderEmit<Scheme>;
}

export type NodeComponent<Scheme extends ClassicScheme> = (
    props: Props<Scheme>
) => JSX.Element;

export function NodeRenderer<Scheme extends ClassicScheme>({ data, styles, emit }: Props<Scheme>) {
    const inputs = Object.entries(data.inputs);
    const outputs = Object.entries(data.outputs);
    const controls = Object.entries(data.controls);
    const selected = data.selected ?? false;
    const { id, label, width, height } = data;

    sortByIndex(inputs);
    sortByIndex(outputs);
    sortByIndex(controls);

    return (
        <div
            className={`graph-node ${selected ? 'selected' : ''}`}
            style={{ width: width ? `${width.toString()}px` : undefined, height: height ? `${height.toString()}px` : undefined, ...styles?.() }}
        >
            {
                data.isEvent
                    ? (
                            <div
                                className="graph-node-title"
                                style={{ display: 'grid', gap: '0.3em', gridTemplateColumns: '0fr 1fr' }}
                            >
                                <OverlayTrigger placement="bottom" overlay={(props: object) => <Tooltip {...props}>Event</Tooltip>}>
                                    <div style={{ width: '1em', height: '1em', alignSelf: 'center', marginLeft: '-5px' }}>
                                        <Icon icon="lightning-fill" />
                                    </div>
                                </OverlayTrigger>
                                <div className="flex-grow-1">{label}</div>
                            </div>
                        )
                    : <div className="graph-node-title">{label}</div>
            }

            <div>
                {/* Controls */}
                <div className="graph-node-controls">
                    {
                        controls.map(([key, control]) => (
                            control
                                ? (
                                        <RefControl
                                            key={key}
                                            name="graph-node-control"
                                            emit={emit}
                                            payload={control}
                                        />
                                    )
                                : null
                        ))
                    }
                </div>

                <div className="graph-node-sockets">
                    <div className="graph-node-inputs">
                        {/* Inputs */}
                        {
                            inputs.map(([key, input]) => (
                                input
                                    ? (
                                            <div className="graph-node-input" key={key}>
                                                <RefSocket
                                                    name="graph-node-socket-wrapper"
                                                    emit={emit}
                                                    side="input"
                                                    socketKey={key}
                                                    nodeId={id}
                                                    payload={input.socket}
                                                />
                                                {(!input.control || !input.showControl) && (
                                                    <div className="graph-node-socket-label font-monospace">
                                                        {input.label}
                                                    </div>
                                                )}
                                                {input.control && input.showControl && (
                                                    <RefControl
                                                        key={key}
                                                        name="graph-node-control"
                                                        emit={emit}
                                                        payload={input.control}
                                                    />
                                                )}
                                            </div>
                                        )
                                    : <></>
                            ))
                        }
                    </div>

                    <div className="graph-node-outputs">
                        {/* Outputs */}
                        {
                            outputs.map(([key, output]) => (
                                output
                                    ? (
                                            <div className="graph-node-output" key={key}>
                                                <div className="graph-node-socket-label font-monospace">
                                                    {output.label}
                                                </div>

                                                <RefSocket
                                                    name="graph-node-socket-wrapper"
                                                    side="output"
                                                    emit={emit}
                                                    socketKey={key}
                                                    nodeId={id}
                                                    payload={output.socket}
                                                />
                                            </div>
                                        )
                                    : <></>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
