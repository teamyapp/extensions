import {
    RequiredAction,
    TaskIdAction,
    ThirdPartyApp,
    ThirdPartyAppDeps,
    CleanupFunc, 
    ThirdPartyAppClient
} from '@teamyapp/ext';
import {render, unmountComponentAtNode} from 'react-dom';
import {LinkGithubAccountActionComponent} from './components/LinkGithubAccountAction.component';
import {SettingsComponent} from './components/Settings.component';
import {requestWithIdentity} from './lib/network';

type UserActionType =
    |'LINK_GITHUB_ACCOUNT';

interface RemoteRequiredAction {
    id: number,
    teamID: number,
    actionUserID: number,
    userActionType: UserActionType,
    isCompleted: boolean,
    requestedAt: string,
    requestedByUserID: number
}

const githubAppWebEndpoint = import.meta.env.VITE_GITHUB_APP_WEB_ENDPOINT;

export class App implements ThirdPartyApp {
    private deps?: ThirdPartyAppDeps;

    public name() {
        return 'Github App';
    }

    public init(deps: ThirdPartyAppDeps) {
        this.deps = deps;
        deps.eventListener.listenOnShowRequiredActions(this.onShowRequiredActions);
        deps.eventListener.listenOnShowAppSetting(this.onShowAppSetting);
        deps.eventListener.listenOnShowTaskIdActions(this.onTaskIdActions);
    }

    private onShowAppSetting = (container: HTMLElement): CleanupFunc => {
        if (this.deps) {
            render(<SettingsComponent deps={this.deps}/>, container);
        }

        return () => {
            unmountComponentAtNode(container);
        };
    };

    private onShowRequiredActions = async (onActionComplete: () => void): Promise<RequiredAction[]> => {
        const url = `${githubAppWebEndpoint}/teams/${this.deps!.client.getTeamId()}/required-actions/current-user`;
        const response = await requestWithIdentity(this.deps!.client, url);
        if (!response) {
            return [];
        }

        const remoteRequiredActions: RemoteRequiredAction[] = JSON.parse(response!);
        return remoteRequiredActions.map(remoteRequiredAction => {
            switch (remoteRequiredAction.userActionType) {
                case 'LINK_GITHUB_ACCOUNT':
                    return {
                        actionName: 'Link Github Account',
                        renderView: (container: HTMLElement): CleanupFunc => {
                            if (this.deps) {
                                render(<LinkGithubAccountActionComponent deps={this.deps}
                                                                         onActionComplete={onActionComplete}/>, container);
                            }

                            return () => {
                                unmountComponentAtNode(container);
                            };
                        }
                    };
            }
        });
    };

    private onTaskIdActions = (taskId: number): TaskIdAction[] => {
        return [
            {
                key: 'copy-mention-task',
                renderView: (container: HTMLElement): CleanupFunc => {
                    render(<>Copy mention task</>, container);
                    return () => {
                        unmountComponentAtNode(container);
                    };
                },
                execute: (): void => {
                    const teamId = this.deps?.client.getTeamId();
                    if (teamId) {
                        const taskPath = this.deps?.client.getTaskPath(teamId, taskId);
                        const mentionTask = `[(task:${taskId})](${taskPath})`;
                        navigator.clipboard.writeText(mentionTask);
                        this.deps?.client.showDynamicFeedback((container: HTMLElement): CleanupFunc => {
                                render(<>Github Mention for task({taskId}) is copied to clipboard</>, container);
                                return () => {
                                    unmountComponentAtNode(container);
                                };
                            },
                        );
                    }
                },
            }
        ];
    };
}