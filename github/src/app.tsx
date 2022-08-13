import { createRoot } from 'react-dom/client';
import React from 'react';
import {
    LinkGithubAccountActionComponent
} from './LinkGithubAccountAction.component';
import {
    Dependencies,
    RequiredAction,
    RequiredActionProps,
    UiExtension
} from '@teamyapp/ext';
import { Config, getConfig } from './config';

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

export class App implements UiExtension {
    private deps?: Dependencies;
    private readonly config: Config;

    constructor() {
        this.config = getConfig();
    }

    public name(): string {
        return 'Github';
    }

    public init(deps: Dependencies): void {
        this.deps = deps;
    }

    public async requiredActions(teamId: number): Promise<RequiredAction[]> {
        const url = `${this.config.githubAppWebEndpoint}/teams/${teamId}/required-actions/current-user`;
        const response = await requestWithIdentity(this.deps!, url);
        if (!response) {
            return [];
        }
        const remoteRequiredActions: RemoteRequiredAction[] = JSON.parse(response!);
        return remoteRequiredActions.map(remoteRequiredAction => {
            switch (remoteRequiredAction.userActionType) {
                case 'LINK_GITHUB_ACCOUNT':
                    return this.linkGithubAccountAction();
            }
        });
    }

    public renderSettingsView(teamId: number, container: Element): void {
    }

    private linkGithubAccountAction(): RequiredAction {
        return {
            name: () => {
                return `Link Github account`;
            },
            renderView: (requiredActionProps: RequiredActionProps) => {
                const root = createRoot(
                    requiredActionProps.container
                );
                root.render(
                    <React.StrictMode>
                        <LinkGithubAccountActionComponent
                            config={this.config}
                            deps={this.deps!}
                            onActionComplete={requiredActionProps.onActionComplete}
                        />
                    </React.StrictMode>);
            }
        };
    }
}

async function requestWithIdentity(
    deps: Dependencies,
    url: string,
    options?: {
        method: string;
        headers?: Record<string, string>;
        body?: string;
    },
) {
    options = Object.assign(
        {
            headers: {
                Authorization: `Bearer ${deps.getAccessToken()}`,
            },
        },
        options,
    );

    return request(url, options);
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