import {ThirdPartyAppDeps} from '@teamyapp/ext';
import classNames from 'classnames';
import React, { Fragment, ReactElement, useEffect, useState } from 'react';
import {requestWithIdentity} from '../lib/network';
import { InstallAppOnGithubComponent } from './InstallAppOnGithub.component';
import { TeamGroupSettingComponent } from './TeamGroupsSetting.component';

import styles from './Settings.component.module.scss';

const githubAppWebEndpoint = import.meta.env.VITE_GITHUB_APP_WEB_ENDPOINT;

interface TeamStatus {
    isGithubAppInstalled: boolean;
}

type TabKey = 'InstallGithubApp' | 'TeamGroupSetting'

interface Props {
    deps: ThirdPartyAppDeps;
}

export function SettingsComponent(props: Props): ReactElement {
    const [tabKey, setTabKey] = useState<TabKey>('InstallGithubApp');
    const [isInitialized, setIsInitialized] = useState(false);

    const fetchTeamStatus = async (): Promise<TeamStatus> => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/status`;
        const response = await requestWithIdentity(props.deps.client, url);
        if (!response) {
            return {
                isGithubAppInstalled: false
            };
        }

        return JSON.parse(response);
    }

    useEffect(() => {
        (async () => {
            const teamStatus = await fetchTeamStatus();
            console.log('teamStatus', teamStatus);
            if (teamStatus.isGithubAppInstalled) {
                console.log('TeamGroupSetting');
                setTabKey('TeamGroupSetting');
            } else {
                console.log('InstallGithubApp');
                setTabKey('InstallGithubApp');
            }

            setIsInitialized(true);
        })();
    }, []);

    const renderTab = () => {
        switch (tabKey) {
            case 'InstallGithubApp':
                return <InstallAppOnGithubComponent deps={props.deps} />
            case 'TeamGroupSetting':
                return <TeamGroupSettingComponent deps={props.deps} />
        }
    }
    return isInitialized ? renderTab() : <Fragment/>;
}