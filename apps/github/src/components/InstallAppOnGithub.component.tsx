import { ThirdPartyAppDeps } from '@teamyapp/ext';
import { ReactElement } from 'react';
import styles from './InstallAppOnGithub.component.module.scss';

const githubAppWebEndpoint = import.meta.env.VITE_GITHUB_APP_WEB_ENDPOINT;

interface Props {
    deps: ThirdPartyAppDeps;
}

export const InstallAppOnGithubComponent = (props: Props): ReactElement => {
    const handleInstall = async () => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/install?redirectUrl=${window.location.href}`;
        window.location.href = url;
    }

    return (
        <div className={styles.InstallAppOnGithub}>
            <div className={styles.Title}>Install Teamy on Github</div>
            <div className={styles.Message}>
                Please install Teamy to your Github organization to enable the following features:
                <br/>
                <ol>
                    <li>Automatically create task to pull request</li>
                    <li>Automatically track pull request status in Teamy</li>
                    <li>Link pull request to existing task</li>
                    <li>Automatically coordinate between author and code reviewers</li>
                </ol>
            </div>
            <div>
                <div className={styles.InstallButton} onClick={handleInstall}>
                    Install Teamy on Github
                </div>
            </div>
        </div>
    );
}