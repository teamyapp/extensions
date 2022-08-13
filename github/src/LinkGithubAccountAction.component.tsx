import React, { Component } from 'react';
import { Dependencies } from '@teamyapp/ext';

import styles from './LinkGithubAccountAction.component.module.scss';

import github from './github.svg';
import { Config } from './config';

const redirectUrlParam = 'redirectUrl';

interface Props {
    config: Config;
    deps: Dependencies;
    onActionComplete?: () => void;
}

interface State {
}

export class LinkGithubAccountActionComponent extends Component<Props, State> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <div className={styles.GithubPluginLinkGithubAccountAction}>
                <div className={styles.GithubIcon}>
                    <img src={github}/>
                </div>
                <div className={styles.LinkButton} onClick={this.onLinkAccountButtonClick}>
                    Link Github
                </div>
            </div>
        );
    }

    onLinkAccountButtonClick = () => {
        const signInApi = new URL(
            `${this.props.config.teamyCloudWebAPIEndpoint}/identity/sign-in/oauth/github`,
        );
        signInApi.searchParams.set(redirectUrlParam, this.props.config.teamyCloudSignInFinishUrl);
        window.location.replace(signInApi.toString());
    }
}