import './App.component.module.scss';
import {RequiredAction, TaskIdAction, ThirdPartyApp, ThirdPartyAppClient, ThirdPartyAppEventHub} from '@teamyapp/ext';
import classNames from 'classnames';
import {ChangeEvent, ReactNode, useEffect, useRef, useState} from 'react';
import styles from './App.component.module.scss';
import {EditEventComponent} from './EditEvent.component';
import {Event, OnShowTaskIdActionsEvent} from './event';

const inputValuesKey = 'inputValues';

interface InputValues {
    accessToken?: string;
    teamId?: number;
    requiredActionIndex?: number;
    event?: Event;
}

interface ThirdPartyAppPackage {
    name: string;
    root: string;
    entryPoint: string;
}

const thirdPartyAppPackages: ThirdPartyAppPackage[] = [
    {
        name: 'Github',
        root: 'http://localhost:8082/apps/github/',
        entryPoint: 'app.js',
    },
];

class AppStudioThirdPartyAppClient implements ThirdPartyAppClient {
    constructor(
        private packageRoot: string,
        private getInputValues: () => InputValues,
        private log: (message: string) => void,
        private _showDynamicFeedback: (feedbackView: ReactNode) => void,
    ) {
    }

    getTeamId(): number | undefined {
        return this.getInputValues().teamId;
    }

    getAccessToken(): string | undefined {
        return this.getInputValues().accessToken;
    }

    linkAccount(authProvider: string): void {
        this.log(`linkAccount: ${authProvider}`);
    }

    getResourceUrl(appPacketRelativePath: string): string {
        return `${this.packageRoot}${appPacketRelativePath}`;
    }

    getTaskPath(teamId: number, taskId: number): string {
        return `http://appStudio/${teamId}/tasks/${taskId}`;
    }

    showDynamicFeedback(feedbackView: ReactNode): void {
        this._showDynamicFeedback(feedbackView);
    }
}

export function AppComponent() {
    const [thirdPartyAppEventHubs, setThirdPartyAppEventHubs] = useState<ThirdPartyAppEventHub[]>([]);
    const [selectedAppIndex, setSelectedAppIndex] = useState(0);
    const [requiredActions, setRequiredActions] = useState<RequiredAction[]>();
    const [requiredActionIndex, setRequiredActionIndex] = useState(0);
    const [inputValues, setInputValues] = useState<InputValues>({});
    const [taskIdActions, setTaskIdActions] = useState<TaskIdAction[]>([]);
    const [log, setLog] = useState<string[]>([]);
    const [dynamicFeedbackView, setDynamicFeedbackView] = useState<ReactNode>(null);
    const [showBottomPanel, setShowBottomPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const logMutRef = useRef(log);
    const tmpInputValuesMutRef = useRef<InputValues>({
        accessToken: '',
        teamId: 0,
        requiredActionIndex: 0,
    });
    const outputElMutRef = useRef<HTMLDivElement>(null);

    const renderApp = async (tmpThirdPartyAppEventHubs: ThirdPartyAppEventHub[], appIndex: number) => {
        const requiredActions = await tmpThirdPartyAppEventHubs[appIndex].onShowRequiredActions?.(() => {
            setRequiredActionIndex(requiredActionIndex + 1);
        });
        setRequiredActions(requiredActions);
        setTaskIdActions([]);
        setDynamicFeedbackView(null);
    };

    const loadApps = async () => {
        const tmpThirdPartyAppEventHubs: ThirdPartyAppEventHub[] = [];
        await Promise.all(
            thirdPartyAppPackages.map(
                async (pkg, index) => {
                    let {App} = await import(/* @vite-ignore */`${pkg.root}${pkg.entryPoint}`);
                    const app: ThirdPartyApp = new App();

                    const thirdPartyAppEventHub = new ThirdPartyAppEventHub(index);
                    tmpThirdPartyAppEventHubs.push(thirdPartyAppEventHub);

                    const client: ThirdPartyAppClient =
                        new AppStudioThirdPartyAppClient(
                            pkg.root,
                            () => tmpInputValuesMutRef.current,
                            (message: string) => {
                                logMutRef.current = logMutRef.current.concat(message);
                                setLog(logMutRef.current);
                            },
                            (feedbackView: ReactNode) => {
                                setDynamicFeedbackView(feedbackView);
                                setTimeout(() => {
                                    setDynamicFeedbackView(null);
                                }, 5_000);
                            });
                    app.init({
                        eventListener: thirdPartyAppEventHub,
                        client,
                    });
                    console.log(`[App][${app.name()}] Loaded`);
                    return app;
                },
            ),
        );
        setThirdPartyAppEventHubs(tmpThirdPartyAppEventHubs);
        await renderApp(tmpThirdPartyAppEventHubs, selectedAppIndex);
    };

    useEffect(() => {
        const inputValuesStr = localStorage.getItem(inputValuesKey);
        tmpInputValuesMutRef.current = inputValuesStr ? JSON.parse(inputValuesStr) : {
            accessToken: '',
            teamId: 0,
            requiredActionIndex: 0,
        };
        setInputValues(tmpInputValuesMutRef.current);
        loadApps();
    }, []);

    useEffect(() => {
        outputElMutRef.current?.scrollTo({
            top: outputElMutRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [log]);

    const onReloadAppsClick = async () => {
        await loadApps();
    };

    const onAccessTokenChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        tmpInputValuesMutRef.current = Object.assign({}, tmpInputValuesMutRef.current, {
            accessToken: event.target.value
        });
        setInputValues(tmpInputValuesMutRef.current);
        localStorage.setItem(inputValuesKey, JSON.stringify(tmpInputValuesMutRef.current));
    };

    const onTeamIdChange = (event: ChangeEvent<HTMLInputElement>) => {
        tmpInputValuesMutRef.current = Object.assign({}, tmpInputValuesMutRef.current, {
            teamId: Number(event.target.value)
        });
        setInputValues(tmpInputValuesMutRef.current);
        localStorage.setItem(inputValuesKey, JSON.stringify(tmpInputValuesMutRef.current));
    };

    const onRequiredActionIndexChange = (event: ChangeEvent<HTMLInputElement>) => {
        tmpInputValuesMutRef.current = Object.assign({}, tmpInputValuesMutRef.current, {
            requiredActionIndex: Number(event.target.value)
        });
        setInputValues(tmpInputValuesMutRef.current);
        localStorage.setItem(inputValuesKey, JSON.stringify(tmpInputValuesMutRef.current));
    };

    const triggerOnShowTaskIdActionsEvent = (event: OnShowTaskIdActionsEvent) => {
        const tmpTaskIdActions: TaskIdAction[] = [];
        thirdPartyAppEventHubs.forEach((thirdPartyAppEventHub) => {
            const taskIdActions = thirdPartyAppEventHub.onShowTaskIdActions?.(event.taskId);
            taskIdActions?.forEach(taskIdAction => {
                tmpTaskIdActions.push(taskIdAction);
            });
        });
        setTaskIdActions(tmpTaskIdActions);
    };

    const onTriggerEvent = (event?: Event) => {
        if (!event) {
            return;
        }

        switch (event.type) {
            case 'onShowTaskIdActions':
                triggerOnShowTaskIdActionsEvent(event);
                break;
        }

        logMutRef.current = logMutRef.current.concat(`Triggered event: ${JSON.stringify(event)}`);
        setLog(logMutRef.current);
    };

    const onEventChange = (event: Event | undefined) => {
        tmpInputValuesMutRef.current = Object.assign({}, tmpInputValuesMutRef.current, {
            event,
        });
        setInputValues(tmpInputValuesMutRef.current);
        localStorage.setItem(inputValuesKey, JSON.stringify(tmpInputValuesMutRef.current));
    };

    const onSelectedAppIndexChange = (index: number) => async () => {
        setSelectedAppIndex(index);
        await renderApp(thirdPartyAppEventHubs, index);
    };

    const onTaskIdActionClickHandler = (taskIdAction: TaskIdAction) => () => {
        taskIdAction.execute();
        setTaskIdActions([]);
    };

    const onToggleBottomPanelClick = () => {
        setShowBottomPanel(!showBottomPanel);
    };

    const onToggleRightPanelClick = () => {
        setShowRightPanel(!showRightPanel);
    };

    const renderMaterialIcon = (icon: string, iconStyle: string, extraClassNames?: string) => (
        <i className={`${
            styles[`material-symbols-${iconStyle}`]
        } ${extraClassNames ? extraClassNames : ''}`}>
            {icon}
        </i>
    );

    return (
        <div className={styles.App}>
            <div className={styles.TopBar}>
                <div className={styles.LeftSection}>
                    <div className={styles.Logo}>App Studio</div>
                </div>
                <div className={styles.Tabs}>
                    {thirdPartyAppPackages.map((provider, index) => (
                        <div className={styles.Tab} key={index} onClick={onSelectedAppIndexChange(index)}>
                            {provider.name}
                        </div>
                    ))}
                </div>
                <div className={styles.RightSection}>
                    <div className={styles.Reload} onClick={onReloadAppsClick}>
                        Reload Apps
                    </div>
                </div>
            </div>
            <div className={styles.MainSection}>
                <div className={styles.TabContent}>
                    <div className={`${styles.Section}`}>
                        <div className={styles.Title}>App Setting</div>
                        <div className={`${styles.View} ${styles.AppSetting}`}>
                            {selectedAppIndex < thirdPartyAppEventHubs.length &&
                                thirdPartyAppEventHubs[selectedAppIndex].onShowAppSetting?.()}
                        </div>
                    </div>
                    <div className={`${styles.Section}`}>
                        <div className={styles.Title}>Required Actions</div>
                        <div className={`${styles.View} ${styles.RequiredActions}`}>
                            {requiredActions && requiredActionIndex < requiredActions.length &&
                                requiredActions[requiredActionIndex].view}
                        </div>
                    </div>
                    <div className={`${styles.Section}`}>
                        <div className={styles.Title}>Teamy UI</div>
                        <div className={styles.TeamyViews}>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    TaskId Actions:
                                </div>
                                <div className={`${styles.View} ${styles.TaskIdActions}`}>
                                    {taskIdActions.map((taskIdAction) => (
                                        <div key={taskIdAction.key}
                                             className={styles.TaskIdAction}
                                             onClick={onTaskIdActionClickHandler(taskIdAction)}>
                                            {taskIdAction.view}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Dynamic Feedback:
                                </div>
                                <div className={`${styles.View} ${styles.DynamicFeedback}`}>
                                    {dynamicFeedbackView}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`${styles.RightPanel} ${
                    classNames({
                        [styles.ShowRightPanel]: showRightPanel,
                    })
                }`}>
                    <div className={styles.LeftBar}>
                        <div className={`${styles.Action} ${classNames({
                            [styles.Active]: !showRightPanel
                        })}`}
                             style={{
                                 fontVariationSettings: '"FILL" 1',
                             }}
                             onClick={onToggleRightPanelClick}>
                            {renderMaterialIcon(showRightPanel ? 'collapse_content' : 'expand_content', 'outlined')}
                        </div>
                    </div>
                    <div className={styles.Content}>
                        <div className={styles.Title}>Console</div>
                        <div className={styles.Inputs}>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Access Token:
                                </div>
                                <textarea
                                    className={`${styles.Input} ${styles.AccessToken}`}
                                    value={inputValues.accessToken || ''}
                                    onChange={onAccessTokenChange}/>
                            </div>
                            <div className={styles.SameRow}>
                                <div className={`${styles.Label}`}>
                                    Team ID:
                                </div>
                                <input className={`${styles.Input} ${styles.TeamId}`}
                                       value={inputValues.teamId || '0'}
                                       onChange={onTeamIdChange}/>
                            </div>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Required Action Index:
                                </div>
                                <input className={`${styles.Input} ${styles.RequiredActionIndex}`}
                                       value={inputValues.requiredActionIndex || '0'}
                                       onChange={onRequiredActionIndexChange}/>
                            </div>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Event:
                                </div>
                                <EditEventComponent
                                    event={inputValues.event}
                                    onEventChange={onEventChange}
                                    onTriggerEvent={onTriggerEvent}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${styles.BottomPanel} ${classNames({
                [styles.Show]: showBottomPanel
            })}`}>
                <div className={styles.TopBar}>
                    <div className={styles.LeftSection}>
                        <div className={`${styles.Label}`}>Log</div>
                    </div>
                    <div className={styles.RightSection}>
                        <div className={`${styles.Action} ${classNames({
                            [styles.Active]: !showBottomPanel
                        })}`}
                             style={{
                                 fontVariationSettings: '"FILL" 1',
                             }}
                             onClick={onToggleBottomPanelClick}>
                            {renderMaterialIcon(showBottomPanel ? 'collapse_content' : 'expand_content', 'outlined')}
                        </div>
                    </div>
                </div>
                <div className={styles.Outputs} ref={outputElMutRef}>
                    {log.map((line, index) => (
                        <div key={index} className={styles.Line}>
                            <span className={styles.Number}>{index + 1}</span>
                            <div className={styles.Content}>{line}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
