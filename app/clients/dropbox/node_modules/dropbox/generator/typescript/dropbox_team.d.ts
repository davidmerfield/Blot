/// <reference path="./dropbox_types.d.ts" />
/// <reference path="./dropbox.d.ts" />
declare module DropboxTypes {
  class DropboxTeam extends DropboxBase {
    /**
     * The DropboxTeam SDK class.
     */
    constructor(options: DropboxOptions);

    /**
     * Returns an instance of Dropbox that can make calls to user api endpoints on
     * behalf of the passed user id, using the team access token. Only relevant for
     * team endpoints.
     */
    actAsUser(userId: string): Dropbox;



    /**
     * List all device sessions of a team's member.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.ListMemberDevicesError>.
     * @param arg The request parameters.
     */
    public teamDevicesListMemberDevices(arg: team.ListMemberDevicesArg): Promise<team.ListMemberDevicesResult>;

    /**
     * List all device sessions of a team.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.ListMembersDevicesError>.
     * @param arg The request parameters.
     */
    public teamDevicesListMembersDevices(arg: team.ListMembersDevicesArg): Promise<team.ListMembersDevicesResult>;

    /**
     * List all device sessions of a team.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.ListTeamDevicesError>.
     * @deprecated
     * @param arg The request parameters.
     */
    public teamDevicesListTeamDevices(arg: team.ListTeamDevicesArg): Promise<team.ListTeamDevicesResult>;

    /**
     * Revoke a device session of a team's member
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.RevokeDeviceSessionError>.
     * @param arg The request parameters.
     */
    public teamDevicesRevokeDeviceSession(arg: team.RevokeDeviceSessionArg): Promise<void>;

    /**
     * Revoke a list of device sessions of team members
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.RevokeDeviceSessionBatchError>.
     * @param arg The request parameters.
     */
    public teamDevicesRevokeDeviceSessionBatch(arg: team.RevokeDeviceSessionBatchArg): Promise<team.RevokeDeviceSessionBatchResult>;

    /**
     * Get the values for one or more featues. This route allows you to check
     * your account's capability for what feature you can access or what value
     * you have for certain features. Permission : Team information.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.FeaturesGetValuesBatchError>.
     * @param arg The request parameters.
     */
    public teamFeaturesGetValues(arg: team.FeaturesGetValuesBatchArg): Promise<team.FeaturesGetValuesBatchResult>;

    /**
     * Retrieves information about a team.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<void>.
     * @param arg The request parameters.
     */
    public teamGetInfo(arg: void): Promise<team.TeamGetInfoResult>;

    /**
     * Creates a new, empty group, with a requested name. Permission : Team
     * member management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupCreateError>.
     * @param arg The request parameters.
     */
    public teamGroupsCreate(arg: team.GroupCreateArg): Promise<team.GroupFullInfo>;

    /**
     * Deletes a group. The group is deleted immediately. However the revoking
     * of group-owned resources may take additional time. Use the
     * groupsJobStatusGet() to determine whether this process has completed.
     * Permission : Team member management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupDeleteError>.
     * @param arg The request parameters.
     */
    public teamGroupsDelete(arg: team.GroupSelector): Promise<async.LaunchEmptyResult>;

    /**
     * Retrieves information about one or more groups. Note that the optional
     * field  GroupFullInfo.members is not returned for system-managed groups.
     * Permission : Team Information.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupsGetInfoError>.
     * @param arg The request parameters.
     */
    public teamGroupsGetInfo(arg: team.GroupsSelector): Promise<team.GroupsGetInfoResult>;

    /**
     * Once an async_job_id is returned from groupsDelete(), groupsMembersAdd()
     * , or groupsMembersRemove() use this method to poll the status of
     * granting/revoking group members' access to group-owned resources.
     * Permission : Team member management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupsPollError>.
     * @param arg The request parameters.
     */
    public teamGroupsJobStatusGet(arg: async.PollArg): Promise<async.PollEmptyResult>;

    /**
     * Lists groups on a team. Permission : Team Information.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<void>.
     * @param arg The request parameters.
     */
    public teamGroupsList(arg: team.GroupsListArg): Promise<team.GroupsListResult>;

    /**
     * Once a cursor has been retrieved from groupsList(), use this to paginate
     * through all groups. Permission : Team Information.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupsListContinueError>.
     * @param arg The request parameters.
     */
    public teamGroupsListContinue(arg: team.GroupsListContinueArg): Promise<team.GroupsListResult>;

    /**
     * Adds members to a group. The members are added immediately. However the
     * granting of group-owned resources may take additional time. Use the
     * groupsJobStatusGet() to determine whether this process has completed.
     * Permission : Team member management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupMembersAddError>.
     * @param arg The request parameters.
     */
    public teamGroupsMembersAdd(arg: team.GroupMembersAddArg): Promise<team.GroupMembersChangeResult>;

    /**
     * Lists members of a group. Permission : Team Information.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupSelectorError>.
     * @param arg The request parameters.
     */
    public teamGroupsMembersList(arg: team.GroupsMembersListArg): Promise<team.GroupsMembersListResult>;

    /**
     * Once a cursor has been retrieved from groupsMembersList(), use this to
     * paginate through all members of the group. Permission : Team information.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupsMembersListContinueError>.
     * @param arg The request parameters.
     */
    public teamGroupsMembersListContinue(arg: team.GroupsMembersListContinueArg): Promise<team.GroupsMembersListResult>;

    /**
     * Removes members from a group. The members are removed immediately.
     * However the revoking of group-owned resources may take additional time.
     * Use the groupsJobStatusGet() to determine whether this process has
     * completed. This method permits removing the only owner of a group, even
     * in cases where this is not possible via the web client. Permission : Team
     * member management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupMembersRemoveError>.
     * @param arg The request parameters.
     */
    public teamGroupsMembersRemove(arg: team.GroupMembersRemoveArg): Promise<team.GroupMembersChangeResult>;

    /**
     * Sets a member's access type in a group. Permission : Team member
     * management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupMemberSetAccessTypeError>.
     * @param arg The request parameters.
     */
    public teamGroupsMembersSetAccessType(arg: team.GroupMembersSetAccessTypeArg): Promise<team.GroupsGetInfoResult>;

    /**
     * Updates a group's name and/or external ID. Permission : Team member
     * management.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.GroupUpdateError>.
     * @param arg The request parameters.
     */
    public teamGroupsUpdate(arg: team.GroupUpdateArgs): Promise<team.GroupFullInfo>;

    /**
     * List all linked applications of the team member. Note, this endpoint does
     * not list any team-linked applications.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.ListMemberAppsError>.
     * @param arg The request parameters.
     */
    public teamLinkedAppsListMemberLinkedApps(arg: team.ListMemberAppsArg): Promise<team.ListMemberAppsResult>;

    /**
     * List all applications linked to the team members' accounts. Note, this
     * endpoint does not list any team-linked applications.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.ListMembersAppsError>.
     * @param arg The request parameters.
     */
    public teamLinkedAppsListMembersLinkedApps(arg: team.ListMembersAppsArg): Promise<team.ListMembersAppsResult>;

    /**
     * List all applications linked to the team members' accounts. Note, this
     * endpoint doesn't list any team-linked applications.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.ListTeamAppsError>.
     * @deprecated
     * @param arg The request parameters.
     */
    public teamLinkedAppsListTeamLinkedApps(arg: team.ListTeamAppsArg): Promise<team.ListTeamAppsResult>;

    /**
     * Revoke a linked application of the team member
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.RevokeLinkedAppError>.
     * @param arg The request parameters.
     */
    public teamLinkedAppsRevokeLinkedApp(arg: team.RevokeLinkedApiAppArg): Promise<void>;

    /**
     * Revoke a list of linked applications of the team members
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.RevokeLinkedAppBatchError>.
     * @param arg The request parameters.
     */
    public teamLinkedAppsRevokeLinkedAppBatch(arg: team.RevokeLinkedApiAppBatchArg): Promise<team.RevokeLinkedAppBatchResult>;

    /**
     * Adds members to a team. Permission : Team member management A maximum of
     * 20 members can be specified in a single call. If no Dropbox account
     * exists with the email address specified, a new Dropbox account will be
     * created with the given email address, and that account will be invited to
     * the team. If a personal Dropbox account exists with the email address
     * specified in the call, this call will create a placeholder Dropbox
     * account for the user on the team and send an email inviting the user to
     * migrate their existing personal account onto the team. Team member
     * management apps are required to set an initial given_name and surname for
     * a user to use in the team invitation and for 'Perform as team member'
     * actions taken on the user before they become 'active'.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<void>.
     * @param arg The request parameters.
     */
    public teamMembersAdd(arg: team.MembersAddArg): Promise<team.MembersAddLaunch>;

    /**
     * Once an async_job_id is returned from membersAdd() , use this to poll the
     * status of the asynchronous request. Permission : Team member management
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<async.PollError>.
     * @param arg The request parameters.
     */
    public teamMembersAddJobStatusGet(arg: async.PollArg): Promise<team.MembersAddJobStatus>;

    /**
     * Returns information about multiple team members. Permission : Team
     * information This endpoint will return MembersGetInfoItem.id_not_found,
     * for IDs (or emails) that cannot be matched to a valid team member.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersGetInfoError>.
     * @param arg The request parameters.
     */
    public teamMembersGetInfo(arg: team.MembersGetInfoArgs): Promise<team.MembersGetInfoResult>;

    /**
     * Lists members of a team. Permission : Team information
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersListError>.
     * @param arg The request parameters.
     */
    public teamMembersList(arg: team.MembersListArg): Promise<team.MembersListResult>;

    /**
     * Once a cursor has been retrieved from membersList(), use this to paginate
     * through all team members. Permission : Team information
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersListContinueError>.
     * @param arg The request parameters.
     */
    public teamMembersListContinue(arg: team.MembersListContinueArg): Promise<team.MembersListResult>;

    /**
     * Recover a deleted member. Permission : Team member management Exactly one
     * of team_member_id, email, or external_id must be provided to identify the
     * user account.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersRecoverError>.
     * @param arg The request parameters.
     */
    public teamMembersRecover(arg: team.MembersRecoverArg): Promise<void>;

    /**
     * Removes a member from a team. Permission : Team member management Exactly
     * one of team_member_id, email, or external_id must be provided to identify
     * the user account. Accounts can be recovered via membersRecover() for a 7
     * day period or until the account has been permanently deleted or
     * transferred to another account (whichever comes first). Calling
     * membersAdd() while a user is still recoverable on your team will return
     * with MemberAddResult.user_already_on_team. This endpoint may initiate an
     * asynchronous job. To obtain the final result of the job, the client
     * should periodically poll membersRemoveJobStatusGet().
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersRemoveError>.
     * @param arg The request parameters.
     */
    public teamMembersRemove(arg: team.MembersRemoveArg): Promise<async.LaunchEmptyResult>;

    /**
     * Once an async_job_id is returned from membersRemove() , use this to poll
     * the status of the asynchronous request. Permission : Team member
     * management
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<async.PollError>.
     * @param arg The request parameters.
     */
    public teamMembersRemoveJobStatusGet(arg: async.PollArg): Promise<async.PollEmptyResult>;

    /**
     * Sends welcome email to pending team member. Permission : Team member
     * management Exactly one of team_member_id, email, or external_id must be
     * provided to identify the user account. No-op if team member is not
     * pending.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersSendWelcomeError>.
     * @param arg The request parameters.
     */
    public teamMembersSendWelcomeEmail(arg: team.UserSelectorArg): Promise<void>;

    /**
     * Updates a team member's permissions. Permission : Team member management
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersSetPermissionsError>.
     * @param arg The request parameters.
     */
    public teamMembersSetAdminPermissions(arg: team.MembersSetPermissionsArg): Promise<team.MembersSetPermissionsResult>;

    /**
     * Updates a team member's profile. Permission : Team member management
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersSetProfileError>.
     * @param arg The request parameters.
     */
    public teamMembersSetProfile(arg: team.MembersSetProfileArg): Promise<team.TeamMemberInfo>;

    /**
     * Suspend a member from a team. Permission : Team member management Exactly
     * one of team_member_id, email, or external_id must be provided to identify
     * the user account.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersSuspendError>.
     * @param arg The request parameters.
     */
    public teamMembersSuspend(arg: team.MembersDeactivateArg): Promise<void>;

    /**
     * Unsuspend a member from a team. Permission : Team member management
     * Exactly one of team_member_id, email, or external_id must be provided to
     * identify the user account.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.MembersUnsuspendError>.
     * @param arg The request parameters.
     */
    public teamMembersUnsuspend(arg: team.MembersUnsuspendArg): Promise<void>;

    /**
     * Returns a list of all team-accessible namespaces. This list includes team
     * folders, shared folders containing team members, team members' home
     * namespaces, and team members' app folders. Home namespaces and app
     * folders are always owned by this team or members of the team, but shared
     * folders may be owned by other users or other teams. Duplicates may occur
     * in the list.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<void>.
     * @param arg The request parameters.
     */
    public teamNamespacesList(arg: team.TeamNamespacesListArg): Promise<team.TeamNamespacesListResult>;

    /**
     * Once a cursor has been retrieved from namespacesList(), use this to
     * paginate through all team-accessible namespaces. Duplicates may occur in
     * the list.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamNamespacesListContinueError>.
     * @param arg The request parameters.
     */
    public teamNamespacesListContinue(arg: team.TeamNamespacesListContinueArg): Promise<team.TeamNamespacesListResult>;

    /**
     * Add a property template. See route files/properties/add to add properties
     * to a file.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<properties.ModifyPropertyTemplateError>.
     * @param arg The request parameters.
     */
    public teamPropertiesTemplateAdd(arg: team.AddPropertyTemplateArg): Promise<team.AddPropertyTemplateResult>;

    /**
     * Get the schema for a specified template.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<properties.PropertyTemplateError>.
     * @param arg The request parameters.
     */
    public teamPropertiesTemplateGet(arg: properties.GetPropertyTemplateArg): Promise<properties.GetPropertyTemplateResult>;

    /**
     * Get the property template identifiers for a team. To get the schema of
     * each template use propertiesTemplateGet().
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<properties.PropertyTemplateError>.
     * @param arg The request parameters.
     */
    public teamPropertiesTemplateList(arg: void): Promise<properties.ListPropertyTemplateIds>;

    /**
     * Update a property template. This route can update the template name, the
     * template description and add optional properties to templates.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<properties.ModifyPropertyTemplateError>.
     * @param arg The request parameters.
     */
    public teamPropertiesTemplateUpdate(arg: team.UpdatePropertyTemplateArg): Promise<team.UpdatePropertyTemplateResult>;

    /**
     * Retrieves reporting data about a team's user activity.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.DateRangeError>.
     * @param arg The request parameters.
     */
    public teamReportsGetActivity(arg: team.DateRange): Promise<team.GetActivityReport>;

    /**
     * Retrieves reporting data about a team's linked devices.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.DateRangeError>.
     * @param arg The request parameters.
     */
    public teamReportsGetDevices(arg: team.DateRange): Promise<team.GetDevicesReport>;

    /**
     * Retrieves reporting data about a team's membership.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.DateRangeError>.
     * @param arg The request parameters.
     */
    public teamReportsGetMembership(arg: team.DateRange): Promise<team.GetMembershipReport>;

    /**
     * Retrieves reporting data about a team's storage usage.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.DateRangeError>.
     * @param arg The request parameters.
     */
    public teamReportsGetStorage(arg: team.DateRange): Promise<team.GetStorageReport>;

    /**
     * Sets an archived team folder's status to active. Permission : Team member
     * file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderActivateError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderActivate(arg: team.TeamFolderIdArg): Promise<team.TeamFolderMetadata>;

    /**
     * Sets an active team folder's status to archived and removes all folder
     * and file members. Permission : Team member file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderArchiveError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderArchive(arg: team.TeamFolderArchiveArg): Promise<team.TeamFolderArchiveLaunch>;

    /**
     * Returns the status of an asynchronous job for archiving a team folder.
     * Permission : Team member file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<async.PollError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderArchiveCheck(arg: async.PollArg): Promise<team.TeamFolderArchiveJobStatus>;

    /**
     * Creates a new, active, team folder. Permission : Team member file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderCreateError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderCreate(arg: team.TeamFolderCreateArg): Promise<team.TeamFolderMetadata>;

    /**
     * Retrieves metadata for team folders. Permission : Team member file
     * access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<void>.
     * @param arg The request parameters.
     */
    public teamTeamFolderGetInfo(arg: team.TeamFolderIdListArg): Promise<Array<team.TeamFolderGetInfoItem>>;

    /**
     * Lists all team folders. Permission : Team member file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderListError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderList(arg: team.TeamFolderListArg): Promise<team.TeamFolderListResult>;

    /**
     * Once a cursor has been retrieved from teamFolderList(), use this to
     * paginate through all team folders. Permission : Team member file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderListContinueError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderListContinue(arg: team.TeamFolderListContinueArg): Promise<team.TeamFolderListResult>;

    /**
     * Permanently deletes an archived team folder. Permission : Team member
     * file access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderPermanentlyDeleteError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderPermanentlyDelete(arg: team.TeamFolderIdArg): Promise<void>;

    /**
     * Changes an active team folder's name. Permission : Team member file
     * access.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TeamFolderRenameError>.
     * @param arg The request parameters.
     */
    public teamTeamFolderRename(arg: team.TeamFolderRenameArg): Promise<team.TeamFolderMetadata>;

    /**
     * Returns the member profile of the admin who generated the team access
     * token used to make the call.
     * 
     * When an error occurs, the route rejects the promise with type
     * Error<team.TokenGetAuthenticatedAdminError>.
     * @param arg The request parameters.
     */
    public teamTokenGetAuthenticatedAdmin(arg: void): Promise<team.TokenGetAuthenticatedAdminResult>;
  }
}
