import React from 'react';

import {
    ThirdPartyAppDeps
} from '@teamyapp/ext';

import styles from './LinkGithubAccountAction.component.module.scss';

interface Props {
    deps: ThirdPartyAppDeps;
    onActionComplete?: () => void;
}

export function LinkGithubAccountActionComponent(props: Props) {
    const onLinkAccountButtonClick = () => {
        props.deps.client.linkAccount('github');
    };

    return (
        <div className={styles.GithubAppLinkGithubAccountAction}>
            <div className={styles.GithubIcon}>
                <img src={props.deps.client.getResourceUrl('assets/github.svg')}/>
            </div>
            <div className={styles.LinkButton} onClick={onLinkAccountButtonClick}>
                Link Github
            </div>
        </div>
    );
}