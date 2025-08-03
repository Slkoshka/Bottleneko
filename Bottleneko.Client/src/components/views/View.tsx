import './view.scss';
import ViewBase, { ViewBaseProps } from './ViewBase';

export default function View(props: ViewBaseProps) {
    return (
        <ViewBase {...props} className={`view ${props.className ?? ''}`}>
            <div className="content">{props.children}</div>
        </ViewBase>
    );
}
