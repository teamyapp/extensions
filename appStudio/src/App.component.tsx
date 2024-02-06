import './App.component.module.scss';
import {
    CleanupFunc,
    RenderFunc,
    RequiredAction,
    TaskIdAction,
    ThirdPartyApp,
    ThirdPartyAppClient,
    ThirdPartyAppEventHub
} from '@teamyapp/ext';
import classNames from 'classnames';
import {ChangeEvent, createRef, RefObject, useEffect, useRef, useState} from 'react';
import styles from './App.component.module.scss';
import {EditEventComponent} from './EditEvent.component';
import {Event, OnShowTaskIdActionsEvent} from './event';

const persistedStateKey = 'persistedState';

interface PersistedState {
    accessToken: string;
    teamId?: number;
    requiredActionIndex?: number;
    event?: Event;
    showBottomPanel?: boolean;
    showRightPanel?: boolean;
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
        private getPersistedState: () => PersistedState,
        private log: (message: string) => void,
        private _showDynamicFeedback: (renderFunc: RenderFunc) => void,
    ) {
    }

    getTeamId(): number | undefined {
        return this.getPersistedState().teamId;
    }

    getAccessToken(): string | undefined {
        return this.getPersistedState().accessToken;
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

    showDynamicFeedback(renderFunc: RenderFunc): void {
        this._showDynamicFeedback(renderFunc);
    }
}

export function AppComponent() {
    const persistedStateStr = localStorage.getItem(persistedStateKey);
    const defaultPersistedState = persistedStateStr ? JSON.parse(persistedStateStr) : {
        accessToken: '',
    };

    const [thirdPartyAppEventHubs, setThirdPartyAppEventHubs] = useState<ThirdPartyAppEventHub[]>([]);
    const [selectedAppIndex, setSelectedAppIndex] = useState(0);
    const [requiredActions, setRequiredActions] = useState<RequiredAction[]>();
    const [persistedState, setPersistedState] = useState<PersistedState>(defaultPersistedState);
    const [taskIdActions, setTaskIdActions] = useState<TaskIdAction[]>([]);
    const [log, setLog] = useState<string[]>([]);
    const logMutRef = useRef(log);
    const persistedStateMutRef = useRef<PersistedState>(defaultPersistedState);
    const outputElMutRef = useRef<HTMLDivElement>(null);
    const appSettingsElMutRef = useRef<HTMLDivElement>(null);
    const requiredActionElMutRef = useRef<HTMLDivElement>(null);
    const dynamicFeedbackElRef = useRef<HTMLDivElement>(null);
    let taskIdActionElRefs: Record<string, RefObject<HTMLDivElement>> = {};

    const renderApp = async (tmpThirdPartyAppEventHubs: ThirdPartyAppEventHub[], appIndex: number) => {
        const requiredActions = await tmpThirdPartyAppEventHubs[appIndex].onShowRequiredActions?.(() => {
            persistedStateMutRef.current.requiredActionIndex = (persistedStateMutRef.current.requiredActionIndex || 0) + 1;
            updatePersistedState();
        });
        setRequiredActions(requiredActions);
        setTaskIdActions([]);

        if (dynamicFeedbackElRef.current) {
            dynamicFeedbackElRef.current.innerHTML = '';
        }
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
                            () => persistedStateMutRef.current,
                            (message: string) => {
                                logMutRef.current = logMutRef.current.concat(message);
                                setLog(logMutRef.current);
                            },
                            (renderFunc: RenderFunc) => {
                                if (dynamicFeedbackElRef.current) {
                                    const cleanupFunc = renderFunc(dynamicFeedbackElRef.current);
                                    setTimeout(() => {
                                        cleanupFunc();
                                    }, 5000);
                                }
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
        loadApps();
    }, []);

    useEffect(() => {
        outputElMutRef.current?.scrollTo({
            top: outputElMutRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [log]);

    useEffect(() => {
        if (selectedAppIndex < thirdPartyAppEventHubs.length && appSettingsElMutRef.current) {
            const thirdPartyAppEventHub = thirdPartyAppEventHubs[selectedAppIndex];
            return thirdPartyAppEventHub.onShowAppSetting?.(appSettingsElMutRef.current);
        }

    }, [thirdPartyAppEventHubs, selectedAppIndex, appSettingsElMutRef.current]);

    useEffect(() => {
        if (requiredActions && requiredActionElMutRef.current) {
            if (persistedState.requiredActionIndex == undefined || persistedState.requiredActionIndex >= requiredActions.length) {
                return;
            }

            const requiredAction = requiredActions[persistedState.requiredActionIndex];
            return requiredAction.renderView(requiredActionElMutRef.current);
        }
    }, [requiredActions, persistedState.requiredActionIndex, requiredActionElMutRef.current]);

    useEffect(() => {
        const cleanupFuncs: CleanupFunc[] = [];
        taskIdActions.forEach((taskIdAction) => {
            const key = `${thirdPartyAppEventHubs[selectedAppIndex].appId}/${taskIdAction.key}`;
            const curr = taskIdActionElRefs[key].current;
            if (curr) {
                cleanupFuncs.push(taskIdAction.renderView(curr));
            }
        });
        return () => {
            cleanupFuncs.forEach(cleanupFunc => cleanupFunc());
            taskIdActionElRefs = {};
        };
    }, [taskIdActions]);

    const onReloadAppsClick = async () => {
        await loadApps();
    };

    const onAccessTokenChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        persistedStateMutRef.current.accessToken = event.target.value;
        updatePersistedState();
    };

    const onTeamIdChange = (event: ChangeEvent<HTMLInputElement>) => {
        persistedStateMutRef.current.teamId = undefined;
        if (event.target.value.length > 0) {
            const num = Number(event.target.value);
            if (!isNaN(num)) {
                persistedStateMutRef.current.teamId = num;
            }
        }

        updatePersistedState();
        renderApp(thirdPartyAppEventHubs, selectedAppIndex);
    };

    const onRequiredActionIndexChange = (event: ChangeEvent<HTMLInputElement>) => {
        persistedStateMutRef.current.requiredActionIndex = undefined;
        if (event.target.value.length > 0) {
            const num = Number(event.target.value);
            if (!isNaN(num)) {
                persistedStateMutRef.current.requiredActionIndex = num;
            }
        }
        updatePersistedState();
    };

    const triggerOnShowTaskIdActionsEvent = (event: OnShowTaskIdActionsEvent) => {
        const tmpTaskIdActions: TaskIdAction[] = [];
        thirdPartyAppEventHubs.forEach((thirdPartyAppEventHub) => {
            const taskIdActions = thirdPartyAppEventHub.onShowTaskIdActions?.(event.taskId);
            taskIdActions?.forEach((taskIdAction: TaskIdAction) => {
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
        persistedStateMutRef.current.event = event;
        updatePersistedState();
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
        persistedStateMutRef.current.showBottomPanel = !persistedState.showBottomPanel;
        updatePersistedState();
    };

    const onToggleRightPanelClick = () => {
        persistedStateMutRef.current.showRightPanel = !persistedState.showRightPanel;
        updatePersistedState();
    };

    const updatePersistedState = () => {
        setPersistedState(Object.assign({}, persistedStateMutRef.current));
        localStorage.setItem(persistedStateKey, JSON.stringify(persistedStateMutRef.current));
    };

    const renderMaterialIcon = (icon: string, iconStyle: string, extraClassNames?: string) => (
        <i className={`${
            styles[`material-symbols-${iconStyle}`]
        } ${extraClassNames ? extraClassNames : ''}`}>
            {icon}
        </i>
    );

    const getTaskIdActionRef = (key: string): RefObject<HTMLDivElement> => {
        if (!taskIdActionElRefs[key]) {
            taskIdActionElRefs[key] = createRef();
        }

        return taskIdActionElRefs[key];
    };

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
                        <div className={`${styles.View} ${styles.AppSetting}`}
                             ref={appSettingsElMutRef}/>
                    </div>
                    <div className={`${styles.Section}`}>
                        <div className={styles.Title}>Required Actions</div>
                        <div className={`${styles.View} ${styles.RequiredActions}`}
                             ref={requiredActionElMutRef}/>
                    </div>
                    <div className={`${styles.Section}`}>
                        <div className={styles.Title}>Teamy UI</div>
                        <div className={styles.TeamyViews}>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    TaskId Actions:
                                </div>
                                <div className={`${styles.View} ${styles.TaskIdActions}`}>
                                    {
                                        taskIdActions.map((taskIdAction) => {
                                            const key = `${thirdPartyAppEventHubs[selectedAppIndex].appId}/${taskIdAction.key}`;
                                            return (
                                                <div key={key}
                                                     ref={getTaskIdActionRef(key)}
                                                     className={styles.TaskIdAction}
                                                     onClick={onTaskIdActionClickHandler(taskIdAction)}>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Dynamic Feedback:
                                </div>
                                <div className={`${styles.View} ${styles.DynamicFeedback}`}
                                     ref={dynamicFeedbackElRef}>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`${styles.RightPanel} ${
                    classNames({
                        [styles.Show]: persistedState.showRightPanel,
                    })
                }`}>
                    <div className={styles.LeftBar}>
                        <div className={`${styles.Action} ${classNames({
                            [styles.Active]: !persistedState.showRightPanel
                        })}`}
                             style={{
                                 fontVariationSettings: '"FILL" 1',
                             }}
                             onClick={onToggleRightPanelClick}>
                            {renderMaterialIcon(persistedState.showRightPanel ? 'collapse_content' : 'expand_content', 'outlined')}
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
                                    value={persistedState.accessToken || ''}
                                    onChange={onAccessTokenChange}/>
                            </div>
                            <div className={styles.SameRow}>
                                <div className={`${styles.Label}`}>
                                    Team ID:
                                </div>
                                <input className={`${styles.Input} ${styles.TeamId}`}
                                       value={persistedState.teamId === undefined ? '' : persistedState.teamId}
                                       onChange={onTeamIdChange}/>
                            </div>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Required Action Index:
                                </div>
                                <input className={`${styles.Input} ${styles.RequiredActionIndex}`}
                                       value={persistedState.requiredActionIndex === undefined ? '' : persistedState.requiredActionIndex}
                                       onChange={onRequiredActionIndexChange}/>
                            </div>
                            <div className={styles.NextRow}>
                                <div className={`${styles.Label}`}>
                                    Event:
                                </div>
                                <EditEventComponent
                                    event={persistedState.event}
                                    onEventChange={onEventChange}
                                    onTriggerEvent={onTriggerEvent}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${styles.BottomPanel} ${classNames({
                [styles.Show]: persistedState.showBottomPanel
            })}`}>
                <div className={styles.TopBar}>
                    <div className={styles.LeftSection}>
                        <div className={`${styles.Label}`}>Log</div>
                    </div>
                    <div className={styles.RightSection}>
                        <div className={`${styles.Action} ${classNames({
                            [styles.Active]: !persistedState.showBottomPanel
                        })}`}
                             style={{
                                 fontVariationSettings: '"FILL" 1',
                             }}
                             onClick={onToggleBottomPanelClick}>
                            {renderMaterialIcon(persistedState.showBottomPanel ? 'collapse_content' : 'expand_content', 'outlined')}
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
