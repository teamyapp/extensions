import {ThirdPartyAppDeps} from '@teamyapp/ext';
import classNames from 'classnames';
import {useEffect, useState} from 'react';
import styles from './Settings.component.module.scss';

interface TeamMembersAndGroups {
    members: Member[];
    memberGroups: MemberGroup[];
}

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    profileUrl: string;
    hasLinkedGithubAccount: boolean;
    requiredToLinkGithubAccount: boolean;
}

interface MemberGroup {
    id: number;
    name: string;
    userIds: number[];
}

interface Props {
    deps: ThirdPartyAppDeps;
}

const teamMembersAndGroups: TeamMembersAndGroups = {
    members: [
        {
            id: 1,
            firstName: 'Sophia',
            lastName: 'Wilson',
            profileUrl: 'assets/user_profiles/22.svg',
            hasLinkedGithubAccount: true,
            requiredToLinkGithubAccount: false,
        },
        {
            id: 2,
            firstName: 'Olivia',
            lastName: 'Jones',
            profileUrl: 'assets/user_profiles/3.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: false,
        },
        {
            id: 3,
            firstName: 'Ethan',
            lastName: 'Brown',
            profileUrl: 'assets/user_profiles/6.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: false,
        },
        {
            id: 4,
            firstName: 'Charlotte',
            lastName: 'Garcia',
            profileUrl: 'assets/user_profiles/20.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: true,
        },
        {
            id: 5,
            firstName: 'Alexander',
            lastName: 'White',
            profileUrl: 'assets/user_profiles/1.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: false,
        },
        {
            id: 6,
            firstName: 'James',
            lastName: 'Goodwin',
            profileUrl: 'assets/user_profiles/13.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: false,
        },
        {
            id: 7,
            firstName: 'Alisha',
            lastName: 'Marshall',
            profileUrl: 'assets/user_profiles/24.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: false,
        },
        {
            id: 8,
            firstName: 'Jasper',
            lastName: 'Obrien',
            profileUrl: 'assets/user_profiles/5.svg',
            hasLinkedGithubAccount: false,
            requiredToLinkGithubAccount: false,
        }
    ],
    memberGroups: [
        {
            id: 1,
            name: 'All Members',
            userIds: [1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
            id: 2,
            name: 'Designers',
            userIds: [1, 2, 4],
        },
        {
            id: 3,
            name: 'Developers',
            userIds: [3, 5],
        }
    ]
};

export function SettingsComponent(props: Props) {
    const [selectedMemberIds, setSelectedMemberIds] = useState<Record<number, boolean>>({});
    const [requireGithub, setRequireGithub] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const defaultRequireGithub: Record<number, boolean> = {};
        teamMembersAndGroups.members.forEach(member => {
            defaultRequireGithub[member.id] = member.requiredToLinkGithubAccount;
        });
        setRequireGithub(defaultRequireGithub);
    }, []);

    const onMemberClickHandler = (userId: number) => () => {
        setSelectedMemberIds(
            Object.assign({}, selectedMemberIds, {
                [userId]: !selectedMemberIds[userId]
            }));
    };

    const onToggleSelectGroupHandler = (memberGroup: MemberGroup, selectedGroup: boolean) => () => {
        const newSelectedMemberIds = {...selectedMemberIds};
        memberGroup.userIds.forEach(userId => {
            newSelectedMemberIds[userId] = !selectedGroup;
        });
        setSelectedMemberIds(newSelectedMemberIds);
    };

    const onRequireGithubClick = () => {
        const newRequireGithub = {...requireGithub};
        for (const userId in selectedMemberIds) {
            if (selectedMemberIds[userId]) {
                newRequireGithub[userId] = true;
            }
        }

        setRequireGithub(newRequireGithub);
        setSelectedMemberIds({});
    };

    const onCancelRequireGithubClick = () => {
        const newRequireGithub = {...requireGithub};
        for (const userId in selectedMemberIds) {
            if (selectedMemberIds[userId]) {
                newRequireGithub[userId] = false;
            }
        }

        setRequireGithub(newRequireGithub);
        setSelectedMemberIds({});
    };

    const totalSelectedMembersCount = teamMembersAndGroups.members.reduce((selected: number, member: Member) =>
            selectedMemberIds[member.id] ? selected + 1 : selected
        , 0);

    return (
        <div className={styles.Settings}>
            <div className={styles.LeftSection}>
                {
                    teamMembersAndGroups.memberGroups.map(memberGroup => {
                        const selectedMemberCount = memberGroup.userIds.reduce((selected: number, userId: number) =>
                                selectedMemberIds[userId] ? selected + 1 : selected
                            , 0);
                        const selectedGroup = memberGroup.userIds.length === selectedMemberCount;
                        return (
                            <div key={memberGroup.id} className={styles.MemberGroup}>
                                <div className={styles.TopBar}>
                                    <div className={styles.SelectGroup}>
                                        <input type={'checkbox'}
                                               checked={selectedGroup}
                                               onClick={onToggleSelectGroupHandler(memberGroup, selectedGroup)}
                                        />
                                    </div>
                                    <div className={styles.Name}>{memberGroup.name}</div>
                                    <div className={styles.Selected}>
                                        {selectedMemberCount} of {memberGroup.userIds.length} selected
                                    </div>
                                </div>
                                <div className={styles.Members}>
                                    {
                                        memberGroup.userIds.map(userId => {
                                            const member = teamMembersAndGroups.members.find(member => member.id === userId)!;
                                            return (
                                                <div key={userId} className={`${styles.Member} ${classNames({
                                                    [styles.Selected]: selectedMemberIds[userId]
                                                })}`}
                                                     onClick={onMemberClickHandler(userId)}>
                                                    <div className={styles.Profile}>
                                                        <img src={props.deps.client.getResourceUrl(member.profileUrl)}/>
                                                    </div>
                                                    <div
                                                        className={styles.Name}>{member.firstName} {member.lastName}</div>
                                                    <div className={styles.Statuses}>
                                                        <div
                                                            className={`${styles.GithubAccountLinkingStatus} ${classNames({
                                                                [styles.Linked]: member.hasLinkedGithubAccount,
                                                                [styles.Required]: requireGithub[member.id]
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
                            </div>
                        );
                    })
                }
            </div>
            <div className={styles.RightSection}>
                <div className={styles.MembersSelected}>
                    <div>{totalSelectedMembersCount} of {teamMembersAndGroups.members.length}</div>
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