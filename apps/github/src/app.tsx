import {
    RequiredAction,
    TaskIdAction,
    ThirdPartyApp,
    ThirdPartyAppDeps
} from '@teamyapp/ext';
import {ReactNode} from 'react';
import {LinkGithubAccountActionComponent} from './components/LinkGithubAccountAction.component';

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

    private onShowAppSetting = (): ReactNode => {
        return 'Github App Setting';
    };

    private onShowRequiredActions = async (onActionComplete: () => void): Promise<RequiredAction[]> => {
        const url = `${githubAppWebEndpoint}/teams/${this.deps?.client.getTeamId()}/required-actions/current-user`;
        const response = await this.requestWithIdentity(url);
        if (!response) {
            return [];
        }

        const remoteRequiredActions: RemoteRequiredAction[] = JSON.parse(response!);
        return remoteRequiredActions.map(remoteRequiredAction => {
            switch (remoteRequiredAction.userActionType) {
                case 'LINK_GITHUB_ACCOUNT':
                    return {
                        actionName: 'Link Github Account',
                        view: this.deps &&
                            <LinkGithubAccountActionComponent deps={this.deps} onActionComplete={onActionComplete}/>,
                    };
            }
        });
    };

    private onTaskIdActions = (taskId: number): TaskIdAction[] => {
        return [
            {
                key: 'copy-mention-task',
                view: <>Copy mention task</>,
                execute: (): void => {
                    const teamId = this.deps?.client.getTeamId();
                    if (teamId) {
                        const taskPath = this.deps?.client.getTaskPath(teamId, taskId);
                        const mentionTask = `[(task:${taskId})](${taskPath})`;
                        navigator.clipboard.writeText(mentionTask);
                        this.deps?.client.showDynamicFeedback(
                            `Github Mention for task(${taskId}) is copied to clipboard`,
                        );
                    }
                },
            }
        ];
    };

    private requestWithIdentity = async (
        url: string,
        options?: {
            method: string;
            headers?: Record<string, string>;
            body?: string;
        },
    ) => {
        options = Object.assign(
            {
                headers: {
                    Authorization: `Bearer ${this.deps?.client.getAccessToken()}`,
                },
            },
            options,
        );

        return request(url, options);
    };
}

async function request(
    url: string,
    options?: {
        method: string;
        headers?: Record<string, string>;
        body?: string;
    },
): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        fetch(url, {
            method: options?.method,
            mode: 'cors',
            cache: 'no-cache',
            headers: options?.headers,
            redirect: 'follow',
            body: options?.body,
        })
            .then(async (response) => {
                if (response.status >= 400) {
                    throw new Error(`request failed: status=${response.status}`);
                } else {
                    resolve(await response.text());
                }
            })
            .catch((err) => {
                console.error(err);
                resolve(null);
            });
    });
}