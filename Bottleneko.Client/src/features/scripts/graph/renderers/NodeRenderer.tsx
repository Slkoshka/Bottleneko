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
            data-testid="node"
        >
            {
                data.isEvent
                    ? (
                            <div
                                className="title"
                                data-testid="title"
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
                    : <div className="title" data-testid="title">{label}</div>
            }

            <div>
                {/* Controls */}
                {
                    controls.map(([key, control]) => (
                        control
                            ? (
                                    <RefControl
                                        key={key}
                                        name="control"
                                        emit={emit}
                                        payload={control}
                                    />
                                )
                            : null
                    ))
                }

                <div className="inputs-outputs">
                    <div className="inputs">
                        {/* Inputs */}
                        {
                            inputs.map(([key, input]) => (
                                input
                                    ? (
                                            <div className="input" key={key} data-testid={`input-${key}`}>
                                                <RefSocket
                                                    name="input-socket"
                                                    emit={emit}
                                                    side="input"
                                                    socketKey={key}
                                                    nodeId={id}
                                                    payload={input.socket}
                                                />
                                                {(!input.control || !input.showControl) && (
                                                    <div className="input-title font-monospace" data-testid="input-title">
                                                        {input.label}
                                                    </div>
                                                )}
                                                {input.control && input.showControl && (
                                                    <span className="input-control">
                                                        <RefControl
                                                            key={key}
                                                            name="input-control"
                                                            emit={emit}
                                                            payload={input.control}
                                                        />
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    : <></>
                            ))
                        }
                    </div>

                    <div className="outputs">
                        {/* Outputs */}
                        {
                            outputs.map(([key, output]) => (
                                output
                                    ? (
                                            <div className="output" key={key} data-testid={`output-${key}`}>
                                                <div className="output-title font-monospace" data-testid="output-title">
                                                    {output.label}
                                                </div>

                                                <RefSocket
                                                    name="output-socket"
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
