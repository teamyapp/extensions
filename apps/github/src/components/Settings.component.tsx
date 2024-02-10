import {ThirdPartyAppDeps} from '@teamyapp/ext';
import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {requestWithIdentity} from '../lib/network';
import styles from './Settings.component.module.scss';

const githubAppWebEndpoint = import.meta.env.VITE_GITHUB_APP_WEB_ENDPOINT;

interface Member {
    userId: number;
    firstName: string;
    lastName: string;
    profileUrl?: string;
    hasGithubAccount: boolean;
}

interface MemberGroup {
    id: number;
    name: string;
    memberUserIds: number[];
}

type UserActionType = 'LINK_GITHUB_ACCOUNT';

interface RequiredAction {
    id: number;
    teamID: number;
    actionUserID: number;
    userActionType: UserActionType;
    isCompleted: boolean;
    requestedAt: string;
    requestedByUserID: number;
}

interface Props {
    deps: ThirdPartyAppDeps;
}

export function SettingsComponent(props: Props) {
    const [members, setMembers] = useState<Member[]>([]);
    const [memberGroups, setMemberGroups] = useState<MemberGroup[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Record<number, boolean>>({});
    const [requireGithub, setRequireGithub] = useState<Record<number, boolean>>({});

    const onMemberClickHandler = (userId: number) => () => {
        setSelectedMemberIds(
            Object.assign({}, selectedMemberIds, {
                [userId]: !selectedMemberIds[userId]
            }));
    };

    const onToggleSelectGroupHandler = (memberUserIds: number[], selectedGroup: boolean) => () => {
        const newSelectedMemberIds = {...selectedMemberIds};
        memberUserIds.forEach(userId => {
            newSelectedMemberIds[userId] = !selectedGroup;
        });
        setSelectedMemberIds(newSelectedMemberIds);
    };

    const onRequireGithubClick = async () => {
        const userIds = Object.keys(selectedMemberIds)
            .map(userId => Number(userId))
            .filter(userId => selectedMemberIds[userId]);
        await createRequiredActionForUsers(userIds, 'LINK_GITHUB_ACCOUNT');
        const newRequireGithub = {...requireGithub};
        for (const userId of userIds) {
            if (selectedMemberIds[userId]) {
                newRequireGithub[userId] = true;
            }
        }

        setRequireGithub(newRequireGithub);
        setSelectedMemberIds({});
    };

    const onCancelRequireGithubClick = async () => {
        const userIds = Object.keys(selectedMemberIds)
            .map(userId => Number(userId))
            .filter(userId => selectedMemberIds[userId]);
        await deleteRequiredActionForUsers(userIds, 'LINK_GITHUB_ACCOUNT');
        const newRequireGithub = {...requireGithub};
        for (const userId in selectedMemberIds) {
            if (selectedMemberIds[userId]) {
                newRequireGithub[userId] = false;
            }
        }

        setRequireGithub(newRequireGithub);
        setSelectedMemberIds({});
    };

    const fetchMembers = async (): Promise<Member[]> => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/members`;
        const response = await requestWithIdentity(props.deps.client, url);
        if (!response) {
            return [];
        }

        return JSON.parse(response);
    };

    const fetchMemberGroups = async (): Promise<MemberGroup[]> => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/member-groups`;
        const response = await requestWithIdentity(props.deps.client, url);
        if (!response) {
            return [];
        }

        return JSON.parse(response);
    };

    const fetchRequiredActions = async (userId: number): Promise<Record<UserActionType, RequiredAction> | undefined> => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/required-actions/users/${userId}`;
        const response = await requestWithIdentity(props.deps.client, url);
        if (!response) {
            return;
        }

        return JSON.parse(response);
    };

    const createRequiredActionForUsers = async (userIds: number[], userActionType: UserActionType) => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/required-actions/create`;
        const response = await requestWithIdentity(props.deps.client, url, {
            method: 'POST',
            body: JSON.stringify({
                userActionType,
                actionUserIds: userIds,
            })
        });
        if (!response) {
            return {};
        }

        return JSON.parse(response);
    };

    const deleteRequiredActionForUsers = async (userIds: number[], userActionType: UserActionType) => {
        const url = `${githubAppWebEndpoint}/teams/${props.deps.client.getTeamId()}/required-actions/delete`;
        const response = await requestWithIdentity(props.deps.client, url, {
            method: 'POST',
            body: JSON.stringify({
                userActionType,
                actionUserIds: userIds,
            })
        });
        if (!response) {
            return {};
        }

        return JSON.parse(response);
    };

    useEffect(() => {
        (async () => {
            const remoteMembers = await fetchMembers();
            setMembers(remoteMembers);

            const remoteMemberGroups = await fetchMemberGroups();
            setMemberGroups(remoteMemberGroups);

            const allRequiredActions = await Promise.all(remoteMembers.map(member =>
                fetchRequiredActions(member.userId))
            );

            const defaultRequireGithub: Record<number, boolean> = {};
            for (let currRequiredActions of allRequiredActions) {
                if (!currRequiredActions) {
                    continue;
                }

                for (const userActionType in currRequiredActions) {
                    if (userActionType === 'LINK_GITHUB_ACCOUNT') {
                        defaultRequireGithub[currRequiredActions[userActionType].actionUserID] = true;
                    }
                }

            }

            setRequireGithub(defaultRequireGithub);
        })();
    }, []);

    const renderMemberGroup = (groupName: string, memberUserIds: number[], key?: any) => {
        const selectedMemberCount = memberUserIds.reduce((selected: number, userId: number) =>
                selectedMemberIds[userId] ? selected + 1 : selected
            , 0);
        const selectedGroup = memberUserIds.length === selectedMemberCount;
        const renderMemberGroupContent = () => {
            return (
                <>
                    <div className={styles.TopBar}>
                        <div className={styles.SelectGroup}>
                            <input type={'checkbox'}
                                   checked={selectedGroup}
                                   onClick={onToggleSelectGroupHandler(memberUserIds, selectedGroup)}
                            />
                        </div>
                        <div className={styles.Name}>{groupName}</div>
                        <div className={styles.Selected}>
                            {selectedMemberCount} of {memberUserIds.length} selected
                        </div>
                    </div>
                    <div className={styles.Members}>
                        {
                            memberUserIds.map(userId => {
                                const member = members.find(member => member.userId === userId)!;
                                return (
                                    <div key={userId} className={`${styles.Member} ${classNames({
                                        [styles.Selected]: selectedMemberIds[userId]
                                    })}`}
                                         onClick={onMemberClickHandler(userId)}>
                                        <div className={styles.Profile}>
                                            {
                                                member.profileUrl ? (
                                                    <img src={member.profileUrl || ''}/>
                                                ) : (
                                                    member.firstName ? member.firstName[0].toUpperCase() : '?'
                                                )
                                            }
                                        </div>
                                        <div
                                            className={styles.Name}>{member.firstName} {member.lastName}</div>
                                        <div className={styles.Statuses}>
                                            <div
                                                className={`${styles.GithubAccountLinkingStatus} ${classNames({
                                                    [styles.Linked]: member.hasGithubAccount,
                                                    [styles.Required]: requireGithub[member.userId]
                                                })}`}>
                                                <img
                                                    src={props.deps.client.getResourceUrl('assets/github.svg')}/>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </>
            );
        };
        return (
            key ? (
                <div key={key} className={styles.MemberGroup}>
                    {renderMemberGroupContent()}
                </div>
            ) : (
                <div className={styles.MemberGroup}>
                    {renderMemberGroupContent()}
                </div>
            )
        );
    };

    const totalSelectedMembersCount = members.reduce((selectedCount: number, member: Member) =>
            selectedMemberIds[member.userId] ? selectedCount + 1 : selectedCount
        , 0);

    const sortedMemberUserIds = members
        .sort((member1, member2) => member1.userId - member2.userId)
        .map(member => member.userId);

    return (
        <div className={styles.Settings}>
            <div className={styles.LeftSection}>
                {
                    renderMemberGroup('All Members', sortedMemberUserIds)
                }
                {
                    memberGroups.map((memberGroup, index) => {
                       return renderMemberGroup(memberGroup.name, memberGroup.memberUserIds, index);
                    })
                }
            </div>
            <div className={styles.RightSection}>
                <div className={styles.MembersSelected}>
                    <div>{totalSelectedMembersCount} of {members.length}</div>
                    <div>selected</div>
                </div>
                <div className={styles.Divider}/>
                <div className={styles.Actions}>
                    <div className={styles.Action}
                         onClick={onRequireGithubClick}>
                        <div className={styles.RequireGithub}>
                            <img src={props.deps.client.getResourceUrl('assets/github.svg')}/>
                        </div>
                        <div className={styles.Name}>
                            Require Github
                        </div>
                    </div>
                    <div className={styles.Action}
                         onClick={onCancelRequireGithubClick}>
                        <div className={styles.CancelRequireGithub}>
                            <img src={props.deps.client.getResourceUrl('assets/github.svg')}/>
                        </div>
                        <div className={styles.Name}>
                            Cancel require Github
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}