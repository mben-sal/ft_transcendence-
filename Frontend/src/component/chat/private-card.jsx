import { Check } from 'lucide-react';
import PropTypes from 'prop-types';

export const PrivateCard = ({ conversations = [], onSelectPrivate}) => {

  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">People</h2>
      <div className="space-y-4">
        {conversations.map((chat) => (
			<div 
			key={chat.id}
			onClick={() => onSelectPrivate(chat)}
			className="flex items-center justify-between pb-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
			>
            <div className="flex items-center gap-4">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                <p className="text-gray-500 text-sm">{chat.messages?.[0]?.content || 'No message'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-gray-400 text-sm">{chat.messages?.[0]?.created_at}</span>
              {chat.isRead && (
                <div className="flex">
                  <Check className="w-4 h-4 text-blue-500" />
                  <Check className="w-4 h-4 text-blue-500 -ml-2" />
                </div>
              )}
              {chat.unreadCount && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


PrivateCard.propTypes = {
	conversations: PropTypes.arrayOf(
	  PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		messages: PropTypes.array,
		unread_count: PropTypes.number
	  })
	),
	onSelectPrivate: PropTypes.func
  };

export default PrivateCard;