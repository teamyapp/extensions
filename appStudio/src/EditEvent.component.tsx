import {ChangeEvent} from 'react';

import styles from './EditEvent.component.module.scss';
import {Event, EventType, OnShowTaskIdActionsEvent} from './event';

interface Props {
    event?: Event;
    onEventChange?: (event?: Event) => void;
    onTriggerEvent?: (event?: Event) => void;
}

export function EditEventComponent(props: Props) {
    const onEventTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const eventType = event.target.value as EventType;
        switch (eventType) {
            case 'onShowTaskIdActions':
                props.onEventChange?.({
                    type: eventType,
                    taskId: 0,
                });
                return;
            default:
                props.onEventChange?.(undefined);
        }
    };

    const onTaskIdChange = (event: ChangeEvent<HTMLInputElement>) => {
        let taskId = 0;
        if (event.target.value) {
            const num = Number(event.target.value);
            if (!isNaN(num)) {
                taskId = num;
            }
        }

        props.onEventChange?.(Object.assign({}, props.event, {
            taskId,
        }));
    };

    const renderEditOnShowTaskIdActionsEvent = () => {
        const event = props.event as OnShowTaskIdActionsEvent;
        return (
            <div className={styles.SameRow}>
                <div className={styles.Label}>TaskId:</div>
                <input
                    className={styles.Input}
                    value={event.taskId}
                    onChange={onTaskIdChange}/>
            </div>
        );
    };

    const renderEditEvent = () => {
        if (!props.event) {
            return null;
        }

        switch (props.event.type) {
            case 'onShowTaskIdActions':
                return renderEditOnShowTaskIdActionsEvent();
        }
    };

    const onTriggerEventClick = () => {
        props.onTriggerEvent?.(props.event);
    };

    return (
        <div className={styles.EditEvent}>
            <select value={props.event?.type} onChange={onEventTypeChange}>
                <option value={''}>Select Event</option>
                <option value={'onShowTaskIdActions'}>OnShowTaskIdActions</option>
            </select>
            {
                props.event && <>
                    <div className={styles.EditEventDetail}>
                        {renderEditEvent()}
                    </div>
                    <div className={`${styles.Button} ${styles.TriggerEvent}`}
                         onClick={onTriggerEventClick}>
                        Trigger
                    </div>
                </>
            }
        </div>
    );
}