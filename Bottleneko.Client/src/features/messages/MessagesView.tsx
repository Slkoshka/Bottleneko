import View from '../../components/View';
import MessageHistoryViewer from './MessageHistoryViewer';

export default function MessagesView() {
    return (
        <View title="Messages">
            <MessageHistoryViewer className="view-content" />
        </View>
    );
}
