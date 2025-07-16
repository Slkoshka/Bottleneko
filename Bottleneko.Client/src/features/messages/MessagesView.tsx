import View from '../../components/views/View';
import MessageHistoryViewer from './MessageHistoryViewer';

export default function MessagesView() {
    return (
        <View title="Messages">
            <MessageHistoryViewer className="view-content" />
        </View>
    );
}
