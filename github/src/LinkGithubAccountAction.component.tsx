import React, { Component } from 'react';
import { ExtensionRuntime } from '@teamyapp/ext';

import styles from './LinkGithubAccountAction.component.module.scss';
import { Config } from './config';

interface Props {
    config: Config;
    runtime: ExtensionRuntime;
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
                    <img src={this.props.runtime.getAssetUrl('assets/github.svg')}/>
                </div>
                <div className={styles.LinkButton} onClick={this.onLinkAccountButtonClick}>
                    Link Github
                </div>
            </div>
        );
    }

    onLinkAccountButtonClick = () => {
        this.props.runtime.linkAccount('github');
    }
}