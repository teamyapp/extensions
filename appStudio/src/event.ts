export type EventType = 'onShowTaskIdActions';

export type Event = OnShowTaskIdActionsEvent;

export interface OnShowTaskIdActionsEvent {
    type: 'onShowTaskIdActions';
    taskId: number;
}