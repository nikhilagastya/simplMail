import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Reminder {
  id: string;
  email_id: string;
  email_subject: string;
  email_sender: string;
  summary: string | null;
  action_items: string[];
  remind_at: string;
  priority_level: number;
  is_completed: boolean;
}

interface RemindersListProps {
  reminders: Reminder[];
  onCompleteReminder: (id: string) => void;
  onViewEmail: (emailId: string) => void;
}

export const RemindersList: React.FC<RemindersListProps> = ({ 
  reminders, 
  onCompleteReminder, 
  onViewEmail 
}) => {
  const activeReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'border-red-200 bg-red-50';
    if (priority >= 3) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (priority >= 3) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Clock className="w-4 h-4 text-green-500" />;
  };

  const ReminderCard = ({ reminder, isCompleted = false }: { reminder: Reminder; isCompleted?: boolean }) => (
    <div 
      className={`border rounded-lg p-4 ${
        isCompleted 
          ? 'border-gray-200 bg-gray-50' 
          : getPriorityColor(reminder.priority_level)
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            getPriorityIcon(reminder.priority_level)
          )}
          <span className="text-sm font-medium text-gray-600">
            {format(new Date(reminder.remind_at), 'MMM d, h:mm a')}
          </span>
        </div>
        {!isCompleted && (
          <button
            onClick={() => onCompleteReminder(reminder.id)}
            className="text-sm text-gray-500 hover:text-green-600 transition-colors duration-200"
          >
            Mark Complete
          </button>
        )}
      </div>

      <h3 
        className={`font-medium mb-1 cursor-pointer hover:text-blue-600 transition-colors duration-200 ${
          isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
        }`}
        onClick={() => onViewEmail(reminder.email_id)}
      >
        {reminder.email_subject}
      </h3>

      <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
        From: {reminder.email_sender}
      </p>

      {reminder.summary && (
        <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-400' : 'text-gray-700'}`}>
          {reminder.summary}
        </p>
      )}

      {reminder.action_items.length > 0 && (
        <div>
          <p className={`text-xs font-medium mb-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
            Action Items:
          </p>
          <ul className="space-y-1">
            {reminder.action_items.map((item, index) => (
              <li key={index} className={`text-xs flex items-start gap-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-gray-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 bg-white p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Reminders</h1>
          <p className="text-gray-600">
            {activeReminders.length} active reminders, {completedReminders.length} completed
          </p>
        </div>

        {activeReminders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Active Reminders</h2>
            <div className="space-y-4">
              {activeReminders
                .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
                .map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
            </div>
          </div>
        )}

        {completedReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Completed</h2>
            <div className="space-y-4">
              {completedReminders
                .sort((a, b) => new Date(b.remind_at).getTime() - new Date(a.remind_at).getTime())
                .slice(0, 10) // Show only last 10 completed
                .map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} isCompleted />
                ))}
            </div>
          </div>
        )}

        {activeReminders.length === 0 && completedReminders.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No reminders yet</p>
            <p className="text-sm">Set reminders for important emails to stay organized</p>
          </div>
        )}
      </div>
    </div>
  );
};