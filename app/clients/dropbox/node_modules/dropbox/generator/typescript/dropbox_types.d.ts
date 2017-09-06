declare module DropboxTypes {
  interface DropboxOptions {
    // An access token for making authenticated requests.
    accessToken?: string;
    // The client id for your app. Used to create authentication URL.
    clientId?: string;
    // Select user is only used by team endpoints. It specifies which user the team access token should be acting as.
    selectUser?: string;
  }

  class DropboxBase {
    /**
     * Get the access token.
     */
    getAccessToken(): string;

    /**
     * Get a URL that can be used to authenticate users for the Dropbox API.
     * @param redirectUri A URL to redirect the user to after authenticating.
     *   This must be added to your app through the admin interface.
     * @param state State that will be returned in the redirect URL to help
     *   prevent cross site scripting attacks.
     */
    getAuthenticationUrl(redirectUri: string, state?: string): string;

    /**
     * Get the client id
     */
    getClientId(): string;

    /**
     * Set the access token used to authenticate requests to the API.
     * @param accessToken An access token.
     */
    setAccessToken(accessToken: string): void;

    /**
     * Set the client id, which is used to help gain an access token.
     * @param clientId Your app's client ID.
     */
    setClientId(clientId: string): void;
  }


  /**
   * An Error object returned from a route.
   */
  interface Error<T> {
    // Text summary of the error.
    error_summary: string;
    // The error object.
    error: T;
    // User-friendly error message.
    user_message: UserMessage;
  }
  
  /**
   * User-friendly error message.
   */
  interface UserMessage {
    // The message.
    text: string;
    // The locale of the message.
    locale: string;
  }
  
  type Timestamp = string;
  

  namespace async {
    /**
     * The job finished synchronously and successfully.
     */
    interface LaunchEmptyResultComplete {
      '.tag': 'complete';
    }

    /**
     * Result returned by methods that may either launch an asynchronous job or
     * complete synchronously. Upon synchronous completion of the job, no
     * additional information is returned.
     */
    type LaunchEmptyResult = LaunchResultBase | LaunchEmptyResultComplete;

    /**
     * This response indicates that the processing is asynchronous. The string
     * is an id that can be used to obtain the status of the asynchronous job.
     */
    interface LaunchResultBaseAsyncJobId {
      '.tag': 'async_job_id';
      async_job_id: AsyncJobId;
    }

    /**
     * Result returned by methods that launch an asynchronous job. A method who
     * may either launch an asynchronous job, or complete the request
     * synchronously, can use this union by extending it, and adding a
     * 'complete' field with the type of the synchronous response. See
     * async.LaunchEmptyResult for an example.
     */
    type LaunchResultBase = LaunchResultBaseAsyncJobId;

    /**
     * Arguments for methods that poll the status of an asynchronous job.
     */
    interface PollArg {
      /**
       * Id of the asynchronous job. This is the value of a response returned
       * from the method that launched the job.
       */
      async_job_id: AsyncJobId;
    }

    /**
     * The asynchronous job has completed successfully.
     */
    interface PollEmptyResultComplete {
      '.tag': 'complete';
    }

    /**
     * Result returned by methods that poll for the status of an asynchronous
     * job. Upon completion of the job, no additional information is returned.
     */
    type PollEmptyResult = PollResultBase | PollEmptyResultComplete;

    /**
     * The job ID is invalid.
     */
    interface PollErrorInvalidAsyncJobId {
      '.tag': 'invalid_async_job_id';
    }

    /**
     * Something went wrong with the job on Dropbox's end. You'll need to verify
     * that the action you were taking succeeded, and if not, try again. This
     * should happen very rarely.
     */
    interface PollErrorInternalError {
      '.tag': 'internal_error';
    }

    interface PollErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by methods for polling the status of asynchronous job.
     */
    type PollError = PollErrorInvalidAsyncJobId | PollErrorInternalError | PollErrorOther;

    /**
     * The asynchronous job is still in progress.
     */
    interface PollResultBaseInProgress {
      '.tag': 'in_progress';
    }

    /**
     * Result returned by methods that poll for the status of an asynchronous
     * job. Unions that extend this union should add a 'complete' field with a
     * type of the information returned upon job completion. See
     * async.PollEmptyResult for an example.
     */
    type PollResultBase = PollResultBaseInProgress;

    type AsyncJobId = string;

  }

  namespace auth {
    /**
     * Current account type cannot access the resource.
     */
    interface AccessErrorInvalidAccountType {
      '.tag': 'invalid_account_type';
      invalid_account_type: InvalidAccountTypeError;
    }

    /**
     * Current account cannot access Paper.
     */
    interface AccessErrorPaperAccessDenied {
      '.tag': 'paper_access_denied';
      paper_access_denied: PaperAccessError;
    }

    interface AccessErrorOther {
      '.tag': 'other';
    }

    /**
     * Error occurred because the account doesn't have permission to access the
     * resource.
     */
    type AccessError = AccessErrorInvalidAccountType | AccessErrorPaperAccessDenied | AccessErrorOther;

    /**
     * The access token is invalid.
     */
    interface AuthErrorInvalidAccessToken {
      '.tag': 'invalid_access_token';
    }

    /**
     * The user specified in 'Dropbox-API-Select-User' is no longer on the team.
     */
    interface AuthErrorInvalidSelectUser {
      '.tag': 'invalid_select_user';
    }

    /**
     * The user specified in 'Dropbox-API-Select-Admin' is not a Dropbox
     * Business team admin.
     */
    interface AuthErrorInvalidSelectAdmin {
      '.tag': 'invalid_select_admin';
    }

    /**
     * The user has been suspended.
     */
    interface AuthErrorUserSuspended {
      '.tag': 'user_suspended';
    }

    interface AuthErrorOther {
      '.tag': 'other';
    }

    /**
     * Errors occurred during authentication.
     */
    type AuthError = AuthErrorInvalidAccessToken | AuthErrorInvalidSelectUser | AuthErrorInvalidSelectAdmin | AuthErrorUserSuspended | AuthErrorOther;

    /**
     * Current account type doesn't have permission to access this route
     * endpoint.
     */
    interface InvalidAccountTypeErrorEndpoint {
      '.tag': 'endpoint';
    }

    /**
     * Current account type doesn't have permission to access this feature.
     */
    interface InvalidAccountTypeErrorFeature {
      '.tag': 'feature';
    }

    interface InvalidAccountTypeErrorOther {
      '.tag': 'other';
    }

    type InvalidAccountTypeError = InvalidAccountTypeErrorEndpoint | InvalidAccountTypeErrorFeature | InvalidAccountTypeErrorOther;

    /**
     * Paper is disabled.
     */
    interface PaperAccessErrorPaperDisabled {
      '.tag': 'paper_disabled';
    }

    /**
     * The provided user has not used Paper yet.
     */
    interface PaperAccessErrorNotPaperUser {
      '.tag': 'not_paper_user';
    }

    interface PaperAccessErrorOther {
      '.tag': 'other';
    }

    type PaperAccessError = PaperAccessErrorPaperDisabled | PaperAccessErrorNotPaperUser | PaperAccessErrorOther;

    /**
     * Error occurred because the app is being rate limited.
     */
    interface RateLimitError {
      /**
       * The reason why the app is being rate limited.
       */
      reason: RateLimitReason;
      /**
       * Defaults to 1.
       */
      retry_after?: number;
    }

    /**
     * You are making too many requests in the past few minutes.
     */
    interface RateLimitReasonTooManyRequests {
      '.tag': 'too_many_requests';
    }

    /**
     * There are currently too many write operations happening in the user's
     * Dropbox.
     */
    interface RateLimitReasonTooManyWriteOperations {
      '.tag': 'too_many_write_operations';
    }

    interface RateLimitReasonOther {
      '.tag': 'other';
    }

    type RateLimitReason = RateLimitReasonTooManyRequests | RateLimitReasonTooManyWriteOperations | RateLimitReasonOther;

    interface TokenFromOAuth1Arg {
      /**
       * The supplied OAuth 1.0 access token.
       */
      oauth1_token: string;
      /**
       * The token secret associated with the supplied access token.
       */
      oauth1_token_secret: string;
    }

    /**
     * Part or all of the OAuth 1.0 access token info is invalid.
     */
    interface TokenFromOAuth1ErrorInvalidOauth1TokenInfo {
      '.tag': 'invalid_oauth1_token_info';
    }

    /**
     * The authorized app does not match the app associated with the supplied
     * access token.
     */
    interface TokenFromOAuth1ErrorAppIdMismatch {
      '.tag': 'app_id_mismatch';
    }

    interface TokenFromOAuth1ErrorOther {
      '.tag': 'other';
    }

    type TokenFromOAuth1Error = TokenFromOAuth1ErrorInvalidOauth1TokenInfo | TokenFromOAuth1ErrorAppIdMismatch | TokenFromOAuth1ErrorOther;

    interface TokenFromOAuth1Result {
      /**
       * The OAuth 2.0 token generated from the supplied OAuth 1.0 token.
       */
      oauth2_token: string;
    }

  }

  namespace common {
    interface InvalidPathRootError {
      /**
       * The latest path root id for user's team if the user is still in a team.
       */
      path_root?: PathRootId;
    }

    /**
     * Paths are relative to the authenticating user's home directory, whether
     * or not that user belongs to a team.
     */
    interface PathRootHome {
      '.tag': 'home';
    }

    /**
     * Paths are relative to the authenticating team member's home directory.
     * (This results in :field:`PathRootError.invalid' if the user does not
     * belong to a team.)
     */
    interface PathRootMemberHome {
      '.tag': 'member_home';
    }

    /**
     * Paths are relative to the given team directory. (This results in
     * PathRootError.invalid if the user is not a member of the team associated
     * with that path root id.)
     */
    interface PathRootTeam {
      '.tag': 'team';
      team: PathRootId;
    }

    /**
     * Paths are relative to the user's home directory. (This results in
     * PathRootError.invalid if the belongs to a team.)
     */
    interface PathRootUserHome {
      '.tag': 'user_home';
    }

    /**
     * Paths are relative to given namespace id (This results in
     * PathRootError.no_permission if you don't have access to this namespace.)
     */
    interface PathRootNamespaceId {
      '.tag': 'namespace_id';
      namespace_id: PathRootId;
    }

    interface PathRootOther {
      '.tag': 'other';
    }

    type PathRoot = PathRootHome | PathRootMemberHome | PathRootTeam | PathRootUserHome | PathRootNamespaceId | PathRootOther;

    /**
     * The path root id value in Dropbox-API-Path-Root header is no longer
     * valid.
     */
    interface PathRootErrorInvalid {
      '.tag': 'invalid';
      invalid: InvalidPathRootError;
    }

    /**
     * You don't have permission to access the path root id in
     * Dropbox-API-Path-Root  header.
     */
    interface PathRootErrorNoPermission {
      '.tag': 'no_permission';
    }

    interface PathRootErrorOther {
      '.tag': 'other';
    }

    type PathRootError = PathRootErrorInvalid | PathRootErrorNoPermission | PathRootErrorOther;

    type Date = Timestamp;

    type DisplayName = string;

    type DropboxTimestamp = Timestamp;

    type EmailAddress = string;

    type NamePart = string;

    type NamespaceId = string;

    type PathRootId = NamespaceId;

    type SessionId = string;

    type SharedFolderId = NamespaceId;

  }

  /**
   * This namespace contains endpoints and data types for basic file operations.
   */
  namespace files {
    /**
     * This property group already exists for this file.
     */
    interface AddPropertiesErrorPropertyGroupAlreadyExists {
      '.tag': 'property_group_already_exists';
    }

    type AddPropertiesError = InvalidPropertyGroupError | AddPropertiesErrorPropertyGroupAlreadyExists;

    interface AlphaGetMetadataArg extends GetMetadataArg {
      /**
       * If set to a valid list of template IDs, FileMetadata.property_groups is
       * set for files with custom properties.
       */
      include_property_templates?: Array<properties.TemplateId>;
    }

    interface AlphaGetMetadataErrorPropertiesError {
      '.tag': 'properties_error';
      properties_error: LookUpPropertiesError;
    }

    type AlphaGetMetadataError = GetMetadataError | AlphaGetMetadataErrorPropertiesError;

    interface CommitInfo {
      /**
       * The file contents to be uploaded.
       */
      contents: Object;
      /**
       * Path in the user's Dropbox to save the file.
       */
      path: WritePathOrId;
      /**
       * Defaults to TagRef(Union(u'WriteMode', [UnionField(u'add', Void,
       * False), UnionField(u'overwrite', Void, False), UnionField(u'update',
       * Alias(u'Rev', String), False)]), u'add').
       */
      mode?: WriteMode;
      /**
       * Defaults to False.
       */
      autorename?: boolean;
      /**
       * The value to store as the client_modified timestamp. Dropbox
       * automatically records the time at which the file was written to the
       * Dropbox servers. It can also record an additional timestamp, provided
       * by Dropbox desktop clients, mobile clients, and API apps of when the
       * file was actually created or modified.
       */
      client_modified?: common.DropboxTimestamp;
      /**
       * Defaults to False.
       */
      mute?: boolean;
    }

    interface CommitInfoWithProperties extends CommitInfo {
      /**
       * The file contents to be uploaded.
       */
      contents: Object;
      /**
       * List of custom properties to add to file.
       */
      property_groups?: Array<properties.PropertyGroup>;
    }

    interface CreateFolderArg {
      /**
       * Path in the user's Dropbox to create.
       */
      path: WritePath;
      /**
       * Defaults to False.
       */
      autorename?: boolean;
    }

    interface CreateFolderErrorPath {
      '.tag': 'path';
      path: WriteError;
    }

    type CreateFolderError = CreateFolderErrorPath;

    interface CreateFolderResult extends FileOpsResult {
      /**
       * Metadata of the created folder.
       */
      metadata: FolderMetadata;
    }

    interface DeleteArg {
      /**
       * Path in the user's Dropbox to delete.
       */
      path: WritePathOrId;
    }

    interface DeleteBatchArg {
      entries: Array<DeleteArg>;
    }

    /**
     * Deprecated by DeleteError.too_many_write_operations. deleteBatch() now
     * provides smaller granularity about which entry has failed because of
     * this.
     */
    interface DeleteBatchErrorTooManyWriteOperations {
      '.tag': 'too_many_write_operations';
    }

    interface DeleteBatchErrorOther {
      '.tag': 'other';
    }

    type DeleteBatchError = DeleteBatchErrorTooManyWriteOperations | DeleteBatchErrorOther;

    /**
     * The batch delete has finished.
     */
    interface DeleteBatchJobStatusComplete {
      '.tag': 'complete';
      complete: DeleteBatchResult;
    }

    /**
     * The batch delete has failed.
     */
    interface DeleteBatchJobStatusFailed {
      '.tag': 'failed';
      failed: DeleteBatchError;
    }

    interface DeleteBatchJobStatusOther {
      '.tag': 'other';
    }

    type DeleteBatchJobStatus = async.PollResultBase | DeleteBatchJobStatusComplete | DeleteBatchJobStatusFailed | DeleteBatchJobStatusOther;

    interface DeleteBatchLaunchComplete {
      '.tag': 'complete';
      complete: DeleteBatchResult;
    }

    interface DeleteBatchLaunchOther {
      '.tag': 'other';
    }

    /**
     * Result returned by deleteBatch() that may either launch an asynchronous
     * job or complete synchronously.
     */
    type DeleteBatchLaunch = async.LaunchResultBase | DeleteBatchLaunchComplete | DeleteBatchLaunchOther;

    interface DeleteBatchResult extends FileOpsResult {
      entries: Array<DeleteBatchResultEntry>;
    }

    interface DeleteBatchResultData {
      /**
       * Metadata of the deleted object.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
    }

    interface DeleteBatchResultEntrySuccess {
      '.tag': 'success';
      success: DeleteBatchResultData;
    }

    interface DeleteBatchResultEntryFailure {
      '.tag': 'failure';
      failure: DeleteError;
    }

    type DeleteBatchResultEntry = DeleteBatchResultEntrySuccess | DeleteBatchResultEntryFailure;

    interface DeleteErrorPathLookup {
      '.tag': 'path_lookup';
      path_lookup: LookupError;
    }

    interface DeleteErrorPathWrite {
      '.tag': 'path_write';
      path_write: WriteError;
    }

    /**
     * There are too many write operations in user's Dropbox. Please retry this
     * request.
     */
    interface DeleteErrorTooManyWriteOperations {
      '.tag': 'too_many_write_operations';
    }

    /**
     * There are too many files in one request. Please retry with fewer files.
     */
    interface DeleteErrorTooManyFiles {
      '.tag': 'too_many_files';
    }

    interface DeleteErrorOther {
      '.tag': 'other';
    }

    type DeleteError = DeleteErrorPathLookup | DeleteErrorPathWrite | DeleteErrorTooManyWriteOperations | DeleteErrorTooManyFiles | DeleteErrorOther;

    interface DeleteResult extends FileOpsResult {
      /**
       * Metadata of the deleted object.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
    }

    /**
     * Indicates that there used to be a file or folder at this path, but it no
     * longer exists.
     */
    interface DeletedMetadata extends Metadata {
    }

    /**
     * Reference to the DeletedMetadata type, identified by the value of the
     * .tag property.
     */
    interface DeletedMetadataReference extends DeletedMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'deleted';
    }

    /**
     * Dimensions for a photo or video.
     */
    interface Dimensions {
      /**
       * Height of the photo/video.
       */
      height: number;
      /**
       * Width of the photo/video.
       */
      width: number;
    }

    interface DownloadArg {
      /**
       * The path of the file to download.
       */
      path: ReadPath;
      /**
       * Deprecated. Please specify revision in path instead.
       */
      rev?: Rev;
    }

    interface DownloadErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    interface DownloadErrorOther {
      '.tag': 'other';
    }

    type DownloadError = DownloadErrorPath | DownloadErrorOther;

    interface FileMetadata extends Metadata {
      /**
       * A unique identifier for the file.
       */
      id: Id;
      /**
       * For files, this is the modification time set by the desktop client when
       * the file was added to Dropbox. Since this time is not verified (the
       * Dropbox server stores whatever the desktop client sends up), this
       * should only be used for display purposes (such as sorting) and not, for
       * example, to determine if a file has changed or not.
       */
      client_modified: common.DropboxTimestamp;
      /**
       * The last time the file was modified on Dropbox.
       */
      server_modified: common.DropboxTimestamp;
      /**
       * A unique identifier for the current revision of a file. This field is
       * the same rev as elsewhere in the API and can be used to detect changes
       * and avoid conflicts.
       */
      rev: Rev;
      /**
       * The file size in bytes.
       */
      size: number;
      /**
       * Additional information if the file is a photo or video.
       */
      media_info?: MediaInfo;
      /**
       * Set if this file is contained in a shared folder.
       */
      sharing_info?: FileSharingInfo;
      /**
       * Additional information if the file has custom properties with the
       * property template specified.
       */
      property_groups?: Array<properties.PropertyGroup>;
      /**
       * This flag will only be present if include_has_explicit_shared_members
       * is true in listFolder() or getMetadata(). If this  flag is present, it
       * will be true if this file has any explicit shared  members. This is
       * different from sharing_info in that this could be true  in the case
       * where a file has explicit members but is not contained within  a shared
       * folder.
       */
      has_explicit_shared_members?: boolean;
      /**
       * A hash of the file content. This field can be used to verify data
       * integrity. For more information see our [Content hash]{@link
       * /developers/reference/content-hash} page.
       */
      content_hash?: Sha256HexHash;
    }

    /**
     * Reference to the FileMetadata type, identified by the value of the .tag
     * property.
     */
    interface FileMetadataReference extends FileMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'file';
    }

    interface FileOpsResult {
    }

    /**
     * Sharing info for a file which is contained by a shared folder.
     */
    interface FileSharingInfo extends SharingInfo {
      /**
       * ID of shared folder that holds this file.
       */
      parent_shared_folder_id: common.SharedFolderId;
      /**
       * The last user who modified the file. This field will be null if the
       * user's account has been deleted.
       */
      modified_by?: users_common.AccountId;
    }

    interface FolderMetadata extends Metadata {
      /**
       * A unique identifier for the folder.
       */
      id: Id;
      /**
       * Deprecated. Please use sharing_info instead.
       */
      shared_folder_id?: common.SharedFolderId;
      /**
       * Set if the folder is contained in a shared folder or is a shared folder
       * mount point.
       */
      sharing_info?: FolderSharingInfo;
      /**
       * Additional information if the file has custom properties with the
       * property template specified.
       */
      property_groups?: Array<properties.PropertyGroup>;
    }

    /**
     * Reference to the FolderMetadata type, identified by the value of the .tag
     * property.
     */
    interface FolderMetadataReference extends FolderMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'folder';
    }

    /**
     * Sharing info for a folder which is contained in a shared folder or is a
     * shared folder mount point.
     */
    interface FolderSharingInfo extends SharingInfo {
      /**
       * Set if the folder is contained by a shared folder.
       */
      parent_shared_folder_id?: common.SharedFolderId;
      /**
       * If this folder is a shared folder mount point, the ID of the shared
       * folder mounted at this location.
       */
      shared_folder_id?: common.SharedFolderId;
      /**
       * Defaults to False.
       */
      traverse_only?: boolean;
      /**
       * Defaults to False.
       */
      no_access?: boolean;
    }

    interface GetCopyReferenceArg {
      /**
       * The path to the file or folder you want to get a copy reference to.
       */
      path: ReadPath;
    }

    interface GetCopyReferenceErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    interface GetCopyReferenceErrorOther {
      '.tag': 'other';
    }

    type GetCopyReferenceError = GetCopyReferenceErrorPath | GetCopyReferenceErrorOther;

    interface GetCopyReferenceResult {
      /**
       * Metadata of the file or folder.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
      /**
       * A copy reference to the file or folder.
       */
      copy_reference: string;
      /**
       * The expiration date of the copy reference. This value is currently set
       * to be far enough in the future so that expiration is effectively not an
       * issue.
       */
      expires: common.DropboxTimestamp;
    }

    interface GetMetadataArg {
      /**
       * The path of a file or folder on Dropbox.
       */
      path: ReadPath;
      /**
       * Defaults to False.
       */
      include_media_info?: boolean;
      /**
       * Defaults to False.
       */
      include_deleted?: boolean;
      /**
       * Defaults to False.
       */
      include_has_explicit_shared_members?: boolean;
    }

    interface GetMetadataErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    type GetMetadataError = GetMetadataErrorPath;

    interface GetTemporaryLinkArg {
      /**
       * The path to the file you want a temporary link to.
       */
      path: ReadPath;
    }

    interface GetTemporaryLinkErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    interface GetTemporaryLinkErrorOther {
      '.tag': 'other';
    }

    type GetTemporaryLinkError = GetTemporaryLinkErrorPath | GetTemporaryLinkErrorOther;

    interface GetTemporaryLinkResult {
      /**
       * Metadata of the file.
       */
      metadata: FileMetadata;
      /**
       * The temporary link which can be used to stream content the file.
       */
      link: string;
    }

    /**
     * GPS coordinates for a photo or video.
     */
    interface GpsCoordinates {
      /**
       * Latitude of the GPS coordinates.
       */
      latitude: number;
      /**
       * Longitude of the GPS coordinates.
       */
      longitude: number;
    }

    /**
     * A field value in this property group is too large.
     */
    interface InvalidPropertyGroupErrorPropertyFieldTooLarge {
      '.tag': 'property_field_too_large';
    }

    /**
     * The property group specified does not conform to the property template.
     */
    interface InvalidPropertyGroupErrorDoesNotFitTemplate {
      '.tag': 'does_not_fit_template';
    }

    type InvalidPropertyGroupError = PropertiesError | InvalidPropertyGroupErrorPropertyFieldTooLarge | InvalidPropertyGroupErrorDoesNotFitTemplate;

    interface ListFolderArg {
      /**
       * A unique identifier for the file.
       */
      path: PathROrId;
      /**
       * Defaults to False.
       */
      recursive?: boolean;
      /**
       * Defaults to False.
       */
      include_media_info?: boolean;
      /**
       * Defaults to False.
       */
      include_deleted?: boolean;
      /**
       * Defaults to False.
       */
      include_has_explicit_shared_members?: boolean;
    }

    interface ListFolderContinueArg {
      /**
       * The cursor returned by your last call to listFolder() or
       * listFolderContinue().
       */
      cursor: ListFolderCursor;
    }

    interface ListFolderContinueErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    /**
     * Indicates that the cursor has been invalidated. Call listFolder() to
     * obtain a new cursor.
     */
    interface ListFolderContinueErrorReset {
      '.tag': 'reset';
    }

    interface ListFolderContinueErrorOther {
      '.tag': 'other';
    }

    type ListFolderContinueError = ListFolderContinueErrorPath | ListFolderContinueErrorReset | ListFolderContinueErrorOther;

    interface ListFolderErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    interface ListFolderErrorOther {
      '.tag': 'other';
    }

    type ListFolderError = ListFolderErrorPath | ListFolderErrorOther;

    interface ListFolderGetLatestCursorResult {
      /**
       * Pass the cursor into listFolderContinue() to see what's changed in the
       * folder since your previous query.
       */
      cursor: ListFolderCursor;
    }

    interface ListFolderLongpollArg {
      /**
       * A cursor as returned by listFolder() or listFolderContinue(). Cursors
       * retrieved by setting ListFolderArg.include_media_info to true are not
       * supported.
       */
      cursor: ListFolderCursor;
      /**
       * Defaults to 30.
       */
      timeout?: number;
    }

    /**
     * Indicates that the cursor has been invalidated. Call listFolder() to
     * obtain a new cursor.
     */
    interface ListFolderLongpollErrorReset {
      '.tag': 'reset';
    }

    interface ListFolderLongpollErrorOther {
      '.tag': 'other';
    }

    type ListFolderLongpollError = ListFolderLongpollErrorReset | ListFolderLongpollErrorOther;

    interface ListFolderLongpollResult {
      /**
       * Indicates whether new changes are available. If true, call
       * listFolderContinue() to retrieve the changes.
       */
      changes: boolean;
      /**
       * If present, backoff for at least this many seconds before calling
       * listFolderLongpoll() again.
       */
      backoff?: number;
    }

    interface ListFolderResult {
      /**
       * The files and (direct) subfolders in the folder.
       */
      entries: Array<FileMetadataReference|FolderMetadataReference|DeletedMetadataReference>;
      /**
       * Pass the cursor into listFolderContinue() to see what's changed in the
       * folder since your previous query.
       */
      cursor: ListFolderCursor;
      /**
       * If true, then there are more entries available. Pass the cursor to
       * listFolderContinue() to retrieve the rest.
       */
      has_more: boolean;
    }

    interface ListRevisionsArg {
      /**
       * The path to the file you want to see the revisions of.
       */
      path: PathOrId;
      /**
       * Defaults to 10.
       */
      limit?: number;
    }

    interface ListRevisionsErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    interface ListRevisionsErrorOther {
      '.tag': 'other';
    }

    type ListRevisionsError = ListRevisionsErrorPath | ListRevisionsErrorOther;

    interface ListRevisionsResult {
      /**
       * If the file is deleted.
       */
      is_deleted: boolean;
      /**
       * The time of deletion if the file was deleted.
       */
      server_deleted?: common.DropboxTimestamp;
      /**
       * The revisions for the file. Only revisions that are not deleted will
       * show up here.
       */
      entries: Array<FileMetadata>;
    }

    /**
     * This property group does not exist for this file.
     */
    interface LookUpPropertiesErrorPropertyGroupNotFound {
      '.tag': 'property_group_not_found';
    }

    type LookUpPropertiesError = LookUpPropertiesErrorPropertyGroupNotFound;

    interface LookupErrorMalformedPath {
      '.tag': 'malformed_path';
      malformed_path: MalformedPathError;
    }

    /**
     * There is nothing at the given path.
     */
    interface LookupErrorNotFound {
      '.tag': 'not_found';
    }

    /**
     * We were expecting a file, but the given path refers to something that
     * isn't a file.
     */
    interface LookupErrorNotFile {
      '.tag': 'not_file';
    }

    /**
     * We were expecting a folder, but the given path refers to something that
     * isn't a folder.
     */
    interface LookupErrorNotFolder {
      '.tag': 'not_folder';
    }

    /**
     * The file cannot be transferred because the content is restricted.  For
     * example, sometimes there are legal restrictions due to copyright claims.
     */
    interface LookupErrorRestrictedContent {
      '.tag': 'restricted_content';
    }

    interface LookupErrorOther {
      '.tag': 'other';
    }

    type LookupError = LookupErrorMalformedPath | LookupErrorNotFound | LookupErrorNotFile | LookupErrorNotFolder | LookupErrorRestrictedContent | LookupErrorOther;

    /**
     * Indicate the photo/video is still under processing and metadata is not
     * available yet.
     */
    interface MediaInfoPending {
      '.tag': 'pending';
    }

    /**
     * The metadata for the photo/video.
     */
    interface MediaInfoMetadata {
      '.tag': 'metadata';
      metadata: PhotoMetadataReference|VideoMetadataReference;
    }

    type MediaInfo = MediaInfoPending | MediaInfoMetadata;

    /**
     * Metadata for a photo or video.
     */
    interface MediaMetadata {
      /**
       * Dimension of the photo/video.
       */
      dimensions?: Dimensions;
      /**
       * The GPS coordinate of the photo/video.
       */
      location?: GpsCoordinates;
      /**
       * The timestamp when the photo/video is taken.
       */
      time_taken?: common.DropboxTimestamp;
    }

    /**
     * Reference to the MediaMetadata polymorphic type. Contains a .tag property
     * to let you discriminate between possible subtypes.
     */
    interface MediaMetadataReference extends MediaMetadata {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "photo"|"video";
    }

    /**
     * Metadata for a file or folder.
     */
    interface Metadata {
      /**
       * The last component of the path (including extension). This never
       * contains a slash.
       */
      name: string;
      /**
       * The lowercased full path in the user's Dropbox. This always starts with
       * a slash. This field will be null if the file or folder is not mounted.
       */
      path_lower?: string;
      /**
       * The cased path to be used for display purposes only. In rare instances
       * the casing will not correctly match the user's filesystem, but this
       * behavior will match the path provided in the Core API v1, and at least
       * the last path component will have the correct casing. Changes to only
       * the casing of paths won't be returned by listFolderContinue(). This
       * field will be null if the file or folder is not mounted.
       */
      path_display?: string;
      /**
       * Deprecated. Please use FileSharingInfo.parent_shared_folder_id or
       * FolderSharingInfo.parent_shared_folder_id instead.
       */
      parent_shared_folder_id?: common.SharedFolderId;
    }

    /**
     * Reference to the Metadata polymorphic type. Contains a .tag property to
     * let you discriminate between possible subtypes.
     */
    interface MetadataReference extends Metadata {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "file"|"folder"|"deleted";
    }

    /**
     * Metadata for a photo.
     */
    interface PhotoMetadata extends MediaMetadata {
    }

    /**
     * Reference to the PhotoMetadata type, identified by the value of the .tag
     * property.
     */
    interface PhotoMetadataReference extends PhotoMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'photo';
    }

    interface PreviewArg {
      /**
       * The path of the file to preview.
       */
      path: ReadPath;
      /**
       * Deprecated. Please specify revision in path instead.
       */
      rev?: Rev;
    }

    /**
     * An error occurs when downloading metadata for the file.
     */
    interface PreviewErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    /**
     * This preview generation is still in progress and the file is not ready
     * for preview yet.
     */
    interface PreviewErrorInProgress {
      '.tag': 'in_progress';
    }

    /**
     * The file extension is not supported preview generation.
     */
    interface PreviewErrorUnsupportedExtension {
      '.tag': 'unsupported_extension';
    }

    /**
     * The file content is not supported for preview generation.
     */
    interface PreviewErrorUnsupportedContent {
      '.tag': 'unsupported_content';
    }

    type PreviewError = PreviewErrorPath | PreviewErrorInProgress | PreviewErrorUnsupportedExtension | PreviewErrorUnsupportedContent;

    interface PropertiesErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    type PropertiesError = properties.PropertyTemplateError | PropertiesErrorPath;

    interface PropertyGroupUpdate {
      /**
       * A unique identifier for a property template.
       */
      template_id: properties.TemplateId;
      /**
       * List of property fields to update if the field already exists. If the
       * field doesn't exist, add the field to the property group.
       */
      add_or_update_fields?: Array<properties.PropertyField>;
      /**
       * List of property field names to remove from property group if the field
       * exists.
       */
      remove_fields?: Array<string>;
    }

    interface PropertyGroupWithPath {
      /**
       * A unique identifier for the file.
       */
      path: PathOrId;
      /**
       * Filled custom property templates associated with a file.
       */
      property_groups: Array<properties.PropertyGroup>;
    }

    interface RelocationArg extends RelocationPath {
      /**
       * Defaults to False.
       */
      allow_shared_folder?: boolean;
      /**
       * Defaults to False.
       */
      autorename?: boolean;
      /**
       * Defaults to False.
       */
      allow_ownership_transfer?: boolean;
    }

    interface RelocationBatchArg {
      /**
       * List of entries to be moved or copied. Each entry is
       * files.RelocationPath.
       */
      entries: Array<RelocationPath>;
      /**
       * Defaults to False.
       */
      allow_shared_folder?: boolean;
      /**
       * Defaults to False.
       */
      autorename?: boolean;
      /**
       * Defaults to False.
       */
      allow_ownership_transfer?: boolean;
    }

    /**
     * There are too many write operations in user's Dropbox. Please retry this
     * request.
     */
    interface RelocationBatchErrorTooManyWriteOperations {
      '.tag': 'too_many_write_operations';
    }

    type RelocationBatchError = RelocationError | RelocationBatchErrorTooManyWriteOperations;

    /**
     * The copy or move batch job has finished.
     */
    interface RelocationBatchJobStatusComplete {
      '.tag': 'complete';
      complete: RelocationBatchResult;
    }

    /**
     * The copy or move batch job has failed with exception.
     */
    interface RelocationBatchJobStatusFailed {
      '.tag': 'failed';
      failed: RelocationBatchError;
    }

    type RelocationBatchJobStatus = async.PollResultBase | RelocationBatchJobStatusComplete | RelocationBatchJobStatusFailed;

    interface RelocationBatchLaunchComplete {
      '.tag': 'complete';
      complete: RelocationBatchResult;
    }

    interface RelocationBatchLaunchOther {
      '.tag': 'other';
    }

    /**
     * Result returned by copyBatch() or moveBatch() that may either launch an
     * asynchronous job or complete synchronously.
     */
    type RelocationBatchLaunch = async.LaunchResultBase | RelocationBatchLaunchComplete | RelocationBatchLaunchOther;

    interface RelocationBatchResult extends FileOpsResult {
      entries: Array<RelocationBatchResultData>;
    }

    interface RelocationBatchResultData {
      /**
       * Metadata of the relocated object.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
    }

    interface RelocationErrorFromLookup {
      '.tag': 'from_lookup';
      from_lookup: LookupError;
    }

    interface RelocationErrorFromWrite {
      '.tag': 'from_write';
      from_write: WriteError;
    }

    interface RelocationErrorTo {
      '.tag': 'to';
      to: WriteError;
    }

    /**
     * Shared folders can't be copied.
     */
    interface RelocationErrorCantCopySharedFolder {
      '.tag': 'cant_copy_shared_folder';
    }

    /**
     * Your move operation would result in nested shared folders.  This is not
     * allowed.
     */
    interface RelocationErrorCantNestSharedFolder {
      '.tag': 'cant_nest_shared_folder';
    }

    /**
     * You cannot move a folder into itself.
     */
    interface RelocationErrorCantMoveFolderIntoItself {
      '.tag': 'cant_move_folder_into_itself';
    }

    /**
     * The operation would involve more than 10,000 files and folders.
     */
    interface RelocationErrorTooManyFiles {
      '.tag': 'too_many_files';
    }

    /**
     * There are duplicated/nested paths among RelocationArg.from_path and
     * RelocationArg.to_path.
     */
    interface RelocationErrorDuplicatedOrNestedPaths {
      '.tag': 'duplicated_or_nested_paths';
    }

    /**
     * Your move operation would result in an ownership transfer. You may
     * reissue the request with the field RelocationArg.allow_ownership_transfer
     * to true.
     */
    interface RelocationErrorCantTransferOwnership {
      '.tag': 'cant_transfer_ownership';
    }

    interface RelocationErrorOther {
      '.tag': 'other';
    }

    type RelocationError = RelocationErrorFromLookup | RelocationErrorFromWrite | RelocationErrorTo | RelocationErrorCantCopySharedFolder | RelocationErrorCantNestSharedFolder | RelocationErrorCantMoveFolderIntoItself | RelocationErrorTooManyFiles | RelocationErrorDuplicatedOrNestedPaths | RelocationErrorCantTransferOwnership | RelocationErrorOther;

    interface RelocationPath {
      /**
       * Path in the user's Dropbox to be copied or moved.
       */
      from_path: WritePathOrId;
      /**
       * Path in the user's Dropbox that is the destination.
       */
      to_path: WritePathOrId;
    }

    interface RelocationResult extends FileOpsResult {
      /**
       * Metadata of the relocated object.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
    }

    interface RemovePropertiesArg {
      /**
       * A unique identifier for the file.
       */
      path: PathOrId;
      /**
       * A list of identifiers for a property template created by route
       * properties/template/add.
       */
      property_template_ids: Array<properties.TemplateId>;
    }

    interface RemovePropertiesErrorPropertyGroupLookup {
      '.tag': 'property_group_lookup';
      property_group_lookup: LookUpPropertiesError;
    }

    type RemovePropertiesError = PropertiesError | RemovePropertiesErrorPropertyGroupLookup;

    interface RestoreArg {
      /**
       * The path to the file you want to restore.
       */
      path: WritePath;
      /**
       * The revision to restore for the file.
       */
      rev: Rev;
    }

    /**
     * An error occurs when downloading metadata for the file.
     */
    interface RestoreErrorPathLookup {
      '.tag': 'path_lookup';
      path_lookup: LookupError;
    }

    /**
     * An error occurs when trying to restore the file to that path.
     */
    interface RestoreErrorPathWrite {
      '.tag': 'path_write';
      path_write: WriteError;
    }

    /**
     * The revision is invalid. It may point to a different file.
     */
    interface RestoreErrorInvalidRevision {
      '.tag': 'invalid_revision';
    }

    interface RestoreErrorOther {
      '.tag': 'other';
    }

    type RestoreError = RestoreErrorPathLookup | RestoreErrorPathWrite | RestoreErrorInvalidRevision | RestoreErrorOther;

    interface SaveCopyReferenceArg {
      /**
       * A copy reference returned by copyReferenceGet().
       */
      copy_reference: string;
      /**
       * Path in the user's Dropbox that is the destination.
       */
      path: Path;
    }

    interface SaveCopyReferenceErrorPath {
      '.tag': 'path';
      path: WriteError;
    }

    /**
     * The copy reference is invalid.
     */
    interface SaveCopyReferenceErrorInvalidCopyReference {
      '.tag': 'invalid_copy_reference';
    }

    /**
     * You don't have permission to save the given copy reference. Please make
     * sure this app is same app which created the copy reference and the source
     * user is still linked to the app.
     */
    interface SaveCopyReferenceErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * The file referenced by the copy reference cannot be found.
     */
    interface SaveCopyReferenceErrorNotFound {
      '.tag': 'not_found';
    }

    /**
     * The operation would involve more than 10,000 files and folders.
     */
    interface SaveCopyReferenceErrorTooManyFiles {
      '.tag': 'too_many_files';
    }

    interface SaveCopyReferenceErrorOther {
      '.tag': 'other';
    }

    type SaveCopyReferenceError = SaveCopyReferenceErrorPath | SaveCopyReferenceErrorInvalidCopyReference | SaveCopyReferenceErrorNoPermission | SaveCopyReferenceErrorNotFound | SaveCopyReferenceErrorTooManyFiles | SaveCopyReferenceErrorOther;

    interface SaveCopyReferenceResult {
      /**
       * The metadata of the saved file or folder in the user's Dropbox.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
    }

    interface SaveUrlArg {
      /**
       * The path in Dropbox where the URL will be saved to.
       */
      path: Path;
      /**
       * The URL to be saved.
       */
      url: string;
    }

    interface SaveUrlErrorPath {
      '.tag': 'path';
      path: WriteError;
    }

    /**
     * Failed downloading the given URL.
     */
    interface SaveUrlErrorDownloadFailed {
      '.tag': 'download_failed';
    }

    /**
     * The given URL is invalid.
     */
    interface SaveUrlErrorInvalidUrl {
      '.tag': 'invalid_url';
    }

    /**
     * The file where the URL is saved to no longer exists.
     */
    interface SaveUrlErrorNotFound {
      '.tag': 'not_found';
    }

    interface SaveUrlErrorOther {
      '.tag': 'other';
    }

    type SaveUrlError = SaveUrlErrorPath | SaveUrlErrorDownloadFailed | SaveUrlErrorInvalidUrl | SaveUrlErrorNotFound | SaveUrlErrorOther;

    /**
     * Metadata of the file where the URL is saved to.
     */
    interface SaveUrlJobStatusComplete {
      '.tag': 'complete';
      complete: FileMetadata;
    }

    interface SaveUrlJobStatusFailed {
      '.tag': 'failed';
      failed: SaveUrlError;
    }

    type SaveUrlJobStatus = async.PollResultBase | SaveUrlJobStatusComplete | SaveUrlJobStatusFailed;

    /**
     * Metadata of the file where the URL is saved to.
     */
    interface SaveUrlResultComplete {
      '.tag': 'complete';
      complete: FileMetadata;
    }

    type SaveUrlResult = async.LaunchResultBase | SaveUrlResultComplete;

    interface SearchArg {
      /**
       * The path in the user's Dropbox to search. Should probably be a folder.
       */
      path: PathROrId;
      /**
       * The string to search for. The search string is split on spaces into
       * multiple tokens. For file name searching, the last token is used for
       * prefix matching (i.e. "bat c" matches "bat cave" but not "batman car").
       */
      query: string;
      /**
       * Defaults to 0.
       */
      start?: number;
      /**
       * Defaults to 100.
       */
      max_results?: number;
      /**
       * Defaults to TagRef(Union(u'SearchMode', [UnionField(u'filename', Void,
       * False), UnionField(u'filename_and_content', Void, False),
       * UnionField(u'deleted_filename', Void, False)]), u'filename').
       */
      mode?: SearchMode;
    }

    interface SearchErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    interface SearchErrorOther {
      '.tag': 'other';
    }

    type SearchError = SearchErrorPath | SearchErrorOther;

    interface SearchMatch {
      /**
       * The type of the match.
       */
      match_type: SearchMatchType;
      /**
       * The metadata for the matched file or folder.
       */
      metadata: FileMetadataReference|FolderMetadataReference|DeletedMetadataReference;
    }

    /**
     * This item was matched on its file or folder name.
     */
    interface SearchMatchTypeFilename {
      '.tag': 'filename';
    }

    /**
     * This item was matched based on its file contents.
     */
    interface SearchMatchTypeContent {
      '.tag': 'content';
    }

    /**
     * This item was matched based on both its contents and its file name.
     */
    interface SearchMatchTypeBoth {
      '.tag': 'both';
    }

    /**
     * Indicates what type of match was found for a given item.
     */
    type SearchMatchType = SearchMatchTypeFilename | SearchMatchTypeContent | SearchMatchTypeBoth;

    /**
     * Search file and folder names.
     */
    interface SearchModeFilename {
      '.tag': 'filename';
    }

    /**
     * Search file and folder names as well as file contents.
     */
    interface SearchModeFilenameAndContent {
      '.tag': 'filename_and_content';
    }

    /**
     * Search for deleted file and folder names.
     */
    interface SearchModeDeletedFilename {
      '.tag': 'deleted_filename';
    }

    type SearchMode = SearchModeFilename | SearchModeFilenameAndContent | SearchModeDeletedFilename;

    interface SearchResult {
      /**
       * A list (possibly empty) of matches for the query.
       */
      matches: Array<SearchMatch>;
      /**
       * Used for paging. If true, indicates there is another page of results
       * available that can be fetched by calling search() again.
       */
      more: boolean;
      /**
       * Used for paging. Value to set the start argument to when calling
       * search() to fetch the next page of results.
       */
      start: number;
    }

    /**
     * Sharing info for a file or folder.
     */
    interface SharingInfo {
      /**
       * True if the file or folder is inside a read-only shared folder.
       */
      read_only: boolean;
    }

    interface ThumbnailArg {
      /**
       * The path to the image file you want to thumbnail.
       */
      path: ReadPath;
      /**
       * Defaults to TagRef(Union(u'ThumbnailFormat', [UnionField(u'jpeg', Void,
       * False), UnionField(u'png', Void, False)]), u'jpeg').
       */
      format?: ThumbnailFormat;
      /**
       * Defaults to TagRef(Union(u'ThumbnailSize', [UnionField(u'w32h32', Void,
       * False), UnionField(u'w64h64', Void, False), UnionField(u'w128h128',
       * Void, False), UnionField(u'w640h480', Void, False),
       * UnionField(u'w1024h768', Void, False)]), u'w64h64').
       */
      size?: ThumbnailSize;
    }

    /**
     * An error occurs when downloading metadata for the image.
     */
    interface ThumbnailErrorPath {
      '.tag': 'path';
      path: LookupError;
    }

    /**
     * The file extension doesn't allow conversion to a thumbnail.
     */
    interface ThumbnailErrorUnsupportedExtension {
      '.tag': 'unsupported_extension';
    }

    /**
     * The image cannot be converted to a thumbnail.
     */
    interface ThumbnailErrorUnsupportedImage {
      '.tag': 'unsupported_image';
    }

    /**
     * An error occurs during thumbnail conversion.
     */
    interface ThumbnailErrorConversionError {
      '.tag': 'conversion_error';
    }

    type ThumbnailError = ThumbnailErrorPath | ThumbnailErrorUnsupportedExtension | ThumbnailErrorUnsupportedImage | ThumbnailErrorConversionError;

    interface ThumbnailFormatJpeg {
      '.tag': 'jpeg';
    }

    interface ThumbnailFormatPng {
      '.tag': 'png';
    }

    type ThumbnailFormat = ThumbnailFormatJpeg | ThumbnailFormatPng;

    /**
     * 32 by 32 px.
     */
    interface ThumbnailSizeW32h32 {
      '.tag': 'w32h32';
    }

    /**
     * 64 by 64 px.
     */
    interface ThumbnailSizeW64h64 {
      '.tag': 'w64h64';
    }

    /**
     * 128 by 128 px.
     */
    interface ThumbnailSizeW128h128 {
      '.tag': 'w128h128';
    }

    /**
     * 640 by 480 px.
     */
    interface ThumbnailSizeW640h480 {
      '.tag': 'w640h480';
    }

    /**
     * 1024 by 768.
     */
    interface ThumbnailSizeW1024h768 {
      '.tag': 'w1024h768';
    }

    type ThumbnailSize = ThumbnailSizeW32h32 | ThumbnailSizeW64h64 | ThumbnailSizeW128h128 | ThumbnailSizeW640h480 | ThumbnailSizeW1024h768;

    interface UpdatePropertiesErrorPropertyGroupLookup {
      '.tag': 'property_group_lookup';
      property_group_lookup: LookUpPropertiesError;
    }

    type UpdatePropertiesError = InvalidPropertyGroupError | UpdatePropertiesErrorPropertyGroupLookup;

    interface UpdatePropertyGroupArg {
      /**
       * A unique identifier for the file.
       */
      path: PathOrId;
      /**
       * Filled custom property templates associated with a file.
       */
      update_property_groups: Array<PropertyGroupUpdate>;
    }

    /**
     * Unable to save the uploaded contents to a file.
     */
    interface UploadErrorPath {
      '.tag': 'path';
      path: UploadWriteFailed;
    }

    interface UploadErrorOther {
      '.tag': 'other';
    }

    type UploadError = UploadErrorPath | UploadErrorOther;

    interface UploadErrorWithPropertiesPropertiesError {
      '.tag': 'properties_error';
      properties_error: InvalidPropertyGroupError;
    }

    type UploadErrorWithProperties = UploadError | UploadErrorWithPropertiesPropertiesError;

    interface UploadSessionAppendArg {
      /**
       * The file contents to be uploaded.
       */
      contents: Object;
      /**
       * Contains the upload session ID and the offset.
       */
      cursor: UploadSessionCursor;
      /**
       * Defaults to False.
       */
      close?: boolean;
    }

    interface UploadSessionCursor {
      /**
       * The file contents to be uploaded.
       */
      contents: Object;
      /**
       * The upload session ID (returned by uploadSessionStart()).
       */
      session_id: string;
      /**
       * The amount of data that has been uploaded so far. We use this to make
       * sure upload data isn't lost or duplicated in the event of a network
       * error.
       */
      offset: number;
    }

    interface UploadSessionFinishArg {
      /**
       * The file contents to be uploaded.
       */
      contents: Object;
      /**
       * Contains the upload session ID and the offset.
       */
      cursor: UploadSessionCursor;
      /**
       * Contains the path and other optional modifiers for the commit.
       */
      commit: CommitInfo;
    }

    interface UploadSessionFinishBatchArg {
      /**
       * Commit information for each file in the batch.
       */
      entries: Array<UploadSessionFinishArg>;
    }

    /**
     * The uploadSessionFinishBatch() has finished.
     */
    interface UploadSessionFinishBatchJobStatusComplete {
      '.tag': 'complete';
      complete: UploadSessionFinishBatchResult;
    }

    type UploadSessionFinishBatchJobStatus = async.PollResultBase | UploadSessionFinishBatchJobStatusComplete;

    interface UploadSessionFinishBatchLaunchComplete {
      '.tag': 'complete';
      complete: UploadSessionFinishBatchResult;
    }

    interface UploadSessionFinishBatchLaunchOther {
      '.tag': 'other';
    }

    /**
     * Result returned by uploadSessionFinishBatch() that may either launch an
     * asynchronous job or complete synchronously.
     */
    type UploadSessionFinishBatchLaunch = async.LaunchResultBase | UploadSessionFinishBatchLaunchComplete | UploadSessionFinishBatchLaunchOther;

    interface UploadSessionFinishBatchResult {
      /**
       * Commit result for each file in the batch.
       */
      entries: Array<UploadSessionFinishBatchResultEntry>;
    }

    interface UploadSessionFinishBatchResultEntrySuccess {
      '.tag': 'success';
      success: FileMetadata;
    }

    interface UploadSessionFinishBatchResultEntryFailure {
      '.tag': 'failure';
      failure: UploadSessionFinishError;
    }

    type UploadSessionFinishBatchResultEntry = UploadSessionFinishBatchResultEntrySuccess | UploadSessionFinishBatchResultEntryFailure;

    /**
     * The session arguments are incorrect; the value explains the reason.
     */
    interface UploadSessionFinishErrorLookupFailed {
      '.tag': 'lookup_failed';
      lookup_failed: UploadSessionLookupError;
    }

    /**
     * Unable to save the uploaded contents to a file.
     */
    interface UploadSessionFinishErrorPath {
      '.tag': 'path';
      path: WriteError;
    }

    /**
     * The batch request commits files into too many different shared folders.
     * Please limit your batch request to files contained in a single shared
     * folder.
     */
    interface UploadSessionFinishErrorTooManySharedFolderTargets {
      '.tag': 'too_many_shared_folder_targets';
    }

    /**
     * There are too many write operations happening in the user's Dropbox. You
     * should retry uploading this file.
     */
    interface UploadSessionFinishErrorTooManyWriteOperations {
      '.tag': 'too_many_write_operations';
    }

    interface UploadSessionFinishErrorOther {
      '.tag': 'other';
    }

    type UploadSessionFinishError = UploadSessionFinishErrorLookupFailed | UploadSessionFinishErrorPath | UploadSessionFinishErrorTooManySharedFolderTargets | UploadSessionFinishErrorTooManyWriteOperations | UploadSessionFinishErrorOther;

    /**
     * The upload session ID was not found or has expired. Upload sessions are
     * valid for 48 hours.
     */
    interface UploadSessionLookupErrorNotFound {
      '.tag': 'not_found';
    }

    /**
     * The specified offset was incorrect. See the value for the correct offset.
     * This error may occur when a previous request was received and processed
     * successfully but the client did not receive the response, e.g. due to a
     * network error.
     */
    interface UploadSessionLookupErrorIncorrectOffset {
      '.tag': 'incorrect_offset';
      incorrect_offset: UploadSessionOffsetError;
    }

    /**
     * You are attempting to append data to an upload session that has alread
     * been closed (i.e. committed).
     */
    interface UploadSessionLookupErrorClosed {
      '.tag': 'closed';
    }

    /**
     * The session must be closed before calling upload_session/finish_batch.
     */
    interface UploadSessionLookupErrorNotClosed {
      '.tag': 'not_closed';
    }

    interface UploadSessionLookupErrorOther {
      '.tag': 'other';
    }

    type UploadSessionLookupError = UploadSessionLookupErrorNotFound | UploadSessionLookupErrorIncorrectOffset | UploadSessionLookupErrorClosed | UploadSessionLookupErrorNotClosed | UploadSessionLookupErrorOther;

    interface UploadSessionOffsetError {
      /**
       * The offset up to which data has been collected.
       */
      correct_offset: number;
    }

    interface UploadSessionStartArg {
      /**
       * The file contents to be uploaded.
       */
      contents: Object;
      /**
       * Defaults to False.
       */
      close?: boolean;
    }

    interface UploadSessionStartResult {
      /**
       * A unique identifier for the upload session. Pass this to
       * uploadSessionAppendV2() and uploadSessionFinish().
       */
      session_id: string;
    }

    interface UploadWriteFailed {
      /**
       * The reason why the file couldn't be saved.
       */
      reason: WriteError;
      /**
       * The upload session ID; this may be used to retry the commit.
       */
      upload_session_id: string;
    }

    /**
     * Metadata for a video.
     */
    interface VideoMetadata extends MediaMetadata {
      /**
       * The duration of the video in milliseconds.
       */
      duration?: number;
    }

    /**
     * Reference to the VideoMetadata type, identified by the value of the .tag
     * property.
     */
    interface VideoMetadataReference extends VideoMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'video';
    }

    /**
     * There's a file in the way.
     */
    interface WriteConflictErrorFile {
      '.tag': 'file';
    }

    /**
     * There's a folder in the way.
     */
    interface WriteConflictErrorFolder {
      '.tag': 'folder';
    }

    /**
     * There's a file at an ancestor path, so we couldn't create the required
     * parent folders.
     */
    interface WriteConflictErrorFileAncestor {
      '.tag': 'file_ancestor';
    }

    interface WriteConflictErrorOther {
      '.tag': 'other';
    }

    type WriteConflictError = WriteConflictErrorFile | WriteConflictErrorFolder | WriteConflictErrorFileAncestor | WriteConflictErrorOther;

    interface WriteErrorMalformedPath {
      '.tag': 'malformed_path';
      malformed_path: MalformedPathError;
    }

    /**
     * Couldn't write to the target path because there was something in the way.
     */
    interface WriteErrorConflict {
      '.tag': 'conflict';
      conflict: WriteConflictError;
    }

    /**
     * The user doesn't have permissions to write to the target location.
     */
    interface WriteErrorNoWritePermission {
      '.tag': 'no_write_permission';
    }

    /**
     * The user doesn't have enough available space (bytes) to write more data.
     */
    interface WriteErrorInsufficientSpace {
      '.tag': 'insufficient_space';
    }

    /**
     * Dropbox will not save the file or folder because of its name.
     */
    interface WriteErrorDisallowedName {
      '.tag': 'disallowed_name';
    }

    /**
     * This endpoint cannot modify or delete team folders.
     */
    interface WriteErrorTeamFolder {
      '.tag': 'team_folder';
    }

    interface WriteErrorOther {
      '.tag': 'other';
    }

    type WriteError = WriteErrorMalformedPath | WriteErrorConflict | WriteErrorNoWritePermission | WriteErrorInsufficientSpace | WriteErrorDisallowedName | WriteErrorTeamFolder | WriteErrorOther;

    /**
     * Do not overwrite an existing file if there is a conflict. The autorename
     * strategy is to append a number to the file name. For example,
     * "document.txt" might become "document (2).txt".
     */
    interface WriteModeAdd {
      '.tag': 'add';
    }

    /**
     * Always overwrite the existing file. The autorename strategy is the same
     * as it is for add.
     */
    interface WriteModeOverwrite {
      '.tag': 'overwrite';
    }

    /**
     * Overwrite if the given "rev" matches the existing file's "rev". The
     * autorename strategy is to append the string "conflicted copy" to the file
     * name. For example, "document.txt" might become "document (conflicted
     * copy).txt" or "document (Panda's conflicted copy).txt".
     */
    interface WriteModeUpdate {
      '.tag': 'update';
      update: Rev;
    }

    /**
     * Your intent when writing a file to some path. This is used to determine
     * what constitutes a conflict and what the autorename strategy is. In some
     * situations, the conflict behavior is identical: (a) If the target path
     * doesn't refer to anything, the file is always written; no conflict. (b)
     * If the target path refers to a folder, it's always a conflict. (c) If the
     * target path refers to a file with identical contents, nothing gets
     * written; no conflict. The conflict checking differs in the case where
     * there's a file at the target path with contents different from the
     * contents you're trying to write.
     */
    type WriteMode = WriteModeAdd | WriteModeOverwrite | WriteModeUpdate;

    type Id = string;

    type ListFolderCursor = string;

    type MalformedPathError = Object;

    type Path = string;

    type PathOrId = string;

    type PathR = string;

    type PathROrId = string;

    type ReadPath = string;

    type Rev = string;

    type Sha256HexHash = string;

    type WritePath = string;

    type WritePathOrId = string;

  }

  /**
   * This namespace contains endpoints and data types for managing docs and
   * folders in Dropbox Paper.
   */
  namespace paper {
    interface AddMember {
      /**
       * Defaults to TagRef(Union(u'PaperDocPermissionLevel',
       * [UnionField(u'edit', Void, False), UnionField(u'view_and_comment',
       * Void, False), UnionField(u'other', Void, True)]), u'edit').
       */
      permission_level?: PaperDocPermissionLevel;
      /**
       * User which should be added to the Paper doc. Specify only email address
       * or Dropbox account ID.
       */
      member: sharing.MemberSelector;
    }

    interface AddPaperDocUser extends RefPaperDoc {
      /**
       * User which should be added to the Paper doc. Specify only email address
       * or Dropbox account ID.
       */
      members: Array<AddMember>;
      /**
       * A personal message that will be emailed to each successfully added
       * member.
       */
      custom_message?: string;
      /**
       * Defaults to False.
       */
      quiet?: boolean;
    }

    /**
     * Per-member result for docsUsersAdd().
     */
    interface AddPaperDocUserMemberResult {
      /**
       * One of specified input members.
       */
      member: sharing.MemberSelector;
      /**
       * The outcome of the action on this member.
       */
      result: AddPaperDocUserResult;
    }

    /**
     * User was successfully added to the Paper doc.
     */
    interface AddPaperDocUserResultSuccess {
      '.tag': 'success';
    }

    /**
     * Something unexpected happened when trying to add the user to the Paper
     * doc.
     */
    interface AddPaperDocUserResultUnknownError {
      '.tag': 'unknown_error';
    }

    /**
     * The Paper doc can be shared only with team members.
     */
    interface AddPaperDocUserResultSharingOutsideTeamDisabled {
      '.tag': 'sharing_outside_team_disabled';
    }

    /**
     * The daily limit of how many users can be added to the Paper doc was
     * reached.
     */
    interface AddPaperDocUserResultDailyLimitReached {
      '.tag': 'daily_limit_reached';
    }

    /**
     * Owner's permissions cannot be changed.
     */
    interface AddPaperDocUserResultUserIsOwner {
      '.tag': 'user_is_owner';
    }

    /**
     * User data could not be retrieved. Clients should retry.
     */
    interface AddPaperDocUserResultFailedUserDataRetrieval {
      '.tag': 'failed_user_data_retrieval';
    }

    /**
     * This user already has the correct permission to the Paper doc.
     */
    interface AddPaperDocUserResultPermissionAlreadyGranted {
      '.tag': 'permission_already_granted';
    }

    interface AddPaperDocUserResultOther {
      '.tag': 'other';
    }

    type AddPaperDocUserResult = AddPaperDocUserResultSuccess | AddPaperDocUserResultUnknownError | AddPaperDocUserResultSharingOutsideTeamDisabled | AddPaperDocUserResultDailyLimitReached | AddPaperDocUserResultUserIsOwner | AddPaperDocUserResultFailedUserDataRetrieval | AddPaperDocUserResultPermissionAlreadyGranted | AddPaperDocUserResultOther;

    interface Cursor {
      /**
       * The actual cursor value.
       */
      value: string;
      /**
       * Expiration time of value. Some cursors might have expiration time
       * assigned. This is a UTC value after which the cursor is no longer valid
       * and the API starts returning an error. If cursor expires a new one
       * needs to be obtained and pagination needs to be restarted. Some cursors
       * might be short-lived some cursors might be long-lived. This really
       * depends on the sorting type and order, e.g.: 1. on one hand, listing
       * docs created by the user, sorted by the created time ascending will
       * have undefinite expiration because the results cannot change while the
       * iteration is happening. This cursor would be suitable for long term
       * polling. 2. on the other hand, listing docs sorted by the last modified
       * time will have a very short expiration as docs do get modified very
       * often and the modified time can be changed while the iteration is
       * happening thus altering the results.
       */
      expiration?: common.DropboxTimestamp;
    }

    /**
     * The required doc was not found.
     */
    interface DocLookupErrorDocNotFound {
      '.tag': 'doc_not_found';
    }

    type DocLookupError = PaperApiBaseError | DocLookupErrorDocNotFound;

    /**
     * No change email messages unless you're the creator.
     */
    interface DocSubscriptionLevelDefault {
      '.tag': 'default';
    }

    /**
     * Ignored: Not shown in pad lists or activity and no email message is sent.
     */
    interface DocSubscriptionLevelIgnore {
      '.tag': 'ignore';
    }

    /**
     * Subscribed: Shown in pad lists and activity and change email messages are
     * sent.
     */
    interface DocSubscriptionLevelEvery {
      '.tag': 'every';
    }

    /**
     * Unsubscribed: Shown in pad lists, but not in activity and no change email
     * messages are sent.
     */
    interface DocSubscriptionLevelNoEmail {
      '.tag': 'no_email';
    }

    /**
     * The subscription level of a Paper doc.
     */
    type DocSubscriptionLevel = DocSubscriptionLevelDefault | DocSubscriptionLevelIgnore | DocSubscriptionLevelEvery | DocSubscriptionLevelNoEmail;

    /**
     * The HTML export format.
     */
    interface ExportFormatHtml {
      '.tag': 'html';
    }

    /**
     * The markdown export format.
     */
    interface ExportFormatMarkdown {
      '.tag': 'markdown';
    }

    interface ExportFormatOther {
      '.tag': 'other';
    }

    /**
     * The desired export format of the Paper doc.
     */
    type ExportFormat = ExportFormatHtml | ExportFormatMarkdown | ExportFormatOther;

    /**
     * Data structure representing a Paper folder.
     */
    interface Folder {
      /**
       * Paper folder ID. This ID uniquely identifies the folder.
       */
      id: string;
      /**
       * Paper folder name.
       */
      name: string;
    }

    /**
     * Everyone in your team and anyone directly invited can access this folder.
     */
    interface FolderSharingPolicyTypeTeam {
      '.tag': 'team';
    }

    /**
     * Only people directly invited can access this folder.
     */
    interface FolderSharingPolicyTypeInviteOnly {
      '.tag': 'invite_only';
    }

    /**
     * The sharing policy of a Paper folder.  Note: The sharing policy of
     * subfolders is inherited from the root folder.
     */
    type FolderSharingPolicyType = FolderSharingPolicyTypeTeam | FolderSharingPolicyTypeInviteOnly;

    /**
     * Not shown in activity, no email messages.
     */
    interface FolderSubscriptionLevelNone {
      '.tag': 'none';
    }

    /**
     * Shown in activity, no email messages.
     */
    interface FolderSubscriptionLevelActivityOnly {
      '.tag': 'activity_only';
    }

    /**
     * Shown in activity, daily email messages.
     */
    interface FolderSubscriptionLevelDailyEmails {
      '.tag': 'daily_emails';
    }

    /**
     * Shown in activity, weekly email messages.
     */
    interface FolderSubscriptionLevelWeeklyEmails {
      '.tag': 'weekly_emails';
    }

    /**
     * The subscription level of a Paper folder.
     */
    type FolderSubscriptionLevel = FolderSubscriptionLevelNone | FolderSubscriptionLevelActivityOnly | FolderSubscriptionLevelDailyEmails | FolderSubscriptionLevelWeeklyEmails;

    /**
     * Metadata about Paper folders containing the specififed Paper doc.
     */
    interface FoldersContainingPaperDoc {
      /**
       * The sharing policy of the folder containing the Paper doc.
       */
      folder_sharing_policy_type?: FolderSharingPolicyType;
      /**
       * The folder path. If present the first folder is the root folder.
       */
      folders?: Array<Folder>;
    }

    interface InviteeInfoWithPermissionLevel {
      /**
       * Email address invited to the Paper doc.
       */
      invitee: sharing.InviteeInfo;
      /**
       * Permission level for the invitee.
       */
      permission_level: PaperDocPermissionLevel;
    }

    interface ListDocsCursorErrorCursorError {
      '.tag': 'cursor_error';
      cursor_error: PaperApiCursorError;
    }

    interface ListDocsCursorErrorOther {
      '.tag': 'other';
    }

    type ListDocsCursorError = ListDocsCursorErrorCursorError | ListDocsCursorErrorOther;

    interface ListPaperDocsArgs {
      /**
       * Defaults to TagRef(Union(u'ListPaperDocsFilterBy',
       * [UnionField(u'docs_accessed', Void, False), UnionField(u'docs_created',
       * Void, False), UnionField(u'other', Void, True)]), u'docs_accessed').
       */
      filter_by?: ListPaperDocsFilterBy;
      /**
       * Defaults to TagRef(Union(u'ListPaperDocsSortBy',
       * [UnionField(u'accessed', Void, False), UnionField(u'modified', Void,
       * False), UnionField(u'created', Void, False), UnionField(u'other', Void,
       * True)]), u'accessed').
       */
      sort_by?: ListPaperDocsSortBy;
      /**
       * Defaults to TagRef(Union(u'ListPaperDocsSortOrder',
       * [UnionField(u'ascending', Void, False), UnionField(u'descending', Void,
       * False), UnionField(u'other', Void, True)]), u'ascending').
       */
      sort_order?: ListPaperDocsSortOrder;
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface ListPaperDocsContinueArgs {
      /**
       * The cursor obtained from docsList() or docsListContinue(). Allows for
       * pagination.
       */
      cursor: string;
    }

    /**
     * Fetches all Paper doc IDs that the user has ever accessed.
     */
    interface ListPaperDocsFilterByDocsAccessed {
      '.tag': 'docs_accessed';
    }

    /**
     * Fetches only the Paper doc IDs that the user has created.
     */
    interface ListPaperDocsFilterByDocsCreated {
      '.tag': 'docs_created';
    }

    interface ListPaperDocsFilterByOther {
      '.tag': 'other';
    }

    type ListPaperDocsFilterBy = ListPaperDocsFilterByDocsAccessed | ListPaperDocsFilterByDocsCreated | ListPaperDocsFilterByOther;

    interface ListPaperDocsResponse {
      /**
       * The list of Paper doc IDs that can be used to access the given Paper
       * docs or supplied to other API methods. The list is sorted in the order
       * specified by the initial call to docsList().
       */
      doc_ids: Array<string>;
      /**
       * Pass the cursor into docsListContinue() to paginate through all files.
       * The cursor preserves all properties as specified in the original call
       * to docsList().
       */
      cursor: Cursor;
      /**
       * Will be set to True if a subsequent call with the provided cursor to
       * docsListContinue() returns immediately with some results. If set to
       * False please allow some delay before making another call to
       * docsListContinue().
       */
      has_more: boolean;
    }

    /**
     * Sorts the Paper docs by the time they were last accessed.
     */
    interface ListPaperDocsSortByAccessed {
      '.tag': 'accessed';
    }

    /**
     * Sorts the Paper docs by the time they were last modified.
     */
    interface ListPaperDocsSortByModified {
      '.tag': 'modified';
    }

    /**
     * Sorts the Paper docs by the creation time.
     */
    interface ListPaperDocsSortByCreated {
      '.tag': 'created';
    }

    interface ListPaperDocsSortByOther {
      '.tag': 'other';
    }

    type ListPaperDocsSortBy = ListPaperDocsSortByAccessed | ListPaperDocsSortByModified | ListPaperDocsSortByCreated | ListPaperDocsSortByOther;

    /**
     * Sorts the search result in ascending order.
     */
    interface ListPaperDocsSortOrderAscending {
      '.tag': 'ascending';
    }

    /**
     * Sorts the search result in descending order.
     */
    interface ListPaperDocsSortOrderDescending {
      '.tag': 'descending';
    }

    interface ListPaperDocsSortOrderOther {
      '.tag': 'other';
    }

    type ListPaperDocsSortOrder = ListPaperDocsSortOrderAscending | ListPaperDocsSortOrderDescending | ListPaperDocsSortOrderOther;

    /**
     * The required doc was not found.
     */
    interface ListUsersCursorErrorDocNotFound {
      '.tag': 'doc_not_found';
    }

    interface ListUsersCursorErrorCursorError {
      '.tag': 'cursor_error';
      cursor_error: PaperApiCursorError;
    }

    type ListUsersCursorError = PaperApiBaseError | ListUsersCursorErrorDocNotFound | ListUsersCursorErrorCursorError;

    interface ListUsersOnFolderArgs extends RefPaperDoc {
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface ListUsersOnFolderContinueArgs extends RefPaperDoc {
      /**
       * The cursor obtained from docsFolderUsersList() or
       * docsFolderUsersListContinue(). Allows for pagination.
       */
      cursor: string;
    }

    interface ListUsersOnFolderResponse {
      /**
       * List of email addresses that are invited on the Paper folder.
       */
      invitees: Array<sharing.InviteeInfo>;
      /**
       * List of users that are invited on the Paper folder.
       */
      users: Array<sharing.UserInfo>;
      /**
       * Pass the cursor into docsFolderUsersListContinue() to paginate through
       * all users. The cursor preserves all properties as specified in the
       * original call to docsFolderUsersList().
       */
      cursor: Cursor;
      /**
       * Will be set to True if a subsequent call with the provided cursor to
       * docsFolderUsersListContinue() returns immediately with some results. If
       * set to False please allow some delay before making another call to
       * docsFolderUsersListContinue().
       */
      has_more: boolean;
    }

    interface ListUsersOnPaperDocArgs extends RefPaperDoc {
      /**
       * Defaults to 1000.
       */
      limit?: number;
      /**
       * Defaults to TagRef(Union(u'UserOnPaperDocFilter',
       * [UnionField(u'visited', Void, False), UnionField(u'shared', Void,
       * False), UnionField(u'other', Void, True)]), u'shared').
       */
      filter_by?: UserOnPaperDocFilter;
    }

    interface ListUsersOnPaperDocContinueArgs extends RefPaperDoc {
      /**
       * The cursor obtained from docsUsersList() or docsUsersListContinue().
       * Allows for pagination.
       */
      cursor: string;
    }

    interface ListUsersOnPaperDocResponse {
      /**
       * List of email addresses with their respective permission levels that
       * are invited on the Paper doc.
       */
      invitees: Array<InviteeInfoWithPermissionLevel>;
      /**
       * List of users with their respective permission levels that are invited
       * on the Paper folder.
       */
      users: Array<UserInfoWithPermissionLevel>;
      /**
       * The Paper doc owner. This field is populated on every single response.
       */
      doc_owner: sharing.UserInfo;
      /**
       * Pass the cursor into docsUsersListContinue() to paginate through all
       * users. The cursor preserves all properties as specified in the original
       * call to docsUsersList().
       */
      cursor: Cursor;
      /**
       * Will be set to True if a subsequent call with the provided cursor to
       * docsUsersListContinue() returns immediately with some results. If set
       * to False please allow some delay before making another call to
       * docsUsersListContinue().
       */
      has_more: boolean;
    }

    /**
     * Your account does not have permissions to perform this action.
     */
    interface PaperApiBaseErrorInsufficientPermissions {
      '.tag': 'insufficient_permissions';
    }

    interface PaperApiBaseErrorOther {
      '.tag': 'other';
    }

    type PaperApiBaseError = PaperApiBaseErrorInsufficientPermissions | PaperApiBaseErrorOther;

    /**
     * The provided cursor is expired.
     */
    interface PaperApiCursorErrorExpiredCursor {
      '.tag': 'expired_cursor';
    }

    /**
     * The provided cursor is invalid.
     */
    interface PaperApiCursorErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    /**
     * The provided cursor contains invalid user.
     */
    interface PaperApiCursorErrorWrongUserInCursor {
      '.tag': 'wrong_user_in_cursor';
    }

    /**
     * Indicates that the cursor has been invalidated. Call the corresponding
     * non-continue endpoint to obtain a new cursor.
     */
    interface PaperApiCursorErrorReset {
      '.tag': 'reset';
    }

    interface PaperApiCursorErrorOther {
      '.tag': 'other';
    }

    type PaperApiCursorError = PaperApiCursorErrorExpiredCursor | PaperApiCursorErrorInvalidCursor | PaperApiCursorErrorWrongUserInCursor | PaperApiCursorErrorReset | PaperApiCursorErrorOther;

    interface PaperDocExport extends RefPaperDoc {
      export_format: ExportFormat;
    }

    interface PaperDocExportResult {
      /**
       * The Paper doc owner's email address.
       */
      owner: string;
      /**
       * The Paper doc title.
       */
      title: string;
      /**
       * The Paper doc revision. Simply an ever increasing number.
       */
      revision: number;
      /**
       * MIME type of the export. This corresponds to paper.ExportFormat
       * specified in the request.
       */
      mime_type: string;
    }

    /**
     * User will be granted edit permissions.
     */
    interface PaperDocPermissionLevelEdit {
      '.tag': 'edit';
    }

    /**
     * User will be granted view and comment permissions.
     */
    interface PaperDocPermissionLevelViewAndComment {
      '.tag': 'view_and_comment';
    }

    interface PaperDocPermissionLevelOther {
      '.tag': 'other';
    }

    type PaperDocPermissionLevel = PaperDocPermissionLevelEdit | PaperDocPermissionLevelViewAndComment | PaperDocPermissionLevelOther;

    interface PaperDocSharingPolicy extends RefPaperDoc {
      /**
       * The default sharing policy to be set for the Paper doc.
       */
      sharing_policy: SharingPolicy;
    }

    interface RefPaperDoc {
      /**
       * The Paper doc ID.
       */
      doc_id: PaperDocId;
    }

    interface RemovePaperDocUser extends RefPaperDoc {
      /**
       * User which should be removed from the Paper doc. Specify only email
       * address or Dropbox account ID.
       */
      member: sharing.MemberSelector;
    }

    /**
     * Sharing policy of Paper doc.
     */
    interface SharingPolicy {
      /**
       * This value applies to the non-team members.
       */
      public_sharing_policy?: SharingPublicPolicyType;
      /**
       * This value applies to the team members only. The value is null for all
       * personal accounts.
       */
      team_sharing_policy?: SharingTeamPolicyType;
    }

    /**
     * Value used to indicate that doc sharing is enabled only within team.
     */
    interface SharingPublicPolicyTypeDisabled {
      '.tag': 'disabled';
    }

    type SharingPublicPolicyType = SharingTeamPolicyType | SharingPublicPolicyTypeDisabled;

    /**
     * Users who have a link to this doc can edit it.
     */
    interface SharingTeamPolicyTypePeopleWithLinkCanEdit {
      '.tag': 'people_with_link_can_edit';
    }

    /**
     * Users who have a link to this doc can view and comment on it.
     */
    interface SharingTeamPolicyTypePeopleWithLinkCanViewAndComment {
      '.tag': 'people_with_link_can_view_and_comment';
    }

    /**
     * Users must be explicitly invited to this doc.
     */
    interface SharingTeamPolicyTypeInviteOnly {
      '.tag': 'invite_only';
    }

    /**
     * The sharing policy type of the Paper doc.
     */
    type SharingTeamPolicyType = SharingTeamPolicyTypePeopleWithLinkCanEdit | SharingTeamPolicyTypePeopleWithLinkCanViewAndComment | SharingTeamPolicyTypeInviteOnly;

    interface UserInfoWithPermissionLevel {
      /**
       * User shared on the Paper doc.
       */
      user: sharing.UserInfo;
      /**
       * Permission level for the user.
       */
      permission_level: PaperDocPermissionLevel;
    }

    /**
     * all users who have visited the Paper doc.
     */
    interface UserOnPaperDocFilterVisited {
      '.tag': 'visited';
    }

    /**
     * All uses who are shared on the Paper doc. This includes all users who
     * have visited the Paper doc as well as those who have not.
     */
    interface UserOnPaperDocFilterShared {
      '.tag': 'shared';
    }

    interface UserOnPaperDocFilterOther {
      '.tag': 'other';
    }

    type UserOnPaperDocFilter = UserOnPaperDocFilterVisited | UserOnPaperDocFilterShared | UserOnPaperDocFilterOther;

    type PaperDocId = string;

  }

  /**
   * This namespace contains helper entities for property and property/template
   * endpoints.
   */
  namespace properties {
    interface GetPropertyTemplateArg {
      /**
       * An identifier for property template added by route
       * properties/template/add.
       */
      template_id: TemplateId;
    }

    /**
     * The Property template for the specified template.
     */
    interface GetPropertyTemplateResult extends PropertyGroupTemplate {
    }

    interface ListPropertyTemplateIds {
      /**
       * List of identifiers for templates added by route
       * properties/template/add.
       */
      template_ids: Array<TemplateId>;
    }

    /**
     * A property field name already exists in the template.
     */
    interface ModifyPropertyTemplateErrorConflictingPropertyNames {
      '.tag': 'conflicting_property_names';
    }

    /**
     * There are too many properties in the changed template. The maximum number
     * of properties per template is 32.
     */
    interface ModifyPropertyTemplateErrorTooManyProperties {
      '.tag': 'too_many_properties';
    }

    /**
     * There are too many templates for the team.
     */
    interface ModifyPropertyTemplateErrorTooManyTemplates {
      '.tag': 'too_many_templates';
    }

    /**
     * The template name, description or field names is too large.
     */
    interface ModifyPropertyTemplateErrorTemplateAttributeTooLarge {
      '.tag': 'template_attribute_too_large';
    }

    type ModifyPropertyTemplateError = PropertyTemplateError | ModifyPropertyTemplateErrorConflictingPropertyNames | ModifyPropertyTemplateErrorTooManyProperties | ModifyPropertyTemplateErrorTooManyTemplates | ModifyPropertyTemplateErrorTemplateAttributeTooLarge;

    interface PropertyField {
      /**
       * This is the name or key of a custom property in a property template.
       * File property names can be up to 256 bytes.
       */
      name: string;
      /**
       * Value of a custom property attached to a file. Values can be up to 1024
       * bytes.
       */
      value: string;
    }

    /**
     * Describe a single property field type which that can be part of a
     * property template.
     */
    interface PropertyFieldTemplate {
      /**
       * This is the name or key of a custom property in a property template.
       * File property names can be up to 256 bytes.
       */
      name: string;
      /**
       * This is the description for a custom property in a property template.
       * File property description can be up to 1024 bytes.
       */
      description: string;
      /**
       * This is the data type of the value of this property. This type will be
       * enforced upon property creation and modifications.
       */
      type: PropertyType;
    }

    /**
     * Collection of custom properties in filled property templates.
     */
    interface PropertyGroup {
      /**
       * A unique identifier for a property template type.
       */
      template_id: TemplateId;
      /**
       * This is a list of custom properties associated with a file. There can
       * be up to 32 properties for a template.
       */
      fields: Array<PropertyField>;
    }

    /**
     * Describes property templates that can be filled and associated with a
     * file.
     */
    interface PropertyGroupTemplate {
      /**
       * A display name for the property template. Property template names can
       * be up to 256 bytes.
       */
      name: string;
      /**
       * Description for new property template. Property template descriptions
       * can be up to 1024 bytes.
       */
      description: string;
      /**
       * This is a list of custom properties associated with a property
       * template. There can be up to 64 properties in a single property
       * template.
       */
      fields: Array<PropertyFieldTemplate>;
    }

    /**
     * Property template does not exist for given identifier.
     */
    interface PropertyTemplateErrorTemplateNotFound {
      '.tag': 'template_not_found';
      template_not_found: TemplateId;
    }

    /**
     * You do not have the permissions to modify this property template.
     */
    interface PropertyTemplateErrorRestrictedContent {
      '.tag': 'restricted_content';
    }

    interface PropertyTemplateErrorOther {
      '.tag': 'other';
    }

    type PropertyTemplateError = PropertyTemplateErrorTemplateNotFound | PropertyTemplateErrorRestrictedContent | PropertyTemplateErrorOther;

    /**
     * The associated property will be of type string. Unicode is supported.
     */
    interface PropertyTypeString {
      '.tag': 'string';
    }

    interface PropertyTypeOther {
      '.tag': 'other';
    }

    /**
     * Data type of the given property added. This endpoint is in beta and  only
     * properties of type strings is supported.
     */
    type PropertyType = PropertyTypeString | PropertyTypeOther;

    type TemplateId = string;

  }

  /**
   * This namespace contains endpoints and data types for creating and managing
   * shared links and shared folders.
   */
  namespace sharing {
    /**
     * The collaborator is the owner of the shared folder. Owners can view and
     * edit the shared folder as well as set the folder's policies using
     * updateFolderPolicy().
     */
    interface AccessLevelOwner {
      '.tag': 'owner';
    }

    /**
     * The collaborator can both view and edit the shared folder.
     */
    interface AccessLevelEditor {
      '.tag': 'editor';
    }

    /**
     * The collaborator can only view the shared folder.
     */
    interface AccessLevelViewer {
      '.tag': 'viewer';
    }

    /**
     * The collaborator can only view the shared folder and does not have any
     * access to comments.
     */
    interface AccessLevelViewerNoComment {
      '.tag': 'viewer_no_comment';
    }

    interface AccessLevelOther {
      '.tag': 'other';
    }

    /**
     * Defines the access levels for collaborators.
     */
    type AccessLevel = AccessLevelOwner | AccessLevelEditor | AccessLevelViewer | AccessLevelViewerNoComment | AccessLevelOther;

    /**
     * Only the owner can update the ACL.
     */
    interface AclUpdatePolicyOwner {
      '.tag': 'owner';
    }

    /**
     * Any editor can update the ACL. This may be further restricted to editors
     * on the same team.
     */
    interface AclUpdatePolicyEditors {
      '.tag': 'editors';
    }

    interface AclUpdatePolicyOther {
      '.tag': 'other';
    }

    /**
     * Who can change a shared folder's access control list (ACL). In other
     * words, who can add, remove, or change the privileges of members.
     */
    type AclUpdatePolicy = AclUpdatePolicyOwner | AclUpdatePolicyEditors | AclUpdatePolicyOther;

    /**
     * Arguments for addFileMember().
     */
    interface AddFileMemberArgs {
      /**
       * File to which to add members.
       */
      file: PathOrId;
      /**
       * Members to add. Note that even an email address is given, this may
       * result in a user being directy added to the membership if that email is
       * the user's main account email.
       */
      members: Array<MemberSelector>;
      /**
       * Message to send to added members in their invitation.
       */
      custom_message?: string;
      /**
       * Defaults to False.
       */
      quiet?: boolean;
      /**
       * Defaults to TagRef(Union(u'AccessLevel', [UnionField(u'owner', Void,
       * False), UnionField(u'editor', Void, False), UnionField(u'viewer', Void,
       * False), UnionField(u'viewer_no_comment', Void, False),
       * UnionField(u'other', Void, True)]), u'viewer').
       */
      access_level?: AccessLevel;
      /**
       * Defaults to False.
       */
      add_message_as_comment?: boolean;
    }

    interface AddFileMemberErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    interface AddFileMemberErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    /**
     * The user has reached the rate limit for invitations.
     */
    interface AddFileMemberErrorRateLimit {
      '.tag': 'rate_limit';
    }

    /**
     * The custom message did not pass comment permissions checks.
     */
    interface AddFileMemberErrorInvalidComment {
      '.tag': 'invalid_comment';
    }

    interface AddFileMemberErrorOther {
      '.tag': 'other';
    }

    /**
     * Errors for addFileMember().
     */
    type AddFileMemberError = AddFileMemberErrorUserError | AddFileMemberErrorAccessError | AddFileMemberErrorRateLimit | AddFileMemberErrorInvalidComment | AddFileMemberErrorOther;

    interface AddFolderMemberArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * The intended list of members to add.  Added members will receive
       * invites to join the shared folder.
       */
      members: Array<AddMember>;
      /**
       * Defaults to False.
       */
      quiet?: boolean;
      /**
       * Optional message to display to added members in their invitation.
       */
      custom_message?: string;
    }

    /**
     * Unable to access shared folder.
     */
    interface AddFolderMemberErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * The current user's e-mail address is unverified.
     */
    interface AddFolderMemberErrorEmailUnverified {
      '.tag': 'email_unverified';
    }

    /**
     * AddFolderMemberArg.members contains a bad invitation recipient.
     */
    interface AddFolderMemberErrorBadMember {
      '.tag': 'bad_member';
      bad_member: AddMemberSelectorError;
    }

    /**
     * Your team policy does not allow sharing outside of the team.
     */
    interface AddFolderMemberErrorCantShareOutsideTeam {
      '.tag': 'cant_share_outside_team';
    }

    /**
     * The value is the member limit that was reached.
     */
    interface AddFolderMemberErrorTooManyMembers {
      '.tag': 'too_many_members';
      too_many_members: number;
    }

    /**
     * The value is the pending invite limit that was reached.
     */
    interface AddFolderMemberErrorTooManyPendingInvites {
      '.tag': 'too_many_pending_invites';
      too_many_pending_invites: number;
    }

    /**
     * The current user has hit the limit of invites they can send per day. Try
     * again in 24 hours.
     */
    interface AddFolderMemberErrorRateLimit {
      '.tag': 'rate_limit';
    }

    /**
     * The current user is trying to share with too many people at once.
     */
    interface AddFolderMemberErrorTooManyInvitees {
      '.tag': 'too_many_invitees';
    }

    /**
     * The current user's account doesn't support this action. An example of
     * this is when adding a read-only member. This action can only be performed
     * by users that have upgraded to a Pro or Business plan.
     */
    interface AddFolderMemberErrorInsufficientPlan {
      '.tag': 'insufficient_plan';
    }

    /**
     * This action cannot be performed on a team shared folder.
     */
    interface AddFolderMemberErrorTeamFolder {
      '.tag': 'team_folder';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface AddFolderMemberErrorNoPermission {
      '.tag': 'no_permission';
    }

    interface AddFolderMemberErrorOther {
      '.tag': 'other';
    }

    type AddFolderMemberError = AddFolderMemberErrorAccessError | AddFolderMemberErrorEmailUnverified | AddFolderMemberErrorBadMember | AddFolderMemberErrorCantShareOutsideTeam | AddFolderMemberErrorTooManyMembers | AddFolderMemberErrorTooManyPendingInvites | AddFolderMemberErrorRateLimit | AddFolderMemberErrorTooManyInvitees | AddFolderMemberErrorInsufficientPlan | AddFolderMemberErrorTeamFolder | AddFolderMemberErrorNoPermission | AddFolderMemberErrorOther;

    /**
     * The member and type of access the member should have when added to a
     * shared folder.
     */
    interface AddMember {
      /**
       * The member to add to the shared folder.
       */
      member: MemberSelector;
      /**
       * Defaults to TagRef(Union(u'AccessLevel', [UnionField(u'owner', Void,
       * False), UnionField(u'editor', Void, False), UnionField(u'viewer', Void,
       * False), UnionField(u'viewer_no_comment', Void, False),
       * UnionField(u'other', Void, True)]), u'viewer').
       */
      access_level?: AccessLevel;
    }

    /**
     * Automatically created groups can only be added to team folders.
     */
    interface AddMemberSelectorErrorAutomaticGroup {
      '.tag': 'automatic_group';
    }

    /**
     * The value is the ID that could not be identified.
     */
    interface AddMemberSelectorErrorInvalidDropboxId {
      '.tag': 'invalid_dropbox_id';
      invalid_dropbox_id: DropboxId;
    }

    /**
     * The value is the e-email address that is malformed.
     */
    interface AddMemberSelectorErrorInvalidEmail {
      '.tag': 'invalid_email';
      invalid_email: common.EmailAddress;
    }

    /**
     * The value is the ID of the Dropbox user with an unverified e-mail
     * address.  Invite unverified users by e-mail address instead of by their
     * Dropbox ID.
     */
    interface AddMemberSelectorErrorUnverifiedDropboxId {
      '.tag': 'unverified_dropbox_id';
      unverified_dropbox_id: DropboxId;
    }

    /**
     * At least one of the specified groups in AddFolderMemberArg.members is
     * deleted.
     */
    interface AddMemberSelectorErrorGroupDeleted {
      '.tag': 'group_deleted';
    }

    /**
     * Sharing to a group that is not on the current user's team.
     */
    interface AddMemberSelectorErrorGroupNotOnTeam {
      '.tag': 'group_not_on_team';
    }

    interface AddMemberSelectorErrorOther {
      '.tag': 'other';
    }

    type AddMemberSelectorError = AddMemberSelectorErrorAutomaticGroup | AddMemberSelectorErrorInvalidDropboxId | AddMemberSelectorErrorInvalidEmail | AddMemberSelectorErrorUnverifiedDropboxId | AddMemberSelectorErrorGroupDeleted | AddMemberSelectorErrorGroupNotOnTeam | AddMemberSelectorErrorOther;

    /**
     * Information about the content that has a link audience different than
     * that of this folder.
     */
    interface AudienceExceptionContentInfo {
      /**
       * The name of the content, which is either a file or a folder.
       */
      name: string;
    }

    /**
     * The total count and truncated list of information of content inside this
     * folder that has a different audience than the link on this folder. This
     * is only returned for folders.
     */
    interface AudienceExceptions {
      count: number;
      /**
       * A truncated list of some of the content that is an exception. The
       * length of this list could be smaller than the count since it is only a
       * sample but will not be empty as long as count is not 0.
       */
      exceptions: Array<AudienceExceptionContentInfo>;
    }

    /**
     * Information about the shared folder that prevents the link audience for
     * this link from being more restrictive.
     */
    interface AudienceRestrictingSharedFolder {
      /**
       * The ID of the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * The name of the shared folder.
       */
      name: string;
      /**
       * The link audience of the shared folder.
       */
      audience: LinkAudience;
    }

    /**
     * Arguments for changeFileMemberAccess().
     */
    interface ChangeFileMemberAccessArgs {
      /**
       * File for which we are changing a member's access.
       */
      file: PathOrId;
      /**
       * The member whose access we are changing.
       */
      member: MemberSelector;
      /**
       * The new access level for the member.
       */
      access_level: AccessLevel;
    }

    /**
     * Metadata for a collection-based shared link.
     */
    interface CollectionLinkMetadata extends LinkMetadata {
    }

    /**
     * Reference to the CollectionLinkMetadata type, identified by the value of
     * the .tag property.
     */
    interface CollectionLinkMetadataReference extends CollectionLinkMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'collection';
    }

    interface CreateSharedLinkArg {
      /**
       * The path to share.
       */
      path: string;
      /**
       * Defaults to False.
       */
      short_url?: boolean;
      /**
       * If it's okay to share a path that does not yet exist, set this to
       * either PendingUploadMode.file or PendingUploadMode.folder to indicate
       * whether to assume it's a file or folder.
       */
      pending_upload?: PendingUploadMode;
    }

    interface CreateSharedLinkErrorPath {
      '.tag': 'path';
      path: files.LookupError;
    }

    interface CreateSharedLinkErrorOther {
      '.tag': 'other';
    }

    type CreateSharedLinkError = CreateSharedLinkErrorPath | CreateSharedLinkErrorOther;

    interface CreateSharedLinkWithSettingsArg {
      /**
       * The path to be shared by the shared link
       */
      path: ReadPath;
      /**
       * The requested settings for the newly created shared link
       */
      settings?: SharedLinkSettings;
    }

    interface CreateSharedLinkWithSettingsErrorPath {
      '.tag': 'path';
      path: files.LookupError;
    }

    /**
     * User's email should be verified
     */
    interface CreateSharedLinkWithSettingsErrorEmailNotVerified {
      '.tag': 'email_not_verified';
    }

    /**
     * The shared link already exists. You can call listSharedLinks() to get the
     * existing link.
     */
    interface CreateSharedLinkWithSettingsErrorSharedLinkAlreadyExists {
      '.tag': 'shared_link_already_exists';
    }

    /**
     * There is an error with the given settings
     */
    interface CreateSharedLinkWithSettingsErrorSettingsError {
      '.tag': 'settings_error';
      settings_error: SharedLinkSettingsError;
    }

    /**
     * Access to the requested path is forbidden
     */
    interface CreateSharedLinkWithSettingsErrorAccessDenied {
      '.tag': 'access_denied';
    }

    type CreateSharedLinkWithSettingsError = CreateSharedLinkWithSettingsErrorPath | CreateSharedLinkWithSettingsErrorEmailNotVerified | CreateSharedLinkWithSettingsErrorSharedLinkAlreadyExists | CreateSharedLinkWithSettingsErrorSettingsError | CreateSharedLinkWithSettingsErrorAccessDenied;

    /**
     * The expected metadata of a shared link for a file or folder when a link
     * is first created for the content. Absent if the link already exists.
     */
    interface ExpectedSharedContentLinkMetadata extends SharedContentLinkMetadataBase {
    }

    /**
     * Disable viewer information on the file.
     */
    interface FileActionDisableViewerInfo {
      '.tag': 'disable_viewer_info';
    }

    /**
     * Change or edit contents of the file.
     */
    interface FileActionEditContents {
      '.tag': 'edit_contents';
    }

    /**
     * Enable viewer information on the file.
     */
    interface FileActionEnableViewerInfo {
      '.tag': 'enable_viewer_info';
    }

    /**
     * Add a member with view permissions.
     */
    interface FileActionInviteViewer {
      '.tag': 'invite_viewer';
    }

    /**
     * Add a member with view permissions but no comment permissions.
     */
    interface FileActionInviteViewerNoComment {
      '.tag': 'invite_viewer_no_comment';
    }

    /**
     * Stop sharing this file.
     */
    interface FileActionUnshare {
      '.tag': 'unshare';
    }

    /**
     * Relinquish one's own membership to the file.
     */
    interface FileActionRelinquishMembership {
      '.tag': 'relinquish_membership';
    }

    /**
     * This action is deprecated. Use create_link instead.
     */
    interface FileActionShareLink {
      '.tag': 'share_link';
    }

    /**
     * Create a shared link to the file.
     */
    interface FileActionCreateLink {
      '.tag': 'create_link';
    }

    interface FileActionOther {
      '.tag': 'other';
    }

    /**
     * Sharing actions that may be taken on files.
     */
    type FileAction = FileActionDisableViewerInfo | FileActionEditContents | FileActionEnableViewerInfo | FileActionInviteViewer | FileActionInviteViewerNoComment | FileActionUnshare | FileActionRelinquishMembership | FileActionShareLink | FileActionCreateLink | FileActionOther;

    /**
     * File specified by id was not found.
     */
    interface FileErrorResultFileNotFoundError {
      '.tag': 'file_not_found_error';
      file_not_found_error: files.Id;
    }

    /**
     * User does not have permission to take the specified action on the file.
     */
    interface FileErrorResultInvalidFileActionError {
      '.tag': 'invalid_file_action_error';
      invalid_file_action_error: files.Id;
    }

    /**
     * User does not have permission to access file specified by file.Id.
     */
    interface FileErrorResultPermissionDeniedError {
      '.tag': 'permission_denied_error';
      permission_denied_error: files.Id;
    }

    interface FileErrorResultOther {
      '.tag': 'other';
    }

    type FileErrorResult = FileErrorResultFileNotFoundError | FileErrorResultInvalidFileActionError | FileErrorResultPermissionDeniedError | FileErrorResultOther;

    /**
     * The metadata of a file shared link
     */
    interface FileLinkMetadata extends SharedLinkMetadata {
      /**
       * The modification time set by the desktop client when the file was added
       * to Dropbox. Since this time is not verified (the Dropbox server stores
       * whatever the desktop client sends up), this should only be used for
       * display purposes (such as sorting) and not, for example, to determine
       * if a file has changed or not.
       */
      client_modified: common.DropboxTimestamp;
      /**
       * The last time the file was modified on Dropbox.
       */
      server_modified: common.DropboxTimestamp;
      /**
       * A unique identifier for the current revision of a file. This field is
       * the same rev as elsewhere in the API and can be used to detect changes
       * and avoid conflicts.
       */
      rev: Rev;
      /**
       * The file size in bytes.
       */
      size: number;
    }

    /**
     * Reference to the FileLinkMetadata type, identified by the value of the
     * .tag property.
     */
    interface FileLinkMetadataReference extends FileLinkMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'file';
    }

    /**
     * Specified member was not found.
     */
    interface FileMemberActionErrorInvalidMember {
      '.tag': 'invalid_member';
    }

    /**
     * User does not have permission to perform this action on this member.
     */
    interface FileMemberActionErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * Specified file was invalid or user does not have access.
     */
    interface FileMemberActionErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    /**
     * The action cannot be completed because the target member does not have
     * explicit access to the file. The return value is the access that the
     * member has to the file from a parent folder.
     */
    interface FileMemberActionErrorNoExplicitAccess {
      '.tag': 'no_explicit_access';
      no_explicit_access: MemberAccessLevelResult;
    }

    interface FileMemberActionErrorOther {
      '.tag': 'other';
    }

    type FileMemberActionError = FileMemberActionErrorInvalidMember | FileMemberActionErrorNoPermission | FileMemberActionErrorAccessError | FileMemberActionErrorNoExplicitAccess | FileMemberActionErrorOther;

    /**
     * Member was successfully removed from this file. If AccessLevel is given,
     * the member still has access via a parent shared folder.
     */
    interface FileMemberActionIndividualResultSuccess {
      '.tag': 'success';
      success: Object;
    }

    /**
     * User was not able to perform this action.
     */
    interface FileMemberActionIndividualResultMemberError {
      '.tag': 'member_error';
      member_error: FileMemberActionError;
    }

    type FileMemberActionIndividualResult = FileMemberActionIndividualResultSuccess | FileMemberActionIndividualResultMemberError;

    /**
     * Per-member result for addFileMember() or changeFileMemberAccess().
     */
    interface FileMemberActionResult {
      /**
       * One of specified input members.
       */
      member: MemberSelector;
      /**
       * The outcome of the action on this member.
       */
      result: FileMemberActionIndividualResult;
    }

    /**
     * Member was successfully removed from this file.
     */
    interface FileMemberRemoveActionResultSuccess {
      '.tag': 'success';
      success: MemberAccessLevelResult;
    }

    /**
     * User was not able to remove this member.
     */
    interface FileMemberRemoveActionResultMemberError {
      '.tag': 'member_error';
      member_error: FileMemberActionError;
    }

    interface FileMemberRemoveActionResultOther {
      '.tag': 'other';
    }

    type FileMemberRemoveActionResult = FileMemberRemoveActionResultSuccess | FileMemberRemoveActionResultMemberError | FileMemberRemoveActionResultOther;

    /**
     * Whether the user is allowed to take the sharing action on the file.
     */
    interface FilePermission {
      /**
       * The action that the user may wish to take on the file.
       */
      action: FileAction;
      /**
       * True if the user is allowed to take the action.
       */
      allow: boolean;
      /**
       * The reason why the user is denied the permission. Not present if the
       * action is allowed.
       */
      reason?: PermissionDeniedReason;
    }

    /**
     * Change folder options, such as who can be invited to join the folder.
     */
    interface FolderActionChangeOptions {
      '.tag': 'change_options';
    }

    /**
     * Disable viewer information for this folder.
     */
    interface FolderActionDisableViewerInfo {
      '.tag': 'disable_viewer_info';
    }

    /**
     * Change or edit contents of the folder.
     */
    interface FolderActionEditContents {
      '.tag': 'edit_contents';
    }

    /**
     * Enable viewer information on the folder.
     */
    interface FolderActionEnableViewerInfo {
      '.tag': 'enable_viewer_info';
    }

    /**
     * Invite a user or group to join the folder with read and write permission.
     */
    interface FolderActionInviteEditor {
      '.tag': 'invite_editor';
    }

    /**
     * Invite a user or group to join the folder with read permission.
     */
    interface FolderActionInviteViewer {
      '.tag': 'invite_viewer';
    }

    /**
     * Invite a user or group to join the folder with read permission but no
     * comment permissions.
     */
    interface FolderActionInviteViewerNoComment {
      '.tag': 'invite_viewer_no_comment';
    }

    /**
     * Relinquish one's own membership in the folder.
     */
    interface FolderActionRelinquishMembership {
      '.tag': 'relinquish_membership';
    }

    /**
     * Unmount the folder.
     */
    interface FolderActionUnmount {
      '.tag': 'unmount';
    }

    /**
     * Stop sharing this folder.
     */
    interface FolderActionUnshare {
      '.tag': 'unshare';
    }

    /**
     * Keep a copy of the contents upon leaving or being kicked from the folder.
     */
    interface FolderActionLeaveACopy {
      '.tag': 'leave_a_copy';
    }

    /**
     * This action is deprecated. Use create_link instead.
     */
    interface FolderActionShareLink {
      '.tag': 'share_link';
    }

    /**
     * Create a shared link for folder.
     */
    interface FolderActionCreateLink {
      '.tag': 'create_link';
    }

    interface FolderActionOther {
      '.tag': 'other';
    }

    /**
     * Actions that may be taken on shared folders.
     */
    type FolderAction = FolderActionChangeOptions | FolderActionDisableViewerInfo | FolderActionEditContents | FolderActionEnableViewerInfo | FolderActionInviteEditor | FolderActionInviteViewer | FolderActionInviteViewerNoComment | FolderActionRelinquishMembership | FolderActionUnmount | FolderActionUnshare | FolderActionLeaveACopy | FolderActionShareLink | FolderActionCreateLink | FolderActionOther;

    /**
     * The metadata of a folder shared link
     */
    interface FolderLinkMetadata extends SharedLinkMetadata {
    }

    /**
     * Reference to the FolderLinkMetadata type, identified by the value of the
     * .tag property.
     */
    interface FolderLinkMetadataReference extends FolderLinkMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'folder';
    }

    /**
     * Whether the user is allowed to take the action on the shared folder.
     */
    interface FolderPermission {
      /**
       * The action that the user may wish to take on the folder.
       */
      action: FolderAction;
      /**
       * True if the user is allowed to take the action.
       */
      allow: boolean;
      /**
       * The reason why the user is denied the permission. Not present if the
       * action is allowed, or if no reason is available.
       */
      reason?: PermissionDeniedReason;
    }

    /**
     * A set of policies governing membership and privileges for a shared
     * folder.
     */
    interface FolderPolicy {
      /**
       * Who can be a member of this shared folder, as set on the folder itself.
       * The effective policy may differ from this value if the team-wide policy
       * is more restrictive. Present only if the folder is owned by a team.
       */
      member_policy?: MemberPolicy;
      /**
       * Who can be a member of this shared folder, taking into account both the
       * folder and the team-wide policy. This value may differ from that of
       * member_policy if the team-wide policy is more restrictive than the
       * folder policy. Present only if the folder is owned by a team.
       */
      resolved_member_policy?: MemberPolicy;
      /**
       * Who can add and remove members from this shared folder.
       */
      acl_update_policy: AclUpdatePolicy;
      /**
       * Who links can be shared with.
       */
      shared_link_policy: SharedLinkPolicy;
      /**
       * Who can enable/disable viewer info for this shared folder.
       */
      viewer_info_policy?: ViewerInfoPolicy;
    }

    /**
     * Arguments of getFileMetadata().
     */
    interface GetFileMetadataArg {
      /**
       * The file to query.
       */
      file: PathOrId;
      /**
       * A list of `FileAction`s corresponding to `FilePermission`s that should
       * appear in the  response's SharedFileMetadata.permissions field
       * describing the actions the  authenticated user can perform on the file.
       */
      actions?: Array<FileAction>;
    }

    /**
     * Arguments of getFileMetadataBatch().
     */
    interface GetFileMetadataBatchArg {
      /**
       * The files to query.
       */
      files: Array<PathOrId>;
      /**
       * A list of `FileAction`s corresponding to `FilePermission`s that should
       * appear in the  response's SharedFileMetadata.permissions field
       * describing the actions the  authenticated user can perform on the file.
       */
      actions?: Array<FileAction>;
    }

    /**
     * Per file results of getFileMetadataBatch().
     */
    interface GetFileMetadataBatchResult {
      /**
       * This is the input file identifier corresponding to one of
       * GetFileMetadataBatchArg.files.
       */
      file: PathOrId;
      /**
       * The result for this particular file.
       */
      result: GetFileMetadataIndividualResult;
    }

    interface GetFileMetadataErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    interface GetFileMetadataErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    interface GetFileMetadataErrorOther {
      '.tag': 'other';
    }

    /**
     * Error result for getFileMetadata().
     */
    type GetFileMetadataError = GetFileMetadataErrorUserError | GetFileMetadataErrorAccessError | GetFileMetadataErrorOther;

    /**
     * The result for this file if it was successful.
     */
    interface GetFileMetadataIndividualResultMetadata {
      '.tag': 'metadata';
      metadata: SharedFileMetadata;
    }

    /**
     * The result for this file if it was an error.
     */
    interface GetFileMetadataIndividualResultAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    interface GetFileMetadataIndividualResultOther {
      '.tag': 'other';
    }

    type GetFileMetadataIndividualResult = GetFileMetadataIndividualResultMetadata | GetFileMetadataIndividualResultAccessError | GetFileMetadataIndividualResultOther;

    interface GetMetadataArgs {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * A list of `FolderAction`s corresponding to `FolderPermission`s that
       * should appear in the  response's SharedFolderMetadata.permissions field
       * describing the actions the  authenticated user can perform on the
       * folder.
       */
      actions?: Array<FolderAction>;
    }

    /**
     * Directories cannot be retrieved by this endpoint.
     */
    interface GetSharedLinkFileErrorSharedLinkIsDirectory {
      '.tag': 'shared_link_is_directory';
    }

    type GetSharedLinkFileError = SharedLinkError | GetSharedLinkFileErrorSharedLinkIsDirectory;

    interface GetSharedLinkMetadataArg {
      /**
       * URL of the shared link.
       */
      url: string;
      /**
       * If the shared link is to a folder, this parameter can be used to
       * retrieve the metadata for a specific file or sub-folder in this folder.
       * A relative path should be used.
       */
      path?: Path;
      /**
       * If the shared link has a password, this parameter can be used.
       */
      link_password?: string;
    }

    interface GetSharedLinksArg {
      /**
       * See getSharedLinks() description.
       */
      path?: string;
    }

    interface GetSharedLinksErrorPath {
      '.tag': 'path';
      path: files.MalformedPathError;
    }

    interface GetSharedLinksErrorOther {
      '.tag': 'other';
    }

    type GetSharedLinksError = GetSharedLinksErrorPath | GetSharedLinksErrorOther;

    interface GetSharedLinksResult {
      /**
       * Shared links applicable to the path argument.
       */
      links: Array<PathLinkMetadataReference|CollectionLinkMetadataReference|LinkMetadataReference>;
    }

    /**
     * The information about a group. Groups is a way to manage a list of users
     * who need same access permission to the shared folder.
     */
    interface GroupInfo extends team_common.GroupSummary {
      /**
       * The type of group.
       */
      group_type: team_common.GroupType;
      /**
       * If the current user is a member of the group.
       */
      is_member: boolean;
      /**
       * If the current user is an owner of the group.
       */
      is_owner: boolean;
      /**
       * If the group is owned by the current user's team.
       */
      same_team: boolean;
    }

    /**
     * The information about a group member of the shared content.
     */
    interface GroupMembershipInfo extends MembershipInfo {
      /**
       * The information about the membership group.
       */
      group: GroupInfo;
    }

    interface InsufficientPlan {
      /**
       * A message to tell the user to upgrade in order to support expected
       * action.
       */
      message: string;
      /**
       * A URL to send the user to in order to obtain the account type they
       * need, e.g. upgrading. Absent if there is no action the user can take to
       * upgrade.
       */
      upsell_url?: string;
    }

    interface InsufficientQuotaAmounts {
      /**
       * The amount of space needed to add the item (the size of the item).
       */
      space_needed: number;
      /**
       * The amount of extra space needed to add the item.
       */
      space_shortage: number;
      /**
       * The amount of space left in the user's Dropbox, less than space_needed.
       */
      space_left: number;
    }

    /**
     * E-mail address of invited user.
     */
    interface InviteeInfoEmail {
      '.tag': 'email';
      email: common.EmailAddress;
    }

    interface InviteeInfoOther {
      '.tag': 'other';
    }

    /**
     * Information about the recipient of a shared content invitation.
     */
    type InviteeInfo = InviteeInfoEmail | InviteeInfoOther;

    /**
     * Information about an invited member of a shared content.
     */
    interface InviteeMembershipInfo extends MembershipInfo {
      /**
       * Recipient of the invitation.
       */
      invitee: InviteeInfo;
      /**
       * The user this invitation is tied to, if available.
       */
      user?: UserInfo;
    }

    /**
     * Error occurred while performing unshareFolder() action.
     */
    interface JobErrorUnshareFolderError {
      '.tag': 'unshare_folder_error';
      unshare_folder_error: UnshareFolderError;
    }

    /**
     * Error occurred while performing removeFolderMember() action.
     */
    interface JobErrorRemoveFolderMemberError {
      '.tag': 'remove_folder_member_error';
      remove_folder_member_error: RemoveFolderMemberError;
    }

    /**
     * Error occurred while performing relinquishFolderMembership() action.
     */
    interface JobErrorRelinquishFolderMembershipError {
      '.tag': 'relinquish_folder_membership_error';
      relinquish_folder_membership_error: RelinquishFolderMembershipError;
    }

    interface JobErrorOther {
      '.tag': 'other';
    }

    /**
     * Error occurred while performing an asynchronous job from unshareFolder()
     * or removeFolderMember().
     */
    type JobError = JobErrorUnshareFolderError | JobErrorRemoveFolderMemberError | JobErrorRelinquishFolderMembershipError | JobErrorOther;

    /**
     * The asynchronous job has finished.
     */
    interface JobStatusComplete {
      '.tag': 'complete';
    }

    /**
     * The asynchronous job returned an error.
     */
    interface JobStatusFailed {
      '.tag': 'failed';
      failed: JobError;
    }

    type JobStatus = async.PollResultBase | JobStatusComplete | JobStatusFailed;

    /**
     * Change the access level of the link.
     */
    interface LinkActionChangeAccessLevel {
      '.tag': 'change_access_level';
    }

    /**
     * Change the audience of the link.
     */
    interface LinkActionChangeAudience {
      '.tag': 'change_audience';
    }

    /**
     * Remove the expiry date of the link.
     */
    interface LinkActionRemoveExpiry {
      '.tag': 'remove_expiry';
    }

    /**
     * Remove the password of the link.
     */
    interface LinkActionRemovePassword {
      '.tag': 'remove_password';
    }

    /**
     * Create or modify the expiry date of the link.
     */
    interface LinkActionSetExpiry {
      '.tag': 'set_expiry';
    }

    /**
     * Create or modify the password of the link.
     */
    interface LinkActionSetPassword {
      '.tag': 'set_password';
    }

    interface LinkActionOther {
      '.tag': 'other';
    }

    /**
     * Actions that can be performed on a link.
     */
    type LinkAction = LinkActionChangeAccessLevel | LinkActionChangeAudience | LinkActionRemoveExpiry | LinkActionRemovePassword | LinkActionSetExpiry | LinkActionSetPassword | LinkActionOther;

    /**
     * Link is accessible by anyone.
     */
    interface LinkAudiencePublic {
      '.tag': 'public';
    }

    /**
     * Link is accessible only by team members.
     */
    interface LinkAudienceTeam {
      '.tag': 'team';
    }

    /**
     * Link is accessible only by members of the content.
     */
    interface LinkAudienceMembers {
      '.tag': 'members';
    }

    interface LinkAudienceOther {
      '.tag': 'other';
    }

    type LinkAudience = LinkAudiencePublic | LinkAudienceTeam | LinkAudienceMembers | LinkAudienceOther;

    /**
     * Remove the currently set expiry for the link.
     */
    interface LinkExpiryRemoveExpiry {
      '.tag': 'remove_expiry';
    }

    /**
     * Set a new expiry or change an existing expiry.
     */
    interface LinkExpirySetExpiry {
      '.tag': 'set_expiry';
      set_expiry: common.DropboxTimestamp;
    }

    interface LinkExpiryOther {
      '.tag': 'other';
    }

    type LinkExpiry = LinkExpiryRemoveExpiry | LinkExpirySetExpiry | LinkExpiryOther;

    /**
     * Metadata for a shared link. This can be either a sharing.PathLinkMetadata
     * or sharing.CollectionLinkMetadata.
     */
    interface LinkMetadata {
      /**
       * URL of the shared link.
       */
      url: string;
      /**
       * Who can access the link.
       */
      visibility: Visibility;
      /**
       * Expiration time, if set. By default the link won't expire.
       */
      expires?: common.DropboxTimestamp;
    }

    /**
     * Reference to the LinkMetadata polymorphic type. Contains a .tag property
     * to let you discriminate between possible subtypes.
     */
    interface LinkMetadataReference extends LinkMetadata {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "path"|"collection";
    }

    /**
     * Remove the currently set password for the link.
     */
    interface LinkPasswordRemovePassword {
      '.tag': 'remove_password';
    }

    /**
     * Set a new password or change an existing password.
     */
    interface LinkPasswordSetPassword {
      '.tag': 'set_password';
      set_password: string;
    }

    interface LinkPasswordOther {
      '.tag': 'other';
    }

    type LinkPassword = LinkPasswordRemovePassword | LinkPasswordSetPassword | LinkPasswordOther;

    /**
     * Permissions for actions that can be performed on a link.
     */
    interface LinkPermission {
      action: LinkAction;
      allow: boolean;
      reason?: PermissionDeniedReason;
    }

    interface LinkPermissions {
      /**
       * The current visibility of the link after considering the shared links
       * policies of the the team (in case the link's owner is part of a team)
       * and the shared folder (in case the linked file is part of a shared
       * folder). This field is shown only if the caller has access to this info
       * (the link's owner always has access to this data).
       */
      resolved_visibility?: ResolvedVisibility;
      /**
       * The shared link's requested visibility. This can be overridden by the
       * team and shared folder policies. The final visibility, after
       * considering these policies, can be found in resolved_visibility. This
       * is shown only if the caller is the link's owner.
       */
      requested_visibility?: RequestedVisibility;
      /**
       * Whether the caller can revoke the shared link
       */
      can_revoke: boolean;
      /**
       * The failure reason for revoking the link. This field will only be
       * present if the can_revoke is false.
       */
      revoke_failure_reason?: SharedLinkAccessFailureReason;
    }

    /**
     * Settings that apply to a link.
     */
    interface LinkSettings {
      /**
       * The access level on the link for this file. Currently, it only accepts
       * 'viewer' and 'viewer_no_comment'.
       */
      access_level?: AccessLevel;
      /**
       * The type of audience on the link for this file.
       */
      audience?: LinkAudience;
      /**
       * An expiry timestamp to set on a link.
       */
      expiry?: LinkExpiry;
      /**
       * The password for the link.
       */
      password?: LinkPassword;
    }

    /**
     * Arguments for listFileMembers().
     */
    interface ListFileMembersArg {
      /**
       * The file for which you want to see members.
       */
      file: PathOrId;
      /**
       * The actions for which to return permissions on a member.
       */
      actions?: Array<MemberAction>;
      /**
       * Defaults to True.
       */
      include_inherited?: boolean;
      /**
       * Defaults to 100.
       */
      limit?: number;
    }

    /**
     * Arguments for listFileMembersBatch().
     */
    interface ListFileMembersBatchArg {
      /**
       * Files for which to return members.
       */
      files: Array<PathOrId>;
      /**
       * Defaults to 10.
       */
      limit?: number;
    }

    /**
     * Per-file result for listFileMembersBatch().
     */
    interface ListFileMembersBatchResult {
      /**
       * This is the input file identifier, whether an ID or a path.
       */
      file: PathOrId;
      /**
       * The result for this particular file.
       */
      result: ListFileMembersIndividualResult;
    }

    /**
     * Arguments for listFileMembersContinue().
     */
    interface ListFileMembersContinueArg {
      /**
       * The cursor returned by your last call to listFileMembers(),
       * listFileMembersContinue(), or listFileMembersBatch().
       */
      cursor: string;
    }

    interface ListFileMembersContinueErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    interface ListFileMembersContinueErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    /**
     * ListFileMembersContinueArg.cursor is invalid.
     */
    interface ListFileMembersContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface ListFileMembersContinueErrorOther {
      '.tag': 'other';
    }

    /**
     * Error for listFileMembersContinue().
     */
    type ListFileMembersContinueError = ListFileMembersContinueErrorUserError | ListFileMembersContinueErrorAccessError | ListFileMembersContinueErrorInvalidCursor | ListFileMembersContinueErrorOther;

    interface ListFileMembersCountResult {
      /**
       * A list of members on this file.
       */
      members: SharedFileMembers;
      /**
       * The number of members on this file. This does not include inherited
       * members.
       */
      member_count: number;
    }

    interface ListFileMembersErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    interface ListFileMembersErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    interface ListFileMembersErrorOther {
      '.tag': 'other';
    }

    /**
     * Error for listFileMembers().
     */
    type ListFileMembersError = ListFileMembersErrorUserError | ListFileMembersErrorAccessError | ListFileMembersErrorOther;

    /**
     * The results of the query for this file if it was successful.
     */
    interface ListFileMembersIndividualResultResult {
      '.tag': 'result';
      result: ListFileMembersCountResult;
    }

    /**
     * The result of the query for this file if it was an error.
     */
    interface ListFileMembersIndividualResultAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    interface ListFileMembersIndividualResultOther {
      '.tag': 'other';
    }

    type ListFileMembersIndividualResult = ListFileMembersIndividualResultResult | ListFileMembersIndividualResultAccessError | ListFileMembersIndividualResultOther;

    /**
     * Arguments for listReceivedFiles().
     */
    interface ListFilesArg {
      /**
       * Defaults to 100.
       */
      limit?: number;
      /**
       * A list of `FileAction`s corresponding to `FilePermission`s that should
       * appear in the  response's SharedFileMetadata.permissions field
       * describing the actions the  authenticated user can perform on the file.
       */
      actions?: Array<FileAction>;
    }

    /**
     * Arguments for listReceivedFilesContinue().
     */
    interface ListFilesContinueArg {
      /**
       * Cursor in ListFilesResult.cursor.
       */
      cursor: string;
    }

    /**
     * User account had a problem.
     */
    interface ListFilesContinueErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    /**
     * ListFilesContinueArg.cursor is invalid.
     */
    interface ListFilesContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface ListFilesContinueErrorOther {
      '.tag': 'other';
    }

    /**
     * Error results for listReceivedFilesContinue().
     */
    type ListFilesContinueError = ListFilesContinueErrorUserError | ListFilesContinueErrorInvalidCursor | ListFilesContinueErrorOther;

    /**
     * Success results for listReceivedFiles().
     */
    interface ListFilesResult {
      /**
       * Information about the files shared with current user.
       */
      entries: Array<SharedFileMetadata>;
      /**
       * Cursor used to obtain additional shared files.
       */
      cursor?: string;
    }

    interface ListFolderMembersArgs extends ListFolderMembersCursorArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
    }

    interface ListFolderMembersContinueArg {
      /**
       * The cursor returned by your last call to listFolderMembers() or
       * listFolderMembersContinue().
       */
      cursor: string;
    }

    interface ListFolderMembersContinueErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * ListFolderMembersContinueArg.cursor is invalid.
     */
    interface ListFolderMembersContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface ListFolderMembersContinueErrorOther {
      '.tag': 'other';
    }

    type ListFolderMembersContinueError = ListFolderMembersContinueErrorAccessError | ListFolderMembersContinueErrorInvalidCursor | ListFolderMembersContinueErrorOther;

    interface ListFolderMembersCursorArg {
      /**
       * This is a list indicating whether each returned member will include a
       * boolean value MemberPermission.allow that describes whether the current
       * user can perform the MemberAction on the member.
       */
      actions?: Array<MemberAction>;
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface ListFoldersArgs {
      /**
       * Defaults to 1000.
       */
      limit?: number;
      /**
       * A list of `FolderAction`s corresponding to `FolderPermission`s that
       * should appear in the  response's SharedFolderMetadata.permissions field
       * describing the actions the  authenticated user can perform on the
       * folder.
       */
      actions?: Array<FolderAction>;
    }

    interface ListFoldersContinueArg {
      /**
       * The cursor returned by the previous API call specified in the endpoint
       * description.
       */
      cursor: string;
    }

    /**
     * ListFoldersContinueArg.cursor is invalid.
     */
    interface ListFoldersContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface ListFoldersContinueErrorOther {
      '.tag': 'other';
    }

    type ListFoldersContinueError = ListFoldersContinueErrorInvalidCursor | ListFoldersContinueErrorOther;

    /**
     * Result for listFolders() or listMountableFolders(), depending on which
     * endpoint was requested. Unmounted shared folders can be identified by the
     * absence of SharedFolderMetadata.path_lower.
     */
    interface ListFoldersResult {
      /**
       * List of all shared folders the authenticated user has access to.
       */
      entries: Array<SharedFolderMetadata>;
      /**
       * Present if there are additional shared folders that have not been
       * returned yet. Pass the cursor into the corresponding continue endpoint
       * (either listFoldersContinue() or listMountableFoldersContinue()) to
       * list additional folders.
       */
      cursor?: string;
    }

    interface ListSharedLinksArg {
      /**
       * See listSharedLinks() description.
       */
      path?: ReadPath;
      /**
       * The cursor returned by your last call to listSharedLinks().
       */
      cursor?: string;
      /**
       * See listSharedLinks() description.
       */
      direct_only?: boolean;
    }

    interface ListSharedLinksErrorPath {
      '.tag': 'path';
      path: files.LookupError;
    }

    /**
     * Indicates that the cursor has been invalidated. Call listSharedLinks() to
     * obtain a new cursor.
     */
    interface ListSharedLinksErrorReset {
      '.tag': 'reset';
    }

    interface ListSharedLinksErrorOther {
      '.tag': 'other';
    }

    type ListSharedLinksError = ListSharedLinksErrorPath | ListSharedLinksErrorReset | ListSharedLinksErrorOther;

    interface ListSharedLinksResult {
      /**
       * Shared links applicable to the path argument.
       */
      links: Array<FileLinkMetadataReference|FolderLinkMetadataReference|SharedLinkMetadataReference>;
      /**
       * Is true if there are additional shared links that have not been
       * returned yet. Pass the cursor into listSharedLinks() to retrieve them.
       */
      has_more: boolean;
      /**
       * Pass the cursor into listSharedLinks() to obtain the additional links.
       * Cursor is returned only if no path is given.
       */
      cursor?: string;
    }

    /**
     * Contains information about a member's access level to content after an
     * operation.
     */
    interface MemberAccessLevelResult {
      /**
       * The member still has this level of access to the content through a
       * parent folder.
       */
      access_level?: AccessLevel;
      /**
       * A localized string with additional information about why the user has
       * this access level to the content.
       */
      warning?: string;
      /**
       * The parent folders that a member has access to. The field is present if
       * the user has access to the first parent folder where the member gains
       * access.
       */
      access_details?: Array<ParentFolderAccessInfo>;
    }

    /**
     * Allow the member to keep a copy of the folder when removing.
     */
    interface MemberActionLeaveACopy {
      '.tag': 'leave_a_copy';
    }

    /**
     * Make the member an editor of the folder.
     */
    interface MemberActionMakeEditor {
      '.tag': 'make_editor';
    }

    /**
     * Make the member an owner of the folder.
     */
    interface MemberActionMakeOwner {
      '.tag': 'make_owner';
    }

    /**
     * Make the member a viewer of the folder.
     */
    interface MemberActionMakeViewer {
      '.tag': 'make_viewer';
    }

    /**
     * Make the member a viewer of the folder without commenting permissions.
     */
    interface MemberActionMakeViewerNoComment {
      '.tag': 'make_viewer_no_comment';
    }

    /**
     * Remove the member from the folder.
     */
    interface MemberActionRemove {
      '.tag': 'remove';
    }

    interface MemberActionOther {
      '.tag': 'other';
    }

    /**
     * Actions that may be taken on members of a shared folder.
     */
    type MemberAction = MemberActionLeaveACopy | MemberActionMakeEditor | MemberActionMakeOwner | MemberActionMakeViewer | MemberActionMakeViewerNoComment | MemberActionRemove | MemberActionOther;

    /**
     * Whether the user is allowed to take the action on the associated member.
     */
    interface MemberPermission {
      /**
       * The action that the user may wish to take on the member.
       */
      action: MemberAction;
      /**
       * True if the user is allowed to take the action.
       */
      allow: boolean;
      /**
       * The reason why the user is denied the permission. Not present if the
       * action is allowed.
       */
      reason?: PermissionDeniedReason;
    }

    /**
     * Only a teammate can become a member.
     */
    interface MemberPolicyTeam {
      '.tag': 'team';
    }

    /**
     * Anyone can become a member.
     */
    interface MemberPolicyAnyone {
      '.tag': 'anyone';
    }

    interface MemberPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy governing who can be a member of a shared folder. Only applicable
     * to folders owned by a user on a team.
     */
    type MemberPolicy = MemberPolicyTeam | MemberPolicyAnyone | MemberPolicyOther;

    /**
     * Dropbox account, team member, or group ID of member.
     */
    interface MemberSelectorDropboxId {
      '.tag': 'dropbox_id';
      dropbox_id: DropboxId;
    }

    /**
     * E-mail address of member.
     */
    interface MemberSelectorEmail {
      '.tag': 'email';
      email: common.EmailAddress;
    }

    interface MemberSelectorOther {
      '.tag': 'other';
    }

    /**
     * Includes different ways to identify a member of a shared folder.
     */
    type MemberSelector = MemberSelectorDropboxId | MemberSelectorEmail | MemberSelectorOther;

    /**
     * The information about a member of the shared content.
     */
    interface MembershipInfo {
      /**
       * The access type for this member.
       */
      access_type: AccessLevel;
      /**
       * The permissions that requesting user has on this member. The set of
       * permissions corresponds to the MemberActions in the request.
       */
      permissions?: Array<MemberPermission>;
      /**
       * Suggested name initials for a member.
       */
      initials?: string;
      /**
       * Defaults to False.
       */
      is_inherited?: boolean;
    }

    interface ModifySharedLinkSettingsArgs {
      /**
       * URL of the shared link to change its settings
       */
      url: string;
      /**
       * Set of settings for the shared link.
       */
      settings: SharedLinkSettings;
      /**
       * Defaults to False.
       */
      remove_expiration?: boolean;
    }

    /**
     * There is an error with the given settings
     */
    interface ModifySharedLinkSettingsErrorSettingsError {
      '.tag': 'settings_error';
      settings_error: SharedLinkSettingsError;
    }

    /**
     * The caller's email should be verified
     */
    interface ModifySharedLinkSettingsErrorEmailNotVerified {
      '.tag': 'email_not_verified';
    }

    type ModifySharedLinkSettingsError = SharedLinkError | ModifySharedLinkSettingsErrorSettingsError | ModifySharedLinkSettingsErrorEmailNotVerified;

    interface MountFolderArg {
      /**
       * The ID of the shared folder to mount.
       */
      shared_folder_id: common.SharedFolderId;
    }

    interface MountFolderErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * Mounting would cause a shared folder to be inside another, which is
     * disallowed.
     */
    interface MountFolderErrorInsideSharedFolder {
      '.tag': 'inside_shared_folder';
    }

    /**
     * The current user does not have enough space to mount the shared folder.
     */
    interface MountFolderErrorInsufficientQuota {
      '.tag': 'insufficient_quota';
      insufficient_quota: InsufficientQuotaAmounts;
    }

    /**
     * The shared folder is already mounted.
     */
    interface MountFolderErrorAlreadyMounted {
      '.tag': 'already_mounted';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface MountFolderErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * The shared folder is not mountable. One example where this can occur is
     * when the shared folder belongs within a team folder in the user's
     * Dropbox.
     */
    interface MountFolderErrorNotMountable {
      '.tag': 'not_mountable';
    }

    interface MountFolderErrorOther {
      '.tag': 'other';
    }

    type MountFolderError = MountFolderErrorAccessError | MountFolderErrorInsideSharedFolder | MountFolderErrorInsufficientQuota | MountFolderErrorAlreadyMounted | MountFolderErrorNoPermission | MountFolderErrorNotMountable | MountFolderErrorOther;

    /**
     * Contains information about a parent folder that a member has access to.
     */
    interface ParentFolderAccessInfo {
      /**
       * Display name for the folder.
       */
      folder_name: string;
      /**
       * The identifier of the parent shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * The user's permissions for the parent shared folder.
       */
      permissions: Array<MemberPermission>;
      /**
       * The full path to the parent shared folder relative to the acting user's
       * root.
       */
      path: string;
    }

    /**
     * Metadata for a path-based shared link.
     */
    interface PathLinkMetadata extends LinkMetadata {
      /**
       * Path in user's Dropbox.
       */
      path: string;
    }

    /**
     * Reference to the PathLinkMetadata type, identified by the value of the
     * .tag property.
     */
    interface PathLinkMetadataReference extends PathLinkMetadata {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'path';
    }

    /**
     * Assume pending uploads are files.
     */
    interface PendingUploadModeFile {
      '.tag': 'file';
    }

    /**
     * Assume pending uploads are folders.
     */
    interface PendingUploadModeFolder {
      '.tag': 'folder';
    }

    /**
     * Flag to indicate pending upload default (for linking to not-yet-existing
     * paths).
     */
    type PendingUploadMode = PendingUploadModeFile | PendingUploadModeFolder;

    /**
     * User is not on the same team as the folder owner.
     */
    interface PermissionDeniedReasonUserNotSameTeamAsOwner {
      '.tag': 'user_not_same_team_as_owner';
    }

    /**
     * User is prohibited by the owner from taking the action.
     */
    interface PermissionDeniedReasonUserNotAllowedByOwner {
      '.tag': 'user_not_allowed_by_owner';
    }

    /**
     * Target is indirectly a member of the folder, for example by being part of
     * a group.
     */
    interface PermissionDeniedReasonTargetIsIndirectMember {
      '.tag': 'target_is_indirect_member';
    }

    /**
     * Target is the owner of the folder.
     */
    interface PermissionDeniedReasonTargetIsOwner {
      '.tag': 'target_is_owner';
    }

    /**
     * Target is the user itself.
     */
    interface PermissionDeniedReasonTargetIsSelf {
      '.tag': 'target_is_self';
    }

    /**
     * Target is not an active member of the team.
     */
    interface PermissionDeniedReasonTargetNotActive {
      '.tag': 'target_not_active';
    }

    /**
     * Folder is team folder for a limited team.
     */
    interface PermissionDeniedReasonFolderIsLimitedTeamFolder {
      '.tag': 'folder_is_limited_team_folder';
    }

    /**
     * The content owner needs to be on a Dropbox team to perform this action.
     */
    interface PermissionDeniedReasonOwnerNotOnTeam {
      '.tag': 'owner_not_on_team';
    }

    /**
     * The user does not have permission to perform this action on the link.
     */
    interface PermissionDeniedReasonPermissionDenied {
      '.tag': 'permission_denied';
    }

    /**
     * The user's team policy prevents performing this action on the link.
     */
    interface PermissionDeniedReasonRestrictedByTeam {
      '.tag': 'restricted_by_team';
    }

    /**
     * The user's account type does not support this action.
     */
    interface PermissionDeniedReasonUserAccountType {
      '.tag': 'user_account_type';
    }

    /**
     * The user needs to be on a Dropbox team to perform this action.
     */
    interface PermissionDeniedReasonUserNotOnTeam {
      '.tag': 'user_not_on_team';
    }

    /**
     * Folder is inside of another shared folder.
     */
    interface PermissionDeniedReasonFolderIsInsideSharedFolder {
      '.tag': 'folder_is_inside_shared_folder';
    }

    interface PermissionDeniedReasonInsufficientPlan {
      '.tag': 'insufficient_plan';
      insufficient_plan: InsufficientPlan;
    }

    interface PermissionDeniedReasonOther {
      '.tag': 'other';
    }

    /**
     * Possible reasons the user is denied a permission.
     */
    type PermissionDeniedReason = PermissionDeniedReasonUserNotSameTeamAsOwner | PermissionDeniedReasonUserNotAllowedByOwner | PermissionDeniedReasonTargetIsIndirectMember | PermissionDeniedReasonTargetIsOwner | PermissionDeniedReasonTargetIsSelf | PermissionDeniedReasonTargetNotActive | PermissionDeniedReasonFolderIsLimitedTeamFolder | PermissionDeniedReasonOwnerNotOnTeam | PermissionDeniedReasonPermissionDenied | PermissionDeniedReasonRestrictedByTeam | PermissionDeniedReasonUserAccountType | PermissionDeniedReasonUserNotOnTeam | PermissionDeniedReasonFolderIsInsideSharedFolder | PermissionDeniedReasonInsufficientPlan | PermissionDeniedReasonOther;

    interface RelinquishFileMembershipArg {
      /**
       * The path or id for the file.
       */
      file: PathOrId;
    }

    interface RelinquishFileMembershipErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    /**
     * The current user has access to the shared file via a group.  You can't
     * relinquish membership to a file shared via groups.
     */
    interface RelinquishFileMembershipErrorGroupAccess {
      '.tag': 'group_access';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface RelinquishFileMembershipErrorNoPermission {
      '.tag': 'no_permission';
    }

    interface RelinquishFileMembershipErrorOther {
      '.tag': 'other';
    }

    type RelinquishFileMembershipError = RelinquishFileMembershipErrorAccessError | RelinquishFileMembershipErrorGroupAccess | RelinquishFileMembershipErrorNoPermission | RelinquishFileMembershipErrorOther;

    interface RelinquishFolderMembershipArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * Defaults to False.
       */
      leave_a_copy?: boolean;
    }

    interface RelinquishFolderMembershipErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * The current user is the owner of the shared folder. Owners cannot
     * relinquish membership to their own folders. Try unsharing or transferring
     * ownership first.
     */
    interface RelinquishFolderMembershipErrorFolderOwner {
      '.tag': 'folder_owner';
    }

    /**
     * The shared folder is currently mounted.  Unmount the shared folder before
     * relinquishing membership.
     */
    interface RelinquishFolderMembershipErrorMounted {
      '.tag': 'mounted';
    }

    /**
     * The current user has access to the shared folder via a group.  You can't
     * relinquish membership to folders shared via groups.
     */
    interface RelinquishFolderMembershipErrorGroupAccess {
      '.tag': 'group_access';
    }

    /**
     * This action cannot be performed on a team shared folder.
     */
    interface RelinquishFolderMembershipErrorTeamFolder {
      '.tag': 'team_folder';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface RelinquishFolderMembershipErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * The current user only has inherited access to the shared folder.  You
     * can't relinquish inherited membership to folders.
     */
    interface RelinquishFolderMembershipErrorNoExplicitAccess {
      '.tag': 'no_explicit_access';
    }

    interface RelinquishFolderMembershipErrorOther {
      '.tag': 'other';
    }

    type RelinquishFolderMembershipError = RelinquishFolderMembershipErrorAccessError | RelinquishFolderMembershipErrorFolderOwner | RelinquishFolderMembershipErrorMounted | RelinquishFolderMembershipErrorGroupAccess | RelinquishFolderMembershipErrorTeamFolder | RelinquishFolderMembershipErrorNoPermission | RelinquishFolderMembershipErrorNoExplicitAccess | RelinquishFolderMembershipErrorOther;

    /**
     * Arguments for removeFileMember2().
     */
    interface RemoveFileMemberArg {
      /**
       * File from which to remove members.
       */
      file: PathOrId;
      /**
       * Member to remove from this file. Note that even if an email is
       * specified, it may result in the removal of a user (not an invitee) if
       * the user's main account corresponds to that email address.
       */
      member: MemberSelector;
    }

    interface RemoveFileMemberErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    interface RemoveFileMemberErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    /**
     * This member does not have explicit access to the file and therefore
     * cannot be removed. The return value is the access that a user might have
     * to the file from a parent folder.
     */
    interface RemoveFileMemberErrorNoExplicitAccess {
      '.tag': 'no_explicit_access';
      no_explicit_access: MemberAccessLevelResult;
    }

    interface RemoveFileMemberErrorOther {
      '.tag': 'other';
    }

    /**
     * Errors for removeFileMember2().
     */
    type RemoveFileMemberError = RemoveFileMemberErrorUserError | RemoveFileMemberErrorAccessError | RemoveFileMemberErrorNoExplicitAccess | RemoveFileMemberErrorOther;

    interface RemoveFolderMemberArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * The member to remove from the folder.
       */
      member: MemberSelector;
      /**
       * If true, the removed user will keep their copy of the folder after it's
       * unshared, assuming it was mounted. Otherwise, it will be removed from
       * their Dropbox. Also, this must be set to false when kicking a group.
       */
      leave_a_copy: boolean;
    }

    interface RemoveFolderMemberErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    interface RemoveFolderMemberErrorMemberError {
      '.tag': 'member_error';
      member_error: SharedFolderMemberError;
    }

    /**
     * The target user is the owner of the shared folder. You can't remove this
     * user until ownership has been transferred to another member.
     */
    interface RemoveFolderMemberErrorFolderOwner {
      '.tag': 'folder_owner';
    }

    /**
     * The target user has access to the shared folder via a group.
     */
    interface RemoveFolderMemberErrorGroupAccess {
      '.tag': 'group_access';
    }

    /**
     * This action cannot be performed on a team shared folder.
     */
    interface RemoveFolderMemberErrorTeamFolder {
      '.tag': 'team_folder';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface RemoveFolderMemberErrorNoPermission {
      '.tag': 'no_permission';
    }

    interface RemoveFolderMemberErrorOther {
      '.tag': 'other';
    }

    type RemoveFolderMemberError = RemoveFolderMemberErrorAccessError | RemoveFolderMemberErrorMemberError | RemoveFolderMemberErrorFolderOwner | RemoveFolderMemberErrorGroupAccess | RemoveFolderMemberErrorTeamFolder | RemoveFolderMemberErrorNoPermission | RemoveFolderMemberErrorOther;

    /**
     * Removing the folder member has finished. The value is information about
     * whether the member has another form of access.
     */
    interface RemoveMemberJobStatusComplete {
      '.tag': 'complete';
      complete: MemberAccessLevelResult;
    }

    interface RemoveMemberJobStatusFailed {
      '.tag': 'failed';
      failed: RemoveFolderMemberError;
    }

    type RemoveMemberJobStatus = async.PollResultBase | RemoveMemberJobStatusComplete | RemoveMemberJobStatusFailed;

    /**
     * Anyone who has received the link can access it. No login required.
     */
    interface RequestedVisibilityPublic {
      '.tag': 'public';
    }

    /**
     * Only members of the same team can access the link. Login is required.
     */
    interface RequestedVisibilityTeamOnly {
      '.tag': 'team_only';
    }

    /**
     * A link-specific password is required to access the link. Login is not
     * required.
     */
    interface RequestedVisibilityPassword {
      '.tag': 'password';
    }

    /**
     * The access permission that can be requested by the caller for the shared
     * link. Note that the final resolved visibility of the shared link takes
     * into account other aspects, such as team and shared folder settings.
     * Check the sharing.ResolvedVisibility for more info on the possible
     * resolved visibility values of shared links.
     */
    type RequestedVisibility = RequestedVisibilityPublic | RequestedVisibilityTeamOnly | RequestedVisibilityPassword;

    /**
     * Only members of the same team who have the link-specific password can
     * access the link. Login is required.
     */
    interface ResolvedVisibilityTeamAndPassword {
      '.tag': 'team_and_password';
    }

    /**
     * Only members of the shared folder containing the linked file can access
     * the link. Login is required.
     */
    interface ResolvedVisibilitySharedFolderOnly {
      '.tag': 'shared_folder_only';
    }

    interface ResolvedVisibilityOther {
      '.tag': 'other';
    }

    /**
     * The actual access permissions values of shared links after taking into
     * account user preferences and the team and shared folder settings. Check
     * the sharing.RequestedVisibility for more info on the possible visibility
     * values that can be set by the shared link's owner.
     */
    type ResolvedVisibility = RequestedVisibility | ResolvedVisibilityTeamAndPassword | ResolvedVisibilitySharedFolderOnly | ResolvedVisibilityOther;

    interface RevokeSharedLinkArg {
      /**
       * URL of the shared link.
       */
      url: string;
    }

    /**
     * Shared link is malformed.
     */
    interface RevokeSharedLinkErrorSharedLinkMalformed {
      '.tag': 'shared_link_malformed';
    }

    type RevokeSharedLinkError = SharedLinkError | RevokeSharedLinkErrorSharedLinkMalformed;

    interface ShareFolderArg extends ShareFolderArgBase {
      /**
       * A list of `FolderAction`s corresponding to `FolderPermission`s that
       * should appear in the  response's SharedFolderMetadata.permissions field
       * describing the actions the  authenticated user can perform on the
       * folder.
       */
      actions?: Array<FolderAction>;
      /**
       * Settings on the link for this folder.
       */
      link_settings?: LinkSettings;
    }

    interface ShareFolderArgBase {
      /**
       * Who can add and remove members of this shared folder.
       */
      acl_update_policy?: AclUpdatePolicy;
      /**
       * Defaults to False.
       */
      force_async?: boolean;
      /**
       * Who can be a member of this shared folder. Only applicable if the
       * current user is on a team.
       */
      member_policy?: MemberPolicy;
      /**
       * The path to the folder to share. If it does not exist, then a new one
       * is created.
       */
      path: files.WritePath;
      /**
       * The policy to apply to shared links created for content inside this
       * shared folder.  The current user must be on a team to set this policy
       * to SharedLinkPolicy.members.
       */
      shared_link_policy?: SharedLinkPolicy;
      /**
       * Who can enable/disable viewer info for this shared folder.
       */
      viewer_info_policy?: ViewerInfoPolicy;
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface ShareFolderErrorNoPermission {
      '.tag': 'no_permission';
    }

    type ShareFolderError = ShareFolderErrorBase | ShareFolderErrorNoPermission;

    /**
     * The current user's e-mail address is unverified.
     */
    interface ShareFolderErrorBaseEmailUnverified {
      '.tag': 'email_unverified';
    }

    /**
     * ShareFolderArg.path is invalid.
     */
    interface ShareFolderErrorBaseBadPath {
      '.tag': 'bad_path';
      bad_path: SharePathError;
    }

    /**
     * Team policy is more restrictive than ShareFolderArg.member_policy.
     */
    interface ShareFolderErrorBaseTeamPolicyDisallowsMemberPolicy {
      '.tag': 'team_policy_disallows_member_policy';
    }

    /**
     * The current user's account is not allowed to select the specified
     * ShareFolderArg.shared_link_policy.
     */
    interface ShareFolderErrorBaseDisallowedSharedLinkPolicy {
      '.tag': 'disallowed_shared_link_policy';
    }

    interface ShareFolderErrorBaseOther {
      '.tag': 'other';
    }

    type ShareFolderErrorBase = ShareFolderErrorBaseEmailUnverified | ShareFolderErrorBaseBadPath | ShareFolderErrorBaseTeamPolicyDisallowsMemberPolicy | ShareFolderErrorBaseDisallowedSharedLinkPolicy | ShareFolderErrorBaseOther;

    /**
     * The share job has finished. The value is the metadata for the folder.
     */
    interface ShareFolderJobStatusComplete {
      '.tag': 'complete';
      complete: SharedFolderMetadata;
    }

    interface ShareFolderJobStatusFailed {
      '.tag': 'failed';
      failed: ShareFolderError;
    }

    type ShareFolderJobStatus = async.PollResultBase | ShareFolderJobStatusComplete | ShareFolderJobStatusFailed;

    interface ShareFolderLaunchComplete {
      '.tag': 'complete';
      complete: SharedFolderMetadata;
    }

    type ShareFolderLaunch = async.LaunchResultBase | ShareFolderLaunchComplete;

    /**
     * A file is at the specified path.
     */
    interface SharePathErrorIsFile {
      '.tag': 'is_file';
    }

    /**
     * We do not support sharing a folder inside a shared folder.
     */
    interface SharePathErrorInsideSharedFolder {
      '.tag': 'inside_shared_folder';
    }

    /**
     * We do not support shared folders that contain shared folders.
     */
    interface SharePathErrorContainsSharedFolder {
      '.tag': 'contains_shared_folder';
    }

    /**
     * We do not support shared folders that contain app folders.
     */
    interface SharePathErrorContainsAppFolder {
      '.tag': 'contains_app_folder';
    }

    /**
     * We do not support shared folders that contain team folders.
     */
    interface SharePathErrorContainsTeamFolder {
      '.tag': 'contains_team_folder';
    }

    /**
     * We do not support sharing an app folder.
     */
    interface SharePathErrorIsAppFolder {
      '.tag': 'is_app_folder';
    }

    /**
     * We do not support sharing a folder inside an app folder.
     */
    interface SharePathErrorInsideAppFolder {
      '.tag': 'inside_app_folder';
    }

    /**
     * A public folder can't be shared this way. Use a public link instead.
     */
    interface SharePathErrorIsPublicFolder {
      '.tag': 'is_public_folder';
    }

    /**
     * A folder inside a public folder can't be shared this way. Use a public
     * link instead.
     */
    interface SharePathErrorInsidePublicFolder {
      '.tag': 'inside_public_folder';
    }

    /**
     * Folder is already shared. Contains metadata about the existing shared
     * folder.
     */
    interface SharePathErrorAlreadyShared {
      '.tag': 'already_shared';
      already_shared: SharedFolderMetadata;
    }

    /**
     * Path is not valid.
     */
    interface SharePathErrorInvalidPath {
      '.tag': 'invalid_path';
    }

    /**
     * We do not support sharing a Mac OS X package.
     */
    interface SharePathErrorIsOsxPackage {
      '.tag': 'is_osx_package';
    }

    /**
     * We do not support sharing a folder inside a Mac OS X package.
     */
    interface SharePathErrorInsideOsxPackage {
      '.tag': 'inside_osx_package';
    }

    interface SharePathErrorOther {
      '.tag': 'other';
    }

    type SharePathError = SharePathErrorIsFile | SharePathErrorInsideSharedFolder | SharePathErrorContainsSharedFolder | SharePathErrorContainsAppFolder | SharePathErrorContainsTeamFolder | SharePathErrorIsAppFolder | SharePathErrorInsideAppFolder | SharePathErrorIsPublicFolder | SharePathErrorInsidePublicFolder | SharePathErrorAlreadyShared | SharePathErrorInvalidPath | SharePathErrorIsOsxPackage | SharePathErrorInsideOsxPackage | SharePathErrorOther;

    /**
     * Metadata of a shared link for a file or folder.
     */
    interface SharedContentLinkMetadata extends SharedContentLinkMetadataBase {
      /**
       * The content inside this folder with link audience different than this
       * folder's. This is only returned when an endpoint that returns metadata
       * for a single shared folder is called, e.g. /get_folder_metadata.
       */
      audience_exceptions?: AudienceExceptions;
      /**
       * The URL of the link.
       */
      url: string;
    }

    interface SharedContentLinkMetadataBase {
      /**
       * The access level on the link for this file.
       */
      access_level?: AccessLevel;
      /**
       * The audience options that are available for the content. Some audience
       * options may be unavailable. For example, team_only may be unavailable
       * if the content is not owned by a user on a team. The 'default' audience
       * option is always available if the user can modify link settings.
       */
      audience_options: Array<LinkAudience>;
      /**
       * The shared folder that prevents the link audience for this link from
       * being more restrictive.
       */
      audience_restricting_shared_folder?: AudienceRestrictingSharedFolder;
      /**
       * The current audience of the link.
       */
      current_audience: LinkAudience;
      /**
       * Whether the link has an expiry set on it. A link with an expiry will
       * have its  audience changed to members when the expiry is reached.
       */
      expiry?: common.DropboxTimestamp;
      /**
       * A list of permissions for actions you can perform on the link.
       */
      link_permissions: Array<LinkPermission>;
      /**
       * Whether the link is protected by a password.
       */
      password_protected: boolean;
    }

    /**
     * Shared file user, group, and invitee membership. Used for the results of
     * listFileMembers() and listFileMembersContinue(), and used as part of the
     * results for listFileMembersBatch().
     */
    interface SharedFileMembers {
      /**
       * The list of user members of the shared file.
       */
      users: Array<UserMembershipInfo>;
      /**
       * The list of group members of the shared file.
       */
      groups: Array<GroupMembershipInfo>;
      /**
       * The list of invited members of a file, but have not logged in and
       * claimed this.
       */
      invitees: Array<InviteeMembershipInfo>;
      /**
       * Present if there are additional shared file members that have not been
       * returned yet. Pass the cursor into listFileMembersContinue() to list
       * additional members.
       */
      cursor?: string;
    }

    /**
     * Properties of the shared file.
     */
    interface SharedFileMetadata {
      /**
       * The current user's access level for this shared file.
       */
      access_type?: AccessLevel;
      /**
       * The ID of the file.
       */
      id: FileId;
      /**
       * The expected metadata of the link associated for the file when it is
       * first shared. Absent if the link already exists. This is for an
       * unreleased feature so it may not be returned yet.
       */
      expected_link_metadata?: ExpectedSharedContentLinkMetadata;
      /**
       * The metadata of the link associated for the file. This is for an
       * unreleased feature so it may not be returned yet.
       */
      link_metadata?: SharedContentLinkMetadata;
      /**
       * The name of this file.
       */
      name: string;
      /**
       * The display names of the users that own the file. If the file is part
       * of a team folder, the display names of the team admins are also
       * included. Absent if the owner display names cannot be fetched.
       */
      owner_display_names?: Array<string>;
      /**
       * The team that owns the file. This field is not present if the file is
       * not owned by a team.
       */
      owner_team?: users.Team;
      /**
       * The ID of the parent shared folder. This field is present only if the
       * file is contained within a shared folder.
       */
      parent_shared_folder_id?: common.SharedFolderId;
      /**
       * The cased path to be used for display purposes only. In rare instances
       * the casing will not correctly match the user's filesystem, but this
       * behavior will match the path provided in the Core API v1. Absent for
       * unmounted files.
       */
      path_display?: string;
      /**
       * The lower-case full path of this file. Absent for unmounted files.
       */
      path_lower?: string;
      /**
       * The sharing permissions that requesting user has on this file. This
       * corresponds to the entries given in GetFileMetadataBatchArg.actions or
       * GetFileMetadataArg.actions.
       */
      permissions?: Array<FilePermission>;
      /**
       * Policies governing this shared file.
       */
      policy: FolderPolicy;
      /**
       * URL for displaying a web preview of the shared file.
       */
      preview_url: string;
      /**
       * Timestamp indicating when the current user was invited to this shared
       * file. If the user was not invited to the shared file, the timestamp
       * will indicate when the user was invited to the parent shared folder.
       * This value may be absent.
       */
      time_invited?: common.DropboxTimestamp;
    }

    /**
     * This shared folder ID is invalid.
     */
    interface SharedFolderAccessErrorInvalidId {
      '.tag': 'invalid_id';
    }

    /**
     * The user is not a member of the shared folder thus cannot access it.
     */
    interface SharedFolderAccessErrorNotAMember {
      '.tag': 'not_a_member';
    }

    /**
     * The current user's e-mail address is unverified.
     */
    interface SharedFolderAccessErrorEmailUnverified {
      '.tag': 'email_unverified';
    }

    /**
     * The shared folder is unmounted.
     */
    interface SharedFolderAccessErrorUnmounted {
      '.tag': 'unmounted';
    }

    interface SharedFolderAccessErrorOther {
      '.tag': 'other';
    }

    /**
     * There is an error accessing the shared folder.
     */
    type SharedFolderAccessError = SharedFolderAccessErrorInvalidId | SharedFolderAccessErrorNotAMember | SharedFolderAccessErrorEmailUnverified | SharedFolderAccessErrorUnmounted | SharedFolderAccessErrorOther;

    /**
     * The target dropbox_id is invalid.
     */
    interface SharedFolderMemberErrorInvalidDropboxId {
      '.tag': 'invalid_dropbox_id';
    }

    /**
     * The target dropbox_id is not a member of the shared folder.
     */
    interface SharedFolderMemberErrorNotAMember {
      '.tag': 'not_a_member';
    }

    /**
     * The target member only has inherited access to the shared folder.
     */
    interface SharedFolderMemberErrorNoExplicitAccess {
      '.tag': 'no_explicit_access';
      no_explicit_access: MemberAccessLevelResult;
    }

    interface SharedFolderMemberErrorOther {
      '.tag': 'other';
    }

    type SharedFolderMemberError = SharedFolderMemberErrorInvalidDropboxId | SharedFolderMemberErrorNotAMember | SharedFolderMemberErrorNoExplicitAccess | SharedFolderMemberErrorOther;

    /**
     * Shared folder user and group membership.
     */
    interface SharedFolderMembers {
      /**
       * The list of user members of the shared folder.
       */
      users: Array<UserMembershipInfo>;
      /**
       * The list of group members of the shared folder.
       */
      groups: Array<GroupMembershipInfo>;
      /**
       * The list of invitees to the shared folder.
       */
      invitees: Array<InviteeMembershipInfo>;
      /**
       * Present if there are additional shared folder members that have not
       * been returned yet. Pass the cursor into listFolderMembersContinue() to
       * list additional members.
       */
      cursor?: string;
    }

    /**
     * The metadata which includes basic information about the shared folder.
     */
    interface SharedFolderMetadata extends SharedFolderMetadataBase {
      /**
       * The metadata of the shared content link to this shared folder. Absent
       * if there is no link on the folder. This is for an unreleased feature so
       * it may not be returned yet.
       */
      link_metadata?: SharedContentLinkMetadata;
      /**
       * The name of the this shared folder.
       */
      name: string;
      /**
       * Actions the current user may perform on the folder and its contents.
       * The set of permissions corresponds to the FolderActions in the request.
       */
      permissions?: Array<FolderPermission>;
      /**
       * Policies governing this shared folder.
       */
      policy: FolderPolicy;
      /**
       * URL for displaying a web preview of the shared folder.
       */
      preview_url: string;
      /**
       * The ID of the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * Timestamp indicating when the current user was invited to this shared
       * folder.
       */
      time_invited: common.DropboxTimestamp;
    }

    /**
     * Properties of the shared folder.
     */
    interface SharedFolderMetadataBase {
      /**
       * The current user's access level for this shared folder.
       */
      access_type: AccessLevel;
      /**
       * Whether this folder is inside of a team folder.
       */
      is_inside_team_folder: boolean;
      /**
       * Whether this folder is a [team folder]{@link
       * https://www.dropbox.com/en/help/986}.
       */
      is_team_folder: boolean;
      /**
       * The display names of the users that own the folder. If the folder is
       * part of a team folder, the display names of the team admins are also
       * included. Absent if the owner display names cannot be fetched.
       */
      owner_display_names?: Array<string>;
      /**
       * The team that owns the folder. This field is not present if the folder
       * is not owned by a team.
       */
      owner_team?: users.Team;
      /**
       * The ID of the parent shared folder. This field is present only if the
       * folder is contained within another shared folder.
       */
      parent_shared_folder_id?: common.SharedFolderId;
      /**
       * The lower-cased full path of this shared folder. Absent for unmounted
       * folders.
       */
      path_lower?: string;
    }

    /**
     * User is not logged in.
     */
    interface SharedLinkAccessFailureReasonLoginRequired {
      '.tag': 'login_required';
    }

    /**
     * User's email is not verified.
     */
    interface SharedLinkAccessFailureReasonEmailVerifyRequired {
      '.tag': 'email_verify_required';
    }

    /**
     * The link is password protected.
     */
    interface SharedLinkAccessFailureReasonPasswordRequired {
      '.tag': 'password_required';
    }

    /**
     * Access is allowed for team members only.
     */
    interface SharedLinkAccessFailureReasonTeamOnly {
      '.tag': 'team_only';
    }

    /**
     * Access is allowed for the shared link's owner only.
     */
    interface SharedLinkAccessFailureReasonOwnerOnly {
      '.tag': 'owner_only';
    }

    interface SharedLinkAccessFailureReasonOther {
      '.tag': 'other';
    }

    type SharedLinkAccessFailureReason = SharedLinkAccessFailureReasonLoginRequired | SharedLinkAccessFailureReasonEmailVerifyRequired | SharedLinkAccessFailureReasonPasswordRequired | SharedLinkAccessFailureReasonTeamOnly | SharedLinkAccessFailureReasonOwnerOnly | SharedLinkAccessFailureReasonOther;

    /**
     * The shared link wasn't found.
     */
    interface SharedLinkErrorSharedLinkNotFound {
      '.tag': 'shared_link_not_found';
    }

    /**
     * The caller is not allowed to access this shared link.
     */
    interface SharedLinkErrorSharedLinkAccessDenied {
      '.tag': 'shared_link_access_denied';
    }

    /**
     * This type of link is not supported.
     */
    interface SharedLinkErrorUnsupportedLinkType {
      '.tag': 'unsupported_link_type';
    }

    interface SharedLinkErrorOther {
      '.tag': 'other';
    }

    type SharedLinkError = SharedLinkErrorSharedLinkNotFound | SharedLinkErrorSharedLinkAccessDenied | SharedLinkErrorUnsupportedLinkType | SharedLinkErrorOther;

    /**
     * The metadata of a shared link
     */
    interface SharedLinkMetadata {
      /**
       * URL of the shared link.
       */
      url: string;
      /**
       * A unique identifier for the linked file.
       */
      id?: Id;
      /**
       * The linked file name (including extension). This never contains a
       * slash.
       */
      name: string;
      /**
       * Expiration time, if set. By default the link won't expire.
       */
      expires?: common.DropboxTimestamp;
      /**
       * The lowercased full path in the user's Dropbox. This always starts with
       * a slash. This field will only be present only if the linked file is in
       * the authenticated user's  dropbox.
       */
      path_lower?: string;
      /**
       * The link's access permissions.
       */
      link_permissions: LinkPermissions;
      /**
       * The team membership information of the link's owner.  This field will
       * only be present  if the link's owner is a team member.
       */
      team_member_info?: TeamMemberInfo;
      /**
       * The team information of the content's owner. This field will only be
       * present if the content's owner is a team member and the content's owner
       * team is different from the link's owner team.
       */
      content_owner_team_info?: TeamInfo;
    }

    /**
     * Reference to the SharedLinkMetadata polymorphic type. Contains a .tag
     * property to let you discriminate between possible subtypes.
     */
    interface SharedLinkMetadataReference extends SharedLinkMetadata {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "file"|"folder";
    }

    /**
     * Links can be shared with anyone.
     */
    interface SharedLinkPolicyAnyone {
      '.tag': 'anyone';
    }

    /**
     * Links can be shared with anyone on the same team as the owner.
     */
    interface SharedLinkPolicyTeam {
      '.tag': 'team';
    }

    /**
     * Links can only be shared among members of the shared folder.
     */
    interface SharedLinkPolicyMembers {
      '.tag': 'members';
    }

    interface SharedLinkPolicyOther {
      '.tag': 'other';
    }

    /**
     * Who can view shared links in this folder.
     */
    type SharedLinkPolicy = SharedLinkPolicyAnyone | SharedLinkPolicyTeam | SharedLinkPolicyMembers | SharedLinkPolicyOther;

    interface SharedLinkSettings {
      /**
       * The requested access for this shared link.
       */
      requested_visibility?: RequestedVisibility;
      /**
       * If requested_visibility is RequestedVisibility.password this is needed
       * to specify the password to access the link.
       */
      link_password?: string;
      /**
       * Expiration time of the shared link. By default the link won't expire.
       */
      expires?: common.DropboxTimestamp;
    }

    /**
     * The given settings are invalid (for example, all attributes of the
     * sharing.SharedLinkSettings are empty, the requested visibility is
     * RequestedVisibility.password but the SharedLinkSettings.link_password is
     * missing, SharedLinkSettings.expires is set to the past, etc.)
     */
    interface SharedLinkSettingsErrorInvalidSettings {
      '.tag': 'invalid_settings';
    }

    /**
     * User is not allowed to modify the settings of this link. Note that basic
     * users can only set RequestedVisibility.public as the
     * SharedLinkSettings.requested_visibility and cannot set
     * SharedLinkSettings.expires
     */
    interface SharedLinkSettingsErrorNotAuthorized {
      '.tag': 'not_authorized';
    }

    type SharedLinkSettingsError = SharedLinkSettingsErrorInvalidSettings | SharedLinkSettingsErrorNotAuthorized;

    /**
     * Current user does not have sufficient privileges to perform the desired
     * action.
     */
    interface SharingFileAccessErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * File specified was not found.
     */
    interface SharingFileAccessErrorInvalidFile {
      '.tag': 'invalid_file';
    }

    /**
     * A folder can't be shared this way. Use folder sharing or a shared link
     * instead.
     */
    interface SharingFileAccessErrorIsFolder {
      '.tag': 'is_folder';
    }

    /**
     * A file inside a public folder can't be shared this way. Use a public link
     * instead.
     */
    interface SharingFileAccessErrorInsidePublicFolder {
      '.tag': 'inside_public_folder';
    }

    /**
     * A Mac OS X package can't be shared this way. Use a shared link instead.
     */
    interface SharingFileAccessErrorInsideOsxPackage {
      '.tag': 'inside_osx_package';
    }

    interface SharingFileAccessErrorOther {
      '.tag': 'other';
    }

    /**
     * User could not access this file.
     */
    type SharingFileAccessError = SharingFileAccessErrorNoPermission | SharingFileAccessErrorInvalidFile | SharingFileAccessErrorIsFolder | SharingFileAccessErrorInsidePublicFolder | SharingFileAccessErrorInsideOsxPackage | SharingFileAccessErrorOther;

    /**
     * The current user must verify the account e-mail address before performing
     * this action.
     */
    interface SharingUserErrorEmailUnverified {
      '.tag': 'email_unverified';
    }

    interface SharingUserErrorOther {
      '.tag': 'other';
    }

    /**
     * User account had a problem preventing this action.
     */
    type SharingUserError = SharingUserErrorEmailUnverified | SharingUserErrorOther;

    /**
     * Information about a team member.
     */
    interface TeamMemberInfo {
      /**
       * Information about the member's team
       */
      team_info: TeamInfo;
      /**
       * The display name of the user.
       */
      display_name: string;
      /**
       * ID of user as a member of a team. This field will only be present if
       * the member is in the same team as current user.
       */
      member_id?: string;
    }

    interface TransferFolderArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * A account or team member ID to transfer ownership to.
       */
      to_dropbox_id: DropboxId;
    }

    interface TransferFolderErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * TransferFolderArg.to_dropbox_id is invalid.
     */
    interface TransferFolderErrorInvalidDropboxId {
      '.tag': 'invalid_dropbox_id';
    }

    /**
     * The new designated owner is not currently a member of the shared folder.
     */
    interface TransferFolderErrorNewOwnerNotAMember {
      '.tag': 'new_owner_not_a_member';
    }

    /**
     * The new designated owner has not added the folder to their Dropbox.
     */
    interface TransferFolderErrorNewOwnerUnmounted {
      '.tag': 'new_owner_unmounted';
    }

    /**
     * The new designated owner's e-mail address is unverified.
     */
    interface TransferFolderErrorNewOwnerEmailUnverified {
      '.tag': 'new_owner_email_unverified';
    }

    /**
     * This action cannot be performed on a team shared folder.
     */
    interface TransferFolderErrorTeamFolder {
      '.tag': 'team_folder';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface TransferFolderErrorNoPermission {
      '.tag': 'no_permission';
    }

    interface TransferFolderErrorOther {
      '.tag': 'other';
    }

    type TransferFolderError = TransferFolderErrorAccessError | TransferFolderErrorInvalidDropboxId | TransferFolderErrorNewOwnerNotAMember | TransferFolderErrorNewOwnerUnmounted | TransferFolderErrorNewOwnerEmailUnverified | TransferFolderErrorTeamFolder | TransferFolderErrorNoPermission | TransferFolderErrorOther;

    interface UnmountFolderArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
    }

    interface UnmountFolderErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface UnmountFolderErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * The shared folder can't be unmounted. One example where this can occur is
     * when the shared folder's parent folder is also a shared folder that
     * resides in the current user's Dropbox.
     */
    interface UnmountFolderErrorNotUnmountable {
      '.tag': 'not_unmountable';
    }

    interface UnmountFolderErrorOther {
      '.tag': 'other';
    }

    type UnmountFolderError = UnmountFolderErrorAccessError | UnmountFolderErrorNoPermission | UnmountFolderErrorNotUnmountable | UnmountFolderErrorOther;

    /**
     * Arguments for unshareFile().
     */
    interface UnshareFileArg {
      /**
       * The file to unshare.
       */
      file: PathOrId;
    }

    interface UnshareFileErrorUserError {
      '.tag': 'user_error';
      user_error: SharingUserError;
    }

    interface UnshareFileErrorAccessError {
      '.tag': 'access_error';
      access_error: SharingFileAccessError;
    }

    interface UnshareFileErrorOther {
      '.tag': 'other';
    }

    /**
     * Error result for unshareFile().
     */
    type UnshareFileError = UnshareFileErrorUserError | UnshareFileErrorAccessError | UnshareFileErrorOther;

    interface UnshareFolderArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * Defaults to False.
       */
      leave_a_copy?: boolean;
    }

    interface UnshareFolderErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * This action cannot be performed on a team shared folder.
     */
    interface UnshareFolderErrorTeamFolder {
      '.tag': 'team_folder';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface UnshareFolderErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * This shared folder has too many files to be unshared.
     */
    interface UnshareFolderErrorTooManyFiles {
      '.tag': 'too_many_files';
    }

    interface UnshareFolderErrorOther {
      '.tag': 'other';
    }

    type UnshareFolderError = UnshareFolderErrorAccessError | UnshareFolderErrorTeamFolder | UnshareFolderErrorNoPermission | UnshareFolderErrorTooManyFiles | UnshareFolderErrorOther;

    /**
     * Arguments for updateFileMember().
     */
    interface UpdateFileMemberArgs extends ChangeFileMemberAccessArgs {
    }

    interface UpdateFolderMemberArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * The member of the shared folder to update.  Only the
       * MemberSelector.dropbox_id may be set at this time.
       */
      member: MemberSelector;
      /**
       * The new access level for member. AccessLevel.owner is disallowed.
       */
      access_level: AccessLevel;
    }

    interface UpdateFolderMemberErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    interface UpdateFolderMemberErrorMemberError {
      '.tag': 'member_error';
      member_error: SharedFolderMemberError;
    }

    /**
     * If updating the access type required the member to be added to the shared
     * folder and there was an error when adding the member.
     */
    interface UpdateFolderMemberErrorNoExplicitAccess {
      '.tag': 'no_explicit_access';
      no_explicit_access: AddFolderMemberError;
    }

    /**
     * The current user's account doesn't support this action. An example of
     * this is when downgrading a member from editor to viewer. This action can
     * only be performed by users that have upgraded to a Pro or Business plan.
     */
    interface UpdateFolderMemberErrorInsufficientPlan {
      '.tag': 'insufficient_plan';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface UpdateFolderMemberErrorNoPermission {
      '.tag': 'no_permission';
    }

    interface UpdateFolderMemberErrorOther {
      '.tag': 'other';
    }

    type UpdateFolderMemberError = UpdateFolderMemberErrorAccessError | UpdateFolderMemberErrorMemberError | UpdateFolderMemberErrorNoExplicitAccess | UpdateFolderMemberErrorInsufficientPlan | UpdateFolderMemberErrorNoPermission | UpdateFolderMemberErrorOther;

    /**
     * If any of the policies are unset, then they retain their current setting.
     */
    interface UpdateFolderPolicyArg {
      /**
       * The ID for the shared folder.
       */
      shared_folder_id: common.SharedFolderId;
      /**
       * Who can be a member of this shared folder. Only applicable if the
       * current user is on a team.
       */
      member_policy?: MemberPolicy;
      /**
       * Who can add and remove members of this shared folder.
       */
      acl_update_policy?: AclUpdatePolicy;
      /**
       * Who can enable/disable viewer info for this shared folder.
       */
      viewer_info_policy?: ViewerInfoPolicy;
      /**
       * The policy to apply to shared links created for content inside this
       * shared folder. The current user must be on a team to set this policy to
       * SharedLinkPolicy.members.
       */
      shared_link_policy?: SharedLinkPolicy;
      /**
       * Settings on the link for this folder.
       */
      link_settings?: LinkSettings;
      /**
       * A list of `FolderAction`s corresponding to `FolderPermission`s that
       * should appear in the  response's SharedFolderMetadata.permissions field
       * describing the actions the  authenticated user can perform on the
       * folder.
       */
      actions?: Array<FolderAction>;
    }

    interface UpdateFolderPolicyErrorAccessError {
      '.tag': 'access_error';
      access_error: SharedFolderAccessError;
    }

    /**
     * UpdateFolderPolicyArg.member_policy was set even though user is not on a
     * team.
     */
    interface UpdateFolderPolicyErrorNotOnTeam {
      '.tag': 'not_on_team';
    }

    /**
     * Team policy is more restrictive than ShareFolderArg.member_policy.
     */
    interface UpdateFolderPolicyErrorTeamPolicyDisallowsMemberPolicy {
      '.tag': 'team_policy_disallows_member_policy';
    }

    /**
     * The current account is not allowed to select the specified
     * ShareFolderArg.shared_link_policy.
     */
    interface UpdateFolderPolicyErrorDisallowedSharedLinkPolicy {
      '.tag': 'disallowed_shared_link_policy';
    }

    /**
     * The current user does not have permission to perform this action.
     */
    interface UpdateFolderPolicyErrorNoPermission {
      '.tag': 'no_permission';
    }

    /**
     * This action cannot be performed on a team shared folder.
     */
    interface UpdateFolderPolicyErrorTeamFolder {
      '.tag': 'team_folder';
    }

    interface UpdateFolderPolicyErrorOther {
      '.tag': 'other';
    }

    type UpdateFolderPolicyError = UpdateFolderPolicyErrorAccessError | UpdateFolderPolicyErrorNotOnTeam | UpdateFolderPolicyErrorTeamPolicyDisallowsMemberPolicy | UpdateFolderPolicyErrorDisallowedSharedLinkPolicy | UpdateFolderPolicyErrorNoPermission | UpdateFolderPolicyErrorTeamFolder | UpdateFolderPolicyErrorOther;

    /**
     * Basic information about a user. Use usersAccount() and
     * usersAccountBatch() to obtain more detailed information.
     */
    interface UserInfo {
      /**
       * The account ID of the user.
       */
      account_id: users_common.AccountId;
      /**
       * If the user is in the same team as current user.
       */
      same_team: boolean;
      /**
       * The team member ID of the shared folder member. Only present if
       * same_team is true.
       */
      team_member_id?: string;
    }

    /**
     * The information about a user member of the shared content.
     */
    interface UserMembershipInfo extends MembershipInfo {
      /**
       * The account information for the membership user.
       */
      user: UserInfo;
    }

    /**
     * Viewer information is available on this file.
     */
    interface ViewerInfoPolicyEnabled {
      '.tag': 'enabled';
    }

    /**
     * Viewer information is disabled on this file.
     */
    interface ViewerInfoPolicyDisabled {
      '.tag': 'disabled';
    }

    interface ViewerInfoPolicyOther {
      '.tag': 'other';
    }

    type ViewerInfoPolicy = ViewerInfoPolicyEnabled | ViewerInfoPolicyDisabled | ViewerInfoPolicyOther;

    /**
     * Anyone who has received the link can access it. No login required.
     */
    interface VisibilityPublic {
      '.tag': 'public';
    }

    /**
     * Only members of the same team can access the link. Login is required.
     */
    interface VisibilityTeamOnly {
      '.tag': 'team_only';
    }

    /**
     * A link-specific password is required to access the link. Login is not
     * required.
     */
    interface VisibilityPassword {
      '.tag': 'password';
    }

    /**
     * Only members of the same team who have the link-specific password can
     * access the link.
     */
    interface VisibilityTeamAndPassword {
      '.tag': 'team_and_password';
    }

    /**
     * Only members of the shared folder containing the linked file can access
     * the link. Login is required.
     */
    interface VisibilitySharedFolderOnly {
      '.tag': 'shared_folder_only';
    }

    interface VisibilityOther {
      '.tag': 'other';
    }

    /**
     * Who can access a shared link. The most open visibility is public. The
     * default depends on many aspects, such as team and user preferences and
     * shared folder settings.
     */
    type Visibility = VisibilityPublic | VisibilityTeamOnly | VisibilityPassword | VisibilityTeamAndPassword | VisibilitySharedFolderOnly | VisibilityOther;

    type DropboxId = string;

    type FileId = string;

    type GetSharedLinkFileArg = GetSharedLinkMetadataArg;

    type Id = files.Id;

    type Path = files.Path;

    type PathOrId = string;

    type ReadPath = files.ReadPath;

    type Rev = files.Rev;

    type TeamInfo = users.Team;

  }

  namespace team {
    /**
     * Information on active web sessions
     */
    interface ActiveWebSession extends DeviceSession {
      /**
       * Information on the hosting device
       */
      user_agent: string;
      /**
       * Information on the hosting operating system
       */
      os: string;
      /**
       * Information on the browser used for this web session
       */
      browser: string;
      /**
       * The time this session expires
       */
      expires?: common.DropboxTimestamp;
    }

    /**
     * Arguments for adding property templates.
     */
    interface AddPropertyTemplateArg extends properties.PropertyGroupTemplate {
    }

    interface AddPropertyTemplateResult {
      /**
       * An identifier for property template added by propertiesTemplateAdd().
       */
      template_id: properties.TemplateId;
    }

    /**
     * User is an administrator of the team - has all permissions.
     */
    interface AdminTierTeamAdmin {
      '.tag': 'team_admin';
    }

    /**
     * User can do most user provisioning, de-provisioning and management.
     */
    interface AdminTierUserManagementAdmin {
      '.tag': 'user_management_admin';
    }

    /**
     * User can do a limited set of common support tasks for existing users.
     */
    interface AdminTierSupportAdmin {
      '.tag': 'support_admin';
    }

    /**
     * User is not an admin of the team.
     */
    interface AdminTierMemberOnly {
      '.tag': 'member_only';
    }

    /**
     * Describes which team-related admin permissions a user has.
     */
    type AdminTier = AdminTierTeamAdmin | AdminTierUserManagementAdmin | AdminTierSupportAdmin | AdminTierMemberOnly;

    /**
     * Information on linked third party applications
     */
    interface ApiApp {
      /**
       * The application unique id
       */
      app_id: string;
      /**
       * The application name
       */
      app_name: string;
      /**
       * The application publisher name
       */
      publisher?: string;
      /**
       * The publisher's URL
       */
      publisher_url?: string;
      /**
       * The time this application was linked
       */
      linked?: common.DropboxTimestamp;
      /**
       * Whether the linked application uses a dedicated folder
       */
      is_app_folder: boolean;
    }

    /**
     * Base report structure.
     */
    interface BaseDfbReport {
      /**
       * First date present in the results as 'YYYY-MM-DD' or None.
       */
      start_date: string;
    }

    interface BaseTeamFolderErrorAccessError {
      '.tag': 'access_error';
      access_error: TeamFolderAccessError;
    }

    interface BaseTeamFolderErrorStatusError {
      '.tag': 'status_error';
      status_error: TeamFolderInvalidStatusError;
    }

    interface BaseTeamFolderErrorTeamSharedDropboxError {
      '.tag': 'team_shared_dropbox_error';
      team_shared_dropbox_error: TeamFolderTeamSharedDropboxError;
    }

    interface BaseTeamFolderErrorOther {
      '.tag': 'other';
    }

    /**
     * Base error that all errors for existing team folders should extend.
     */
    type BaseTeamFolderError = BaseTeamFolderErrorAccessError | BaseTeamFolderErrorStatusError | BaseTeamFolderErrorTeamSharedDropboxError | BaseTeamFolderErrorOther;

    /**
     * Input arguments that can be provided for most reports.
     */
    interface DateRange {
      /**
       * Optional starting date (inclusive)
       */
      start_date?: common.Date;
      /**
       * Optional ending date (exclusive)
       */
      end_date?: common.Date;
    }

    interface DateRangeErrorOther {
      '.tag': 'other';
    }

    /**
     * Errors that can originate from problems in input arguments to reports.
     */
    type DateRangeError = DateRangeErrorOther;

    /**
     * Information about linked Dropbox desktop client sessions
     */
    interface DesktopClientSession extends DeviceSession {
      /**
       * Name of the hosting desktop
       */
      host_name: string;
      /**
       * The Dropbox desktop client type
       */
      client_type: DesktopPlatform;
      /**
       * The Dropbox client version
       */
      client_version: string;
      /**
       * Information on the hosting platform
       */
      platform: string;
      /**
       * Whether it's possible to delete all of the account files upon unlinking
       */
      is_delete_on_unlink_supported: boolean;
    }

    /**
     * Official Windows Dropbox desktop client
     */
    interface DesktopPlatformWindows {
      '.tag': 'windows';
    }

    /**
     * Official Mac Dropbox desktop client
     */
    interface DesktopPlatformMac {
      '.tag': 'mac';
    }

    /**
     * Official Linux Dropbox desktop client
     */
    interface DesktopPlatformLinux {
      '.tag': 'linux';
    }

    interface DesktopPlatformOther {
      '.tag': 'other';
    }

    type DesktopPlatform = DesktopPlatformWindows | DesktopPlatformMac | DesktopPlatformLinux | DesktopPlatformOther;

    interface DeviceSession {
      /**
       * The session id
       */
      session_id: string;
      /**
       * The IP address of the last activity from this session
       */
      ip_address?: string;
      /**
       * The country from which the last activity from this session was made
       */
      country?: string;
      /**
       * The time this session was created
       */
      created?: common.DropboxTimestamp;
      /**
       * The time of the last activity from this session
       */
      updated?: common.DropboxTimestamp;
    }

    interface DeviceSessionArg {
      /**
       * The session id
       */
      session_id: string;
      /**
       * The unique id of the member owning the device
       */
      team_member_id: string;
    }

    /**
     * Each of the items is an array of values, one value per day. The value is
     * the number of devices active within a time window, ending with that day.
     * If there is no data for a day, then the value will be None.
     */
    interface DevicesActive {
      /**
       * Array of number of linked windows (desktop) clients with activity.
       */
      windows: NumberPerDay;
      /**
       * Array of number of linked mac (desktop) clients with activity.
       */
      macos: NumberPerDay;
      /**
       * Array of number of linked linus (desktop) clients with activity.
       */
      linux: NumberPerDay;
      /**
       * Array of number of linked ios devices with activity.
       */
      ios: NumberPerDay;
      /**
       * Array of number of linked android devices with activity.
       */
      android: NumberPerDay;
      /**
       * Array of number of other linked devices (blackberry, windows phone,
       * etc)  with activity.
       */
      other: NumberPerDay;
      /**
       * Array of total number of linked clients with activity.
       */
      total: NumberPerDay;
    }

    /**
     * The number of upload API calls allowed per month.
     */
    interface FeatureUploadApiRateLimit {
      '.tag': 'upload_api_rate_limit';
    }

    /**
     * Does this team have a have a company shared dropbox.
     */
    interface FeatureHasTeamSharedDropbox {
      '.tag': 'has_team_shared_dropbox';
    }

    interface FeatureOther {
      '.tag': 'other';
    }

    /**
     * A set of features that Dropbox for Business account support.
     */
    type Feature = FeatureUploadApiRateLimit | FeatureHasTeamSharedDropbox | FeatureOther;

    interface FeatureValueUploadApiRateLimit {
      '.tag': 'upload_api_rate_limit';
      upload_api_rate_limit: UploadApiRateLimitValue;
    }

    interface FeatureValueHasTeamSharedDropbox {
      '.tag': 'has_team_shared_dropbox';
      has_team_shared_dropbox: HasTeamSharedDropboxValue;
    }

    interface FeatureValueOther {
      '.tag': 'other';
    }

    /**
     * The values correspond to entries in team.Feature. You may get different
     * value according to your Dropbox for Business plan.
     */
    type FeatureValue = FeatureValueUploadApiRateLimit | FeatureValueHasTeamSharedDropbox | FeatureValueOther;

    interface FeaturesGetValuesBatchArg {
      /**
       * A list of features in team.Feature. If the list is empty, this route
       * will return team.FeaturesGetValuesBatchError.
       */
      features: Array<Feature>;
    }

    /**
     * At least one team.Feature must be included in the
     * team.FeaturesGetValuesBatchArg.features list.
     */
    interface FeaturesGetValuesBatchErrorEmptyFeaturesList {
      '.tag': 'empty_features_list';
    }

    interface FeaturesGetValuesBatchErrorOther {
      '.tag': 'other';
    }

    type FeaturesGetValuesBatchError = FeaturesGetValuesBatchErrorEmptyFeaturesList | FeaturesGetValuesBatchErrorOther;

    interface FeaturesGetValuesBatchResult {
      values: Array<FeatureValue>;
    }

    /**
     * Activity Report Result. Each of the items in the storage report is an
     * array of values, one value per day. If there is no data for a day, then
     * the value will be None.
     */
    interface GetActivityReport extends BaseDfbReport {
      /**
       * Array of total number of adds by team members.
       */
      adds: NumberPerDay;
      /**
       * Array of number of edits by team members. If the same user edits the
       * same file multiple times this is counted as a single edit.
       */
      edits: NumberPerDay;
      /**
       * Array of total number of deletes by team members.
       */
      deletes: NumberPerDay;
      /**
       * Array of the number of users who have been active in the last 28 days.
       */
      active_users_28_day: NumberPerDay;
      /**
       * Array of the number of users who have been active in the last week.
       */
      active_users_7_day: NumberPerDay;
      /**
       * Array of the number of users who have been active in the last day.
       */
      active_users_1_day: NumberPerDay;
      /**
       * Array of the number of shared folders with some activity in the last 28
       * days.
       */
      active_shared_folders_28_day: NumberPerDay;
      /**
       * Array of the number of shared folders with some activity in the last
       * week.
       */
      active_shared_folders_7_day: NumberPerDay;
      /**
       * Array of the number of shared folders with some activity in the last
       * day.
       */
      active_shared_folders_1_day: NumberPerDay;
      /**
       * Array of the number of shared links created.
       */
      shared_links_created: NumberPerDay;
      /**
       * Array of the number of views by team users to shared links created by
       * the team.
       */
      shared_links_viewed_by_team: NumberPerDay;
      /**
       * Array of the number of views by users outside of the team to shared
       * links created by the team.
       */
      shared_links_viewed_by_outside_user: NumberPerDay;
      /**
       * Array of the number of views by non-logged-in users to shared links
       * created by the team.
       */
      shared_links_viewed_by_not_logged_in: NumberPerDay;
      /**
       * Array of the total number of views to shared links created by the team.
       */
      shared_links_viewed_total: NumberPerDay;
    }

    /**
     * Devices Report Result. Contains subsections for different time ranges of
     * activity. Each of the items in each subsection of the storage report is
     * an array of values, one value per day. If there is no data for a day,
     * then the value will be None.
     */
    interface GetDevicesReport extends BaseDfbReport {
      /**
       * Report of the number of devices active in the last day.
       */
      active_1_day: DevicesActive;
      /**
       * Report of the number of devices active in the last 7 days.
       */
      active_7_day: DevicesActive;
      /**
       * Report of the number of devices active in the last 28 days.
       */
      active_28_day: DevicesActive;
    }

    /**
     * Membership Report Result. Each of the items in the storage report is an
     * array of values, one value per day. If there is no data for a day, then
     * the value will be None.
     */
    interface GetMembershipReport extends BaseDfbReport {
      /**
       * Team size, for each day.
       */
      team_size: NumberPerDay;
      /**
       * The number of pending invites to the team, for each day.
       */
      pending_invites: NumberPerDay;
      /**
       * The number of members that joined the team, for each day.
       */
      members_joined: NumberPerDay;
      /**
       * The number of suspended team members, for each day.
       */
      suspended_members: NumberPerDay;
      /**
       * The total number of licenses the team has, for each day.
       */
      licenses: NumberPerDay;
    }

    /**
     * Storage Report Result. Each of the items in the storage report is an
     * array of values, one value per day. If there is no data for a day, then
     * the value will be None.
     */
    interface GetStorageReport extends BaseDfbReport {
      /**
       * Sum of the shared, unshared, and datastore usages, for each day.
       */
      total_usage: NumberPerDay;
      /**
       * Array of the combined size (bytes) of team members' shared folders, for
       * each day.
       */
      shared_usage: NumberPerDay;
      /**
       * Array of the combined size (bytes) of team members' root namespaces,
       * for each day.
       */
      unshared_usage: NumberPerDay;
      /**
       * Array of the number of shared folders owned by team members, for each
       * day.
       */
      shared_folders: NumberPerDay;
      /**
       * Array of storage summaries of team members' account sizes. Each storage
       * summary is an array of key, value pairs, where each pair describes a
       * storage bucket. The key indicates the upper bound of the bucket and the
       * value is the number of users in that bucket. There is one such summary
       * per day. If there is no data for a day, the storage summary will be
       * empty.
       */
      member_storage_map: Array<Array<StorageBucket>>;
    }

    /**
     * User is a member of the group, but has no special permissions.
     */
    interface GroupAccessTypeMember {
      '.tag': 'member';
    }

    /**
     * User can rename the group, and add/remove members.
     */
    interface GroupAccessTypeOwner {
      '.tag': 'owner';
    }

    /**
     * Role of a user in group.
     */
    type GroupAccessType = GroupAccessTypeMember | GroupAccessTypeOwner;

    interface GroupCreateArg {
      /**
       * Group name.
       */
      group_name: string;
      /**
       * The creator of a team can associate an arbitrary external ID to the
       * group.
       */
      group_external_id?: team_common.GroupExternalId;
      /**
       * Whether the team can be managed by selected users, or only by team
       * admins.
       */
      group_management_type?: team_common.GroupManagementType;
    }

    /**
     * The requested group name is already being used by another group.
     */
    interface GroupCreateErrorGroupNameAlreadyUsed {
      '.tag': 'group_name_already_used';
    }

    /**
     * Group name is empty or has invalid characters.
     */
    interface GroupCreateErrorGroupNameInvalid {
      '.tag': 'group_name_invalid';
    }

    /**
     * The requested external ID is already being used by another group.
     */
    interface GroupCreateErrorExternalIdAlreadyInUse {
      '.tag': 'external_id_already_in_use';
    }

    /**
     * System-managed group cannot be manually created.
     */
    interface GroupCreateErrorSystemManagedGroupDisallowed {
      '.tag': 'system_managed_group_disallowed';
    }

    interface GroupCreateErrorOther {
      '.tag': 'other';
    }

    type GroupCreateError = GroupCreateErrorGroupNameAlreadyUsed | GroupCreateErrorGroupNameInvalid | GroupCreateErrorExternalIdAlreadyInUse | GroupCreateErrorSystemManagedGroupDisallowed | GroupCreateErrorOther;

    /**
     * This group has already been deleted.
     */
    interface GroupDeleteErrorGroupAlreadyDeleted {
      '.tag': 'group_already_deleted';
    }

    type GroupDeleteError = GroupSelectorWithTeamGroupError | GroupDeleteErrorGroupAlreadyDeleted;

    /**
     * Full description of a group.
     */
    interface GroupFullInfo extends team_common.GroupSummary {
      /**
       * List of group members.
       */
      members?: Array<GroupMemberInfo>;
      /**
       * The group creation time as a UTC timestamp in milliseconds since the
       * Unix epoch.
       */
      created: number;
    }

    /**
     * Profile of group member, and role in group.
     */
    interface GroupMemberInfo {
      /**
       * Profile of group member.
       */
      profile: MemberProfile;
      /**
       * The role that the user has in the group.
       */
      access_type: GroupAccessType;
    }

    /**
     * Argument for selecting a group and a single user.
     */
    interface GroupMemberSelector {
      /**
       * Specify a group.
       */
      group: GroupSelector;
      /**
       * Identity of a user that is a member of group.
       */
      user: UserSelectorArg;
    }

    /**
     * The specified user is not a member of this group.
     */
    interface GroupMemberSelectorErrorMemberNotInGroup {
      '.tag': 'member_not_in_group';
    }

    /**
     * Error that can be raised when team.GroupMemberSelector is used, and the
     * user is required to be a member of the specified group.
     */
    type GroupMemberSelectorError = GroupSelectorWithTeamGroupError | GroupMemberSelectorErrorMemberNotInGroup;

    /**
     * A company managed group cannot be managed by a user.
     */
    interface GroupMemberSetAccessTypeErrorUserCannotBeManagerOfCompanyManagedGroup {
      '.tag': 'user_cannot_be_manager_of_company_managed_group';
    }

    type GroupMemberSetAccessTypeError = GroupMemberSelectorError | GroupMemberSetAccessTypeErrorUserCannotBeManagerOfCompanyManagedGroup;

    interface GroupMembersAddArg extends IncludeMembersArg {
      /**
       * Group to which users will be added.
       */
      group: GroupSelector;
      /**
       * List of users to be added to the group.
       */
      members: Array<MemberAccess>;
    }

    /**
     * You cannot add duplicate users. One or more of the members you are trying
     * to add is already a member of the group.
     */
    interface GroupMembersAddErrorDuplicateUser {
      '.tag': 'duplicate_user';
    }

    /**
     * Group is not in this team. You cannot add members to a group that is
     * outside of your team.
     */
    interface GroupMembersAddErrorGroupNotInTeam {
      '.tag': 'group_not_in_team';
    }

    /**
     * These members are not part of your team. Currently, you cannot add
     * members to a group if they are not part of your team, though this may
     * change in a subsequent version. To add new members to your Dropbox
     * Business team, use the membersAdd() endpoint.
     */
    interface GroupMembersAddErrorMembersNotInTeam {
      '.tag': 'members_not_in_team';
      members_not_in_team: Array<string>;
    }

    /**
     * These users were not found in Dropbox.
     */
    interface GroupMembersAddErrorUsersNotFound {
      '.tag': 'users_not_found';
      users_not_found: Array<string>;
    }

    /**
     * A suspended user cannot be added to a group as GroupAccessType.owner.
     */
    interface GroupMembersAddErrorUserMustBeActiveToBeOwner {
      '.tag': 'user_must_be_active_to_be_owner';
    }

    /**
     * A company-managed group cannot be managed by a user.
     */
    interface GroupMembersAddErrorUserCannotBeManagerOfCompanyManagedGroup {
      '.tag': 'user_cannot_be_manager_of_company_managed_group';
      user_cannot_be_manager_of_company_managed_group: Array<string>;
    }

    type GroupMembersAddError = GroupSelectorWithTeamGroupError | GroupMembersAddErrorDuplicateUser | GroupMembersAddErrorGroupNotInTeam | GroupMembersAddErrorMembersNotInTeam | GroupMembersAddErrorUsersNotFound | GroupMembersAddErrorUserMustBeActiveToBeOwner | GroupMembersAddErrorUserCannotBeManagerOfCompanyManagedGroup;

    /**
     * Result returned by groupsMembersAdd() and groupsMembersRemove().
     */
    interface GroupMembersChangeResult {
      /**
       * The group info after member change operation has been performed.
       */
      group_info: GroupFullInfo;
      /**
       * An ID that can be used to obtain the status of granting/revoking
       * group-owned resources.
       */
      async_job_id: async.AsyncJobId;
    }

    interface GroupMembersRemoveArg extends IncludeMembersArg {
      /**
       * Group from which users will be removed.
       */
      group: GroupSelector;
      /**
       * List of users to be removed from the group.
       */
      users: Array<UserSelectorArg>;
    }

    /**
     * Group is not in this team. You cannot remove members from a group that is
     * outside of your team.
     */
    interface GroupMembersRemoveErrorGroupNotInTeam {
      '.tag': 'group_not_in_team';
    }

    /**
     * These members are not part of your team.
     */
    interface GroupMembersRemoveErrorMembersNotInTeam {
      '.tag': 'members_not_in_team';
      members_not_in_team: Array<string>;
    }

    /**
     * These users were not found in Dropbox.
     */
    interface GroupMembersRemoveErrorUsersNotFound {
      '.tag': 'users_not_found';
      users_not_found: Array<string>;
    }

    type GroupMembersRemoveError = GroupMembersSelectorError | GroupMembersRemoveErrorGroupNotInTeam | GroupMembersRemoveErrorMembersNotInTeam | GroupMembersRemoveErrorUsersNotFound;

    /**
     * Argument for selecting a group and a list of users.
     */
    interface GroupMembersSelector {
      /**
       * Specify a group.
       */
      group: GroupSelector;
      /**
       * A list of users that are members of group.
       */
      users: UsersSelectorArg;
    }

    /**
     * At least one of the specified users is not a member of the group.
     */
    interface GroupMembersSelectorErrorMemberNotInGroup {
      '.tag': 'member_not_in_group';
    }

    /**
     * Error that can be raised when team.GroupMembersSelector is used, and the
     * users are required to be members of the specified group.
     */
    type GroupMembersSelectorError = GroupSelectorWithTeamGroupError | GroupMembersSelectorErrorMemberNotInGroup;

    interface GroupMembersSetAccessTypeArg extends GroupMemberSelector {
      /**
       * New group access type the user will have.
       */
      access_type: GroupAccessType;
      /**
       * Defaults to True.
       */
      return_members?: boolean;
    }

    /**
     * Group ID.
     */
    interface GroupSelectorGroupId {
      '.tag': 'group_id';
      group_id: team_common.GroupId;
    }

    /**
     * External ID of the group.
     */
    interface GroupSelectorGroupExternalId {
      '.tag': 'group_external_id';
      group_external_id: team_common.GroupExternalId;
    }

    /**
     * Argument for selecting a single group, either by group_id or by external
     * group ID.
     */
    type GroupSelector = GroupSelectorGroupId | GroupSelectorGroupExternalId;

    /**
     * No matching group found. No groups match the specified group ID.
     */
    interface GroupSelectorErrorGroupNotFound {
      '.tag': 'group_not_found';
    }

    interface GroupSelectorErrorOther {
      '.tag': 'other';
    }

    /**
     * Error that can be raised when team.GroupSelector is used.
     */
    type GroupSelectorError = GroupSelectorErrorGroupNotFound | GroupSelectorErrorOther;

    /**
     * This operation is not supported on system-managed groups.
     */
    interface GroupSelectorWithTeamGroupErrorSystemManagedGroupDisallowed {
      '.tag': 'system_managed_group_disallowed';
    }

    /**
     * Error that can be raised when team.GroupSelector is used and team groups
     * are disallowed from being used.
     */
    type GroupSelectorWithTeamGroupError = GroupSelectorError | GroupSelectorWithTeamGroupErrorSystemManagedGroupDisallowed;

    interface GroupUpdateArgs extends IncludeMembersArg {
      /**
       * Specify a group.
       */
      group: GroupSelector;
      /**
       * Optional argument. Set group name to this if provided.
       */
      new_group_name?: string;
      /**
       * Optional argument. New group external ID. If the argument is None, the
       * group's external_id won't be updated. If the argument is empty string,
       * the group's external id will be cleared.
       */
      new_group_external_id?: team_common.GroupExternalId;
      /**
       * Set new group management type, if provided.
       */
      new_group_management_type?: team_common.GroupManagementType;
    }

    /**
     * The requested group name is already being used by another group.
     */
    interface GroupUpdateErrorGroupNameAlreadyUsed {
      '.tag': 'group_name_already_used';
    }

    /**
     * Group name is empty or has invalid characters.
     */
    interface GroupUpdateErrorGroupNameInvalid {
      '.tag': 'group_name_invalid';
    }

    /**
     * The requested external ID is already being used by another group.
     */
    interface GroupUpdateErrorExternalIdAlreadyInUse {
      '.tag': 'external_id_already_in_use';
    }

    type GroupUpdateError = GroupSelectorWithTeamGroupError | GroupUpdateErrorGroupNameAlreadyUsed | GroupUpdateErrorGroupNameInvalid | GroupUpdateErrorExternalIdAlreadyInUse;

    /**
     * The group is not on your team.
     */
    interface GroupsGetInfoErrorGroupNotOnTeam {
      '.tag': 'group_not_on_team';
    }

    interface GroupsGetInfoErrorOther {
      '.tag': 'other';
    }

    type GroupsGetInfoError = GroupsGetInfoErrorGroupNotOnTeam | GroupsGetInfoErrorOther;

    /**
     * An ID that was provided as a parameter to groupsGetInfo(), and did not
     * match a corresponding group. The ID can be a group ID, or an external ID,
     * depending on how the method was called.
     */
    interface GroupsGetInfoItemIdNotFound {
      '.tag': 'id_not_found';
      id_not_found: string;
    }

    /**
     * Info about a group.
     */
    interface GroupsGetInfoItemGroupInfo {
      '.tag': 'group_info';
      group_info: GroupFullInfo;
    }

    type GroupsGetInfoItem = GroupsGetInfoItemIdNotFound | GroupsGetInfoItemGroupInfo;

    interface GroupsListArg {
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface GroupsListContinueArg {
      /**
       * Indicates from what point to get the next set of groups.
       */
      cursor: string;
    }

    /**
     * The cursor is invalid.
     */
    interface GroupsListContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface GroupsListContinueErrorOther {
      '.tag': 'other';
    }

    type GroupsListContinueError = GroupsListContinueErrorInvalidCursor | GroupsListContinueErrorOther;

    interface GroupsListResult {
      groups: Array<team_common.GroupSummary>;
      /**
       * Pass the cursor into groupsListContinue() to obtain the additional
       * groups.
       */
      cursor: string;
      /**
       * Is true if there are additional groups that have not been returned yet.
       * An additional call to groupsListContinue() can retrieve them.
       */
      has_more: boolean;
    }

    interface GroupsMembersListArg {
      /**
       * The group whose members are to be listed.
       */
      group: GroupSelector;
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface GroupsMembersListContinueArg {
      /**
       * Indicates from what point to get the next set of groups.
       */
      cursor: string;
    }

    /**
     * The cursor is invalid.
     */
    interface GroupsMembersListContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface GroupsMembersListContinueErrorOther {
      '.tag': 'other';
    }

    type GroupsMembersListContinueError = GroupsMembersListContinueErrorInvalidCursor | GroupsMembersListContinueErrorOther;

    interface GroupsMembersListResult {
      members: Array<GroupMemberInfo>;
      /**
       * Pass the cursor into groupsMembersListContinue() to obtain additional
       * group members.
       */
      cursor: string;
      /**
       * Is true if there are additional group members that have not been
       * returned yet. An additional call to groupsMembersListContinue() can
       * retrieve them.
       */
      has_more: boolean;
    }

    /**
     * You are not allowed to poll this job.
     */
    interface GroupsPollErrorAccessDenied {
      '.tag': 'access_denied';
    }

    type GroupsPollError = async.PollError | GroupsPollErrorAccessDenied;

    /**
     * List of group IDs.
     */
    interface GroupsSelectorGroupIds {
      '.tag': 'group_ids';
      group_ids: Array<team_common.GroupId>;
    }

    /**
     * List of external IDs of groups.
     */
    interface GroupsSelectorGroupExternalIds {
      '.tag': 'group_external_ids';
      group_external_ids: Array<string>;
    }

    /**
     * Argument for selecting a list of groups, either by group_ids, or external
     * group IDs.
     */
    type GroupsSelector = GroupsSelectorGroupIds | GroupsSelectorGroupExternalIds;

    /**
     * Does this team have a team shared dropbox.
     */
    interface HasTeamSharedDropboxValueHasTeamSharedDropbox {
      '.tag': 'has_team_shared_dropbox';
      has_team_shared_dropbox: boolean;
    }

    interface HasTeamSharedDropboxValueOther {
      '.tag': 'other';
    }

    /**
     * The value for Feature.has_team_shared_dropbox.
     */
    type HasTeamSharedDropboxValue = HasTeamSharedDropboxValueHasTeamSharedDropbox | HasTeamSharedDropboxValueOther;

    interface IncludeMembersArg {
      /**
       * Defaults to True.
       */
      return_members?: boolean;
    }

    interface ListMemberAppsArg {
      /**
       * The team member id
       */
      team_member_id: string;
    }

    /**
     * Member not found.
     */
    interface ListMemberAppsErrorMemberNotFound {
      '.tag': 'member_not_found';
    }

    interface ListMemberAppsErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by linkedAppsListMemberLinkedApps().
     */
    type ListMemberAppsError = ListMemberAppsErrorMemberNotFound | ListMemberAppsErrorOther;

    interface ListMemberAppsResult {
      /**
       * List of third party applications linked by this team member
       */
      linked_api_apps: Array<ApiApp>;
    }

    interface ListMemberDevicesArg {
      /**
       * The team's member id
       */
      team_member_id: string;
      /**
       * Defaults to True.
       */
      include_web_sessions?: boolean;
      /**
       * Defaults to True.
       */
      include_desktop_clients?: boolean;
      /**
       * Defaults to True.
       */
      include_mobile_clients?: boolean;
    }

    /**
     * Member not found.
     */
    interface ListMemberDevicesErrorMemberNotFound {
      '.tag': 'member_not_found';
    }

    interface ListMemberDevicesErrorOther {
      '.tag': 'other';
    }

    type ListMemberDevicesError = ListMemberDevicesErrorMemberNotFound | ListMemberDevicesErrorOther;

    interface ListMemberDevicesResult {
      /**
       * List of web sessions made by this team member
       */
      active_web_sessions?: Array<ActiveWebSession>;
      /**
       * List of desktop clients used by this team member
       */
      desktop_client_sessions?: Array<DesktopClientSession>;
      /**
       * List of mobile client used by this team member
       */
      mobile_client_sessions?: Array<MobileClientSession>;
    }

    /**
     * Arguments for linkedAppsListMembersLinkedApps().
     */
    interface ListMembersAppsArg {
      /**
       * At the first call to the linkedAppsListMembersLinkedApps() the cursor
       * shouldn't be passed. Then, if the result of the call includes a cursor,
       * the following requests should include the received cursors in order to
       * receive the next sub list of the team applications
       */
      cursor?: string;
    }

    /**
     * Indicates that the cursor has been invalidated. Call
     * linkedAppsListMembersLinkedApps() again with an empty cursor to obtain a
     * new cursor.
     */
    interface ListMembersAppsErrorReset {
      '.tag': 'reset';
    }

    interface ListMembersAppsErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by linkedAppsListMembersLinkedApps()
     */
    type ListMembersAppsError = ListMembersAppsErrorReset | ListMembersAppsErrorOther;

    /**
     * Information returned by linkedAppsListMembersLinkedApps().
     */
    interface ListMembersAppsResult {
      /**
       * The linked applications of each member of the team
       */
      apps: Array<MemberLinkedApps>;
      /**
       * If true, then there are more apps available. Pass the cursor to
       * linkedAppsListMembersLinkedApps() to retrieve the rest.
       */
      has_more: boolean;
      /**
       * Pass the cursor into linkedAppsListMembersLinkedApps() to receive the
       * next sub list of team's applications.
       */
      cursor?: string;
    }

    interface ListMembersDevicesArg {
      /**
       * At the first call to the devicesListMembersDevices() the cursor
       * shouldn't be passed. Then, if the result of the call includes a cursor,
       * the following requests should include the received cursors in order to
       * receive the next sub list of team devices
       */
      cursor?: string;
      /**
       * Defaults to True.
       */
      include_web_sessions?: boolean;
      /**
       * Defaults to True.
       */
      include_desktop_clients?: boolean;
      /**
       * Defaults to True.
       */
      include_mobile_clients?: boolean;
    }

    /**
     * Indicates that the cursor has been invalidated. Call
     * devicesListMembersDevices() again with an empty cursor to obtain a new
     * cursor.
     */
    interface ListMembersDevicesErrorReset {
      '.tag': 'reset';
    }

    interface ListMembersDevicesErrorOther {
      '.tag': 'other';
    }

    type ListMembersDevicesError = ListMembersDevicesErrorReset | ListMembersDevicesErrorOther;

    interface ListMembersDevicesResult {
      /**
       * The devices of each member of the team
       */
      devices: Array<MemberDevices>;
      /**
       * If true, then there are more devices available. Pass the cursor to
       * devicesListMembersDevices() to retrieve the rest.
       */
      has_more: boolean;
      /**
       * Pass the cursor into devicesListMembersDevices() to receive the next
       * sub list of team's devices.
       */
      cursor?: string;
    }

    /**
     * Arguments for linkedAppsListTeamLinkedApps().
     */
    interface ListTeamAppsArg {
      /**
       * At the first call to the linkedAppsListTeamLinkedApps() the cursor
       * shouldn't be passed. Then, if the result of the call includes a cursor,
       * the following requests should include the received cursors in order to
       * receive the next sub list of the team applications
       */
      cursor?: string;
    }

    /**
     * Indicates that the cursor has been invalidated. Call
     * linkedAppsListTeamLinkedApps() again with an empty cursor to obtain a new
     * cursor.
     */
    interface ListTeamAppsErrorReset {
      '.tag': 'reset';
    }

    interface ListTeamAppsErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by linkedAppsListTeamLinkedApps()
     */
    type ListTeamAppsError = ListTeamAppsErrorReset | ListTeamAppsErrorOther;

    /**
     * Information returned by linkedAppsListTeamLinkedApps().
     */
    interface ListTeamAppsResult {
      /**
       * The linked applications of each member of the team
       */
      apps: Array<MemberLinkedApps>;
      /**
       * If true, then there are more apps available. Pass the cursor to
       * linkedAppsListTeamLinkedApps() to retrieve the rest.
       */
      has_more: boolean;
      /**
       * Pass the cursor into linkedAppsListTeamLinkedApps() to receive the next
       * sub list of team's applications.
       */
      cursor?: string;
    }

    interface ListTeamDevicesArg {
      /**
       * At the first call to the devicesListTeamDevices() the cursor shouldn't
       * be passed. Then, if the result of the call includes a cursor, the
       * following requests should include the received cursors in order to
       * receive the next sub list of team devices
       */
      cursor?: string;
      /**
       * Defaults to True.
       */
      include_web_sessions?: boolean;
      /**
       * Defaults to True.
       */
      include_desktop_clients?: boolean;
      /**
       * Defaults to True.
       */
      include_mobile_clients?: boolean;
    }

    /**
     * Indicates that the cursor has been invalidated. Call
     * devicesListTeamDevices() again with an empty cursor to obtain a new
     * cursor.
     */
    interface ListTeamDevicesErrorReset {
      '.tag': 'reset';
    }

    interface ListTeamDevicesErrorOther {
      '.tag': 'other';
    }

    type ListTeamDevicesError = ListTeamDevicesErrorReset | ListTeamDevicesErrorOther;

    interface ListTeamDevicesResult {
      /**
       * The devices of each member of the team
       */
      devices: Array<MemberDevices>;
      /**
       * If true, then there are more devices available. Pass the cursor to
       * devicesListTeamDevices() to retrieve the rest.
       */
      has_more: boolean;
      /**
       * Pass the cursor into devicesListTeamDevices() to receive the next sub
       * list of team's devices.
       */
      cursor?: string;
    }

    /**
     * Specify access type a member should have when joined to a group.
     */
    interface MemberAccess {
      /**
       * Identity of a user.
       */
      user: UserSelectorArg;
      /**
       * Access type.
       */
      access_type: GroupAccessType;
    }

    interface MemberAddArg {
      member_email: common.EmailAddress;
      /**
       * Member's first name.
       */
      member_given_name?: common.NamePart;
      /**
       * Member's last name.
       */
      member_surname?: common.NamePart;
      /**
       * External ID for member.
       */
      member_external_id?: team_common.MemberExternalId;
      /**
       * Persistent ID for member. This field is only available to teams using
       * persistent ID SAML configuration.
       */
      member_persistent_id?: string;
      /**
       * Defaults to True.
       */
      send_welcome_email?: boolean;
      /**
       * Defaults to TagRef(Union(u'AdminTier', [UnionField(u'team_admin', Void,
       * False), UnionField(u'user_management_admin', Void, False),
       * UnionField(u'support_admin', Void, False), UnionField(u'member_only',
       * Void, False)]), u'member_only').
       */
      role?: AdminTier;
    }

    /**
     * Describes a user that was successfully added to the team.
     */
    interface MemberAddResultSuccess {
      '.tag': 'success';
      success: TeamMemberInfo;
    }

    /**
     * Team is already full. The organization has no available licenses.
     */
    interface MemberAddResultTeamLicenseLimit {
      '.tag': 'team_license_limit';
      team_license_limit: common.EmailAddress;
    }

    /**
     * Team is already full. The free team member limit has been reached.
     */
    interface MemberAddResultFreeTeamMemberLimitReached {
      '.tag': 'free_team_member_limit_reached';
      free_team_member_limit_reached: common.EmailAddress;
    }

    /**
     * User is already on this team. The provided email address is associated
     * with a user who is already a member of (including in recoverable state)
     * or invited to the team.
     */
    interface MemberAddResultUserAlreadyOnTeam {
      '.tag': 'user_already_on_team';
      user_already_on_team: common.EmailAddress;
    }

    /**
     * User is already on another team. The provided email address is associated
     * with a user that is already a member or invited to another team.
     */
    interface MemberAddResultUserOnAnotherTeam {
      '.tag': 'user_on_another_team';
      user_on_another_team: common.EmailAddress;
    }

    /**
     * User is already paired.
     */
    interface MemberAddResultUserAlreadyPaired {
      '.tag': 'user_already_paired';
      user_already_paired: common.EmailAddress;
    }

    /**
     * User migration has failed.
     */
    interface MemberAddResultUserMigrationFailed {
      '.tag': 'user_migration_failed';
      user_migration_failed: common.EmailAddress;
    }

    /**
     * A user with the given external member ID already exists on the team
     * (including in recoverable state).
     */
    interface MemberAddResultDuplicateExternalMemberId {
      '.tag': 'duplicate_external_member_id';
      duplicate_external_member_id: common.EmailAddress;
    }

    /**
     * A user with the given persistent ID already exists on the team (including
     * in recoverable state).
     */
    interface MemberAddResultDuplicateMemberPersistentId {
      '.tag': 'duplicate_member_persistent_id';
      duplicate_member_persistent_id: common.EmailAddress;
    }

    /**
     * Persistent ID is only available to teams with persistent ID SAML
     * configuration. Please contact Dropbox for more information.
     */
    interface MemberAddResultPersistentIdDisabled {
      '.tag': 'persistent_id_disabled';
      persistent_id_disabled: common.EmailAddress;
    }

    /**
     * User creation has failed.
     */
    interface MemberAddResultUserCreationFailed {
      '.tag': 'user_creation_failed';
      user_creation_failed: common.EmailAddress;
    }

    /**
     * Describes the result of attempting to add a single user to the team.
     * 'success' is the only value indicating that a user was indeed added to
     * the team - the other values explain the type of failure that occurred,
     * and include the email of the user for which the operation has failed.
     */
    type MemberAddResult = MemberAddResultSuccess | MemberAddResultTeamLicenseLimit | MemberAddResultFreeTeamMemberLimitReached | MemberAddResultUserAlreadyOnTeam | MemberAddResultUserOnAnotherTeam | MemberAddResultUserAlreadyPaired | MemberAddResultUserMigrationFailed | MemberAddResultDuplicateExternalMemberId | MemberAddResultDuplicateMemberPersistentId | MemberAddResultPersistentIdDisabled | MemberAddResultUserCreationFailed;

    /**
     * Information on devices of a team's member.
     */
    interface MemberDevices {
      /**
       * The member unique Id
       */
      team_member_id: string;
      /**
       * List of web sessions made by this team member
       */
      web_sessions?: Array<ActiveWebSession>;
      /**
       * List of desktop clients by this team member
       */
      desktop_clients?: Array<DesktopClientSession>;
      /**
       * List of mobile clients by this team member
       */
      mobile_clients?: Array<MobileClientSession>;
    }

    /**
     * Information on linked applications of a team member.
     */
    interface MemberLinkedApps {
      /**
       * The member unique Id
       */
      team_member_id: string;
      /**
       * List of third party applications linked by this team member
       */
      linked_api_apps: Array<ApiApp>;
    }

    /**
     * Basic member profile.
     */
    interface MemberProfile {
      /**
       * ID of user as a member of a team.
       */
      team_member_id: team_common.TeamMemberId;
      /**
       * External ID that a team can attach to the user. An application using
       * the API may find it easier to use their own IDs instead of Dropbox IDs
       * like account_id or team_member_id.
       */
      external_id?: string;
      /**
       * A user's account identifier.
       */
      account_id?: users_common.AccountId;
      /**
       * Email address of user.
       */
      email: string;
      /**
       * Is true if the user's email is verified to be owned by the user.
       */
      email_verified: boolean;
      /**
       * The user's status as a member of a specific team.
       */
      status: TeamMemberStatus;
      /**
       * Representations for a person's name.
       */
      name: users.Name;
      /**
       * The user's membership type: full (normal team member) vs limited (does
       * not use a license; no access to the team's shared quota).
       */
      membership_type: TeamMembershipType;
      /**
       * The date and time the user joined as a member of a specific team.
       */
      joined_on?: common.DropboxTimestamp;
      /**
       * Persistent ID that a team can attach to the user. The persistent ID is
       * unique ID to be used for SAML authentication.
       */
      persistent_id?: string;
    }

    /**
     * The user is not a member of the team.
     */
    interface MemberSelectorErrorUserNotInTeam {
      '.tag': 'user_not_in_team';
    }

    type MemberSelectorError = UserSelectorError | MemberSelectorErrorUserNotInTeam;

    interface MembersAddArg {
      /**
       * Details of new members to be added to the team.
       */
      new_members: Array<MemberAddArg>;
      /**
       * Defaults to False.
       */
      force_async?: boolean;
    }

    /**
     * The asynchronous job has finished. For each member that was specified in
     * the parameter team.MembersAddArg that was provided to membersAdd(), a
     * corresponding item is returned in this list.
     */
    interface MembersAddJobStatusComplete {
      '.tag': 'complete';
      complete: Array<MemberAddResult>;
    }

    /**
     * The asynchronous job returned an error. The string contains an error
     * message.
     */
    interface MembersAddJobStatusFailed {
      '.tag': 'failed';
      failed: string;
    }

    type MembersAddJobStatus = async.PollResultBase | MembersAddJobStatusComplete | MembersAddJobStatusFailed;

    interface MembersAddLaunchComplete {
      '.tag': 'complete';
      complete: Array<MemberAddResult>;
    }

    type MembersAddLaunch = async.LaunchResultBase | MembersAddLaunchComplete;

    /**
     * Exactly one of team_member_id, email, or external_id must be provided to
     * identify the user account.
     */
    interface MembersDeactivateArg {
      /**
       * Identity of user to remove/suspend.
       */
      user: UserSelectorArg;
      /**
       * Defaults to True.
       */
      wipe_data?: boolean;
    }

    /**
     * The user is not a member of the team.
     */
    interface MembersDeactivateErrorUserNotInTeam {
      '.tag': 'user_not_in_team';
    }

    interface MembersDeactivateErrorOther {
      '.tag': 'other';
    }

    type MembersDeactivateError = UserSelectorError | MembersDeactivateErrorUserNotInTeam | MembersDeactivateErrorOther;

    interface MembersGetInfoArgs {
      /**
       * List of team members.
       */
      members: Array<UserSelectorArg>;
    }

    interface MembersGetInfoErrorOther {
      '.tag': 'other';
    }

    type MembersGetInfoError = MembersGetInfoErrorOther;

    /**
     * An ID that was provided as a parameter to membersGetInfo(), and did not
     * match a corresponding user. This might be a team_member_id, an email, or
     * an external ID, depending on how the method was called.
     */
    interface MembersGetInfoItemIdNotFound {
      '.tag': 'id_not_found';
      id_not_found: string;
    }

    /**
     * Info about a team member.
     */
    interface MembersGetInfoItemMemberInfo {
      '.tag': 'member_info';
      member_info: TeamMemberInfo;
    }

    /**
     * Describes a result obtained for a single user whose id was specified in
     * the parameter of membersGetInfo().
     */
    type MembersGetInfoItem = MembersGetInfoItemIdNotFound | MembersGetInfoItemMemberInfo;

    interface MembersListArg {
      /**
       * Defaults to 1000.
       */
      limit?: number;
      /**
       * Defaults to False.
       */
      include_removed?: boolean;
    }

    interface MembersListContinueArg {
      /**
       * Indicates from what point to get the next set of members.
       */
      cursor: string;
    }

    /**
     * The cursor is invalid.
     */
    interface MembersListContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface MembersListContinueErrorOther {
      '.tag': 'other';
    }

    type MembersListContinueError = MembersListContinueErrorInvalidCursor | MembersListContinueErrorOther;

    interface MembersListErrorOther {
      '.tag': 'other';
    }

    type MembersListError = MembersListErrorOther;

    interface MembersListResult {
      /**
       * List of team members.
       */
      members: Array<TeamMemberInfo>;
      /**
       * Pass the cursor into membersListContinue() to obtain the additional
       * members.
       */
      cursor: string;
      /**
       * Is true if there are additional team members that have not been
       * returned yet. An additional call to membersListContinue() can retrieve
       * them.
       */
      has_more: boolean;
    }

    /**
     * Exactly one of team_member_id, email, or external_id must be provided to
     * identify the user account.
     */
    interface MembersRecoverArg {
      /**
       * Identity of user to recover.
       */
      user: UserSelectorArg;
    }

    /**
     * The user is not recoverable.
     */
    interface MembersRecoverErrorUserUnrecoverable {
      '.tag': 'user_unrecoverable';
    }

    /**
     * The user is not a member of the team.
     */
    interface MembersRecoverErrorUserNotInTeam {
      '.tag': 'user_not_in_team';
    }

    /**
     * Team is full. The organization has no available licenses.
     */
    interface MembersRecoverErrorTeamLicenseLimit {
      '.tag': 'team_license_limit';
    }

    interface MembersRecoverErrorOther {
      '.tag': 'other';
    }

    type MembersRecoverError = UserSelectorError | MembersRecoverErrorUserUnrecoverable | MembersRecoverErrorUserNotInTeam | MembersRecoverErrorTeamLicenseLimit | MembersRecoverErrorOther;

    interface MembersRemoveArg extends MembersDeactivateArg {
      /**
       * If provided, files from the deleted member account will be transferred
       * to this user.
       */
      transfer_dest_id?: UserSelectorArg;
      /**
       * If provided, errors during the transfer process will be sent via email
       * to this user. If the transfer_dest_id argument was provided, then this
       * argument must be provided as well.
       */
      transfer_admin_id?: UserSelectorArg;
      /**
       * Defaults to False.
       */
      keep_account?: boolean;
    }

    /**
     * The user is the last admin of the team, so it cannot be removed from it.
     */
    interface MembersRemoveErrorRemoveLastAdmin {
      '.tag': 'remove_last_admin';
    }

    /**
     * Expected removed user and transfer_dest user to be different
     */
    interface MembersRemoveErrorRemovedAndTransferDestShouldDiffer {
      '.tag': 'removed_and_transfer_dest_should_differ';
    }

    /**
     * Expected removed user and transfer_admin user to be different.
     */
    interface MembersRemoveErrorRemovedAndTransferAdminShouldDiffer {
      '.tag': 'removed_and_transfer_admin_should_differ';
    }

    /**
     * No matching user found for the argument transfer_dest_id.
     */
    interface MembersRemoveErrorTransferDestUserNotFound {
      '.tag': 'transfer_dest_user_not_found';
    }

    /**
     * The provided transfer_dest_id does not exist on this team.
     */
    interface MembersRemoveErrorTransferDestUserNotInTeam {
      '.tag': 'transfer_dest_user_not_in_team';
    }

    /**
     * No matching user found for the argument transfer_admin_id.
     */
    interface MembersRemoveErrorTransferAdminUserNotFound {
      '.tag': 'transfer_admin_user_not_found';
    }

    /**
     * The provided transfer_admin_id does not exist on this team.
     */
    interface MembersRemoveErrorTransferAdminUserNotInTeam {
      '.tag': 'transfer_admin_user_not_in_team';
    }

    /**
     * The transfer_admin_id argument must be provided when file transfer is
     * requested.
     */
    interface MembersRemoveErrorUnspecifiedTransferAdminId {
      '.tag': 'unspecified_transfer_admin_id';
    }

    /**
     * Specified transfer_admin user is not a team admin.
     */
    interface MembersRemoveErrorTransferAdminIsNotAdmin {
      '.tag': 'transfer_admin_is_not_admin';
    }

    /**
     * Cannot keep account and transfer the data to another user at the same
     * time.
     */
    interface MembersRemoveErrorCannotKeepAccountAndTransfer {
      '.tag': 'cannot_keep_account_and_transfer';
    }

    /**
     * Cannot keep account and delete the data at the same time. To keep the
     * account the argument wipe_data should be set to False.
     */
    interface MembersRemoveErrorCannotKeepAccountAndDeleteData {
      '.tag': 'cannot_keep_account_and_delete_data';
    }

    /**
     * The email address of the user is too long to be disabled.
     */
    interface MembersRemoveErrorEmailAddressTooLongToBeDisabled {
      '.tag': 'email_address_too_long_to_be_disabled';
    }

    type MembersRemoveError = MembersDeactivateError | MembersRemoveErrorRemoveLastAdmin | MembersRemoveErrorRemovedAndTransferDestShouldDiffer | MembersRemoveErrorRemovedAndTransferAdminShouldDiffer | MembersRemoveErrorTransferDestUserNotFound | MembersRemoveErrorTransferDestUserNotInTeam | MembersRemoveErrorTransferAdminUserNotFound | MembersRemoveErrorTransferAdminUserNotInTeam | MembersRemoveErrorUnspecifiedTransferAdminId | MembersRemoveErrorTransferAdminIsNotAdmin | MembersRemoveErrorCannotKeepAccountAndTransfer | MembersRemoveErrorCannotKeepAccountAndDeleteData | MembersRemoveErrorEmailAddressTooLongToBeDisabled;

    interface MembersSendWelcomeErrorOther {
      '.tag': 'other';
    }

    type MembersSendWelcomeError = MemberSelectorError | MembersSendWelcomeErrorOther;

    /**
     * Exactly one of team_member_id, email, or external_id must be provided to
     * identify the user account.
     */
    interface MembersSetPermissionsArg {
      /**
       * Identity of user whose role will be set.
       */
      user: UserSelectorArg;
      /**
       * The new role of the member.
       */
      new_role: AdminTier;
    }

    /**
     * Cannot remove the admin setting of the last admin.
     */
    interface MembersSetPermissionsErrorLastAdmin {
      '.tag': 'last_admin';
    }

    /**
     * The user is not a member of the team.
     */
    interface MembersSetPermissionsErrorUserNotInTeam {
      '.tag': 'user_not_in_team';
    }

    /**
     * Cannot remove/grant permissions.
     */
    interface MembersSetPermissionsErrorCannotSetPermissions {
      '.tag': 'cannot_set_permissions';
    }

    /**
     * Team is full. The organization has no available licenses.
     */
    interface MembersSetPermissionsErrorTeamLicenseLimit {
      '.tag': 'team_license_limit';
    }

    interface MembersSetPermissionsErrorOther {
      '.tag': 'other';
    }

    type MembersSetPermissionsError = UserSelectorError | MembersSetPermissionsErrorLastAdmin | MembersSetPermissionsErrorUserNotInTeam | MembersSetPermissionsErrorCannotSetPermissions | MembersSetPermissionsErrorTeamLicenseLimit | MembersSetPermissionsErrorOther;

    interface MembersSetPermissionsResult {
      /**
       * The member ID of the user to which the change was applied.
       */
      team_member_id: team_common.TeamMemberId;
      /**
       * The role after the change.
       */
      role: AdminTier;
    }

    /**
     * Exactly one of team_member_id, email, or external_id must be provided to
     * identify the user account. At least one of new_email, new_external_id,
     * new_given_name, and/or new_surname must be provided.
     */
    interface MembersSetProfileArg {
      /**
       * Identity of user whose profile will be set.
       */
      user: UserSelectorArg;
      /**
       * New email for member.
       */
      new_email?: common.EmailAddress;
      /**
       * New external ID for member.
       */
      new_external_id?: team_common.MemberExternalId;
      /**
       * New given name for member.
       */
      new_given_name?: common.NamePart;
      /**
       * New surname for member.
       */
      new_surname?: common.NamePart;
      /**
       * New persistent ID. This field only available to teams using persistent
       * ID SAML configuration.
       */
      new_persistent_id?: string;
    }

    /**
     * It is unsafe to use both external_id and new_external_id
     */
    interface MembersSetProfileErrorExternalIdAndNewExternalIdUnsafe {
      '.tag': 'external_id_and_new_external_id_unsafe';
    }

    /**
     * None of new_email, new_given_name, new_surname, or new_external_id are
     * specified
     */
    interface MembersSetProfileErrorNoNewDataSpecified {
      '.tag': 'no_new_data_specified';
    }

    /**
     * Email is already reserved for another user.
     */
    interface MembersSetProfileErrorEmailReservedForOtherUser {
      '.tag': 'email_reserved_for_other_user';
    }

    /**
     * The external ID is already in use by another team member.
     */
    interface MembersSetProfileErrorExternalIdUsedByOtherUser {
      '.tag': 'external_id_used_by_other_user';
    }

    /**
     * Modifying deleted users is not allowed.
     */
    interface MembersSetProfileErrorSetProfileDisallowed {
      '.tag': 'set_profile_disallowed';
    }

    /**
     * Parameter new_email cannot be empty.
     */
    interface MembersSetProfileErrorParamCannotBeEmpty {
      '.tag': 'param_cannot_be_empty';
    }

    /**
     * Persistent ID is only available to teams with persistent ID SAML
     * configuration. Please contact Dropbox for more information.
     */
    interface MembersSetProfileErrorPersistentIdDisabled {
      '.tag': 'persistent_id_disabled';
    }

    /**
     * The persistent ID is already in use by another team member.
     */
    interface MembersSetProfileErrorPersistentIdUsedByOtherUser {
      '.tag': 'persistent_id_used_by_other_user';
    }

    interface MembersSetProfileErrorOther {
      '.tag': 'other';
    }

    type MembersSetProfileError = MemberSelectorError | MembersSetProfileErrorExternalIdAndNewExternalIdUnsafe | MembersSetProfileErrorNoNewDataSpecified | MembersSetProfileErrorEmailReservedForOtherUser | MembersSetProfileErrorExternalIdUsedByOtherUser | MembersSetProfileErrorSetProfileDisallowed | MembersSetProfileErrorParamCannotBeEmpty | MembersSetProfileErrorPersistentIdDisabled | MembersSetProfileErrorPersistentIdUsedByOtherUser | MembersSetProfileErrorOther;

    /**
     * The user is not active, so it cannot be suspended.
     */
    interface MembersSuspendErrorSuspendInactiveUser {
      '.tag': 'suspend_inactive_user';
    }

    /**
     * The user is the last admin of the team, so it cannot be suspended.
     */
    interface MembersSuspendErrorSuspendLastAdmin {
      '.tag': 'suspend_last_admin';
    }

    /**
     * Team is full. The organization has no available licenses.
     */
    interface MembersSuspendErrorTeamLicenseLimit {
      '.tag': 'team_license_limit';
    }

    type MembersSuspendError = MembersDeactivateError | MembersSuspendErrorSuspendInactiveUser | MembersSuspendErrorSuspendLastAdmin | MembersSuspendErrorTeamLicenseLimit;

    /**
     * Exactly one of team_member_id, email, or external_id must be provided to
     * identify the user account.
     */
    interface MembersUnsuspendArg {
      /**
       * Identity of user to unsuspend.
       */
      user: UserSelectorArg;
    }

    /**
     * The user is unsuspended, so it cannot be unsuspended again.
     */
    interface MembersUnsuspendErrorUnsuspendNonSuspendedMember {
      '.tag': 'unsuspend_non_suspended_member';
    }

    /**
     * Team is full. The organization has no available licenses.
     */
    interface MembersUnsuspendErrorTeamLicenseLimit {
      '.tag': 'team_license_limit';
    }

    type MembersUnsuspendError = MembersDeactivateError | MembersUnsuspendErrorUnsuspendNonSuspendedMember | MembersUnsuspendErrorTeamLicenseLimit;

    /**
     * Official Dropbox iPhone client
     */
    interface MobileClientPlatformIphone {
      '.tag': 'iphone';
    }

    /**
     * Official Dropbox iPad client
     */
    interface MobileClientPlatformIpad {
      '.tag': 'ipad';
    }

    /**
     * Official Dropbox Android client
     */
    interface MobileClientPlatformAndroid {
      '.tag': 'android';
    }

    /**
     * Official Dropbox Windows phone client
     */
    interface MobileClientPlatformWindowsPhone {
      '.tag': 'windows_phone';
    }

    /**
     * Official Dropbox Blackberry client
     */
    interface MobileClientPlatformBlackberry {
      '.tag': 'blackberry';
    }

    interface MobileClientPlatformOther {
      '.tag': 'other';
    }

    type MobileClientPlatform = MobileClientPlatformIphone | MobileClientPlatformIpad | MobileClientPlatformAndroid | MobileClientPlatformWindowsPhone | MobileClientPlatformBlackberry | MobileClientPlatformOther;

    /**
     * Information about linked Dropbox mobile client sessions
     */
    interface MobileClientSession extends DeviceSession {
      /**
       * The device name
       */
      device_name: string;
      /**
       * The mobile application type
       */
      client_type: MobileClientPlatform;
      /**
       * The dropbox client version
       */
      client_version?: string;
      /**
       * The hosting OS version
       */
      os_version?: string;
      /**
       * last carrier used by the device
       */
      last_carrier?: string;
    }

    /**
     * Properties of a namespace.
     */
    interface NamespaceMetadata {
      /**
       * The name of this namespace.
       */
      name: string;
      /**
       * The ID of this namespace.
       */
      namespace_id: common.SharedFolderId;
      /**
       * The type of this namespace.
       */
      namespace_type: NamespaceType;
      /**
       * If this is a team member folder, the ID of the team member. Otherwise,
       * this field is not present.
       */
      team_member_id?: team_common.TeamMemberId;
    }

    /**
     * App sandbox folder.
     */
    interface NamespaceTypeAppFolder {
      '.tag': 'app_folder';
    }

    /**
     * Shared folder.
     */
    interface NamespaceTypeSharedFolder {
      '.tag': 'shared_folder';
    }

    /**
     * Top-level team-owned folder.
     */
    interface NamespaceTypeTeamFolder {
      '.tag': 'team_folder';
    }

    /**
     * Team member's home folder.
     */
    interface NamespaceTypeTeamMemberFolder {
      '.tag': 'team_member_folder';
    }

    interface NamespaceTypeOther {
      '.tag': 'other';
    }

    type NamespaceType = NamespaceTypeAppFolder | NamespaceTypeSharedFolder | NamespaceTypeTeamFolder | NamespaceTypeTeamMemberFolder | NamespaceTypeOther;

    interface RemovedStatus {
      /**
       * True if the removed team member is recoverable.
       */
      is_recoverable: boolean;
    }

    interface RevokeDesktopClientArg extends DeviceSessionArg {
      /**
       * Defaults to False.
       */
      delete_on_unlink?: boolean;
    }

    /**
     * End an active session
     */
    interface RevokeDeviceSessionArgWebSession {
      '.tag': 'web_session';
      web_session: DeviceSessionArg;
    }

    /**
     * Unlink a linked desktop device
     */
    interface RevokeDeviceSessionArgDesktopClient {
      '.tag': 'desktop_client';
      desktop_client: RevokeDesktopClientArg;
    }

    /**
     * Unlink a linked mobile device
     */
    interface RevokeDeviceSessionArgMobileClient {
      '.tag': 'mobile_client';
      mobile_client: DeviceSessionArg;
    }

    type RevokeDeviceSessionArg = RevokeDeviceSessionArgWebSession | RevokeDeviceSessionArgDesktopClient | RevokeDeviceSessionArgMobileClient;

    interface RevokeDeviceSessionBatchArg {
      revoke_devices: Array<RevokeDeviceSessionArg>;
    }

    interface RevokeDeviceSessionBatchErrorOther {
      '.tag': 'other';
    }

    type RevokeDeviceSessionBatchError = RevokeDeviceSessionBatchErrorOther;

    interface RevokeDeviceSessionBatchResult {
      revoke_devices_status: Array<RevokeDeviceSessionStatus>;
    }

    /**
     * Device session not found.
     */
    interface RevokeDeviceSessionErrorDeviceSessionNotFound {
      '.tag': 'device_session_not_found';
    }

    /**
     * Member not found.
     */
    interface RevokeDeviceSessionErrorMemberNotFound {
      '.tag': 'member_not_found';
    }

    interface RevokeDeviceSessionErrorOther {
      '.tag': 'other';
    }

    type RevokeDeviceSessionError = RevokeDeviceSessionErrorDeviceSessionNotFound | RevokeDeviceSessionErrorMemberNotFound | RevokeDeviceSessionErrorOther;

    interface RevokeDeviceSessionStatus {
      /**
       * Result of the revoking request
       */
      success: boolean;
      /**
       * The error cause in case of a failure
       */
      error_type?: RevokeDeviceSessionError;
    }

    interface RevokeLinkedApiAppArg {
      /**
       * The application's unique id
       */
      app_id: string;
      /**
       * The unique id of the member owning the device
       */
      team_member_id: string;
      /**
       * Defaults to True.
       */
      keep_app_folder?: boolean;
    }

    interface RevokeLinkedApiAppBatchArg {
      revoke_linked_app: Array<RevokeLinkedApiAppArg>;
    }

    interface RevokeLinkedAppBatchErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by linkedAppsRevokeLinkedAppBatch().
     */
    type RevokeLinkedAppBatchError = RevokeLinkedAppBatchErrorOther;

    interface RevokeLinkedAppBatchResult {
      revoke_linked_app_status: Array<RevokeLinkedAppStatus>;
    }

    /**
     * Application not found.
     */
    interface RevokeLinkedAppErrorAppNotFound {
      '.tag': 'app_not_found';
    }

    /**
     * Member not found.
     */
    interface RevokeLinkedAppErrorMemberNotFound {
      '.tag': 'member_not_found';
    }

    interface RevokeLinkedAppErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by linkedAppsRevokeLinkedApp().
     */
    type RevokeLinkedAppError = RevokeLinkedAppErrorAppNotFound | RevokeLinkedAppErrorMemberNotFound | RevokeLinkedAppErrorOther;

    interface RevokeLinkedAppStatus {
      /**
       * Result of the revoking request
       */
      success: boolean;
      /**
       * The error cause in case of a failure
       */
      error_type?: RevokeLinkedAppError;
    }

    /**
     * Describes the number of users in a specific storage bucket.
     */
    interface StorageBucket {
      /**
       * The name of the storage bucket. For example, '1G' is a bucket of users
       * with storage size up to 1 Giga.
       */
      bucket: string;
      /**
       * The number of people whose storage is in the range of this storage
       * bucket.
       */
      users: number;
    }

    /**
     * The team folder ID is invalid.
     */
    interface TeamFolderAccessErrorInvalidTeamFolderId {
      '.tag': 'invalid_team_folder_id';
    }

    /**
     * The authenticated app does not have permission to manage that team
     * folder.
     */
    interface TeamFolderAccessErrorNoAccess {
      '.tag': 'no_access';
    }

    interface TeamFolderAccessErrorOther {
      '.tag': 'other';
    }

    type TeamFolderAccessError = TeamFolderAccessErrorInvalidTeamFolderId | TeamFolderAccessErrorNoAccess | TeamFolderAccessErrorOther;

    type TeamFolderActivateError = BaseTeamFolderError;

    interface TeamFolderArchiveArg extends TeamFolderIdArg {
      /**
       * Defaults to False.
       */
      force_async_off?: boolean;
    }

    type TeamFolderArchiveError = BaseTeamFolderError;

    /**
     * The archive job has finished. The value is the metadata for the resulting
     * team folder.
     */
    interface TeamFolderArchiveJobStatusComplete {
      '.tag': 'complete';
      complete: TeamFolderMetadata;
    }

    /**
     * Error occurred while performing an asynchronous job from
     * teamFolderArchive().
     */
    interface TeamFolderArchiveJobStatusFailed {
      '.tag': 'failed';
      failed: TeamFolderArchiveError;
    }

    type TeamFolderArchiveJobStatus = async.PollResultBase | TeamFolderArchiveJobStatusComplete | TeamFolderArchiveJobStatusFailed;

    interface TeamFolderArchiveLaunchComplete {
      '.tag': 'complete';
      complete: TeamFolderMetadata;
    }

    type TeamFolderArchiveLaunch = async.LaunchResultBase | TeamFolderArchiveLaunchComplete;

    interface TeamFolderCreateArg {
      /**
       * Name for the new team folder.
       */
      name: string;
    }

    /**
     * The provided name cannot be used.
     */
    interface TeamFolderCreateErrorInvalidFolderName {
      '.tag': 'invalid_folder_name';
    }

    /**
     * There is already a team folder with the provided name.
     */
    interface TeamFolderCreateErrorFolderNameAlreadyUsed {
      '.tag': 'folder_name_already_used';
    }

    /**
     * The provided name cannot be used because it is reserved.
     */
    interface TeamFolderCreateErrorFolderNameReserved {
      '.tag': 'folder_name_reserved';
    }

    interface TeamFolderCreateErrorOther {
      '.tag': 'other';
    }

    type TeamFolderCreateError = TeamFolderCreateErrorInvalidFolderName | TeamFolderCreateErrorFolderNameAlreadyUsed | TeamFolderCreateErrorFolderNameReserved | TeamFolderCreateErrorOther;

    /**
     * An ID that was provided as a parameter to teamFolderGetInfo() did not
     * match any of the team's team folders.
     */
    interface TeamFolderGetInfoItemIdNotFound {
      '.tag': 'id_not_found';
      id_not_found: string;
    }

    /**
     * Properties of a team folder.
     */
    interface TeamFolderGetInfoItemTeamFolderMetadata {
      '.tag': 'team_folder_metadata';
      team_folder_metadata: TeamFolderMetadata;
    }

    type TeamFolderGetInfoItem = TeamFolderGetInfoItemIdNotFound | TeamFolderGetInfoItemTeamFolderMetadata;

    interface TeamFolderIdArg {
      /**
       * The ID of the team folder.
       */
      team_folder_id: common.SharedFolderId;
    }

    interface TeamFolderIdListArg {
      /**
       * The list of team folder IDs.
       */
      team_folder_ids: Array<common.SharedFolderId>;
    }

    /**
     * The folder is active and the operation did not succeed.
     */
    interface TeamFolderInvalidStatusErrorActive {
      '.tag': 'active';
    }

    /**
     * The folder is archived and the operation did not succeed.
     */
    interface TeamFolderInvalidStatusErrorArchived {
      '.tag': 'archived';
    }

    /**
     * The folder is being archived and the operation did not succeed.
     */
    interface TeamFolderInvalidStatusErrorArchiveInProgress {
      '.tag': 'archive_in_progress';
    }

    interface TeamFolderInvalidStatusErrorOther {
      '.tag': 'other';
    }

    type TeamFolderInvalidStatusError = TeamFolderInvalidStatusErrorActive | TeamFolderInvalidStatusErrorArchived | TeamFolderInvalidStatusErrorArchiveInProgress | TeamFolderInvalidStatusErrorOther;

    interface TeamFolderListArg {
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface TeamFolderListContinueArg {
      /**
       * Indicates from what point to get the next set of team folders.
       */
      cursor: string;
    }

    /**
     * The cursor is invalid.
     */
    interface TeamFolderListContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface TeamFolderListContinueErrorOther {
      '.tag': 'other';
    }

    type TeamFolderListContinueError = TeamFolderListContinueErrorInvalidCursor | TeamFolderListContinueErrorOther;

    interface TeamFolderListError {
      access_error: TeamFolderAccessError;
    }

    /**
     * Result for teamFolderList() and teamFolderListContinue().
     */
    interface TeamFolderListResult {
      /**
       * List of all team folders in the authenticated team.
       */
      team_folders: Array<TeamFolderMetadata>;
      /**
       * Pass the cursor into teamFolderListContinue() to obtain additional team
       * folders.
       */
      cursor: string;
      /**
       * Is true if there are additional team folders that have not been
       * returned yet. An additional call to teamFolderListContinue() can
       * retrieve them.
       */
      has_more: boolean;
    }

    /**
     * Properties of a team folder.
     */
    interface TeamFolderMetadata {
      /**
       * The ID of the team folder.
       */
      team_folder_id: common.SharedFolderId;
      /**
       * The name of the team folder.
       */
      name: string;
      /**
       * The status of the team folder.
       */
      status: TeamFolderStatus;
      /**
       * True if this team folder is the team shared dropbox.
       */
      is_team_shared_dropbox: boolean;
    }

    type TeamFolderPermanentlyDeleteError = BaseTeamFolderError;

    interface TeamFolderRenameArg extends TeamFolderIdArg {
      /**
       * New team folder name.
       */
      name: string;
    }

    /**
     * The provided folder name cannot be used.
     */
    interface TeamFolderRenameErrorInvalidFolderName {
      '.tag': 'invalid_folder_name';
    }

    /**
     * There is already a team folder with the same name.
     */
    interface TeamFolderRenameErrorFolderNameAlreadyUsed {
      '.tag': 'folder_name_already_used';
    }

    /**
     * The provided name cannot be used because it is reserved.
     */
    interface TeamFolderRenameErrorFolderNameReserved {
      '.tag': 'folder_name_reserved';
    }

    type TeamFolderRenameError = BaseTeamFolderError | TeamFolderRenameErrorInvalidFolderName | TeamFolderRenameErrorFolderNameAlreadyUsed | TeamFolderRenameErrorFolderNameReserved;

    /**
     * The team folder and sub-folders are available to all members.
     */
    interface TeamFolderStatusActive {
      '.tag': 'active';
    }

    /**
     * The team folder is not accessible outside of the team folder manager.
     */
    interface TeamFolderStatusArchived {
      '.tag': 'archived';
    }

    /**
     * The team folder is not accessible outside of the team folder manager.
     */
    interface TeamFolderStatusArchiveInProgress {
      '.tag': 'archive_in_progress';
    }

    interface TeamFolderStatusOther {
      '.tag': 'other';
    }

    type TeamFolderStatus = TeamFolderStatusActive | TeamFolderStatusArchived | TeamFolderStatusArchiveInProgress | TeamFolderStatusOther;

    /**
     * This action is not allowed for a team shared dropbox.
     */
    interface TeamFolderTeamSharedDropboxErrorDisallowed {
      '.tag': 'disallowed';
    }

    interface TeamFolderTeamSharedDropboxErrorOther {
      '.tag': 'other';
    }

    type TeamFolderTeamSharedDropboxError = TeamFolderTeamSharedDropboxErrorDisallowed | TeamFolderTeamSharedDropboxErrorOther;

    interface TeamGetInfoResult {
      /**
       * The name of the team.
       */
      name: string;
      /**
       * The ID of the team.
       */
      team_id: string;
      /**
       * The number of licenses available to the team.
       */
      num_licensed_users: number;
      /**
       * The number of accounts that have been invited or are already active
       * members of the team.
       */
      num_provisioned_users: number;
      policies: team_policies.TeamMemberPolicies;
    }

    /**
     * Information about a team member.
     */
    interface TeamMemberInfo {
      /**
       * Profile of a user as a member of a team.
       */
      profile: TeamMemberProfile;
      /**
       * The user's role in the team.
       */
      role: AdminTier;
    }

    /**
     * Profile of a user as a member of a team.
     */
    interface TeamMemberProfile extends MemberProfile {
      /**
       * List of group IDs of groups that the user belongs to.
       */
      groups: Array<team_common.GroupId>;
      /**
       * The namespace id of the user's root folder.
       */
      member_folder_id: common.NamespaceId;
    }

    /**
     * User has successfully joined the team.
     */
    interface TeamMemberStatusActive {
      '.tag': 'active';
    }

    /**
     * User has been invited to a team, but has not joined the team yet.
     */
    interface TeamMemberStatusInvited {
      '.tag': 'invited';
    }

    /**
     * User is no longer a member of the team, but the account can be
     * un-suspended, re-establishing the user as a team member.
     */
    interface TeamMemberStatusSuspended {
      '.tag': 'suspended';
    }

    /**
     * User is no longer a member of the team. Removed users are only listed
     * when include_removed is true in members/list.
     */
    interface TeamMemberStatusRemoved {
      '.tag': 'removed';
      removed: RemovedStatus;
    }

    /**
     * The user's status as a member of a specific team.
     */
    type TeamMemberStatus = TeamMemberStatusActive | TeamMemberStatusInvited | TeamMemberStatusSuspended | TeamMemberStatusRemoved;

    /**
     * User uses a license and has full access to team resources like the shared
     * quota.
     */
    interface TeamMembershipTypeFull {
      '.tag': 'full';
    }

    /**
     * User does not have access to the shared quota and team admins have
     * restricted administrative control.
     */
    interface TeamMembershipTypeLimited {
      '.tag': 'limited';
    }

    type TeamMembershipType = TeamMembershipTypeFull | TeamMembershipTypeLimited;

    interface TeamNamespacesListArg {
      /**
       * Defaults to 1000.
       */
      limit?: number;
    }

    interface TeamNamespacesListContinueArg {
      /**
       * Indicates from what point to get the next set of team-accessible
       * namespaces.
       */
      cursor: string;
    }

    /**
     * The cursor is invalid.
     */
    interface TeamNamespacesListContinueErrorInvalidCursor {
      '.tag': 'invalid_cursor';
    }

    interface TeamNamespacesListContinueErrorOther {
      '.tag': 'other';
    }

    type TeamNamespacesListContinueError = TeamNamespacesListContinueErrorInvalidCursor | TeamNamespacesListContinueErrorOther;

    /**
     * Result for namespacesList().
     */
    interface TeamNamespacesListResult {
      /**
       * List of all namespaces the team can access.
       */
      namespaces: Array<NamespaceMetadata>;
      /**
       * Pass the cursor into namespacesListContinue() to obtain additional
       * namespaces. Note that duplicate namespaces may be returned.
       */
      cursor: string;
      /**
       * Is true if there are additional namespaces that have not been returned
       * yet.
       */
      has_more: boolean;
    }

    /**
     * The current token is not associated with a team admin, because mappings
     * were not recorded when the token was created. Consider re-authorizing a
     * new access token to record its authenticating admin.
     */
    interface TokenGetAuthenticatedAdminErrorMappingNotFound {
      '.tag': 'mapping_not_found';
    }

    /**
     * Either the team admin that authorized this token is no longer an active
     * member of the team or no longer a team admin.
     */
    interface TokenGetAuthenticatedAdminErrorAdminNotActive {
      '.tag': 'admin_not_active';
    }

    interface TokenGetAuthenticatedAdminErrorOther {
      '.tag': 'other';
    }

    /**
     * Error returned by tokenGetAuthenticatedAdmin().
     */
    type TokenGetAuthenticatedAdminError = TokenGetAuthenticatedAdminErrorMappingNotFound | TokenGetAuthenticatedAdminErrorAdminNotActive | TokenGetAuthenticatedAdminErrorOther;

    /**
     * Results for tokenGetAuthenticatedAdmin().
     */
    interface TokenGetAuthenticatedAdminResult {
      /**
       * The admin who authorized the token.
       */
      admin_profile: TeamMemberProfile;
    }

    interface UpdatePropertyTemplateArg {
      /**
       * An identifier for property template added by propertiesTemplateAdd().
       */
      template_id: properties.TemplateId;
      /**
       * A display name for the property template. Property template names can
       * be up to 256 bytes.
       */
      name?: string;
      /**
       * Description for new property template. Property template descriptions
       * can be up to 1024 bytes.
       */
      description?: string;
      /**
       * This is a list of custom properties to add to the property template.
       * There can be up to 64 properties in a single property template.
       */
      add_fields?: Array<properties.PropertyFieldTemplate>;
    }

    interface UpdatePropertyTemplateResult {
      /**
       * An identifier for property template added by propertiesTemplateAdd().
       */
      template_id: properties.TemplateId;
    }

    /**
     * This team has unlimited upload API quota. So far both server version
     * account and legacy  account type have unlimited monthly upload api quota.
     */
    interface UploadApiRateLimitValueUnlimited {
      '.tag': 'unlimited';
    }

    /**
     * The number of upload API calls allowed per month.
     */
    interface UploadApiRateLimitValueLimit {
      '.tag': 'limit';
      limit: number;
    }

    interface UploadApiRateLimitValueOther {
      '.tag': 'other';
    }

    /**
     * The value for Feature.upload_api_rate_limit.
     */
    type UploadApiRateLimitValue = UploadApiRateLimitValueUnlimited | UploadApiRateLimitValueLimit | UploadApiRateLimitValueOther;

    interface UserSelectorArgTeamMemberId {
      '.tag': 'team_member_id';
      team_member_id: team_common.TeamMemberId;
    }

    interface UserSelectorArgExternalId {
      '.tag': 'external_id';
      external_id: team_common.MemberExternalId;
    }

    interface UserSelectorArgEmail {
      '.tag': 'email';
      email: common.EmailAddress;
    }

    /**
     * Argument for selecting a single user, either by team_member_id,
     * external_id or email.
     */
    type UserSelectorArg = UserSelectorArgTeamMemberId | UserSelectorArgExternalId | UserSelectorArgEmail;

    /**
     * No matching user found. The provided team_member_id, email, or
     * external_id does not exist on this team.
     */
    interface UserSelectorErrorUserNotFound {
      '.tag': 'user_not_found';
    }

    /**
     * Error that can be returned whenever a struct derived from
     * team.UserSelectorArg is used.
     */
    type UserSelectorError = UserSelectorErrorUserNotFound;

    /**
     * List of member IDs.
     */
    interface UsersSelectorArgTeamMemberIds {
      '.tag': 'team_member_ids';
      team_member_ids: Array<team_common.TeamMemberId>;
    }

    /**
     * List of external user IDs.
     */
    interface UsersSelectorArgExternalIds {
      '.tag': 'external_ids';
      external_ids: Array<team_common.MemberExternalId>;
    }

    /**
     * List of email addresses.
     */
    interface UsersSelectorArgEmails {
      '.tag': 'emails';
      emails: Array<common.EmailAddress>;
    }

    /**
     * Argument for selecting a list of users, either by team_member_ids,
     * external_ids or emails.
     */
    type UsersSelectorArg = UsersSelectorArgTeamMemberIds | UsersSelectorArgExternalIds | UsersSelectorArgEmails;

    type GroupsGetInfoResult = Array<GroupsGetInfoItem>;

    type MembersGetInfoResult = Array<MembersGetInfoItem>;

    type NumberPerDay = Array<Object>;

  }

  namespace team_common {
    /**
     * A group which is managed by selected users.
     */
    interface GroupManagementTypeUserManaged {
      '.tag': 'user_managed';
    }

    /**
     * A group which is managed by team admins only.
     */
    interface GroupManagementTypeCompanyManaged {
      '.tag': 'company_managed';
    }

    /**
     * A group which is managed automatically by Dropbox.
     */
    interface GroupManagementTypeSystemManaged {
      '.tag': 'system_managed';
    }

    interface GroupManagementTypeOther {
      '.tag': 'other';
    }

    /**
     * The group type determines how a group is managed.
     */
    type GroupManagementType = GroupManagementTypeUserManaged | GroupManagementTypeCompanyManaged | GroupManagementTypeSystemManaged | GroupManagementTypeOther;

    /**
     * Information about a group.
     */
    interface GroupSummary {
      group_name: string;
      group_id: GroupId;
      /**
       * External ID of group. This is an arbitrary ID that an admin can attach
       * to a group.
       */
      group_external_id?: GroupExternalId;
      /**
       * The number of members in the group.
       */
      member_count?: number;
      /**
       * Who is allowed to manage the group.
       */
      group_management_type: GroupManagementType;
    }

    /**
     * A group to which team members are automatically added. Applicable to
     * [team folders]{@link https://www.dropbox.com/help/986} only.
     */
    interface GroupTypeTeam {
      '.tag': 'team';
    }

    /**
     * A group is created and managed by a user.
     */
    interface GroupTypeUserManaged {
      '.tag': 'user_managed';
    }

    interface GroupTypeOther {
      '.tag': 'other';
    }

    /**
     * The group type determines how a group is created and managed.
     */
    type GroupType = GroupTypeTeam | GroupTypeUserManaged | GroupTypeOther;

    /**
     * Time range.
     */
    interface TimeRange {
      /**
       * Optional starting time (inclusive).
       */
      start_time?: common.DropboxTimestamp;
      /**
       * Optional ending time (exclusive).
       */
      end_time?: common.DropboxTimestamp;
    }

    type GroupExternalId = string;

    type GroupId = string;

    type MemberExternalId = string;

    type ResellerId = string;

    type TeamMemberId = string;

  }

  namespace team_log {
    /**
     * End user session details.
     */
    interface AccessMethodLogInfoEndUser {
      '.tag': 'end_user';
      end_user: WebSessionLogInfoReference|DesktopSessionLogInfoReference|MobileSessionLogInfoReference|SessionLogInfoReference;
    }

    /**
     * Sign in as session details.
     */
    interface AccessMethodLogInfoSignInAs {
      '.tag': 'sign_in_as';
      sign_in_as: WebSessionLogInfo;
    }

    /**
     * Content manager session details.
     */
    interface AccessMethodLogInfoContentManager {
      '.tag': 'content_manager';
      content_manager: WebSessionLogInfo;
    }

    /**
     * Admin console session details.
     */
    interface AccessMethodLogInfoAdminConsole {
      '.tag': 'admin_console';
      admin_console: WebSessionLogInfo;
    }

    /**
     * Api session details.
     */
    interface AccessMethodLogInfoApi {
      '.tag': 'api';
      api: ApiSessionLogInfo;
    }

    interface AccessMethodLogInfoOther {
      '.tag': 'other';
    }

    /**
     * Indicates the method in which the action was performed.
     */
    type AccessMethodLogInfo = AccessMethodLogInfoEndUser | AccessMethodLogInfoSignInAs | AccessMethodLogInfoContentManager | AccessMethodLogInfoAdminConsole | AccessMethodLogInfoApi | AccessMethodLogInfoOther;

    interface AccountCaptureAvailabilityUnavailable {
      '.tag': 'unavailable';
    }

    interface AccountCaptureAvailabilityAvailable {
      '.tag': 'available';
    }

    interface AccountCaptureAvailabilityOther {
      '.tag': 'other';
    }

    type AccountCaptureAvailability = AccountCaptureAvailabilityUnavailable | AccountCaptureAvailabilityAvailable | AccountCaptureAvailabilityOther;

    /**
     * Granted or revoked the option to enable account capture on domains
     * belonging to the team.
     */
    interface AccountCaptureChangeAvailabilityDetails {
      /**
       * New account capture availabilty value.
       */
      new_value: AccountCaptureAvailability;
      /**
       * Previous account capture availabilty value. Might be missing due to
       * historical data gap.
       */
      previous_value?: AccountCaptureAvailability;
    }

    /**
     * Changed the account capture policy on a domain belonging to the team.
     */
    interface AccountCaptureChangePolicyDetails {
      /**
       * New account capture policy.
       */
      new_value: AccountCapturePolicy;
      /**
       * Previous account capture policy. Might be missing due to historical
       * data gap.
       */
      previous_value?: AccountCapturePolicy;
    }

    /**
     * Account captured user migrated their account to the team.
     */
    interface AccountCaptureMigrateAccountDetails {
      /**
       * Domain name.
       */
      domain_name: string;
    }

    interface AccountCapturePolicyDisabled {
      '.tag': 'disabled';
    }

    interface AccountCapturePolicyInvitedUsers {
      '.tag': 'invited_users';
    }

    interface AccountCapturePolicyAllUsers {
      '.tag': 'all_users';
    }

    interface AccountCapturePolicyOther {
      '.tag': 'other';
    }

    type AccountCapturePolicy = AccountCapturePolicyDisabled | AccountCapturePolicyInvitedUsers | AccountCapturePolicyAllUsers | AccountCapturePolicyOther;

    /**
     * Account captured user relinquished their account by changing the email
     * address associated with it.
     */
    interface AccountCaptureRelinquishAccountDetails {
      /**
       * Domain name.
       */
      domain_name: string;
    }

    /**
     * The user who did the action.
     */
    interface ActorLogInfoUser {
      '.tag': 'user';
      user: TeamMemberLogInfoReference|NonTeamMemberLogInfoReference|UserLogInfoReference;
    }

    /**
     * The admin who did the action.
     */
    interface ActorLogInfoAdmin {
      '.tag': 'admin';
      admin: TeamMemberLogInfoReference|NonTeamMemberLogInfoReference|UserLogInfoReference;
    }

    /**
     * The application who did the action.
     */
    interface ActorLogInfoApp {
      '.tag': 'app';
      app: UserOrTeamLinkedAppLogInfoReference|UserLinkedAppLogInfoReference|TeamLinkedAppLogInfoReference|AppLogInfoReference;
    }

    /**
     * Action done by reseller.
     */
    interface ActorLogInfoReseller {
      '.tag': 'reseller';
      reseller: ResellerLogInfo;
    }

    /**
     * Action done by Dropbox.
     */
    interface ActorLogInfoDropbox {
      '.tag': 'dropbox';
    }

    interface ActorLogInfoOther {
      '.tag': 'other';
    }

    /**
     * The entity who performed the action.
     */
    type ActorLogInfo = ActorLogInfoUser | ActorLogInfoAdmin | ActorLogInfoApp | ActorLogInfoReseller | ActorLogInfoDropbox | ActorLogInfoOther;

    interface AdminRoleUser {
      '.tag': 'user';
    }

    interface AdminRoleLimitedAdmin {
      '.tag': 'limited_admin';
    }

    interface AdminRoleSupportAdmin {
      '.tag': 'support_admin';
    }

    interface AdminRoleUserManagementAdmin {
      '.tag': 'user_management_admin';
    }

    interface AdminRoleTeamAdmin {
      '.tag': 'team_admin';
    }

    interface AdminRoleOther {
      '.tag': 'other';
    }

    type AdminRole = AdminRoleUser | AdminRoleLimitedAdmin | AdminRoleSupportAdmin | AdminRoleUserManagementAdmin | AdminRoleTeamAdmin | AdminRoleOther;

    /**
     * Disabled allow downloads.
     */
    interface AllowDownloadDisabledDetails {
    }

    /**
     * Enabled allow downloads.
     */
    interface AllowDownloadEnabledDetails {
    }

    /**
     * Api session.
     */
    interface ApiSessionLogInfo {
      /**
       * Api request ID.
       */
      request_id: RequestId;
    }

    /**
     * Linked an app for team.
     */
    interface AppLinkTeamDetails {
      /**
       * Relevant application details.
       */
      app_info: UserOrTeamLinkedAppLogInfoReference|UserLinkedAppLogInfoReference|TeamLinkedAppLogInfoReference|AppLogInfoReference;
    }

    /**
     * Linked an app for team member.
     */
    interface AppLinkUserDetails {
      /**
       * Relevant application details.
       */
      app_info: UserOrTeamLinkedAppLogInfoReference|UserLinkedAppLogInfoReference|TeamLinkedAppLogInfoReference|AppLogInfoReference;
    }

    /**
     * App's logged information.
     */
    interface AppLogInfo {
      /**
       * App unique ID. Might be missing due to historical data gap.
       */
      app_id?: AppId;
      /**
       * App display name. Might be missing due to historical data gap.
       */
      display_name?: string;
    }

    /**
     * Reference to the AppLogInfo polymorphic type. Contains a .tag property to
     * let you discriminate between possible subtypes.
     */
    interface AppLogInfoReference extends AppLogInfo {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "user_or_team_linked_app"|"user_linked_app"|"team_linked_app";
    }

    /**
     * Unlinked an app for team.
     */
    interface AppUnlinkTeamDetails {
      /**
       * Relevant application details.
       */
      app_info: UserOrTeamLinkedAppLogInfoReference|UserLinkedAppLogInfoReference|TeamLinkedAppLogInfoReference|AppLogInfoReference;
    }

    /**
     * Unlinked an app for team member.
     */
    interface AppUnlinkUserDetails {
      /**
       * Relevant application details.
       */
      app_info: UserOrTeamLinkedAppLogInfoReference|UserLinkedAppLogInfoReference|TeamLinkedAppLogInfoReference|AppLogInfoReference;
    }

    /**
     * File's details.
     */
    interface AssetLogInfoFile {
      '.tag': 'file';
      file: FileLogInfo;
    }

    /**
     * Folder's details.
     */
    interface AssetLogInfoFolder {
      '.tag': 'folder';
      folder: FolderLogInfo;
    }

    /**
     * Paper docuement's details.
     */
    interface AssetLogInfoPaperDocument {
      '.tag': 'paper_document';
      paper_document: PaperDocumentLogInfo;
    }

    /**
     * Paper folder's details.
     */
    interface AssetLogInfoPaperFolder {
      '.tag': 'paper_folder';
      paper_folder: PaperFolderLogInfo;
    }

    interface AssetLogInfoOther {
      '.tag': 'other';
    }

    /**
     * Asset details.
     */
    type AssetLogInfo = AssetLogInfoFile | AssetLogInfoFolder | AssetLogInfoPaperDocument | AssetLogInfoPaperFolder | AssetLogInfoOther;

    /**
     * Certificate details.
     */
    interface Certificate {
      /**
       * Certificate subject.
       */
      subject: string;
      /**
       * Certificate issuer.
       */
      issuer: string;
      /**
       * Certificate issue date.
       */
      issue_date: string;
      /**
       * Certificate expiration date.
       */
      expiration_date: string;
      /**
       * Certificate serial number.
       */
      serial_number: string;
      /**
       * Certificate sha1 fingerprint.
       */
      sha1_fingerprint: string;
      /**
       * Certificate common name.
       */
      common_name: string;
    }

    /**
     * Shared an album.
     */
    interface CollectionShareDetails {
      /**
       * Album name.
       */
      album_name: string;
    }

    interface ConfidentialityConfidential {
      '.tag': 'confidential';
    }

    interface ConfidentialityNonConfidential {
      '.tag': 'non_confidential';
    }

    interface ConfidentialityOther {
      '.tag': 'other';
    }

    type Confidentiality = ConfidentialityConfidential | ConfidentialityNonConfidential | ConfidentialityOther;

    interface ContentPermanentDeletePolicyDisabled {
      '.tag': 'disabled';
    }

    interface ContentPermanentDeletePolicyEnabled {
      '.tag': 'enabled';
    }

    interface ContentPermanentDeletePolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for pemanent content deletion
     */
    type ContentPermanentDeletePolicy = ContentPermanentDeletePolicyDisabled | ContentPermanentDeletePolicyEnabled | ContentPermanentDeletePolicyOther;

    /**
     * Action was done on behalf of a team member.
     */
    interface ContextLogInfoTeamMember {
      '.tag': 'team_member';
      team_member: TeamMemberLogInfo;
    }

    /**
     * Action was done on behalf of a non team member.
     */
    interface ContextLogInfoNonTeamMember {
      '.tag': 'non_team_member';
      non_team_member: NonTeamMemberLogInfo;
    }

    /**
     * Action was done on behalf of the team.
     */
    interface ContextLogInfoTeam {
      '.tag': 'team';
    }

    interface ContextLogInfoOther {
      '.tag': 'other';
    }

    /**
     * The primary entity on which the action was done.
     */
    type ContextLogInfo = ContextLogInfoTeamMember | ContextLogInfoNonTeamMember | ContextLogInfoTeam | ContextLogInfoOther;

    /**
     * Created folders.
     */
    interface CreateFolderDetails {
    }

    /**
     * Set a restriction policy regarding the location of data centers where
     * team data resides.
     */
    interface DataPlacementRestrictionChangePolicyDetails {
      /**
       * Previous placement restriction.
       */
      previous_value: PlacementRestriction;
      /**
       * New placement restriction.
       */
      new_value: PlacementRestriction;
    }

    /**
     * Satisfied a previously set restriction policy regarding the location of
     * data centers where team data resides (i.e. all data have been migrated
     * according to the restriction placed).
     */
    interface DataPlacementRestrictionSatisfyPolicyDetails {
      /**
       * Placement restriction.
       */
      placement_restriction: PlacementRestriction;
    }

    /**
     * Desktop session.
     */
    interface DesktopSessionLogInfo extends SessionLogInfo {
    }

    /**
     * Reference to the DesktopSessionLogInfo type, identified by the value of
     * the .tag property.
     */
    interface DesktopSessionLogInfoReference extends DesktopSessionLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'desktop';
    }

    /**
     * Set or removed a limit on the number of computers each team member can
     * link to their work Dropbox account.
     */
    interface DeviceApprovalsChangeDesktopPolicyDetails {
      /**
       * New desktop device approvals policy. Might be missing due to historical
       * data gap.
       */
      new_value?: DeviceApprovalsPolicy;
      /**
       * Previous desktop device approvals policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: DeviceApprovalsPolicy;
    }

    /**
     * Set or removed a limit on the number of mobiles devices each team member
     * can link to their work Dropbox account.
     */
    interface DeviceApprovalsChangeMobilePolicyDetails {
      /**
       * New mobile device approvals policy. Might be missing due to historical
       * data gap.
       */
      new_value?: DeviceApprovalsPolicy;
      /**
       * Previous mobile device approvals policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: DeviceApprovalsPolicy;
    }

    /**
     * Changed the action taken when a team member is already over the limits
     * (e.g when they join the team, an admin lowers limits, etc.).
     */
    interface DeviceApprovalsChangeOverageActionDetails {
      /**
       * New over the limits policy. Might be missing due to historical data
       * gap.
       */
      new_value?: DeviceApprovalsRolloutPolicy;
      /**
       * Previous over the limit policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: DeviceApprovalsRolloutPolicy;
    }

    /**
     * Changed the action taken with respect to approval limits when a team
     * member unlinks an approved device.
     */
    interface DeviceApprovalsChangeUnlinkActionDetails {
      /**
       * New device unlink policy. Might be missing due to historical data gap.
       */
      new_value?: DeviceUnlinkPolicy;
      /**
       * Previous device unlink policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: DeviceUnlinkPolicy;
    }

    interface DeviceApprovalsPolicyUnlimited {
      '.tag': 'unlimited';
    }

    interface DeviceApprovalsPolicyLimited {
      '.tag': 'limited';
    }

    interface DeviceApprovalsPolicyOther {
      '.tag': 'other';
    }

    type DeviceApprovalsPolicy = DeviceApprovalsPolicyUnlimited | DeviceApprovalsPolicyLimited | DeviceApprovalsPolicyOther;

    interface DeviceApprovalsRolloutPolicyRemoveOldest {
      '.tag': 'remove_oldest';
    }

    interface DeviceApprovalsRolloutPolicyRemoveAll {
      '.tag': 'remove_all';
    }

    interface DeviceApprovalsRolloutPolicyAddException {
      '.tag': 'add_exception';
    }

    interface DeviceApprovalsRolloutPolicyOther {
      '.tag': 'other';
    }

    type DeviceApprovalsRolloutPolicy = DeviceApprovalsRolloutPolicyRemoveOldest | DeviceApprovalsRolloutPolicyRemoveAll | DeviceApprovalsRolloutPolicyAddException | DeviceApprovalsRolloutPolicyOther;

    /**
     * IP address associated with active desktop session changed.
     */
    interface DeviceChangeIpDesktopDetails {
      /**
       * Device information.
       */
      device_info: DeviceLogInfo;
    }

    /**
     * IP address associated with active mobile session changed.
     */
    interface DeviceChangeIpMobileDetails {
      /**
       * Device information.
       */
      device_info: DeviceLogInfo;
    }

    /**
     * IP address associated with active Web session changed.
     */
    interface DeviceChangeIpWebDetails {
      /**
       * Device information. Might be missing due to historical data gap.
       */
      device_info?: DeviceLogInfo;
      /**
       * Web browser name.
       */
      user_agent: string;
    }

    /**
     * Failed to delete all files from an unlinked device.
     */
    interface DeviceDeleteOnUnlinkFailDetails {
      /**
       * Device information.
       */
      device_info: DeviceLogInfo;
      /**
       * The number of times that remote file deletion failed.
       */
      num_failures: number;
    }

    /**
     * Deleted all files from an unlinked device.
     */
    interface DeviceDeleteOnUnlinkSuccessDetails {
      /**
       * Device information.
       */
      device_info: DeviceLogInfo;
    }

    /**
     * Failed to link a device.
     */
    interface DeviceLinkFailDetails {
      /**
       * Device information. Might be missing due to historical data gap.
       */
      device_info?: DeviceLogInfo;
      /**
       * A description of the device used while user approval blocked.
       */
      device_type: DeviceType;
    }

    /**
     * Linked a device.
     */
    interface DeviceLinkSuccessDetails {
      /**
       * Device information.
       */
      device_info: DeviceLogInfo;
    }

    /**
     * Device's logged information.
     */
    interface DeviceLogInfo {
      /**
       * Device unique id. Might be missing due to historical data gap.
       */
      device_id?: string;
      /**
       * Device display name. Might be missing due to historical data gap.
       */
      display_name?: string;
      /**
       * True if this device is emm managed, false otherwise. Might be missing
       * due to historical data gap.
       */
      is_emm_managed?: boolean;
      /**
       * Device platform name. Might be missing due to historical data gap.
       */
      platform?: string;
      /**
       * Device mac address. Might be missing due to historical data gap.
       */
      mac_address?: string;
      /**
       * Device OS version. Might be missing due to historical data gap.
       */
      os_version?: string;
      /**
       * Device type. Might be missing due to historical data gap.
       */
      device_type?: string;
      /**
       * IP address. Might be missing due to historical data gap.
       */
      ip_address?: IpAddress;
      /**
       * Last activity. Might be missing due to historical data gap.
       */
      last_activity?: string;
      /**
       * Linking app version. Might be missing due to historical data gap.
       */
      app_version?: string;
    }

    /**
     * Disable Device Management.
     */
    interface DeviceManagementDisabledDetails {
    }

    /**
     * Enable Device Management.
     */
    interface DeviceManagementEnabledDetails {
    }

    interface DeviceTypeDesktop {
      '.tag': 'desktop';
    }

    interface DeviceTypeMobile {
      '.tag': 'mobile';
    }

    interface DeviceTypeOther {
      '.tag': 'other';
    }

    type DeviceType = DeviceTypeDesktop | DeviceTypeMobile | DeviceTypeOther;

    /**
     * Disconnected a device.
     */
    interface DeviceUnlinkDetails {
      /**
       * Device information.
       */
      device_info: DeviceLogInfo;
      /**
       * True if the user requested to delete data after device unlink, false
       * otherwise.
       */
      delete_data: boolean;
    }

    interface DeviceUnlinkPolicyRemove {
      '.tag': 'remove';
    }

    interface DeviceUnlinkPolicyKeep {
      '.tag': 'keep';
    }

    interface DeviceUnlinkPolicyOther {
      '.tag': 'other';
    }

    type DeviceUnlinkPolicy = DeviceUnlinkPolicyRemove | DeviceUnlinkPolicyKeep | DeviceUnlinkPolicyOther;

    /**
     * Disabled domain invites.
     */
    interface DisabledDomainInvitesDetails {
    }

    /**
     * Approved a member's request to join the team.
     */
    interface DomainInvitesApproveRequestToJoinTeamDetails {
    }

    /**
     * Declined a user's request to join the team.
     */
    interface DomainInvitesDeclineRequestToJoinTeamDetails {
    }

    /**
     * Sent domain invites to existing domain accounts.
     */
    interface DomainInvitesEmailExistingUsersDetails {
      /**
       * Domain names.
       */
      domain_name: Array<string>;
      /**
       * Number of recipients.
       */
      num_recipients: number;
    }

    /**
     * Asked to join the team.
     */
    interface DomainInvitesRequestToJoinTeamDetails {
    }

    /**
     * Turned off u201cAutomatically invite new usersu201d.
     */
    interface DomainInvitesSetInviteNewUserPrefToNoDetails {
    }

    /**
     * Turned on u201cAutomatically invite new usersu201d.
     */
    interface DomainInvitesSetInviteNewUserPrefToYesDetails {
    }

    /**
     * Failed to verify a domain belonging to the team.
     */
    interface DomainVerificationAddDomainFailDetails {
      /**
       * Domain name.
       */
      domain_name: string;
      /**
       * Domain name verification method. Might be missing due to historical
       * data gap.
       */
      verification_method?: string;
    }

    /**
     * Verified a domain belonging to the team.
     */
    interface DomainVerificationAddDomainSuccessDetails {
      /**
       * Domain names.
       */
      domain_names: Array<string>;
      /**
       * Domain name verification method. Might be missing due to historical
       * data gap.
       */
      verification_method?: string;
    }

    /**
     * Removed a domain from the list of verified domains belonging to the team.
     */
    interface DomainVerificationRemoveDomainDetails {
      /**
       * Domain names.
       */
      domain_names: Array<string>;
      /**
       * Domain name verification method. Might be missing due to historical
       * data gap.
       */
      verification_method?: string;
    }

    /**
     * Represents a time duration: unit and amount
     */
    interface DurationLogInfo {
      /**
       * Time unit.
       */
      unit: TimeUnit;
      /**
       * Amount of time.
       */
      amount: number;
    }

    /**
     * Added an exception for one or more team members to optionally use the
     * regular Dropbox app when EMM is enabled.
     */
    interface EmmAddExceptionDetails {
    }

    /**
     * Enabled or disabled enterprise mobility management for team members.
     */
    interface EmmChangePolicyDetails {
      /**
       * New enterprise mobility management policy.
       */
      new_value: EmmPolicy;
      /**
       * Previous enterprise mobility management policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: EmmPolicy;
    }

    /**
     * EMM excluded users report created.
     */
    interface EmmCreateExceptionsReportDetails {
    }

    /**
     * EMM mobile app usage report created.
     */
    interface EmmCreateUsageReportDetails {
    }

    /**
     * Signed in using the Dropbox EMM app.
     */
    interface EmmLoginSuccessDetails {
    }

    interface EmmPolicyDisabled {
      '.tag': 'disabled';
    }

    interface EmmPolicyOptional {
      '.tag': 'optional';
    }

    interface EmmPolicyRequired {
      '.tag': 'required';
    }

    interface EmmPolicyOther {
      '.tag': 'other';
    }

    /**
     * Enterprise mobility management policy
     */
    type EmmPolicy = EmmPolicyDisabled | EmmPolicyOptional | EmmPolicyRequired | EmmPolicyOther;

    /**
     * Refreshed the auth token used for setting up enterprise mobility
     * management.
     */
    interface EmmRefreshAuthTokenDetails {
    }

    /**
     * Removed an exception for one or more team members to optionally use the
     * regular Dropbox app when EMM is enabled.
     */
    interface EmmRemoveExceptionDetails {
    }

    /**
     * Enabled domain invites.
     */
    interface EnabledDomainInvitesDetails {
    }

    /**
     * Events that have to do with account capture and invite enforcement on
     * team-owned domains.
     */
    interface EventCategoryAccountCapture {
      '.tag': 'account_capture';
    }

    /**
     * Events that relate to team and team member account administration or team
     * administration. Note that these actions are not necessarily performed by
     * team admins. They might also be performed by Dropbox Support or System or
     * by team members on their own accounts.
     */
    interface EventCategoryAdministration {
      '.tag': 'administration';
    }

    /**
     * Events that apply to management of linked apps.
     */
    interface EventCategoryApps {
      '.tag': 'apps';
    }

    /**
     * Events that apply to user authentication in some way.
     */
    interface EventCategoryAuthentication {
      '.tag': 'authentication';
    }

    /**
     * Events that have to do with comments on files and Paper documents.
     */
    interface EventCategoryComments {
      '.tag': 'comments';
    }

    /**
     * Events that apply to changes how people can access content on Dropbox as
     * well as actions that represent actually accessing content.
     */
    interface EventCategoryContentAccess {
      '.tag': 'content_access';
    }

    /**
     * Events that apply to linked devices on mobile, desktop and Web platforms.
     */
    interface EventCategoryDevices {
      '.tag': 'devices';
    }

    /**
     * Events that concern device approvals and device management.
     */
    interface EventCategoryDeviceApprovals {
      '.tag': 'device_approvals';
    }

    /**
     * Events that involve domain management feature: domain verification,
     * invite enforcement and account capture.
     */
    interface EventCategoryDomains {
      '.tag': 'domains';
    }

    /**
     * Events that involve enterprise mobility management and the Dropbox EMM
     * app.
     */
    interface EventCategoryEmm {
      '.tag': 'emm';
    }

    /**
     * Events that mark some type of unexpected outcome.
     */
    interface EventCategoryErrors {
      '.tag': 'errors';
    }

    /**
     * Events that mark a user's interaction with files and folders on Dropbox.
     */
    interface EventCategoryFiles {
      '.tag': 'files';
    }

    /**
     * Events that have to do with filesystem operations on files and folders:
     * copy, move, delete, etc.
     */
    interface EventCategoryFileOperations {
      '.tag': 'file_operations';
    }

    /**
     * Events that apply to the file requests feature.
     */
    interface EventCategoryFileRequests {
      '.tag': 'file_requests';
    }

    /**
     * Events that involve group management.
     */
    interface EventCategoryGroups {
      '.tag': 'groups';
    }

    /**
     * Events that involve users signing in to or out of Dropbox.
     */
    interface EventCategoryLogins {
      '.tag': 'logins';
    }

    /**
     * Events that involve team member management.
     */
    interface EventCategoryMembers {
      '.tag': 'members';
    }

    /**
     * Events that apply to Dropbox Paper.
     */
    interface EventCategoryPaper {
      '.tag': 'paper';
    }

    /**
     * Events that involve using, changing or resetting passwords.
     */
    interface EventCategoryPasswords {
      '.tag': 'passwords';
    }

    /**
     * Events that concern generation of admin reports, including team activity
     * and device usage.
     */
    interface EventCategoryReports {
      '.tag': 'reports';
    }

    /**
     * Events that mark the beginning or end of sessions as well as those that
     * apply to an ongoing session.
     */
    interface EventCategorySessions {
      '.tag': 'sessions';
    }

    /**
     * Events that specifically apply to shared files.
     */
    interface EventCategorySharedFiles {
      '.tag': 'shared_files';
    }

    /**
     * Events that specifically apply to shared folders.
     */
    interface EventCategorySharedFolders {
      '.tag': 'shared_folders';
    }

    /**
     * Events that specifically apply to link sharing.
     */
    interface EventCategorySharedLinks {
      '.tag': 'shared_links';
    }

    /**
     * Events that apply to all types of sharing and collaboration.
     */
    interface EventCategorySharing {
      '.tag': 'sharing';
    }

    /**
     * Events that concern policies that affect sharing - both at the team level
     * and at the folder level.
     */
    interface EventCategorySharingPolicies {
      '.tag': 'sharing_policies';
    }

    /**
     * Events that involve using or configuring single sign-on as well as
     * administrative policies concerning single sign-on.
     */
    interface EventCategorySso {
      '.tag': 'sso';
    }

    /**
     * Events that involve team folder management.
     */
    interface EventCategoryTeamFolders {
      '.tag': 'team_folders';
    }

    /**
     * Events that involve a change in team-wide policies.
     */
    interface EventCategoryTeamPolicies {
      '.tag': 'team_policies';
    }

    /**
     * Events that involve a change in the team profile.
     */
    interface EventCategoryTeamProfile {
      '.tag': 'team_profile';
    }

    /**
     * Events that involve using or configuring two factor authentication as
     * well as administrative policies concerning two factor authentication.
     */
    interface EventCategoryTfa {
      '.tag': 'tfa';
    }

    interface EventCategoryOther {
      '.tag': 'other';
    }

    /**
     * Category of events in event audit log.
     */
    type EventCategory = EventCategoryAccountCapture | EventCategoryAdministration | EventCategoryApps | EventCategoryAuthentication | EventCategoryComments | EventCategoryContentAccess | EventCategoryDevices | EventCategoryDeviceApprovals | EventCategoryDomains | EventCategoryEmm | EventCategoryErrors | EventCategoryFiles | EventCategoryFileOperations | EventCategoryFileRequests | EventCategoryGroups | EventCategoryLogins | EventCategoryMembers | EventCategoryPaper | EventCategoryPasswords | EventCategoryReports | EventCategorySessions | EventCategorySharedFiles | EventCategorySharedFolders | EventCategorySharedLinks | EventCategorySharing | EventCategorySharingPolicies | EventCategorySso | EventCategoryTeamFolders | EventCategoryTeamPolicies | EventCategoryTeamProfile | EventCategoryTfa | EventCategoryOther;

    /**
     * Changed the membership type (limited vs full) for team member.
     */
    interface EventDetailsMemberChangeMembershipTypeDetails {
      '.tag': 'member_change_membership_type_details';
      member_change_membership_type_details: MemberChangeMembershipTypeDetails;
    }

    /**
     * Permanently deleted contents of a removed team member account.
     */
    interface EventDetailsMemberPermanentlyDeleteAccountContentsDetails {
      '.tag': 'member_permanently_delete_account_contents_details';
      member_permanently_delete_account_contents_details: MemberPermanentlyDeleteAccountContentsDetails;
    }

    /**
     * Changed the status with respect to whether the team member is under or
     * over storage quota specified by policy.
     */
    interface EventDetailsMemberSpaceLimitsChangeStatusDetails {
      '.tag': 'member_space_limits_change_status_details';
      member_space_limits_change_status_details: MemberSpaceLimitsChangeStatusDetails;
    }

    /**
     * Transferred contents of a removed team member account to another member.
     */
    interface EventDetailsMemberTransferAccountContentsDetails {
      '.tag': 'member_transfer_account_contents_details';
      member_transfer_account_contents_details: MemberTransferAccountContentsDetails;
    }

    /**
     * Users added to Paper enabled users list.
     */
    interface EventDetailsPaperEnabledUsersGroupAdditionDetails {
      '.tag': 'paper_enabled_users_group_addition_details';
      paper_enabled_users_group_addition_details: PaperEnabledUsersGroupAdditionDetails;
    }

    /**
     * Users removed from Paper enabled users list.
     */
    interface EventDetailsPaperEnabledUsersGroupRemovalDetails {
      '.tag': 'paper_enabled_users_group_removal_details';
      paper_enabled_users_group_removal_details: PaperEnabledUsersGroupRemovalDetails;
    }

    /**
     * Paper external sharing policy changed: anyone.
     */
    interface EventDetailsPaperExternalViewAllowDetails {
      '.tag': 'paper_external_view_allow_details';
      paper_external_view_allow_details: PaperExternalViewAllowDetails;
    }

    /**
     * Paper external sharing policy changed: default team.
     */
    interface EventDetailsPaperExternalViewDefaultTeamDetails {
      '.tag': 'paper_external_view_default_team_details';
      paper_external_view_default_team_details: PaperExternalViewDefaultTeamDetails;
    }

    /**
     * Paper external sharing policy changed: team-only.
     */
    interface EventDetailsPaperExternalViewForbidDetails {
      '.tag': 'paper_external_view_forbid_details';
      paper_external_view_forbid_details: PaperExternalViewForbidDetails;
    }

    /**
     * Admin settings: team members see a warning before sharing folders outside
     * the team (DEPRECATED FEATURE).
     */
    interface EventDetailsSfExternalInviteWarnDetails {
      '.tag': 'sf_external_invite_warn_details';
      sf_external_invite_warn_details: SfExternalInviteWarnDetails;
    }

    /**
     * Merged another team into this team.
     */
    interface EventDetailsTeamMergeFromDetails {
      '.tag': 'team_merge_from_details';
      team_merge_from_details: TeamMergeFromDetails;
    }

    /**
     * Merged this team into another team.
     */
    interface EventDetailsTeamMergeToDetails {
      '.tag': 'team_merge_to_details';
      team_merge_to_details: TeamMergeToDetails;
    }

    /**
     * Linked an app for team.
     */
    interface EventDetailsAppLinkTeamDetails {
      '.tag': 'app_link_team_details';
      app_link_team_details: AppLinkTeamDetails;
    }

    /**
     * Linked an app for team member.
     */
    interface EventDetailsAppLinkUserDetails {
      '.tag': 'app_link_user_details';
      app_link_user_details: AppLinkUserDetails;
    }

    /**
     * Unlinked an app for team.
     */
    interface EventDetailsAppUnlinkTeamDetails {
      '.tag': 'app_unlink_team_details';
      app_unlink_team_details: AppUnlinkTeamDetails;
    }

    /**
     * Unlinked an app for team member.
     */
    interface EventDetailsAppUnlinkUserDetails {
      '.tag': 'app_unlink_user_details';
      app_unlink_user_details: AppUnlinkUserDetails;
    }

    /**
     * IP address associated with active desktop session changed.
     */
    interface EventDetailsDeviceChangeIpDesktopDetails {
      '.tag': 'device_change_ip_desktop_details';
      device_change_ip_desktop_details: DeviceChangeIpDesktopDetails;
    }

    /**
     * IP address associated with active mobile session changed.
     */
    interface EventDetailsDeviceChangeIpMobileDetails {
      '.tag': 'device_change_ip_mobile_details';
      device_change_ip_mobile_details: DeviceChangeIpMobileDetails;
    }

    /**
     * IP address associated with active Web session changed.
     */
    interface EventDetailsDeviceChangeIpWebDetails {
      '.tag': 'device_change_ip_web_details';
      device_change_ip_web_details: DeviceChangeIpWebDetails;
    }

    /**
     * Failed to delete all files from an unlinked device.
     */
    interface EventDetailsDeviceDeleteOnUnlinkFailDetails {
      '.tag': 'device_delete_on_unlink_fail_details';
      device_delete_on_unlink_fail_details: DeviceDeleteOnUnlinkFailDetails;
    }

    /**
     * Deleted all files from an unlinked device.
     */
    interface EventDetailsDeviceDeleteOnUnlinkSuccessDetails {
      '.tag': 'device_delete_on_unlink_success_details';
      device_delete_on_unlink_success_details: DeviceDeleteOnUnlinkSuccessDetails;
    }

    /**
     * Failed to link a device.
     */
    interface EventDetailsDeviceLinkFailDetails {
      '.tag': 'device_link_fail_details';
      device_link_fail_details: DeviceLinkFailDetails;
    }

    /**
     * Linked a device.
     */
    interface EventDetailsDeviceLinkSuccessDetails {
      '.tag': 'device_link_success_details';
      device_link_success_details: DeviceLinkSuccessDetails;
    }

    /**
     * Disable Device Management.
     */
    interface EventDetailsDeviceManagementDisabledDetails {
      '.tag': 'device_management_disabled_details';
      device_management_disabled_details: DeviceManagementDisabledDetails;
    }

    /**
     * Enable Device Management.
     */
    interface EventDetailsDeviceManagementEnabledDetails {
      '.tag': 'device_management_enabled_details';
      device_management_enabled_details: DeviceManagementEnabledDetails;
    }

    /**
     * Disconnected a device.
     */
    interface EventDetailsDeviceUnlinkDetails {
      '.tag': 'device_unlink_details';
      device_unlink_details: DeviceUnlinkDetails;
    }

    /**
     * Refreshed the auth token used for setting up enterprise mobility
     * management.
     */
    interface EventDetailsEmmRefreshAuthTokenDetails {
      '.tag': 'emm_refresh_auth_token_details';
      emm_refresh_auth_token_details: EmmRefreshAuthTokenDetails;
    }

    /**
     * Granted or revoked the option to enable account capture on domains
     * belonging to the team.
     */
    interface EventDetailsAccountCaptureChangeAvailabilityDetails {
      '.tag': 'account_capture_change_availability_details';
      account_capture_change_availability_details: AccountCaptureChangeAvailabilityDetails;
    }

    /**
     * Account captured user migrated their account to the team.
     */
    interface EventDetailsAccountCaptureMigrateAccountDetails {
      '.tag': 'account_capture_migrate_account_details';
      account_capture_migrate_account_details: AccountCaptureMigrateAccountDetails;
    }

    /**
     * Account captured user relinquished their account by changing the email
     * address associated with it.
     */
    interface EventDetailsAccountCaptureRelinquishAccountDetails {
      '.tag': 'account_capture_relinquish_account_details';
      account_capture_relinquish_account_details: AccountCaptureRelinquishAccountDetails;
    }

    /**
     * Disabled domain invites.
     */
    interface EventDetailsDisabledDomainInvitesDetails {
      '.tag': 'disabled_domain_invites_details';
      disabled_domain_invites_details: DisabledDomainInvitesDetails;
    }

    /**
     * Approved a member's request to join the team.
     */
    interface EventDetailsDomainInvitesApproveRequestToJoinTeamDetails {
      '.tag': 'domain_invites_approve_request_to_join_team_details';
      domain_invites_approve_request_to_join_team_details: DomainInvitesApproveRequestToJoinTeamDetails;
    }

    /**
     * Declined a user's request to join the team.
     */
    interface EventDetailsDomainInvitesDeclineRequestToJoinTeamDetails {
      '.tag': 'domain_invites_decline_request_to_join_team_details';
      domain_invites_decline_request_to_join_team_details: DomainInvitesDeclineRequestToJoinTeamDetails;
    }

    /**
     * Sent domain invites to existing domain accounts.
     */
    interface EventDetailsDomainInvitesEmailExistingUsersDetails {
      '.tag': 'domain_invites_email_existing_users_details';
      domain_invites_email_existing_users_details: DomainInvitesEmailExistingUsersDetails;
    }

    /**
     * Asked to join the team.
     */
    interface EventDetailsDomainInvitesRequestToJoinTeamDetails {
      '.tag': 'domain_invites_request_to_join_team_details';
      domain_invites_request_to_join_team_details: DomainInvitesRequestToJoinTeamDetails;
    }

    /**
     * Turned off u201cAutomatically invite new usersu201d.
     */
    interface EventDetailsDomainInvitesSetInviteNewUserPrefToNoDetails {
      '.tag': 'domain_invites_set_invite_new_user_pref_to_no_details';
      domain_invites_set_invite_new_user_pref_to_no_details: DomainInvitesSetInviteNewUserPrefToNoDetails;
    }

    /**
     * Turned on u201cAutomatically invite new usersu201d.
     */
    interface EventDetailsDomainInvitesSetInviteNewUserPrefToYesDetails {
      '.tag': 'domain_invites_set_invite_new_user_pref_to_yes_details';
      domain_invites_set_invite_new_user_pref_to_yes_details: DomainInvitesSetInviteNewUserPrefToYesDetails;
    }

    /**
     * Failed to verify a domain belonging to the team.
     */
    interface EventDetailsDomainVerificationAddDomainFailDetails {
      '.tag': 'domain_verification_add_domain_fail_details';
      domain_verification_add_domain_fail_details: DomainVerificationAddDomainFailDetails;
    }

    /**
     * Verified a domain belonging to the team.
     */
    interface EventDetailsDomainVerificationAddDomainSuccessDetails {
      '.tag': 'domain_verification_add_domain_success_details';
      domain_verification_add_domain_success_details: DomainVerificationAddDomainSuccessDetails;
    }

    /**
     * Removed a domain from the list of verified domains belonging to the team.
     */
    interface EventDetailsDomainVerificationRemoveDomainDetails {
      '.tag': 'domain_verification_remove_domain_details';
      domain_verification_remove_domain_details: DomainVerificationRemoveDomainDetails;
    }

    /**
     * Enabled domain invites.
     */
    interface EventDetailsEnabledDomainInvitesDetails {
      '.tag': 'enabled_domain_invites_details';
      enabled_domain_invites_details: EnabledDomainInvitesDetails;
    }

    /**
     * Created folders.
     */
    interface EventDetailsCreateFolderDetails {
      '.tag': 'create_folder_details';
      create_folder_details: CreateFolderDetails;
    }

    /**
     * Added files and/or folders.
     */
    interface EventDetailsFileAddDetails {
      '.tag': 'file_add_details';
      file_add_details: FileAddDetails;
    }

    /**
     * Copied files and/or folders.
     */
    interface EventDetailsFileCopyDetails {
      '.tag': 'file_copy_details';
      file_copy_details: FileCopyDetails;
    }

    /**
     * Deleted files and/or folders.
     */
    interface EventDetailsFileDeleteDetails {
      '.tag': 'file_delete_details';
      file_delete_details: FileDeleteDetails;
    }

    /**
     * Downloaded files and/or folders.
     */
    interface EventDetailsFileDownloadDetails {
      '.tag': 'file_download_details';
      file_download_details: FileDownloadDetails;
    }

    /**
     * Edited files.
     */
    interface EventDetailsFileEditDetails {
      '.tag': 'file_edit_details';
      file_edit_details: FileEditDetails;
    }

    /**
     * Create a copy reference to a file or folder.
     */
    interface EventDetailsFileGetCopyReferenceDetails {
      '.tag': 'file_get_copy_reference_details';
      file_get_copy_reference_details: FileGetCopyReferenceDetails;
    }

    /**
     * Moved files and/or folders.
     */
    interface EventDetailsFileMoveDetails {
      '.tag': 'file_move_details';
      file_move_details: FileMoveDetails;
    }

    /**
     * Permanently deleted files and/or folders.
     */
    interface EventDetailsFilePermanentlyDeleteDetails {
      '.tag': 'file_permanently_delete_details';
      file_permanently_delete_details: FilePermanentlyDeleteDetails;
    }

    /**
     * Previewed files and/or folders.
     */
    interface EventDetailsFilePreviewDetails {
      '.tag': 'file_preview_details';
      file_preview_details: FilePreviewDetails;
    }

    /**
     * Renamed files and/or folders.
     */
    interface EventDetailsFileRenameDetails {
      '.tag': 'file_rename_details';
      file_rename_details: FileRenameDetails;
    }

    /**
     * Restored deleted files and/or folders.
     */
    interface EventDetailsFileRestoreDetails {
      '.tag': 'file_restore_details';
      file_restore_details: FileRestoreDetails;
    }

    /**
     * Reverted files to a previous version.
     */
    interface EventDetailsFileRevertDetails {
      '.tag': 'file_revert_details';
      file_revert_details: FileRevertDetails;
    }

    /**
     * Rolled back file change location changes.
     */
    interface EventDetailsFileRollbackChangesDetails {
      '.tag': 'file_rollback_changes_details';
      file_rollback_changes_details: FileRollbackChangesDetails;
    }

    /**
     * Save a file or folder using a copy reference.
     */
    interface EventDetailsFileSaveCopyReferenceDetails {
      '.tag': 'file_save_copy_reference_details';
      file_save_copy_reference_details: FileSaveCopyReferenceDetails;
    }

    /**
     * Added a deadline to a file request.
     */
    interface EventDetailsFileRequestAddDeadlineDetails {
      '.tag': 'file_request_add_deadline_details';
      file_request_add_deadline_details: FileRequestAddDeadlineDetails;
    }

    /**
     * Changed the file request folder.
     */
    interface EventDetailsFileRequestChangeFolderDetails {
      '.tag': 'file_request_change_folder_details';
      file_request_change_folder_details: FileRequestChangeFolderDetails;
    }

    /**
     * Change the file request title.
     */
    interface EventDetailsFileRequestChangeTitleDetails {
      '.tag': 'file_request_change_title_details';
      file_request_change_title_details: FileRequestChangeTitleDetails;
    }

    /**
     * Closed a file request.
     */
    interface EventDetailsFileRequestCloseDetails {
      '.tag': 'file_request_close_details';
      file_request_close_details: FileRequestCloseDetails;
    }

    /**
     * Created a file request.
     */
    interface EventDetailsFileRequestCreateDetails {
      '.tag': 'file_request_create_details';
      file_request_create_details: FileRequestCreateDetails;
    }

    /**
     * Received files for a file request.
     */
    interface EventDetailsFileRequestReceiveFileDetails {
      '.tag': 'file_request_receive_file_details';
      file_request_receive_file_details: FileRequestReceiveFileDetails;
    }

    /**
     * Removed the file request deadline.
     */
    interface EventDetailsFileRequestRemoveDeadlineDetails {
      '.tag': 'file_request_remove_deadline_details';
      file_request_remove_deadline_details: FileRequestRemoveDeadlineDetails;
    }

    /**
     * Sent file request to users via email.
     */
    interface EventDetailsFileRequestSendDetails {
      '.tag': 'file_request_send_details';
      file_request_send_details: FileRequestSendDetails;
    }

    /**
     * Added an external ID for group.
     */
    interface EventDetailsGroupAddExternalIdDetails {
      '.tag': 'group_add_external_id_details';
      group_add_external_id_details: GroupAddExternalIdDetails;
    }

    /**
     * Added team members to a group.
     */
    interface EventDetailsGroupAddMemberDetails {
      '.tag': 'group_add_member_details';
      group_add_member_details: GroupAddMemberDetails;
    }

    /**
     * Changed the external ID for group.
     */
    interface EventDetailsGroupChangeExternalIdDetails {
      '.tag': 'group_change_external_id_details';
      group_change_external_id_details: GroupChangeExternalIdDetails;
    }

    /**
     * Changed group management type.
     */
    interface EventDetailsGroupChangeManagementTypeDetails {
      '.tag': 'group_change_management_type_details';
      group_change_management_type_details: GroupChangeManagementTypeDetails;
    }

    /**
     * Changed the manager permissions belonging to a group member.
     */
    interface EventDetailsGroupChangeMemberRoleDetails {
      '.tag': 'group_change_member_role_details';
      group_change_member_role_details: GroupChangeMemberRoleDetails;
    }

    /**
     * Created a group.
     */
    interface EventDetailsGroupCreateDetails {
      '.tag': 'group_create_details';
      group_create_details: GroupCreateDetails;
    }

    /**
     * Deleted a group.
     */
    interface EventDetailsGroupDeleteDetails {
      '.tag': 'group_delete_details';
      group_delete_details: GroupDeleteDetails;
    }

    /**
     * Updated a group.
     */
    interface EventDetailsGroupDescriptionUpdatedDetails {
      '.tag': 'group_description_updated_details';
      group_description_updated_details: GroupDescriptionUpdatedDetails;
    }

    /**
     * Updated a group join policy.
     */
    interface EventDetailsGroupJoinPolicyUpdatedDetails {
      '.tag': 'group_join_policy_updated_details';
      group_join_policy_updated_details: GroupJoinPolicyUpdatedDetails;
    }

    /**
     * Moved a group.
     */
    interface EventDetailsGroupMovedDetails {
      '.tag': 'group_moved_details';
      group_moved_details: GroupMovedDetails;
    }

    /**
     * Removed the external ID for group.
     */
    interface EventDetailsGroupRemoveExternalIdDetails {
      '.tag': 'group_remove_external_id_details';
      group_remove_external_id_details: GroupRemoveExternalIdDetails;
    }

    /**
     * Removed team members from a group.
     */
    interface EventDetailsGroupRemoveMemberDetails {
      '.tag': 'group_remove_member_details';
      group_remove_member_details: GroupRemoveMemberDetails;
    }

    /**
     * Renamed a group.
     */
    interface EventDetailsGroupRenameDetails {
      '.tag': 'group_rename_details';
      group_rename_details: GroupRenameDetails;
    }

    /**
     * Signed in using the Dropbox EMM app.
     */
    interface EventDetailsEmmLoginSuccessDetails {
      '.tag': 'emm_login_success_details';
      emm_login_success_details: EmmLoginSuccessDetails;
    }

    /**
     * Signed out.
     */
    interface EventDetailsLogoutDetails {
      '.tag': 'logout_details';
      logout_details: LogoutDetails;
    }

    /**
     * Failed to sign in using a password.
     */
    interface EventDetailsPasswordLoginFailDetails {
      '.tag': 'password_login_fail_details';
      password_login_fail_details: PasswordLoginFailDetails;
    }

    /**
     * Signed in using a password.
     */
    interface EventDetailsPasswordLoginSuccessDetails {
      '.tag': 'password_login_success_details';
      password_login_success_details: PasswordLoginSuccessDetails;
    }

    /**
     * Ended reseller support session.
     */
    interface EventDetailsResellerSupportSessionEndDetails {
      '.tag': 'reseller_support_session_end_details';
      reseller_support_session_end_details: ResellerSupportSessionEndDetails;
    }

    /**
     * Started reseller support session.
     */
    interface EventDetailsResellerSupportSessionStartDetails {
      '.tag': 'reseller_support_session_start_details';
      reseller_support_session_start_details: ResellerSupportSessionStartDetails;
    }

    /**
     * Ended admin sign-in-as session.
     */
    interface EventDetailsSignInAsSessionEndDetails {
      '.tag': 'sign_in_as_session_end_details';
      sign_in_as_session_end_details: SignInAsSessionEndDetails;
    }

    /**
     * Started admin sign-in-as session.
     */
    interface EventDetailsSignInAsSessionStartDetails {
      '.tag': 'sign_in_as_session_start_details';
      sign_in_as_session_start_details: SignInAsSessionStartDetails;
    }

    /**
     * Failed to sign in using SSO.
     */
    interface EventDetailsSsoLoginFailDetails {
      '.tag': 'sso_login_fail_details';
      sso_login_fail_details: SsoLoginFailDetails;
    }

    /**
     * Set team member name when joining team.
     */
    interface EventDetailsMemberAddNameDetails {
      '.tag': 'member_add_name_details';
      member_add_name_details: MemberAddNameDetails;
    }

    /**
     * Change the admin role belonging to team member.
     */
    interface EventDetailsMemberChangeAdminRoleDetails {
      '.tag': 'member_change_admin_role_details';
      member_change_admin_role_details: MemberChangeAdminRoleDetails;
    }

    /**
     * Changed team member email address.
     */
    interface EventDetailsMemberChangeEmailDetails {
      '.tag': 'member_change_email_details';
      member_change_email_details: MemberChangeEmailDetails;
    }

    /**
     * Changed team member name.
     */
    interface EventDetailsMemberChangeNameDetails {
      '.tag': 'member_change_name_details';
      member_change_name_details: MemberChangeNameDetails;
    }

    /**
     * Changed the membership status of a team member.
     */
    interface EventDetailsMemberChangeStatusDetails {
      '.tag': 'member_change_status_details';
      member_change_status_details: MemberChangeStatusDetails;
    }

    /**
     * Suggested a new team member to be added to the team.
     */
    interface EventDetailsMemberSuggestDetails {
      '.tag': 'member_suggest_details';
      member_suggest_details: MemberSuggestDetails;
    }

    /**
     * Added users to the membership of a Paper doc or folder.
     */
    interface EventDetailsPaperContentAddMemberDetails {
      '.tag': 'paper_content_add_member_details';
      paper_content_add_member_details: PaperContentAddMemberDetails;
    }

    /**
     * Added Paper doc or folder to a folder.
     */
    interface EventDetailsPaperContentAddToFolderDetails {
      '.tag': 'paper_content_add_to_folder_details';
      paper_content_add_to_folder_details: PaperContentAddToFolderDetails;
    }

    /**
     * Archived Paper doc or folder.
     */
    interface EventDetailsPaperContentArchiveDetails {
      '.tag': 'paper_content_archive_details';
      paper_content_archive_details: PaperContentArchiveDetails;
    }

    /**
     * Followed or unfollowed a Paper doc or folder.
     */
    interface EventDetailsPaperContentChangeSubscriptionDetails {
      '.tag': 'paper_content_change_subscription_details';
      paper_content_change_subscription_details: PaperContentChangeSubscriptionDetails;
    }

    /**
     * Created a Paper doc or folder.
     */
    interface EventDetailsPaperContentCreateDetails {
      '.tag': 'paper_content_create_details';
      paper_content_create_details: PaperContentCreateDetails;
    }

    /**
     * Permanently deleted a Paper doc or folder.
     */
    interface EventDetailsPaperContentPermanentlyDeleteDetails {
      '.tag': 'paper_content_permanently_delete_details';
      paper_content_permanently_delete_details: PaperContentPermanentlyDeleteDetails;
    }

    /**
     * Removed Paper doc or folder from a folder.
     */
    interface EventDetailsPaperContentRemoveFromFolderDetails {
      '.tag': 'paper_content_remove_from_folder_details';
      paper_content_remove_from_folder_details: PaperContentRemoveFromFolderDetails;
    }

    /**
     * Removed a user from the membership of a Paper doc or folder.
     */
    interface EventDetailsPaperContentRemoveMemberDetails {
      '.tag': 'paper_content_remove_member_details';
      paper_content_remove_member_details: PaperContentRemoveMemberDetails;
    }

    /**
     * Renamed Paper doc or folder.
     */
    interface EventDetailsPaperContentRenameDetails {
      '.tag': 'paper_content_rename_details';
      paper_content_rename_details: PaperContentRenameDetails;
    }

    /**
     * Restored an archived Paper doc or folder.
     */
    interface EventDetailsPaperContentRestoreDetails {
      '.tag': 'paper_content_restore_details';
      paper_content_restore_details: PaperContentRestoreDetails;
    }

    /**
     * Added a Paper doc comment.
     */
    interface EventDetailsPaperDocAddCommentDetails {
      '.tag': 'paper_doc_add_comment_details';
      paper_doc_add_comment_details: PaperDocAddCommentDetails;
    }

    /**
     * Changed the access type of a Paper doc member.
     */
    interface EventDetailsPaperDocChangeMemberRoleDetails {
      '.tag': 'paper_doc_change_member_role_details';
      paper_doc_change_member_role_details: PaperDocChangeMemberRoleDetails;
    }

    /**
     * Changed the sharing policy for Paper doc.
     */
    interface EventDetailsPaperDocChangeSharingPolicyDetails {
      '.tag': 'paper_doc_change_sharing_policy_details';
      paper_doc_change_sharing_policy_details: PaperDocChangeSharingPolicyDetails;
    }

    /**
     * Paper doc archived.
     */
    interface EventDetailsPaperDocDeletedDetails {
      '.tag': 'paper_doc_deleted_details';
      paper_doc_deleted_details: PaperDocDeletedDetails;
    }

    /**
     * Deleted a Paper doc comment.
     */
    interface EventDetailsPaperDocDeleteCommentDetails {
      '.tag': 'paper_doc_delete_comment_details';
      paper_doc_delete_comment_details: PaperDocDeleteCommentDetails;
    }

    /**
     * Downloaded a Paper doc in a particular output format.
     */
    interface EventDetailsPaperDocDownloadDetails {
      '.tag': 'paper_doc_download_details';
      paper_doc_download_details: PaperDocDownloadDetails;
    }

    /**
     * Edited a Paper doc.
     */
    interface EventDetailsPaperDocEditDetails {
      '.tag': 'paper_doc_edit_details';
      paper_doc_edit_details: PaperDocEditDetails;
    }

    /**
     * Edited a Paper doc comment.
     */
    interface EventDetailsPaperDocEditCommentDetails {
      '.tag': 'paper_doc_edit_comment_details';
      paper_doc_edit_comment_details: PaperDocEditCommentDetails;
    }

    /**
     * Followed a Paper doc.
     */
    interface EventDetailsPaperDocFollowedDetails {
      '.tag': 'paper_doc_followed_details';
      paper_doc_followed_details: PaperDocFollowedDetails;
    }

    /**
     * Mentioned a member in a Paper doc.
     */
    interface EventDetailsPaperDocMentionDetails {
      '.tag': 'paper_doc_mention_details';
      paper_doc_mention_details: PaperDocMentionDetails;
    }

    /**
     * Requested to be a member on a Paper doc.
     */
    interface EventDetailsPaperDocRequestAccessDetails {
      '.tag': 'paper_doc_request_access_details';
      paper_doc_request_access_details: PaperDocRequestAccessDetails;
    }

    /**
     * Paper doc comment resolved.
     */
    interface EventDetailsPaperDocResolveCommentDetails {
      '.tag': 'paper_doc_resolve_comment_details';
      paper_doc_resolve_comment_details: PaperDocResolveCommentDetails;
    }

    /**
     * Restored a Paper doc to previous revision.
     */
    interface EventDetailsPaperDocRevertDetails {
      '.tag': 'paper_doc_revert_details';
      paper_doc_revert_details: PaperDocRevertDetails;
    }

    /**
     * Paper doc link shared via slack.
     */
    interface EventDetailsPaperDocSlackShareDetails {
      '.tag': 'paper_doc_slack_share_details';
      paper_doc_slack_share_details: PaperDocSlackShareDetails;
    }

    /**
     * Paper doc shared with team member.
     */
    interface EventDetailsPaperDocTeamInviteDetails {
      '.tag': 'paper_doc_team_invite_details';
      paper_doc_team_invite_details: PaperDocTeamInviteDetails;
    }

    /**
     * Unresolved a Paper doc comment.
     */
    interface EventDetailsPaperDocUnresolveCommentDetails {
      '.tag': 'paper_doc_unresolve_comment_details';
      paper_doc_unresolve_comment_details: PaperDocUnresolveCommentDetails;
    }

    /**
     * Viewed Paper doc.
     */
    interface EventDetailsPaperDocViewDetails {
      '.tag': 'paper_doc_view_details';
      paper_doc_view_details: PaperDocViewDetails;
    }

    /**
     * Paper folder archived.
     */
    interface EventDetailsPaperFolderDeletedDetails {
      '.tag': 'paper_folder_deleted_details';
      paper_folder_deleted_details: PaperFolderDeletedDetails;
    }

    /**
     * Followed a Paper folder.
     */
    interface EventDetailsPaperFolderFollowedDetails {
      '.tag': 'paper_folder_followed_details';
      paper_folder_followed_details: PaperFolderFollowedDetails;
    }

    /**
     * Paper folder shared with team member.
     */
    interface EventDetailsPaperFolderTeamInviteDetails {
      '.tag': 'paper_folder_team_invite_details';
      paper_folder_team_invite_details: PaperFolderTeamInviteDetails;
    }

    /**
     * Changed password.
     */
    interface EventDetailsPasswordChangeDetails {
      '.tag': 'password_change_details';
      password_change_details: PasswordChangeDetails;
    }

    /**
     * Reset password.
     */
    interface EventDetailsPasswordResetDetails {
      '.tag': 'password_reset_details';
      password_reset_details: PasswordResetDetails;
    }

    /**
     * Reset all team member passwords.
     */
    interface EventDetailsPasswordResetAllDetails {
      '.tag': 'password_reset_all_details';
      password_reset_all_details: PasswordResetAllDetails;
    }

    /**
     * EMM excluded users report created.
     */
    interface EventDetailsEmmCreateExceptionsReportDetails {
      '.tag': 'emm_create_exceptions_report_details';
      emm_create_exceptions_report_details: EmmCreateExceptionsReportDetails;
    }

    /**
     * EMM mobile app usage report created.
     */
    interface EventDetailsEmmCreateUsageReportDetails {
      '.tag': 'emm_create_usage_report_details';
      emm_create_usage_report_details: EmmCreateUsageReportDetails;
    }

    /**
     * Smart Sync non-admin devices report created.
     */
    interface EventDetailsSmartSyncCreateAdminPrivilegeReportDetails {
      '.tag': 'smart_sync_create_admin_privilege_report_details';
      smart_sync_create_admin_privilege_report_details: SmartSyncCreateAdminPrivilegeReportDetails;
    }

    /**
     * Created a team activity report.
     */
    interface EventDetailsTeamActivityCreateReportDetails {
      '.tag': 'team_activity_create_report_details';
      team_activity_create_report_details: TeamActivityCreateReportDetails;
    }

    /**
     * Shared an album.
     */
    interface EventDetailsCollectionShareDetails {
      '.tag': 'collection_share_details';
      collection_share_details: CollectionShareDetails;
    }

    /**
     * Added a file comment.
     */
    interface EventDetailsFileAddCommentDetails {
      '.tag': 'file_add_comment_details';
      file_add_comment_details: FileAddCommentDetails;
    }

    /**
     * Liked a file comment.
     */
    interface EventDetailsFileLikeCommentDetails {
      '.tag': 'file_like_comment_details';
      file_like_comment_details: FileLikeCommentDetails;
    }

    /**
     * Unliked a file comment.
     */
    interface EventDetailsFileUnlikeCommentDetails {
      '.tag': 'file_unlike_comment_details';
      file_unlike_comment_details: FileUnlikeCommentDetails;
    }

    /**
     * Changed a Paper document to be invite-only.
     */
    interface EventDetailsNoteAclInviteOnlyDetails {
      '.tag': 'note_acl_invite_only_details';
      note_acl_invite_only_details: NoteAclInviteOnlyDetails;
    }

    /**
     * Changed a Paper document to be link accessible.
     */
    interface EventDetailsNoteAclLinkDetails {
      '.tag': 'note_acl_link_details';
      note_acl_link_details: NoteAclLinkDetails;
    }

    /**
     * Changed a Paper document to be link accessible for the team.
     */
    interface EventDetailsNoteAclTeamLinkDetails {
      '.tag': 'note_acl_team_link_details';
      note_acl_team_link_details: NoteAclTeamLinkDetails;
    }

    /**
     * Shared a Paper doc.
     */
    interface EventDetailsNoteSharedDetails {
      '.tag': 'note_shared_details';
      note_shared_details: NoteSharedDetails;
    }

    /**
     * Shared Paper document received.
     */
    interface EventDetailsNoteShareReceiveDetails {
      '.tag': 'note_share_receive_details';
      note_share_receive_details: NoteShareReceiveDetails;
    }

    /**
     * Opened a shared Paper doc.
     */
    interface EventDetailsOpenNoteSharedDetails {
      '.tag': 'open_note_shared_details';
      open_note_shared_details: OpenNoteSharedDetails;
    }

    /**
     * Added the team to a shared folder.
     */
    interface EventDetailsSfAddGroupDetails {
      '.tag': 'sf_add_group_details';
      sf_add_group_details: SfAddGroupDetails;
    }

    /**
     * Allowed non collaborators to view links to files in a shared folder.
     */
    interface EventDetailsSfAllowNonMembersToViewSharedLinksDetails {
      '.tag': 'sf_allow_non_members_to_view_shared_links_details';
      sf_allow_non_members_to_view_shared_links_details: SfAllowNonMembersToViewSharedLinksDetails;
    }

    /**
     * Invited a group to a shared folder.
     */
    interface EventDetailsSfInviteGroupDetails {
      '.tag': 'sf_invite_group_details';
      sf_invite_group_details: SfInviteGroupDetails;
    }

    /**
     * Changed parent of shared folder.
     */
    interface EventDetailsSfNestDetails {
      '.tag': 'sf_nest_details';
      sf_nest_details: SfNestDetails;
    }

    /**
     * Declined a team member's invitation to a shared folder.
     */
    interface EventDetailsSfTeamDeclineDetails {
      '.tag': 'sf_team_decline_details';
      sf_team_decline_details: SfTeamDeclineDetails;
    }

    /**
     * Granted access to a shared folder.
     */
    interface EventDetailsSfTeamGrantAccessDetails {
      '.tag': 'sf_team_grant_access_details';
      sf_team_grant_access_details: SfTeamGrantAccessDetails;
    }

    /**
     * Invited team members to a shared folder.
     */
    interface EventDetailsSfTeamInviteDetails {
      '.tag': 'sf_team_invite_details';
      sf_team_invite_details: SfTeamInviteDetails;
    }

    /**
     * Changed a team member's role in a shared folder.
     */
    interface EventDetailsSfTeamInviteChangeRoleDetails {
      '.tag': 'sf_team_invite_change_role_details';
      sf_team_invite_change_role_details: SfTeamInviteChangeRoleDetails;
    }

    /**
     * Joined a team member's shared folder.
     */
    interface EventDetailsSfTeamJoinDetails {
      '.tag': 'sf_team_join_details';
      sf_team_join_details: SfTeamJoinDetails;
    }

    /**
     * Joined a team member's shared folder from a link.
     */
    interface EventDetailsSfTeamJoinFromOobLinkDetails {
      '.tag': 'sf_team_join_from_oob_link_details';
      sf_team_join_from_oob_link_details: SfTeamJoinFromOobLinkDetails;
    }

    /**
     * Unshared a folder with a team member.
     */
    interface EventDetailsSfTeamUninviteDetails {
      '.tag': 'sf_team_uninvite_details';
      sf_team_uninvite_details: SfTeamUninviteDetails;
    }

    /**
     * Sent an email invitation to the membership of a shared file or folder.
     */
    interface EventDetailsSharedContentAddInviteesDetails {
      '.tag': 'shared_content_add_invitees_details';
      shared_content_add_invitees_details: SharedContentAddInviteesDetails;
    }

    /**
     * Added an expiry to the link for the shared file or folder.
     */
    interface EventDetailsSharedContentAddLinkExpiryDetails {
      '.tag': 'shared_content_add_link_expiry_details';
      shared_content_add_link_expiry_details: SharedContentAddLinkExpiryDetails;
    }

    /**
     * Added a password to the link for the shared file or folder.
     */
    interface EventDetailsSharedContentAddLinkPasswordDetails {
      '.tag': 'shared_content_add_link_password_details';
      shared_content_add_link_password_details: SharedContentAddLinkPasswordDetails;
    }

    /**
     * Added users and/or groups to the membership of a shared file or folder.
     */
    interface EventDetailsSharedContentAddMemberDetails {
      '.tag': 'shared_content_add_member_details';
      shared_content_add_member_details: SharedContentAddMemberDetails;
    }

    /**
     * Changed whether members can download the shared file or folder.
     */
    interface EventDetailsSharedContentChangeDownloadsPolicyDetails {
      '.tag': 'shared_content_change_downloads_policy_details';
      shared_content_change_downloads_policy_details: SharedContentChangeDownloadsPolicyDetails;
    }

    /**
     * Changed the access type of an invitee to a shared file or folder before
     * the invitation was claimed.
     */
    interface EventDetailsSharedContentChangeInviteeRoleDetails {
      '.tag': 'shared_content_change_invitee_role_details';
      shared_content_change_invitee_role_details: SharedContentChangeInviteeRoleDetails;
    }

    /**
     * Changed the audience of the link for a shared file or folder.
     */
    interface EventDetailsSharedContentChangeLinkAudienceDetails {
      '.tag': 'shared_content_change_link_audience_details';
      shared_content_change_link_audience_details: SharedContentChangeLinkAudienceDetails;
    }

    /**
     * Changed the expiry of the link for the shared file or folder.
     */
    interface EventDetailsSharedContentChangeLinkExpiryDetails {
      '.tag': 'shared_content_change_link_expiry_details';
      shared_content_change_link_expiry_details: SharedContentChangeLinkExpiryDetails;
    }

    /**
     * Changed the password on the link for the shared file or folder.
     */
    interface EventDetailsSharedContentChangeLinkPasswordDetails {
      '.tag': 'shared_content_change_link_password_details';
      shared_content_change_link_password_details: SharedContentChangeLinkPasswordDetails;
    }

    /**
     * Changed the access type of a shared file or folder member.
     */
    interface EventDetailsSharedContentChangeMemberRoleDetails {
      '.tag': 'shared_content_change_member_role_details';
      shared_content_change_member_role_details: SharedContentChangeMemberRoleDetails;
    }

    /**
     * Changed whether members can see who viewed the shared file or folder.
     */
    interface EventDetailsSharedContentChangeViewerInfoPolicyDetails {
      '.tag': 'shared_content_change_viewer_info_policy_details';
      shared_content_change_viewer_info_policy_details: SharedContentChangeViewerInfoPolicyDetails;
    }

    /**
     * Claimed membership to a team member's shared folder.
     */
    interface EventDetailsSharedContentClaimInvitationDetails {
      '.tag': 'shared_content_claim_invitation_details';
      shared_content_claim_invitation_details: SharedContentClaimInvitationDetails;
    }

    /**
     * Copied the shared file or folder to own Dropbox.
     */
    interface EventDetailsSharedContentCopyDetails {
      '.tag': 'shared_content_copy_details';
      shared_content_copy_details: SharedContentCopyDetails;
    }

    /**
     * Downloaded the shared file or folder.
     */
    interface EventDetailsSharedContentDownloadDetails {
      '.tag': 'shared_content_download_details';
      shared_content_download_details: SharedContentDownloadDetails;
    }

    /**
     * Left the membership of a shared file or folder.
     */
    interface EventDetailsSharedContentRelinquishMembershipDetails {
      '.tag': 'shared_content_relinquish_membership_details';
      shared_content_relinquish_membership_details: SharedContentRelinquishMembershipDetails;
    }

    /**
     * Removed an invitee from the membership of a shared file or folder before
     * it was claimed.
     */
    interface EventDetailsSharedContentRemoveInviteeDetails {
      '.tag': 'shared_content_remove_invitee_details';
      shared_content_remove_invitee_details: SharedContentRemoveInviteeDetails;
    }

    /**
     * Removed the expiry of the link for the shared file or folder.
     */
    interface EventDetailsSharedContentRemoveLinkExpiryDetails {
      '.tag': 'shared_content_remove_link_expiry_details';
      shared_content_remove_link_expiry_details: SharedContentRemoveLinkExpiryDetails;
    }

    /**
     * Removed the password on the link for the shared file or folder.
     */
    interface EventDetailsSharedContentRemoveLinkPasswordDetails {
      '.tag': 'shared_content_remove_link_password_details';
      shared_content_remove_link_password_details: SharedContentRemoveLinkPasswordDetails;
    }

    /**
     * Removed a user or a group from the membership of a shared file or folder.
     */
    interface EventDetailsSharedContentRemoveMemberDetails {
      '.tag': 'shared_content_remove_member_details';
      shared_content_remove_member_details: SharedContentRemoveMemberDetails;
    }

    /**
     * Requested to be on the membership of a shared file or folder.
     */
    interface EventDetailsSharedContentRequestAccessDetails {
      '.tag': 'shared_content_request_access_details';
      shared_content_request_access_details: SharedContentRequestAccessDetails;
    }

    /**
     * Unshared a shared file or folder by clearing its membership and turning
     * off its link.
     */
    interface EventDetailsSharedContentUnshareDetails {
      '.tag': 'shared_content_unshare_details';
      shared_content_unshare_details: SharedContentUnshareDetails;
    }

    /**
     * Previewed the shared file or folder.
     */
    interface EventDetailsSharedContentViewDetails {
      '.tag': 'shared_content_view_details';
      shared_content_view_details: SharedContentViewDetails;
    }

    /**
     * Set or unset the confidential flag on a shared folder.
     */
    interface EventDetailsSharedFolderChangeConfidentialityDetails {
      '.tag': 'shared_folder_change_confidentiality_details';
      shared_folder_change_confidentiality_details: SharedFolderChangeConfidentialityDetails;
    }

    /**
     * Changed who can access the shared folder via a link.
     */
    interface EventDetailsSharedFolderChangeLinkPolicyDetails {
      '.tag': 'shared_folder_change_link_policy_details';
      shared_folder_change_link_policy_details: SharedFolderChangeLinkPolicyDetails;
    }

    /**
     * Changed who can manage the membership of a shared folder.
     */
    interface EventDetailsSharedFolderChangeMemberManagementPolicyDetails {
      '.tag': 'shared_folder_change_member_management_policy_details';
      shared_folder_change_member_management_policy_details: SharedFolderChangeMemberManagementPolicyDetails;
    }

    /**
     * Changed who can become a member of the shared folder.
     */
    interface EventDetailsSharedFolderChangeMemberPolicyDetails {
      '.tag': 'shared_folder_change_member_policy_details';
      shared_folder_change_member_policy_details: SharedFolderChangeMemberPolicyDetails;
    }

    /**
     * Created a shared folder.
     */
    interface EventDetailsSharedFolderCreateDetails {
      '.tag': 'shared_folder_create_details';
      shared_folder_create_details: SharedFolderCreateDetails;
    }

    /**
     * Added a shared folder to own Dropbox.
     */
    interface EventDetailsSharedFolderMountDetails {
      '.tag': 'shared_folder_mount_details';
      shared_folder_mount_details: SharedFolderMountDetails;
    }

    /**
     * Transferred the ownership of a shared folder to another member.
     */
    interface EventDetailsSharedFolderTransferOwnershipDetails {
      '.tag': 'shared_folder_transfer_ownership_details';
      shared_folder_transfer_ownership_details: SharedFolderTransferOwnershipDetails;
    }

    /**
     * Deleted a shared folder from Dropbox.
     */
    interface EventDetailsSharedFolderUnmountDetails {
      '.tag': 'shared_folder_unmount_details';
      shared_folder_unmount_details: SharedFolderUnmountDetails;
    }

    /**
     * Shared Paper document was opened.
     */
    interface EventDetailsSharedNoteOpenedDetails {
      '.tag': 'shared_note_opened_details';
      shared_note_opened_details: SharedNoteOpenedDetails;
    }

    /**
     * Created a link to a file using an app.
     */
    interface EventDetailsShmodelAppCreateDetails {
      '.tag': 'shmodel_app_create_details';
      shmodel_app_create_details: ShmodelAppCreateDetails;
    }

    /**
     * Created a new link.
     */
    interface EventDetailsShmodelCreateDetails {
      '.tag': 'shmodel_create_details';
      shmodel_create_details: ShmodelCreateDetails;
    }

    /**
     * Removed a link.
     */
    interface EventDetailsShmodelDisableDetails {
      '.tag': 'shmodel_disable_details';
      shmodel_disable_details: ShmodelDisableDetails;
    }

    /**
     * Shared a link with Facebook users.
     */
    interface EventDetailsShmodelFbShareDetails {
      '.tag': 'shmodel_fb_share_details';
      shmodel_fb_share_details: ShmodelFbShareDetails;
    }

    /**
     * Shared a link with a group.
     */
    interface EventDetailsShmodelGroupShareDetails {
      '.tag': 'shmodel_group_share_details';
      shmodel_group_share_details: ShmodelGroupShareDetails;
    }

    /**
     * Removed the expiration date from a link.
     */
    interface EventDetailsShmodelRemoveExpirationDetails {
      '.tag': 'shmodel_remove_expiration_details';
      shmodel_remove_expiration_details: ShmodelRemoveExpirationDetails;
    }

    /**
     * Added an expiration date to a link.
     */
    interface EventDetailsShmodelSetExpirationDetails {
      '.tag': 'shmodel_set_expiration_details';
      shmodel_set_expiration_details: ShmodelSetExpirationDetails;
    }

    /**
     * Added a team member's file/folder to their Dropbox from a link.
     */
    interface EventDetailsShmodelTeamCopyDetails {
      '.tag': 'shmodel_team_copy_details';
      shmodel_team_copy_details: ShmodelTeamCopyDetails;
    }

    /**
     * Downloaded a team member's file/folder from a link.
     */
    interface EventDetailsShmodelTeamDownloadDetails {
      '.tag': 'shmodel_team_download_details';
      shmodel_team_download_details: ShmodelTeamDownloadDetails;
    }

    /**
     * Shared a link with team members.
     */
    interface EventDetailsShmodelTeamShareDetails {
      '.tag': 'shmodel_team_share_details';
      shmodel_team_share_details: ShmodelTeamShareDetails;
    }

    /**
     * Opened a team member's link.
     */
    interface EventDetailsShmodelTeamViewDetails {
      '.tag': 'shmodel_team_view_details';
      shmodel_team_view_details: ShmodelTeamViewDetails;
    }

    /**
     * Password-protected a link.
     */
    interface EventDetailsShmodelVisibilityPasswordDetails {
      '.tag': 'shmodel_visibility_password_details';
      shmodel_visibility_password_details: ShmodelVisibilityPasswordDetails;
    }

    /**
     * Made a file/folder visible to anyone with the link.
     */
    interface EventDetailsShmodelVisibilityPublicDetails {
      '.tag': 'shmodel_visibility_public_details';
      shmodel_visibility_public_details: ShmodelVisibilityPublicDetails;
    }

    /**
     * Made a file/folder visible only to team members with the link.
     */
    interface EventDetailsShmodelVisibilityTeamOnlyDetails {
      '.tag': 'shmodel_visibility_team_only_details';
      shmodel_visibility_team_only_details: ShmodelVisibilityTeamOnlyDetails;
    }

    /**
     * Removed single sign-on logout URL.
     */
    interface EventDetailsRemoveLogoutUrlDetails {
      '.tag': 'remove_logout_url_details';
      remove_logout_url_details: RemoveLogoutUrlDetails;
    }

    /**
     * Changed the sign-out URL for SSO.
     */
    interface EventDetailsRemoveSsoUrlDetails {
      '.tag': 'remove_sso_url_details';
      remove_sso_url_details: RemoveSsoUrlDetails;
    }

    /**
     * Changed the X.509 certificate for SSO.
     */
    interface EventDetailsSsoChangeCertDetails {
      '.tag': 'sso_change_cert_details';
      sso_change_cert_details: SsoChangeCertDetails;
    }

    /**
     * Changed the sign-in URL for SSO.
     */
    interface EventDetailsSsoChangeLoginUrlDetails {
      '.tag': 'sso_change_login_url_details';
      sso_change_login_url_details: SsoChangeLoginUrlDetails;
    }

    /**
     * Changed the sign-out URL for SSO.
     */
    interface EventDetailsSsoChangeLogoutUrlDetails {
      '.tag': 'sso_change_logout_url_details';
      sso_change_logout_url_details: SsoChangeLogoutUrlDetails;
    }

    /**
     * Changed the SAML identity mode for SSO.
     */
    interface EventDetailsSsoChangeSamlIdentityModeDetails {
      '.tag': 'sso_change_saml_identity_mode_details';
      sso_change_saml_identity_mode_details: SsoChangeSamlIdentityModeDetails;
    }

    /**
     * Changed the archival status of a team folder.
     */
    interface EventDetailsTeamFolderChangeStatusDetails {
      '.tag': 'team_folder_change_status_details';
      team_folder_change_status_details: TeamFolderChangeStatusDetails;
    }

    /**
     * Created a new team folder in active status.
     */
    interface EventDetailsTeamFolderCreateDetails {
      '.tag': 'team_folder_create_details';
      team_folder_create_details: TeamFolderCreateDetails;
    }

    /**
     * Downgraded a team folder to a regular shared folder.
     */
    interface EventDetailsTeamFolderDowngradeDetails {
      '.tag': 'team_folder_downgrade_details';
      team_folder_downgrade_details: TeamFolderDowngradeDetails;
    }

    /**
     * Permanently deleted an archived team folder.
     */
    interface EventDetailsTeamFolderPermanentlyDeleteDetails {
      '.tag': 'team_folder_permanently_delete_details';
      team_folder_permanently_delete_details: TeamFolderPermanentlyDeleteDetails;
    }

    /**
     * Renamed an active or archived team folder.
     */
    interface EventDetailsTeamFolderRenameDetails {
      '.tag': 'team_folder_rename_details';
      team_folder_rename_details: TeamFolderRenameDetails;
    }

    /**
     * Changed the account capture policy on a domain belonging to the team.
     */
    interface EventDetailsAccountCaptureChangePolicyDetails {
      '.tag': 'account_capture_change_policy_details';
      account_capture_change_policy_details: AccountCaptureChangePolicyDetails;
    }

    /**
     * Disabled allow downloads.
     */
    interface EventDetailsAllowDownloadDisabledDetails {
      '.tag': 'allow_download_disabled_details';
      allow_download_disabled_details: AllowDownloadDisabledDetails;
    }

    /**
     * Enabled allow downloads.
     */
    interface EventDetailsAllowDownloadEnabledDetails {
      '.tag': 'allow_download_enabled_details';
      allow_download_enabled_details: AllowDownloadEnabledDetails;
    }

    /**
     * Set a restriction policy regarding the location of data centers where
     * team data resides.
     */
    interface EventDetailsDataPlacementRestrictionChangePolicyDetails {
      '.tag': 'data_placement_restriction_change_policy_details';
      data_placement_restriction_change_policy_details: DataPlacementRestrictionChangePolicyDetails;
    }

    /**
     * Satisfied a previously set restriction policy regarding the location of
     * data centers where team data resides (i.e. all data have been migrated
     * according to the restriction placed).
     */
    interface EventDetailsDataPlacementRestrictionSatisfyPolicyDetails {
      '.tag': 'data_placement_restriction_satisfy_policy_details';
      data_placement_restriction_satisfy_policy_details: DataPlacementRestrictionSatisfyPolicyDetails;
    }

    /**
     * Set or removed a limit on the number of computers each team member can
     * link to their work Dropbox account.
     */
    interface EventDetailsDeviceApprovalsChangeDesktopPolicyDetails {
      '.tag': 'device_approvals_change_desktop_policy_details';
      device_approvals_change_desktop_policy_details: DeviceApprovalsChangeDesktopPolicyDetails;
    }

    /**
     * Set or removed a limit on the number of mobiles devices each team member
     * can link to their work Dropbox account.
     */
    interface EventDetailsDeviceApprovalsChangeMobilePolicyDetails {
      '.tag': 'device_approvals_change_mobile_policy_details';
      device_approvals_change_mobile_policy_details: DeviceApprovalsChangeMobilePolicyDetails;
    }

    /**
     * Changed the action taken when a team member is already over the limits
     * (e.g when they join the team, an admin lowers limits, etc.).
     */
    interface EventDetailsDeviceApprovalsChangeOverageActionDetails {
      '.tag': 'device_approvals_change_overage_action_details';
      device_approvals_change_overage_action_details: DeviceApprovalsChangeOverageActionDetails;
    }

    /**
     * Changed the action taken with respect to approval limits when a team
     * member unlinks an approved device.
     */
    interface EventDetailsDeviceApprovalsChangeUnlinkActionDetails {
      '.tag': 'device_approvals_change_unlink_action_details';
      device_approvals_change_unlink_action_details: DeviceApprovalsChangeUnlinkActionDetails;
    }

    /**
     * Added an exception for one or more team members to optionally use the
     * regular Dropbox app when EMM is enabled.
     */
    interface EventDetailsEmmAddExceptionDetails {
      '.tag': 'emm_add_exception_details';
      emm_add_exception_details: EmmAddExceptionDetails;
    }

    /**
     * Enabled or disabled enterprise mobility management for team members.
     */
    interface EventDetailsEmmChangePolicyDetails {
      '.tag': 'emm_change_policy_details';
      emm_change_policy_details: EmmChangePolicyDetails;
    }

    /**
     * Removed an exception for one or more team members to optionally use the
     * regular Dropbox app when EMM is enabled.
     */
    interface EventDetailsEmmRemoveExceptionDetails {
      '.tag': 'emm_remove_exception_details';
      emm_remove_exception_details: EmmRemoveExceptionDetails;
    }

    /**
     * Accepted or opted out of extended version history.
     */
    interface EventDetailsExtendedVersionHistoryChangePolicyDetails {
      '.tag': 'extended_version_history_change_policy_details';
      extended_version_history_change_policy_details: ExtendedVersionHistoryChangePolicyDetails;
    }

    /**
     * Enabled or disabled commenting on team files.
     */
    interface EventDetailsFileCommentsChangePolicyDetails {
      '.tag': 'file_comments_change_policy_details';
      file_comments_change_policy_details: FileCommentsChangePolicyDetails;
    }

    /**
     * Enabled or disabled file requests.
     */
    interface EventDetailsFileRequestsChangePolicyDetails {
      '.tag': 'file_requests_change_policy_details';
      file_requests_change_policy_details: FileRequestsChangePolicyDetails;
    }

    /**
     * Enabled file request emails for everyone.
     */
    interface EventDetailsFileRequestsEmailsEnabledDetails {
      '.tag': 'file_requests_emails_enabled_details';
      file_requests_emails_enabled_details: FileRequestsEmailsEnabledDetails;
    }

    /**
     * Allowed file request emails for the team.
     */
    interface EventDetailsFileRequestsEmailsRestrictedToTeamOnlyDetails {
      '.tag': 'file_requests_emails_restricted_to_team_only_details';
      file_requests_emails_restricted_to_team_only_details: FileRequestsEmailsRestrictedToTeamOnlyDetails;
    }

    /**
     * Enabled or disabled Google single sign-on for the team.
     */
    interface EventDetailsGoogleSsoChangePolicyDetails {
      '.tag': 'google_sso_change_policy_details';
      google_sso_change_policy_details: GoogleSsoChangePolicyDetails;
    }

    /**
     * Changed who can create groups.
     */
    interface EventDetailsGroupUserManagementChangePolicyDetails {
      '.tag': 'group_user_management_change_policy_details';
      group_user_management_change_policy_details: GroupUserManagementChangePolicyDetails;
    }

    /**
     * Changed whether users can find the team when not invited.
     */
    interface EventDetailsMemberRequestsChangePolicyDetails {
      '.tag': 'member_requests_change_policy_details';
      member_requests_change_policy_details: MemberRequestsChangePolicyDetails;
    }

    /**
     * Added an exception for one or more team members to bypass space limits
     * imposed by policy.
     */
    interface EventDetailsMemberSpaceLimitsAddExceptionDetails {
      '.tag': 'member_space_limits_add_exception_details';
      member_space_limits_add_exception_details: MemberSpaceLimitsAddExceptionDetails;
    }

    /**
     * Changed the storage limits applied to team members by policy.
     */
    interface EventDetailsMemberSpaceLimitsChangePolicyDetails {
      '.tag': 'member_space_limits_change_policy_details';
      member_space_limits_change_policy_details: MemberSpaceLimitsChangePolicyDetails;
    }

    /**
     * Removed an exception for one or more team members to bypass space limits
     * imposed by policy.
     */
    interface EventDetailsMemberSpaceLimitsRemoveExceptionDetails {
      '.tag': 'member_space_limits_remove_exception_details';
      member_space_limits_remove_exception_details: MemberSpaceLimitsRemoveExceptionDetails;
    }

    /**
     * Enabled or disabled the option for team members to suggest new members to
     * add to the team.
     */
    interface EventDetailsMemberSuggestionsChangePolicyDetails {
      '.tag': 'member_suggestions_change_policy_details';
      member_suggestions_change_policy_details: MemberSuggestionsChangePolicyDetails;
    }

    /**
     * Enabled or disabled the Microsoft Office add-in, which lets team members
     * save files to Dropbox directly from Microsoft Office.
     */
    interface EventDetailsMicrosoftOfficeAddinChangePolicyDetails {
      '.tag': 'microsoft_office_addin_change_policy_details';
      microsoft_office_addin_change_policy_details: MicrosoftOfficeAddinChangePolicyDetails;
    }

    /**
     * Enabled or disabled network control.
     */
    interface EventDetailsNetworkControlChangePolicyDetails {
      '.tag': 'network_control_change_policy_details';
      network_control_change_policy_details: NetworkControlChangePolicyDetails;
    }

    /**
     * Changed whether Dropbox Paper, when enabled, is deployed to all teams or
     * to specific members of the team.
     */
    interface EventDetailsPaperChangeDeploymentPolicyDetails {
      '.tag': 'paper_change_deployment_policy_details';
      paper_change_deployment_policy_details: PaperChangeDeploymentPolicyDetails;
    }

    /**
     * Changed whether team members can share Paper documents externally (i.e.
     * outside the team), and if so, whether they should be accessible only by
     * team members or anyone by default.
     */
    interface EventDetailsPaperChangeMemberPolicyDetails {
      '.tag': 'paper_change_member_policy_details';
      paper_change_member_policy_details: PaperChangeMemberPolicyDetails;
    }

    /**
     * Enabled or disabled Dropbox Paper for the team.
     */
    interface EventDetailsPaperChangePolicyDetails {
      '.tag': 'paper_change_policy_details';
      paper_change_policy_details: PaperChangePolicyDetails;
    }

    /**
     * Enabled or disabled the ability of team members to permanently delete
     * content.
     */
    interface EventDetailsPermanentDeleteChangePolicyDetails {
      '.tag': 'permanent_delete_change_policy_details';
      permanent_delete_change_policy_details: PermanentDeleteChangePolicyDetails;
    }

    /**
     * Changed whether team members can join shared folders owned externally
     * (i.e. outside the team).
     */
    interface EventDetailsSharingChangeFolderJoinPolicyDetails {
      '.tag': 'sharing_change_folder_join_policy_details';
      sharing_change_folder_join_policy_details: SharingChangeFolderJoinPolicyDetails;
    }

    /**
     * Changed whether team members can share links externally (i.e. outside the
     * team), and if so, whether links should be accessible only by team members
     * or anyone by default.
     */
    interface EventDetailsSharingChangeLinkPolicyDetails {
      '.tag': 'sharing_change_link_policy_details';
      sharing_change_link_policy_details: SharingChangeLinkPolicyDetails;
    }

    /**
     * Changed whether team members can share files and folders externally (i.e.
     * outside the team).
     */
    interface EventDetailsSharingChangeMemberPolicyDetails {
      '.tag': 'sharing_change_member_policy_details';
      sharing_change_member_policy_details: SharingChangeMemberPolicyDetails;
    }

    /**
     * Changed the default Smart Sync policy for team members.
     */
    interface EventDetailsSmartSyncChangePolicyDetails {
      '.tag': 'smart_sync_change_policy_details';
      smart_sync_change_policy_details: SmartSyncChangePolicyDetails;
    }

    /**
     * Opted team into Smart Sync.
     */
    interface EventDetailsSmartSyncNotOptOutDetails {
      '.tag': 'smart_sync_not_opt_out_details';
      smart_sync_not_opt_out_details: SmartSyncNotOptOutDetails;
    }

    /**
     * Opted team out of Smart Sync.
     */
    interface EventDetailsSmartSyncOptOutDetails {
      '.tag': 'smart_sync_opt_out_details';
      smart_sync_opt_out_details: SmartSyncOptOutDetails;
    }

    /**
     * Change the single sign-on policy for the team.
     */
    interface EventDetailsSsoChangePolicyDetails {
      '.tag': 'sso_change_policy_details';
      sso_change_policy_details: SsoChangePolicyDetails;
    }

    /**
     * Change two-step verification policy for the team.
     */
    interface EventDetailsTfaChangePolicyDetails {
      '.tag': 'tfa_change_policy_details';
      tfa_change_policy_details: TfaChangePolicyDetails;
    }

    /**
     * Enabled or disabled the option for team members to link a personal
     * Dropbox account in addition to their work account to the same computer.
     */
    interface EventDetailsTwoAccountChangePolicyDetails {
      '.tag': 'two_account_change_policy_details';
      two_account_change_policy_details: TwoAccountChangePolicyDetails;
    }

    /**
     * Changed how long team members can stay signed in to Dropbox on the web.
     */
    interface EventDetailsWebSessionsChangeFixedLengthPolicyDetails {
      '.tag': 'web_sessions_change_fixed_length_policy_details';
      web_sessions_change_fixed_length_policy_details: WebSessionsChangeFixedLengthPolicyDetails;
    }

    /**
     * Changed how long team members can be idle while signed in to Dropbox on
     * the web.
     */
    interface EventDetailsWebSessionsChangeIdleLengthPolicyDetails {
      '.tag': 'web_sessions_change_idle_length_policy_details';
      web_sessions_change_idle_length_policy_details: WebSessionsChangeIdleLengthPolicyDetails;
    }

    /**
     * Added a team logo to be displayed on shared link headers.
     */
    interface EventDetailsTeamProfileAddLogoDetails {
      '.tag': 'team_profile_add_logo_details';
      team_profile_add_logo_details: TeamProfileAddLogoDetails;
    }

    /**
     * Changed the team logo to be displayed on shared link headers.
     */
    interface EventDetailsTeamProfileChangeLogoDetails {
      '.tag': 'team_profile_change_logo_details';
      team_profile_change_logo_details: TeamProfileChangeLogoDetails;
    }

    /**
     * Changed the team name.
     */
    interface EventDetailsTeamProfileChangeNameDetails {
      '.tag': 'team_profile_change_name_details';
      team_profile_change_name_details: TeamProfileChangeNameDetails;
    }

    /**
     * Removed the team logo to be displayed on shared link headers.
     */
    interface EventDetailsTeamProfileRemoveLogoDetails {
      '.tag': 'team_profile_remove_logo_details';
      team_profile_remove_logo_details: TeamProfileRemoveLogoDetails;
    }

    /**
     * Added a backup phone for two-step verification.
     */
    interface EventDetailsTfaAddBackupPhoneDetails {
      '.tag': 'tfa_add_backup_phone_details';
      tfa_add_backup_phone_details: TfaAddBackupPhoneDetails;
    }

    /**
     * Added a security key for two-step verification.
     */
    interface EventDetailsTfaAddSecurityKeyDetails {
      '.tag': 'tfa_add_security_key_details';
      tfa_add_security_key_details: TfaAddSecurityKeyDetails;
    }

    /**
     * Changed the backup phone for two-step verification.
     */
    interface EventDetailsTfaChangeBackupPhoneDetails {
      '.tag': 'tfa_change_backup_phone_details';
      tfa_change_backup_phone_details: TfaChangeBackupPhoneDetails;
    }

    /**
     * Enabled, disabled or changed the configuration for two-step verification.
     */
    interface EventDetailsTfaChangeStatusDetails {
      '.tag': 'tfa_change_status_details';
      tfa_change_status_details: TfaChangeStatusDetails;
    }

    /**
     * Removed the backup phone for two-step verification.
     */
    interface EventDetailsTfaRemoveBackupPhoneDetails {
      '.tag': 'tfa_remove_backup_phone_details';
      tfa_remove_backup_phone_details: TfaRemoveBackupPhoneDetails;
    }

    /**
     * Removed a security key for two-step verification.
     */
    interface EventDetailsTfaRemoveSecurityKeyDetails {
      '.tag': 'tfa_remove_security_key_details';
      tfa_remove_security_key_details: TfaRemoveSecurityKeyDetails;
    }

    /**
     * Reset two-step verification for team member.
     */
    interface EventDetailsTfaResetDetails {
      '.tag': 'tfa_reset_details';
      tfa_reset_details: TfaResetDetails;
    }

    /**
     * Hints that this event was returned with missing details due to an
     * internal error.
     */
    interface EventDetailsMissingDetails {
      '.tag': 'missing_details';
      missing_details: MissingDetails;
    }

    interface EventDetailsOther {
      '.tag': 'other';
    }

    /**
     * Additional fields depending on the event type.
     */
    type EventDetails = EventDetailsMemberChangeMembershipTypeDetails | EventDetailsMemberPermanentlyDeleteAccountContentsDetails | EventDetailsMemberSpaceLimitsChangeStatusDetails | EventDetailsMemberTransferAccountContentsDetails | EventDetailsPaperEnabledUsersGroupAdditionDetails | EventDetailsPaperEnabledUsersGroupRemovalDetails | EventDetailsPaperExternalViewAllowDetails | EventDetailsPaperExternalViewDefaultTeamDetails | EventDetailsPaperExternalViewForbidDetails | EventDetailsSfExternalInviteWarnDetails | EventDetailsTeamMergeFromDetails | EventDetailsTeamMergeToDetails | EventDetailsAppLinkTeamDetails | EventDetailsAppLinkUserDetails | EventDetailsAppUnlinkTeamDetails | EventDetailsAppUnlinkUserDetails | EventDetailsDeviceChangeIpDesktopDetails | EventDetailsDeviceChangeIpMobileDetails | EventDetailsDeviceChangeIpWebDetails | EventDetailsDeviceDeleteOnUnlinkFailDetails | EventDetailsDeviceDeleteOnUnlinkSuccessDetails | EventDetailsDeviceLinkFailDetails | EventDetailsDeviceLinkSuccessDetails | EventDetailsDeviceManagementDisabledDetails | EventDetailsDeviceManagementEnabledDetails | EventDetailsDeviceUnlinkDetails | EventDetailsEmmRefreshAuthTokenDetails | EventDetailsAccountCaptureChangeAvailabilityDetails | EventDetailsAccountCaptureMigrateAccountDetails | EventDetailsAccountCaptureRelinquishAccountDetails | EventDetailsDisabledDomainInvitesDetails | EventDetailsDomainInvitesApproveRequestToJoinTeamDetails | EventDetailsDomainInvitesDeclineRequestToJoinTeamDetails | EventDetailsDomainInvitesEmailExistingUsersDetails | EventDetailsDomainInvitesRequestToJoinTeamDetails | EventDetailsDomainInvitesSetInviteNewUserPrefToNoDetails | EventDetailsDomainInvitesSetInviteNewUserPrefToYesDetails | EventDetailsDomainVerificationAddDomainFailDetails | EventDetailsDomainVerificationAddDomainSuccessDetails | EventDetailsDomainVerificationRemoveDomainDetails | EventDetailsEnabledDomainInvitesDetails | EventDetailsCreateFolderDetails | EventDetailsFileAddDetails | EventDetailsFileCopyDetails | EventDetailsFileDeleteDetails | EventDetailsFileDownloadDetails | EventDetailsFileEditDetails | EventDetailsFileGetCopyReferenceDetails | EventDetailsFileMoveDetails | EventDetailsFilePermanentlyDeleteDetails | EventDetailsFilePreviewDetails | EventDetailsFileRenameDetails | EventDetailsFileRestoreDetails | EventDetailsFileRevertDetails | EventDetailsFileRollbackChangesDetails | EventDetailsFileSaveCopyReferenceDetails | EventDetailsFileRequestAddDeadlineDetails | EventDetailsFileRequestChangeFolderDetails | EventDetailsFileRequestChangeTitleDetails | EventDetailsFileRequestCloseDetails | EventDetailsFileRequestCreateDetails | EventDetailsFileRequestReceiveFileDetails | EventDetailsFileRequestRemoveDeadlineDetails | EventDetailsFileRequestSendDetails | EventDetailsGroupAddExternalIdDetails | EventDetailsGroupAddMemberDetails | EventDetailsGroupChangeExternalIdDetails | EventDetailsGroupChangeManagementTypeDetails | EventDetailsGroupChangeMemberRoleDetails | EventDetailsGroupCreateDetails | EventDetailsGroupDeleteDetails | EventDetailsGroupDescriptionUpdatedDetails | EventDetailsGroupJoinPolicyUpdatedDetails | EventDetailsGroupMovedDetails | EventDetailsGroupRemoveExternalIdDetails | EventDetailsGroupRemoveMemberDetails | EventDetailsGroupRenameDetails | EventDetailsEmmLoginSuccessDetails | EventDetailsLogoutDetails | EventDetailsPasswordLoginFailDetails | EventDetailsPasswordLoginSuccessDetails | EventDetailsResellerSupportSessionEndDetails | EventDetailsResellerSupportSessionStartDetails | EventDetailsSignInAsSessionEndDetails | EventDetailsSignInAsSessionStartDetails | EventDetailsSsoLoginFailDetails | EventDetailsMemberAddNameDetails | EventDetailsMemberChangeAdminRoleDetails | EventDetailsMemberChangeEmailDetails | EventDetailsMemberChangeNameDetails | EventDetailsMemberChangeStatusDetails | EventDetailsMemberSuggestDetails | EventDetailsPaperContentAddMemberDetails | EventDetailsPaperContentAddToFolderDetails | EventDetailsPaperContentArchiveDetails | EventDetailsPaperContentChangeSubscriptionDetails | EventDetailsPaperContentCreateDetails | EventDetailsPaperContentPermanentlyDeleteDetails | EventDetailsPaperContentRemoveFromFolderDetails | EventDetailsPaperContentRemoveMemberDetails | EventDetailsPaperContentRenameDetails | EventDetailsPaperContentRestoreDetails | EventDetailsPaperDocAddCommentDetails | EventDetailsPaperDocChangeMemberRoleDetails | EventDetailsPaperDocChangeSharingPolicyDetails | EventDetailsPaperDocDeletedDetails | EventDetailsPaperDocDeleteCommentDetails | EventDetailsPaperDocDownloadDetails | EventDetailsPaperDocEditDetails | EventDetailsPaperDocEditCommentDetails | EventDetailsPaperDocFollowedDetails | EventDetailsPaperDocMentionDetails | EventDetailsPaperDocRequestAccessDetails | EventDetailsPaperDocResolveCommentDetails | EventDetailsPaperDocRevertDetails | EventDetailsPaperDocSlackShareDetails | EventDetailsPaperDocTeamInviteDetails | EventDetailsPaperDocUnresolveCommentDetails | EventDetailsPaperDocViewDetails | EventDetailsPaperFolderDeletedDetails | EventDetailsPaperFolderFollowedDetails | EventDetailsPaperFolderTeamInviteDetails | EventDetailsPasswordChangeDetails | EventDetailsPasswordResetDetails | EventDetailsPasswordResetAllDetails | EventDetailsEmmCreateExceptionsReportDetails | EventDetailsEmmCreateUsageReportDetails | EventDetailsSmartSyncCreateAdminPrivilegeReportDetails | EventDetailsTeamActivityCreateReportDetails | EventDetailsCollectionShareDetails | EventDetailsFileAddCommentDetails | EventDetailsFileLikeCommentDetails | EventDetailsFileUnlikeCommentDetails | EventDetailsNoteAclInviteOnlyDetails | EventDetailsNoteAclLinkDetails | EventDetailsNoteAclTeamLinkDetails | EventDetailsNoteSharedDetails | EventDetailsNoteShareReceiveDetails | EventDetailsOpenNoteSharedDetails | EventDetailsSfAddGroupDetails | EventDetailsSfAllowNonMembersToViewSharedLinksDetails | EventDetailsSfInviteGroupDetails | EventDetailsSfNestDetails | EventDetailsSfTeamDeclineDetails | EventDetailsSfTeamGrantAccessDetails | EventDetailsSfTeamInviteDetails | EventDetailsSfTeamInviteChangeRoleDetails | EventDetailsSfTeamJoinDetails | EventDetailsSfTeamJoinFromOobLinkDetails | EventDetailsSfTeamUninviteDetails | EventDetailsSharedContentAddInviteesDetails | EventDetailsSharedContentAddLinkExpiryDetails | EventDetailsSharedContentAddLinkPasswordDetails | EventDetailsSharedContentAddMemberDetails | EventDetailsSharedContentChangeDownloadsPolicyDetails | EventDetailsSharedContentChangeInviteeRoleDetails | EventDetailsSharedContentChangeLinkAudienceDetails | EventDetailsSharedContentChangeLinkExpiryDetails | EventDetailsSharedContentChangeLinkPasswordDetails | EventDetailsSharedContentChangeMemberRoleDetails | EventDetailsSharedContentChangeViewerInfoPolicyDetails | EventDetailsSharedContentClaimInvitationDetails | EventDetailsSharedContentCopyDetails | EventDetailsSharedContentDownloadDetails | EventDetailsSharedContentRelinquishMembershipDetails | EventDetailsSharedContentRemoveInviteeDetails | EventDetailsSharedContentRemoveLinkExpiryDetails | EventDetailsSharedContentRemoveLinkPasswordDetails | EventDetailsSharedContentRemoveMemberDetails | EventDetailsSharedContentRequestAccessDetails | EventDetailsSharedContentUnshareDetails | EventDetailsSharedContentViewDetails | EventDetailsSharedFolderChangeConfidentialityDetails | EventDetailsSharedFolderChangeLinkPolicyDetails | EventDetailsSharedFolderChangeMemberManagementPolicyDetails | EventDetailsSharedFolderChangeMemberPolicyDetails | EventDetailsSharedFolderCreateDetails | EventDetailsSharedFolderMountDetails | EventDetailsSharedFolderTransferOwnershipDetails | EventDetailsSharedFolderUnmountDetails | EventDetailsSharedNoteOpenedDetails | EventDetailsShmodelAppCreateDetails | EventDetailsShmodelCreateDetails | EventDetailsShmodelDisableDetails | EventDetailsShmodelFbShareDetails | EventDetailsShmodelGroupShareDetails | EventDetailsShmodelRemoveExpirationDetails | EventDetailsShmodelSetExpirationDetails | EventDetailsShmodelTeamCopyDetails | EventDetailsShmodelTeamDownloadDetails | EventDetailsShmodelTeamShareDetails | EventDetailsShmodelTeamViewDetails | EventDetailsShmodelVisibilityPasswordDetails | EventDetailsShmodelVisibilityPublicDetails | EventDetailsShmodelVisibilityTeamOnlyDetails | EventDetailsRemoveLogoutUrlDetails | EventDetailsRemoveSsoUrlDetails | EventDetailsSsoChangeCertDetails | EventDetailsSsoChangeLoginUrlDetails | EventDetailsSsoChangeLogoutUrlDetails | EventDetailsSsoChangeSamlIdentityModeDetails | EventDetailsTeamFolderChangeStatusDetails | EventDetailsTeamFolderCreateDetails | EventDetailsTeamFolderDowngradeDetails | EventDetailsTeamFolderPermanentlyDeleteDetails | EventDetailsTeamFolderRenameDetails | EventDetailsAccountCaptureChangePolicyDetails | EventDetailsAllowDownloadDisabledDetails | EventDetailsAllowDownloadEnabledDetails | EventDetailsDataPlacementRestrictionChangePolicyDetails | EventDetailsDataPlacementRestrictionSatisfyPolicyDetails | EventDetailsDeviceApprovalsChangeDesktopPolicyDetails | EventDetailsDeviceApprovalsChangeMobilePolicyDetails | EventDetailsDeviceApprovalsChangeOverageActionDetails | EventDetailsDeviceApprovalsChangeUnlinkActionDetails | EventDetailsEmmAddExceptionDetails | EventDetailsEmmChangePolicyDetails | EventDetailsEmmRemoveExceptionDetails | EventDetailsExtendedVersionHistoryChangePolicyDetails | EventDetailsFileCommentsChangePolicyDetails | EventDetailsFileRequestsChangePolicyDetails | EventDetailsFileRequestsEmailsEnabledDetails | EventDetailsFileRequestsEmailsRestrictedToTeamOnlyDetails | EventDetailsGoogleSsoChangePolicyDetails | EventDetailsGroupUserManagementChangePolicyDetails | EventDetailsMemberRequestsChangePolicyDetails | EventDetailsMemberSpaceLimitsAddExceptionDetails | EventDetailsMemberSpaceLimitsChangePolicyDetails | EventDetailsMemberSpaceLimitsRemoveExceptionDetails | EventDetailsMemberSuggestionsChangePolicyDetails | EventDetailsMicrosoftOfficeAddinChangePolicyDetails | EventDetailsNetworkControlChangePolicyDetails | EventDetailsPaperChangeDeploymentPolicyDetails | EventDetailsPaperChangeMemberPolicyDetails | EventDetailsPaperChangePolicyDetails | EventDetailsPermanentDeleteChangePolicyDetails | EventDetailsSharingChangeFolderJoinPolicyDetails | EventDetailsSharingChangeLinkPolicyDetails | EventDetailsSharingChangeMemberPolicyDetails | EventDetailsSmartSyncChangePolicyDetails | EventDetailsSmartSyncNotOptOutDetails | EventDetailsSmartSyncOptOutDetails | EventDetailsSsoChangePolicyDetails | EventDetailsTfaChangePolicyDetails | EventDetailsTwoAccountChangePolicyDetails | EventDetailsWebSessionsChangeFixedLengthPolicyDetails | EventDetailsWebSessionsChangeIdleLengthPolicyDetails | EventDetailsTeamProfileAddLogoDetails | EventDetailsTeamProfileChangeLogoDetails | EventDetailsTeamProfileChangeNameDetails | EventDetailsTeamProfileRemoveLogoDetails | EventDetailsTfaAddBackupPhoneDetails | EventDetailsTfaAddSecurityKeyDetails | EventDetailsTfaChangeBackupPhoneDetails | EventDetailsTfaChangeStatusDetails | EventDetailsTfaRemoveBackupPhoneDetails | EventDetailsTfaRemoveSecurityKeyDetails | EventDetailsTfaResetDetails | EventDetailsMissingDetails | EventDetailsOther;

    /**
     * Changed the membership type (limited vs full) for team member.
     */
    interface EventTypeMemberChangeMembershipType {
      '.tag': 'member_change_membership_type';
    }

    /**
     * Permanently deleted contents of a removed team member account.
     */
    interface EventTypeMemberPermanentlyDeleteAccountContents {
      '.tag': 'member_permanently_delete_account_contents';
    }

    /**
     * Changed the status with respect to whether the team member is under or
     * over storage quota specified by policy.
     */
    interface EventTypeMemberSpaceLimitsChangeStatus {
      '.tag': 'member_space_limits_change_status';
    }

    /**
     * Transferred contents of a removed team member account to another member.
     */
    interface EventTypeMemberTransferAccountContents {
      '.tag': 'member_transfer_account_contents';
    }

    /**
     * Users added to Paper enabled users list.
     */
    interface EventTypePaperEnabledUsersGroupAddition {
      '.tag': 'paper_enabled_users_group_addition';
    }

    /**
     * Users removed from Paper enabled users list.
     */
    interface EventTypePaperEnabledUsersGroupRemoval {
      '.tag': 'paper_enabled_users_group_removal';
    }

    /**
     * Paper external sharing policy changed: anyone. This event is deprecated
     * and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypePaperExternalViewAllow {
      '.tag': 'paper_external_view_allow';
    }

    /**
     * Paper external sharing policy changed: default team. This event is
     * deprecated and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypePaperExternalViewDefaultTeam {
      '.tag': 'paper_external_view_default_team';
    }

    /**
     * Paper external sharing policy changed: team-only. This event is
     * deprecated and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypePaperExternalViewForbid {
      '.tag': 'paper_external_view_forbid';
    }

    /**
     * Admin settings: team members see a warning before sharing folders outside
     * the team (DEPRECATED FEATURE). This event is deprecated and will not be
     * logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeSfExternalInviteWarn {
      '.tag': 'sf_external_invite_warn';
    }

    /**
     * Merged another team into this team.
     */
    interface EventTypeTeamMergeFrom {
      '.tag': 'team_merge_from';
    }

    /**
     * Merged this team into another team.
     */
    interface EventTypeTeamMergeTo {
      '.tag': 'team_merge_to';
    }

    /**
     * Linked an app for team.
     */
    interface EventTypeAppLinkTeam {
      '.tag': 'app_link_team';
    }

    /**
     * Linked an app for team member.
     */
    interface EventTypeAppLinkUser {
      '.tag': 'app_link_user';
    }

    /**
     * Unlinked an app for team.
     */
    interface EventTypeAppUnlinkTeam {
      '.tag': 'app_unlink_team';
    }

    /**
     * Unlinked an app for team member.
     */
    interface EventTypeAppUnlinkUser {
      '.tag': 'app_unlink_user';
    }

    /**
     * IP address associated with active desktop session changed.
     */
    interface EventTypeDeviceChangeIpDesktop {
      '.tag': 'device_change_ip_desktop';
    }

    /**
     * IP address associated with active mobile session changed.
     */
    interface EventTypeDeviceChangeIpMobile {
      '.tag': 'device_change_ip_mobile';
    }

    /**
     * IP address associated with active Web session changed.
     */
    interface EventTypeDeviceChangeIpWeb {
      '.tag': 'device_change_ip_web';
    }

    /**
     * Failed to delete all files from an unlinked device.
     */
    interface EventTypeDeviceDeleteOnUnlinkFail {
      '.tag': 'device_delete_on_unlink_fail';
    }

    /**
     * Deleted all files from an unlinked device.
     */
    interface EventTypeDeviceDeleteOnUnlinkSuccess {
      '.tag': 'device_delete_on_unlink_success';
    }

    /**
     * Failed to link a device.
     */
    interface EventTypeDeviceLinkFail {
      '.tag': 'device_link_fail';
    }

    /**
     * Linked a device.
     */
    interface EventTypeDeviceLinkSuccess {
      '.tag': 'device_link_success';
    }

    /**
     * Disable Device Management. This event is deprecated and will not be
     * logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeDeviceManagementDisabled {
      '.tag': 'device_management_disabled';
    }

    /**
     * Enable Device Management. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeDeviceManagementEnabled {
      '.tag': 'device_management_enabled';
    }

    /**
     * Disconnected a device.
     */
    interface EventTypeDeviceUnlink {
      '.tag': 'device_unlink';
    }

    /**
     * Refreshed the auth token used for setting up enterprise mobility
     * management.
     */
    interface EventTypeEmmRefreshAuthToken {
      '.tag': 'emm_refresh_auth_token';
    }

    /**
     * Granted or revoked the option to enable account capture on domains
     * belonging to the team.
     */
    interface EventTypeAccountCaptureChangeAvailability {
      '.tag': 'account_capture_change_availability';
    }

    /**
     * Account captured user migrated their account to the team.
     */
    interface EventTypeAccountCaptureMigrateAccount {
      '.tag': 'account_capture_migrate_account';
    }

    /**
     * Account captured user relinquished their account by changing the email
     * address associated with it.
     */
    interface EventTypeAccountCaptureRelinquishAccount {
      '.tag': 'account_capture_relinquish_account';
    }

    /**
     * Disabled domain invites. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeDisabledDomainInvites {
      '.tag': 'disabled_domain_invites';
    }

    /**
     * Approved a member's request to join the team.
     */
    interface EventTypeDomainInvitesApproveRequestToJoinTeam {
      '.tag': 'domain_invites_approve_request_to_join_team';
    }

    /**
     * Declined a user's request to join the team.
     */
    interface EventTypeDomainInvitesDeclineRequestToJoinTeam {
      '.tag': 'domain_invites_decline_request_to_join_team';
    }

    /**
     * Sent domain invites to existing domain accounts.
     */
    interface EventTypeDomainInvitesEmailExistingUsers {
      '.tag': 'domain_invites_email_existing_users';
    }

    /**
     * Asked to join the team.
     */
    interface EventTypeDomainInvitesRequestToJoinTeam {
      '.tag': 'domain_invites_request_to_join_team';
    }

    /**
     * Turned off u201cAutomatically invite new usersu201d. This event is
     * deprecated and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypeDomainInvitesSetInviteNewUserPrefToNo {
      '.tag': 'domain_invites_set_invite_new_user_pref_to_no';
    }

    /**
     * Turned on u201cAutomatically invite new usersu201d. This event is
     * deprecated and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypeDomainInvitesSetInviteNewUserPrefToYes {
      '.tag': 'domain_invites_set_invite_new_user_pref_to_yes';
    }

    /**
     * Failed to verify a domain belonging to the team.
     */
    interface EventTypeDomainVerificationAddDomainFail {
      '.tag': 'domain_verification_add_domain_fail';
    }

    /**
     * Verified a domain belonging to the team.
     */
    interface EventTypeDomainVerificationAddDomainSuccess {
      '.tag': 'domain_verification_add_domain_success';
    }

    /**
     * Removed a domain from the list of verified domains belonging to the team.
     */
    interface EventTypeDomainVerificationRemoveDomain {
      '.tag': 'domain_verification_remove_domain';
    }

    /**
     * Enabled domain invites. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeEnabledDomainInvites {
      '.tag': 'enabled_domain_invites';
    }

    /**
     * Created folders. This event is deprecated and will not be logged going
     * forward as the associated product functionality no longer exists.
     */
    interface EventTypeCreateFolder {
      '.tag': 'create_folder';
    }

    /**
     * Added files and/or folders.
     */
    interface EventTypeFileAdd {
      '.tag': 'file_add';
    }

    /**
     * Copied files and/or folders.
     */
    interface EventTypeFileCopy {
      '.tag': 'file_copy';
    }

    /**
     * Deleted files and/or folders.
     */
    interface EventTypeFileDelete {
      '.tag': 'file_delete';
    }

    /**
     * Downloaded files and/or folders.
     */
    interface EventTypeFileDownload {
      '.tag': 'file_download';
    }

    /**
     * Edited files.
     */
    interface EventTypeFileEdit {
      '.tag': 'file_edit';
    }

    /**
     * Create a copy reference to a file or folder.
     */
    interface EventTypeFileGetCopyReference {
      '.tag': 'file_get_copy_reference';
    }

    /**
     * Moved files and/or folders.
     */
    interface EventTypeFileMove {
      '.tag': 'file_move';
    }

    /**
     * Permanently deleted files and/or folders.
     */
    interface EventTypeFilePermanentlyDelete {
      '.tag': 'file_permanently_delete';
    }

    /**
     * Previewed files and/or folders.
     */
    interface EventTypeFilePreview {
      '.tag': 'file_preview';
    }

    /**
     * Renamed files and/or folders.
     */
    interface EventTypeFileRename {
      '.tag': 'file_rename';
    }

    /**
     * Restored deleted files and/or folders.
     */
    interface EventTypeFileRestore {
      '.tag': 'file_restore';
    }

    /**
     * Reverted files to a previous version.
     */
    interface EventTypeFileRevert {
      '.tag': 'file_revert';
    }

    /**
     * Rolled back file change location changes.
     */
    interface EventTypeFileRollbackChanges {
      '.tag': 'file_rollback_changes';
    }

    /**
     * Save a file or folder using a copy reference.
     */
    interface EventTypeFileSaveCopyReference {
      '.tag': 'file_save_copy_reference';
    }

    /**
     * Added a deadline to a file request.
     */
    interface EventTypeFileRequestAddDeadline {
      '.tag': 'file_request_add_deadline';
    }

    /**
     * Changed the file request folder.
     */
    interface EventTypeFileRequestChangeFolder {
      '.tag': 'file_request_change_folder';
    }

    /**
     * Change the file request title.
     */
    interface EventTypeFileRequestChangeTitle {
      '.tag': 'file_request_change_title';
    }

    /**
     * Closed a file request.
     */
    interface EventTypeFileRequestClose {
      '.tag': 'file_request_close';
    }

    /**
     * Created a file request.
     */
    interface EventTypeFileRequestCreate {
      '.tag': 'file_request_create';
    }

    /**
     * Received files for a file request.
     */
    interface EventTypeFileRequestReceiveFile {
      '.tag': 'file_request_receive_file';
    }

    /**
     * Removed the file request deadline.
     */
    interface EventTypeFileRequestRemoveDeadline {
      '.tag': 'file_request_remove_deadline';
    }

    /**
     * Sent file request to users via email.
     */
    interface EventTypeFileRequestSend {
      '.tag': 'file_request_send';
    }

    /**
     * Added an external ID for group.
     */
    interface EventTypeGroupAddExternalId {
      '.tag': 'group_add_external_id';
    }

    /**
     * Added team members to a group.
     */
    interface EventTypeGroupAddMember {
      '.tag': 'group_add_member';
    }

    /**
     * Changed the external ID for group.
     */
    interface EventTypeGroupChangeExternalId {
      '.tag': 'group_change_external_id';
    }

    /**
     * Changed group management type.
     */
    interface EventTypeGroupChangeManagementType {
      '.tag': 'group_change_management_type';
    }

    /**
     * Changed the manager permissions belonging to a group member.
     */
    interface EventTypeGroupChangeMemberRole {
      '.tag': 'group_change_member_role';
    }

    /**
     * Created a group.
     */
    interface EventTypeGroupCreate {
      '.tag': 'group_create';
    }

    /**
     * Deleted a group.
     */
    interface EventTypeGroupDelete {
      '.tag': 'group_delete';
    }

    /**
     * Updated a group.
     */
    interface EventTypeGroupDescriptionUpdated {
      '.tag': 'group_description_updated';
    }

    /**
     * Updated a group join policy.
     */
    interface EventTypeGroupJoinPolicyUpdated {
      '.tag': 'group_join_policy_updated';
    }

    /**
     * Moved a group. This event is deprecated and will not be logged going
     * forward as the associated product functionality no longer exists.
     */
    interface EventTypeGroupMoved {
      '.tag': 'group_moved';
    }

    /**
     * Removed the external ID for group.
     */
    interface EventTypeGroupRemoveExternalId {
      '.tag': 'group_remove_external_id';
    }

    /**
     * Removed team members from a group.
     */
    interface EventTypeGroupRemoveMember {
      '.tag': 'group_remove_member';
    }

    /**
     * Renamed a group.
     */
    interface EventTypeGroupRename {
      '.tag': 'group_rename';
    }

    /**
     * Signed in using the Dropbox EMM app.
     */
    interface EventTypeEmmLoginSuccess {
      '.tag': 'emm_login_success';
    }

    /**
     * Signed out.
     */
    interface EventTypeLogout {
      '.tag': 'logout';
    }

    /**
     * Failed to sign in using a password.
     */
    interface EventTypePasswordLoginFail {
      '.tag': 'password_login_fail';
    }

    /**
     * Signed in using a password.
     */
    interface EventTypePasswordLoginSuccess {
      '.tag': 'password_login_success';
    }

    /**
     * Ended reseller support session.
     */
    interface EventTypeResellerSupportSessionEnd {
      '.tag': 'reseller_support_session_end';
    }

    /**
     * Started reseller support session.
     */
    interface EventTypeResellerSupportSessionStart {
      '.tag': 'reseller_support_session_start';
    }

    /**
     * Ended admin sign-in-as session.
     */
    interface EventTypeSignInAsSessionEnd {
      '.tag': 'sign_in_as_session_end';
    }

    /**
     * Started admin sign-in-as session.
     */
    interface EventTypeSignInAsSessionStart {
      '.tag': 'sign_in_as_session_start';
    }

    /**
     * Failed to sign in using SSO.
     */
    interface EventTypeSsoLoginFail {
      '.tag': 'sso_login_fail';
    }

    /**
     * Set team member name when joining team.
     */
    interface EventTypeMemberAddName {
      '.tag': 'member_add_name';
    }

    /**
     * Change the admin role belonging to team member.
     */
    interface EventTypeMemberChangeAdminRole {
      '.tag': 'member_change_admin_role';
    }

    /**
     * Changed team member email address.
     */
    interface EventTypeMemberChangeEmail {
      '.tag': 'member_change_email';
    }

    /**
     * Changed team member name.
     */
    interface EventTypeMemberChangeName {
      '.tag': 'member_change_name';
    }

    /**
     * Changed the membership status of a team member.
     */
    interface EventTypeMemberChangeStatus {
      '.tag': 'member_change_status';
    }

    /**
     * Suggested a new team member to be added to the team.
     */
    interface EventTypeMemberSuggest {
      '.tag': 'member_suggest';
    }

    /**
     * Added users to the membership of a Paper doc or folder.
     */
    interface EventTypePaperContentAddMember {
      '.tag': 'paper_content_add_member';
    }

    /**
     * Added Paper doc or folder to a folder.
     */
    interface EventTypePaperContentAddToFolder {
      '.tag': 'paper_content_add_to_folder';
    }

    /**
     * Archived Paper doc or folder.
     */
    interface EventTypePaperContentArchive {
      '.tag': 'paper_content_archive';
    }

    /**
     * Followed or unfollowed a Paper doc or folder.
     */
    interface EventTypePaperContentChangeSubscription {
      '.tag': 'paper_content_change_subscription';
    }

    /**
     * Created a Paper doc or folder.
     */
    interface EventTypePaperContentCreate {
      '.tag': 'paper_content_create';
    }

    /**
     * Permanently deleted a Paper doc or folder.
     */
    interface EventTypePaperContentPermanentlyDelete {
      '.tag': 'paper_content_permanently_delete';
    }

    /**
     * Removed Paper doc or folder from a folder.
     */
    interface EventTypePaperContentRemoveFromFolder {
      '.tag': 'paper_content_remove_from_folder';
    }

    /**
     * Removed a user from the membership of a Paper doc or folder.
     */
    interface EventTypePaperContentRemoveMember {
      '.tag': 'paper_content_remove_member';
    }

    /**
     * Renamed Paper doc or folder.
     */
    interface EventTypePaperContentRename {
      '.tag': 'paper_content_rename';
    }

    /**
     * Restored an archived Paper doc or folder.
     */
    interface EventTypePaperContentRestore {
      '.tag': 'paper_content_restore';
    }

    /**
     * Added a Paper doc comment.
     */
    interface EventTypePaperDocAddComment {
      '.tag': 'paper_doc_add_comment';
    }

    /**
     * Changed the access type of a Paper doc member.
     */
    interface EventTypePaperDocChangeMemberRole {
      '.tag': 'paper_doc_change_member_role';
    }

    /**
     * Changed the sharing policy for Paper doc.
     */
    interface EventTypePaperDocChangeSharingPolicy {
      '.tag': 'paper_doc_change_sharing_policy';
    }

    /**
     * Paper doc archived. This event is deprecated and will not be logged going
     * forward as the associated product functionality no longer exists.
     */
    interface EventTypePaperDocDeleted {
      '.tag': 'paper_doc_deleted';
    }

    /**
     * Deleted a Paper doc comment.
     */
    interface EventTypePaperDocDeleteComment {
      '.tag': 'paper_doc_delete_comment';
    }

    /**
     * Downloaded a Paper doc in a particular output format.
     */
    interface EventTypePaperDocDownload {
      '.tag': 'paper_doc_download';
    }

    /**
     * Edited a Paper doc.
     */
    interface EventTypePaperDocEdit {
      '.tag': 'paper_doc_edit';
    }

    /**
     * Edited a Paper doc comment.
     */
    interface EventTypePaperDocEditComment {
      '.tag': 'paper_doc_edit_comment';
    }

    /**
     * Followed a Paper doc. This event is replaced by
     * paper_content_change_subscription and will not be logged going forward.
     */
    interface EventTypePaperDocFollowed {
      '.tag': 'paper_doc_followed';
    }

    /**
     * Mentioned a member in a Paper doc.
     */
    interface EventTypePaperDocMention {
      '.tag': 'paper_doc_mention';
    }

    /**
     * Requested to be a member on a Paper doc.
     */
    interface EventTypePaperDocRequestAccess {
      '.tag': 'paper_doc_request_access';
    }

    /**
     * Paper doc comment resolved.
     */
    interface EventTypePaperDocResolveComment {
      '.tag': 'paper_doc_resolve_comment';
    }

    /**
     * Restored a Paper doc to previous revision.
     */
    interface EventTypePaperDocRevert {
      '.tag': 'paper_doc_revert';
    }

    /**
     * Paper doc link shared via slack.
     */
    interface EventTypePaperDocSlackShare {
      '.tag': 'paper_doc_slack_share';
    }

    /**
     * Paper doc shared with team member. This event is deprecated and will not
     * be logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypePaperDocTeamInvite {
      '.tag': 'paper_doc_team_invite';
    }

    /**
     * Unresolved a Paper doc comment.
     */
    interface EventTypePaperDocUnresolveComment {
      '.tag': 'paper_doc_unresolve_comment';
    }

    /**
     * Viewed Paper doc.
     */
    interface EventTypePaperDocView {
      '.tag': 'paper_doc_view';
    }

    /**
     * Paper folder archived. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypePaperFolderDeleted {
      '.tag': 'paper_folder_deleted';
    }

    /**
     * Followed a Paper folder. This event is replaced by
     * paper_content_change_subscription and will not be logged going forward.
     */
    interface EventTypePaperFolderFollowed {
      '.tag': 'paper_folder_followed';
    }

    /**
     * Paper folder shared with team member. This event is deprecated and will
     * not be logged going forward as the associated product functionality no
     * longer exists.
     */
    interface EventTypePaperFolderTeamInvite {
      '.tag': 'paper_folder_team_invite';
    }

    /**
     * Changed password.
     */
    interface EventTypePasswordChange {
      '.tag': 'password_change';
    }

    /**
     * Reset password.
     */
    interface EventTypePasswordReset {
      '.tag': 'password_reset';
    }

    /**
     * Reset all team member passwords.
     */
    interface EventTypePasswordResetAll {
      '.tag': 'password_reset_all';
    }

    /**
     * EMM excluded users report created.
     */
    interface EventTypeEmmCreateExceptionsReport {
      '.tag': 'emm_create_exceptions_report';
    }

    /**
     * EMM mobile app usage report created.
     */
    interface EventTypeEmmCreateUsageReport {
      '.tag': 'emm_create_usage_report';
    }

    /**
     * Smart Sync non-admin devices report created.
     */
    interface EventTypeSmartSyncCreateAdminPrivilegeReport {
      '.tag': 'smart_sync_create_admin_privilege_report';
    }

    /**
     * Created a team activity report.
     */
    interface EventTypeTeamActivityCreateReport {
      '.tag': 'team_activity_create_report';
    }

    /**
     * Shared an album.
     */
    interface EventTypeCollectionShare {
      '.tag': 'collection_share';
    }

    /**
     * Added a file comment.
     */
    interface EventTypeFileAddComment {
      '.tag': 'file_add_comment';
    }

    /**
     * Liked a file comment. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeFileLikeComment {
      '.tag': 'file_like_comment';
    }

    /**
     * Unliked a file comment. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeFileUnlikeComment {
      '.tag': 'file_unlike_comment';
    }

    /**
     * Changed a Paper document to be invite-only. This event is deprecated and
     * will not be logged going forward as the associated product functionality
     * no longer exists.
     */
    interface EventTypeNoteAclInviteOnly {
      '.tag': 'note_acl_invite_only';
    }

    /**
     * Changed a Paper document to be link accessible. This event is deprecated
     * and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypeNoteAclLink {
      '.tag': 'note_acl_link';
    }

    /**
     * Changed a Paper document to be link accessible for the team. This event
     * is deprecated and will not be logged going forward as the associated
     * product functionality no longer exists.
     */
    interface EventTypeNoteAclTeamLink {
      '.tag': 'note_acl_team_link';
    }

    /**
     * Shared a Paper doc. This event is deprecated and will not be logged going
     * forward as the associated product functionality no longer exists.
     */
    interface EventTypeNoteShared {
      '.tag': 'note_shared';
    }

    /**
     * Shared Paper document received. This event is deprecated and will not be
     * logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeNoteShareReceive {
      '.tag': 'note_share_receive';
    }

    /**
     * Opened a shared Paper doc. This event is deprecated and will not be
     * logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeOpenNoteShared {
      '.tag': 'open_note_shared';
    }

    /**
     * Added the team to a shared folder.
     */
    interface EventTypeSfAddGroup {
      '.tag': 'sf_add_group';
    }

    /**
     * Allowed non collaborators to view links to files in a shared folder. This
     * event is deprecated and will not be logged going forward as the
     * associated product functionality no longer exists.
     */
    interface EventTypeSfAllowNonMembersToViewSharedLinks {
      '.tag': 'sf_allow_non_members_to_view_shared_links';
    }

    /**
     * Invited a group to a shared folder. This event is deprecated and will not
     * be logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeSfInviteGroup {
      '.tag': 'sf_invite_group';
    }

    /**
     * Changed parent of shared folder.
     */
    interface EventTypeSfNest {
      '.tag': 'sf_nest';
    }

    /**
     * Declined a team member's invitation to a shared folder.
     */
    interface EventTypeSfTeamDecline {
      '.tag': 'sf_team_decline';
    }

    /**
     * Granted access to a shared folder. This event is deprecated and will not
     * be logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeSfTeamGrantAccess {
      '.tag': 'sf_team_grant_access';
    }

    /**
     * Invited team members to a shared folder. This event is deprecated and
     * will not be logged going forward as the associated product functionality
     * no longer exists.
     */
    interface EventTypeSfTeamInvite {
      '.tag': 'sf_team_invite';
    }

    /**
     * Changed a team member's role in a shared folder. This event is deprecated
     * and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypeSfTeamInviteChangeRole {
      '.tag': 'sf_team_invite_change_role';
    }

    /**
     * Joined a team member's shared folder. This event is deprecated and will
     * not be logged going forward as the associated product functionality no
     * longer exists.
     */
    interface EventTypeSfTeamJoin {
      '.tag': 'sf_team_join';
    }

    /**
     * Joined a team member's shared folder from a link. This event is
     * deprecated and will not be logged going forward as the associated product
     * functionality no longer exists.
     */
    interface EventTypeSfTeamJoinFromOobLink {
      '.tag': 'sf_team_join_from_oob_link';
    }

    /**
     * Unshared a folder with a team member. This event is deprecated and will
     * not be logged going forward as the associated product functionality no
     * longer exists.
     */
    interface EventTypeSfTeamUninvite {
      '.tag': 'sf_team_uninvite';
    }

    /**
     * Sent an email invitation to the membership of a shared file or folder.
     */
    interface EventTypeSharedContentAddInvitees {
      '.tag': 'shared_content_add_invitees';
    }

    /**
     * Added an expiry to the link for the shared file or folder.
     */
    interface EventTypeSharedContentAddLinkExpiry {
      '.tag': 'shared_content_add_link_expiry';
    }

    /**
     * Added a password to the link for the shared file or folder.
     */
    interface EventTypeSharedContentAddLinkPassword {
      '.tag': 'shared_content_add_link_password';
    }

    /**
     * Added users and/or groups to the membership of a shared file or folder.
     */
    interface EventTypeSharedContentAddMember {
      '.tag': 'shared_content_add_member';
    }

    /**
     * Changed whether members can download the shared file or folder.
     */
    interface EventTypeSharedContentChangeDownloadsPolicy {
      '.tag': 'shared_content_change_downloads_policy';
    }

    /**
     * Changed the access type of an invitee to a shared file or folder before
     * the invitation was claimed.
     */
    interface EventTypeSharedContentChangeInviteeRole {
      '.tag': 'shared_content_change_invitee_role';
    }

    /**
     * Changed the audience of the link for a shared file or folder.
     */
    interface EventTypeSharedContentChangeLinkAudience {
      '.tag': 'shared_content_change_link_audience';
    }

    /**
     * Changed the expiry of the link for the shared file or folder.
     */
    interface EventTypeSharedContentChangeLinkExpiry {
      '.tag': 'shared_content_change_link_expiry';
    }

    /**
     * Changed the password on the link for the shared file or folder.
     */
    interface EventTypeSharedContentChangeLinkPassword {
      '.tag': 'shared_content_change_link_password';
    }

    /**
     * Changed the access type of a shared file or folder member.
     */
    interface EventTypeSharedContentChangeMemberRole {
      '.tag': 'shared_content_change_member_role';
    }

    /**
     * Changed whether members can see who viewed the shared file or folder.
     */
    interface EventTypeSharedContentChangeViewerInfoPolicy {
      '.tag': 'shared_content_change_viewer_info_policy';
    }

    /**
     * Claimed membership to a team member's shared folder.
     */
    interface EventTypeSharedContentClaimInvitation {
      '.tag': 'shared_content_claim_invitation';
    }

    /**
     * Copied the shared file or folder to own Dropbox.
     */
    interface EventTypeSharedContentCopy {
      '.tag': 'shared_content_copy';
    }

    /**
     * Downloaded the shared file or folder.
     */
    interface EventTypeSharedContentDownload {
      '.tag': 'shared_content_download';
    }

    /**
     * Left the membership of a shared file or folder.
     */
    interface EventTypeSharedContentRelinquishMembership {
      '.tag': 'shared_content_relinquish_membership';
    }

    /**
     * Removed an invitee from the membership of a shared file or folder before
     * it was claimed.
     */
    interface EventTypeSharedContentRemoveInvitee {
      '.tag': 'shared_content_remove_invitee';
    }

    /**
     * Removed the expiry of the link for the shared file or folder.
     */
    interface EventTypeSharedContentRemoveLinkExpiry {
      '.tag': 'shared_content_remove_link_expiry';
    }

    /**
     * Removed the password on the link for the shared file or folder.
     */
    interface EventTypeSharedContentRemoveLinkPassword {
      '.tag': 'shared_content_remove_link_password';
    }

    /**
     * Removed a user or a group from the membership of a shared file or folder.
     */
    interface EventTypeSharedContentRemoveMember {
      '.tag': 'shared_content_remove_member';
    }

    /**
     * Requested to be on the membership of a shared file or folder.
     */
    interface EventTypeSharedContentRequestAccess {
      '.tag': 'shared_content_request_access';
    }

    /**
     * Unshared a shared file or folder by clearing its membership and turning
     * off its link.
     */
    interface EventTypeSharedContentUnshare {
      '.tag': 'shared_content_unshare';
    }

    /**
     * Previewed the shared file or folder.
     */
    interface EventTypeSharedContentView {
      '.tag': 'shared_content_view';
    }

    /**
     * Set or unset the confidential flag on a shared folder.
     */
    interface EventTypeSharedFolderChangeConfidentiality {
      '.tag': 'shared_folder_change_confidentiality';
    }

    /**
     * Changed who can access the shared folder via a link.
     */
    interface EventTypeSharedFolderChangeLinkPolicy {
      '.tag': 'shared_folder_change_link_policy';
    }

    /**
     * Changed who can manage the membership of a shared folder.
     */
    interface EventTypeSharedFolderChangeMemberManagementPolicy {
      '.tag': 'shared_folder_change_member_management_policy';
    }

    /**
     * Changed who can become a member of the shared folder.
     */
    interface EventTypeSharedFolderChangeMemberPolicy {
      '.tag': 'shared_folder_change_member_policy';
    }

    /**
     * Created a shared folder.
     */
    interface EventTypeSharedFolderCreate {
      '.tag': 'shared_folder_create';
    }

    /**
     * Added a shared folder to own Dropbox.
     */
    interface EventTypeSharedFolderMount {
      '.tag': 'shared_folder_mount';
    }

    /**
     * Transferred the ownership of a shared folder to another member.
     */
    interface EventTypeSharedFolderTransferOwnership {
      '.tag': 'shared_folder_transfer_ownership';
    }

    /**
     * Deleted a shared folder from Dropbox.
     */
    interface EventTypeSharedFolderUnmount {
      '.tag': 'shared_folder_unmount';
    }

    /**
     * Shared Paper document was opened. This event is deprecated and will not
     * be logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeSharedNoteOpened {
      '.tag': 'shared_note_opened';
    }

    /**
     * Created a link to a file using an app.
     */
    interface EventTypeShmodelAppCreate {
      '.tag': 'shmodel_app_create';
    }

    /**
     * Created a new link.
     */
    interface EventTypeShmodelCreate {
      '.tag': 'shmodel_create';
    }

    /**
     * Removed a link.
     */
    interface EventTypeShmodelDisable {
      '.tag': 'shmodel_disable';
    }

    /**
     * Shared a link with Facebook users.
     */
    interface EventTypeShmodelFbShare {
      '.tag': 'shmodel_fb_share';
    }

    /**
     * Shared a link with a group. This event is deprecated and will not be
     * logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeShmodelGroupShare {
      '.tag': 'shmodel_group_share';
    }

    /**
     * Removed the expiration date from a link.
     */
    interface EventTypeShmodelRemoveExpiration {
      '.tag': 'shmodel_remove_expiration';
    }

    /**
     * Added an expiration date to a link.
     */
    interface EventTypeShmodelSetExpiration {
      '.tag': 'shmodel_set_expiration';
    }

    /**
     * Added a team member's file/folder to their Dropbox from a link.
     */
    interface EventTypeShmodelTeamCopy {
      '.tag': 'shmodel_team_copy';
    }

    /**
     * Downloaded a team member's file/folder from a link.
     */
    interface EventTypeShmodelTeamDownload {
      '.tag': 'shmodel_team_download';
    }

    /**
     * Shared a link with team members.
     */
    interface EventTypeShmodelTeamShare {
      '.tag': 'shmodel_team_share';
    }

    /**
     * Opened a team member's link.
     */
    interface EventTypeShmodelTeamView {
      '.tag': 'shmodel_team_view';
    }

    /**
     * Password-protected a link.
     */
    interface EventTypeShmodelVisibilityPassword {
      '.tag': 'shmodel_visibility_password';
    }

    /**
     * Made a file/folder visible to anyone with the link.
     */
    interface EventTypeShmodelVisibilityPublic {
      '.tag': 'shmodel_visibility_public';
    }

    /**
     * Made a file/folder visible only to team members with the link.
     */
    interface EventTypeShmodelVisibilityTeamOnly {
      '.tag': 'shmodel_visibility_team_only';
    }

    /**
     * Removed single sign-on logout URL. This event is deprecated and will not
     * be logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeRemoveLogoutUrl {
      '.tag': 'remove_logout_url';
    }

    /**
     * Changed the sign-out URL for SSO. This event is deprecated and will not
     * be logged going forward as the associated product functionality no longer
     * exists.
     */
    interface EventTypeRemoveSsoUrl {
      '.tag': 'remove_sso_url';
    }

    /**
     * Changed the X.509 certificate for SSO.
     */
    interface EventTypeSsoChangeCert {
      '.tag': 'sso_change_cert';
    }

    /**
     * Changed the sign-in URL for SSO.
     */
    interface EventTypeSsoChangeLoginUrl {
      '.tag': 'sso_change_login_url';
    }

    /**
     * Changed the sign-out URL for SSO.
     */
    interface EventTypeSsoChangeLogoutUrl {
      '.tag': 'sso_change_logout_url';
    }

    /**
     * Changed the SAML identity mode for SSO.
     */
    interface EventTypeSsoChangeSamlIdentityMode {
      '.tag': 'sso_change_saml_identity_mode';
    }

    /**
     * Changed the archival status of a team folder.
     */
    interface EventTypeTeamFolderChangeStatus {
      '.tag': 'team_folder_change_status';
    }

    /**
     * Created a new team folder in active status.
     */
    interface EventTypeTeamFolderCreate {
      '.tag': 'team_folder_create';
    }

    /**
     * Downgraded a team folder to a regular shared folder.
     */
    interface EventTypeTeamFolderDowngrade {
      '.tag': 'team_folder_downgrade';
    }

    /**
     * Permanently deleted an archived team folder.
     */
    interface EventTypeTeamFolderPermanentlyDelete {
      '.tag': 'team_folder_permanently_delete';
    }

    /**
     * Renamed an active or archived team folder.
     */
    interface EventTypeTeamFolderRename {
      '.tag': 'team_folder_rename';
    }

    /**
     * Changed the account capture policy on a domain belonging to the team.
     */
    interface EventTypeAccountCaptureChangePolicy {
      '.tag': 'account_capture_change_policy';
    }

    /**
     * Disabled allow downloads. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeAllowDownloadDisabled {
      '.tag': 'allow_download_disabled';
    }

    /**
     * Enabled allow downloads. This event is deprecated and will not be logged
     * going forward as the associated product functionality no longer exists.
     */
    interface EventTypeAllowDownloadEnabled {
      '.tag': 'allow_download_enabled';
    }

    /**
     * Set a restriction policy regarding the location of data centers where
     * team data resides.
     */
    interface EventTypeDataPlacementRestrictionChangePolicy {
      '.tag': 'data_placement_restriction_change_policy';
    }

    /**
     * Satisfied a previously set restriction policy regarding the location of
     * data centers where team data resides (i.e. all data have been migrated
     * according to the restriction placed).
     */
    interface EventTypeDataPlacementRestrictionSatisfyPolicy {
      '.tag': 'data_placement_restriction_satisfy_policy';
    }

    /**
     * Set or removed a limit on the number of computers each team member can
     * link to their work Dropbox account.
     */
    interface EventTypeDeviceApprovalsChangeDesktopPolicy {
      '.tag': 'device_approvals_change_desktop_policy';
    }

    /**
     * Set or removed a limit on the number of mobiles devices each team member
     * can link to their work Dropbox account.
     */
    interface EventTypeDeviceApprovalsChangeMobilePolicy {
      '.tag': 'device_approvals_change_mobile_policy';
    }

    /**
     * Changed the action taken when a team member is already over the limits
     * (e.g when they join the team, an admin lowers limits, etc.).
     */
    interface EventTypeDeviceApprovalsChangeOverageAction {
      '.tag': 'device_approvals_change_overage_action';
    }

    /**
     * Changed the action taken with respect to approval limits when a team
     * member unlinks an approved device.
     */
    interface EventTypeDeviceApprovalsChangeUnlinkAction {
      '.tag': 'device_approvals_change_unlink_action';
    }

    /**
     * Added an exception for one or more team members to optionally use the
     * regular Dropbox app when EMM is enabled.
     */
    interface EventTypeEmmAddException {
      '.tag': 'emm_add_exception';
    }

    /**
     * Enabled or disabled enterprise mobility management for team members.
     */
    interface EventTypeEmmChangePolicy {
      '.tag': 'emm_change_policy';
    }

    /**
     * Removed an exception for one or more team members to optionally use the
     * regular Dropbox app when EMM is enabled.
     */
    interface EventTypeEmmRemoveException {
      '.tag': 'emm_remove_exception';
    }

    /**
     * Accepted or opted out of extended version history.
     */
    interface EventTypeExtendedVersionHistoryChangePolicy {
      '.tag': 'extended_version_history_change_policy';
    }

    /**
     * Enabled or disabled commenting on team files.
     */
    interface EventTypeFileCommentsChangePolicy {
      '.tag': 'file_comments_change_policy';
    }

    /**
     * Enabled or disabled file requests.
     */
    interface EventTypeFileRequestsChangePolicy {
      '.tag': 'file_requests_change_policy';
    }

    /**
     * Enabled file request emails for everyone. This event is deprecated and
     * will not be logged going forward as the associated product functionality
     * no longer exists.
     */
    interface EventTypeFileRequestsEmailsEnabled {
      '.tag': 'file_requests_emails_enabled';
    }

    /**
     * Allowed file request emails for the team. This event is deprecated and
     * will not be logged going forward as the associated product functionality
     * no longer exists.
     */
    interface EventTypeFileRequestsEmailsRestrictedToTeamOnly {
      '.tag': 'file_requests_emails_restricted_to_team_only';
    }

    /**
     * Enabled or disabled Google single sign-on for the team.
     */
    interface EventTypeGoogleSsoChangePolicy {
      '.tag': 'google_sso_change_policy';
    }

    /**
     * Changed who can create groups.
     */
    interface EventTypeGroupUserManagementChangePolicy {
      '.tag': 'group_user_management_change_policy';
    }

    /**
     * Changed whether users can find the team when not invited.
     */
    interface EventTypeMemberRequestsChangePolicy {
      '.tag': 'member_requests_change_policy';
    }

    /**
     * Added an exception for one or more team members to bypass space limits
     * imposed by policy.
     */
    interface EventTypeMemberSpaceLimitsAddException {
      '.tag': 'member_space_limits_add_exception';
    }

    /**
     * Changed the storage limits applied to team members by policy.
     */
    interface EventTypeMemberSpaceLimitsChangePolicy {
      '.tag': 'member_space_limits_change_policy';
    }

    /**
     * Removed an exception for one or more team members to bypass space limits
     * imposed by policy.
     */
    interface EventTypeMemberSpaceLimitsRemoveException {
      '.tag': 'member_space_limits_remove_exception';
    }

    /**
     * Enabled or disabled the option for team members to suggest new members to
     * add to the team.
     */
    interface EventTypeMemberSuggestionsChangePolicy {
      '.tag': 'member_suggestions_change_policy';
    }

    /**
     * Enabled or disabled the Microsoft Office add-in, which lets team members
     * save files to Dropbox directly from Microsoft Office.
     */
    interface EventTypeMicrosoftOfficeAddinChangePolicy {
      '.tag': 'microsoft_office_addin_change_policy';
    }

    /**
     * Enabled or disabled network control.
     */
    interface EventTypeNetworkControlChangePolicy {
      '.tag': 'network_control_change_policy';
    }

    /**
     * Changed whether Dropbox Paper, when enabled, is deployed to all teams or
     * to specific members of the team.
     */
    interface EventTypePaperChangeDeploymentPolicy {
      '.tag': 'paper_change_deployment_policy';
    }

    /**
     * Changed whether team members can share Paper documents externally (i.e.
     * outside the team), and if so, whether they should be accessible only by
     * team members or anyone by default.
     */
    interface EventTypePaperChangeMemberPolicy {
      '.tag': 'paper_change_member_policy';
    }

    /**
     * Enabled or disabled Dropbox Paper for the team.
     */
    interface EventTypePaperChangePolicy {
      '.tag': 'paper_change_policy';
    }

    /**
     * Enabled or disabled the ability of team members to permanently delete
     * content.
     */
    interface EventTypePermanentDeleteChangePolicy {
      '.tag': 'permanent_delete_change_policy';
    }

    /**
     * Changed whether team members can join shared folders owned externally
     * (i.e. outside the team).
     */
    interface EventTypeSharingChangeFolderJoinPolicy {
      '.tag': 'sharing_change_folder_join_policy';
    }

    /**
     * Changed whether team members can share links externally (i.e. outside the
     * team), and if so, whether links should be accessible only by team members
     * or anyone by default.
     */
    interface EventTypeSharingChangeLinkPolicy {
      '.tag': 'sharing_change_link_policy';
    }

    /**
     * Changed whether team members can share files and folders externally (i.e.
     * outside the team).
     */
    interface EventTypeSharingChangeMemberPolicy {
      '.tag': 'sharing_change_member_policy';
    }

    /**
     * Changed the default Smart Sync policy for team members.
     */
    interface EventTypeSmartSyncChangePolicy {
      '.tag': 'smart_sync_change_policy';
    }

    /**
     * Opted team into Smart Sync.
     */
    interface EventTypeSmartSyncNotOptOut {
      '.tag': 'smart_sync_not_opt_out';
    }

    /**
     * Opted team out of Smart Sync.
     */
    interface EventTypeSmartSyncOptOut {
      '.tag': 'smart_sync_opt_out';
    }

    /**
     * Change the single sign-on policy for the team.
     */
    interface EventTypeSsoChangePolicy {
      '.tag': 'sso_change_policy';
    }

    /**
     * Change two-step verification policy for the team.
     */
    interface EventTypeTfaChangePolicy {
      '.tag': 'tfa_change_policy';
    }

    /**
     * Enabled or disabled the option for team members to link a personal
     * Dropbox account in addition to their work account to the same computer.
     */
    interface EventTypeTwoAccountChangePolicy {
      '.tag': 'two_account_change_policy';
    }

    /**
     * Changed how long team members can stay signed in to Dropbox on the web.
     */
    interface EventTypeWebSessionsChangeFixedLengthPolicy {
      '.tag': 'web_sessions_change_fixed_length_policy';
    }

    /**
     * Changed how long team members can be idle while signed in to Dropbox on
     * the web.
     */
    interface EventTypeWebSessionsChangeIdleLengthPolicy {
      '.tag': 'web_sessions_change_idle_length_policy';
    }

    /**
     * Added a team logo to be displayed on shared link headers.
     */
    interface EventTypeTeamProfileAddLogo {
      '.tag': 'team_profile_add_logo';
    }

    /**
     * Changed the team logo to be displayed on shared link headers.
     */
    interface EventTypeTeamProfileChangeLogo {
      '.tag': 'team_profile_change_logo';
    }

    /**
     * Changed the team name.
     */
    interface EventTypeTeamProfileChangeName {
      '.tag': 'team_profile_change_name';
    }

    /**
     * Removed the team logo to be displayed on shared link headers.
     */
    interface EventTypeTeamProfileRemoveLogo {
      '.tag': 'team_profile_remove_logo';
    }

    /**
     * Added a backup phone for two-step verification.
     */
    interface EventTypeTfaAddBackupPhone {
      '.tag': 'tfa_add_backup_phone';
    }

    /**
     * Added a security key for two-step verification.
     */
    interface EventTypeTfaAddSecurityKey {
      '.tag': 'tfa_add_security_key';
    }

    /**
     * Changed the backup phone for two-step verification.
     */
    interface EventTypeTfaChangeBackupPhone {
      '.tag': 'tfa_change_backup_phone';
    }

    /**
     * Enabled, disabled or changed the configuration for two-step verification.
     */
    interface EventTypeTfaChangeStatus {
      '.tag': 'tfa_change_status';
    }

    /**
     * Removed the backup phone for two-step verification.
     */
    interface EventTypeTfaRemoveBackupPhone {
      '.tag': 'tfa_remove_backup_phone';
    }

    /**
     * Removed a security key for two-step verification.
     */
    interface EventTypeTfaRemoveSecurityKey {
      '.tag': 'tfa_remove_security_key';
    }

    /**
     * Reset two-step verification for team member.
     */
    interface EventTypeTfaReset {
      '.tag': 'tfa_reset';
    }

    interface EventTypeOther {
      '.tag': 'other';
    }

    /**
     * The type of the event.
     */
    type EventType = EventTypeMemberChangeMembershipType | EventTypeMemberPermanentlyDeleteAccountContents | EventTypeMemberSpaceLimitsChangeStatus | EventTypeMemberTransferAccountContents | EventTypePaperEnabledUsersGroupAddition | EventTypePaperEnabledUsersGroupRemoval | EventTypePaperExternalViewAllow | EventTypePaperExternalViewDefaultTeam | EventTypePaperExternalViewForbid | EventTypeSfExternalInviteWarn | EventTypeTeamMergeFrom | EventTypeTeamMergeTo | EventTypeAppLinkTeam | EventTypeAppLinkUser | EventTypeAppUnlinkTeam | EventTypeAppUnlinkUser | EventTypeDeviceChangeIpDesktop | EventTypeDeviceChangeIpMobile | EventTypeDeviceChangeIpWeb | EventTypeDeviceDeleteOnUnlinkFail | EventTypeDeviceDeleteOnUnlinkSuccess | EventTypeDeviceLinkFail | EventTypeDeviceLinkSuccess | EventTypeDeviceManagementDisabled | EventTypeDeviceManagementEnabled | EventTypeDeviceUnlink | EventTypeEmmRefreshAuthToken | EventTypeAccountCaptureChangeAvailability | EventTypeAccountCaptureMigrateAccount | EventTypeAccountCaptureRelinquishAccount | EventTypeDisabledDomainInvites | EventTypeDomainInvitesApproveRequestToJoinTeam | EventTypeDomainInvitesDeclineRequestToJoinTeam | EventTypeDomainInvitesEmailExistingUsers | EventTypeDomainInvitesRequestToJoinTeam | EventTypeDomainInvitesSetInviteNewUserPrefToNo | EventTypeDomainInvitesSetInviteNewUserPrefToYes | EventTypeDomainVerificationAddDomainFail | EventTypeDomainVerificationAddDomainSuccess | EventTypeDomainVerificationRemoveDomain | EventTypeEnabledDomainInvites | EventTypeCreateFolder | EventTypeFileAdd | EventTypeFileCopy | EventTypeFileDelete | EventTypeFileDownload | EventTypeFileEdit | EventTypeFileGetCopyReference | EventTypeFileMove | EventTypeFilePermanentlyDelete | EventTypeFilePreview | EventTypeFileRename | EventTypeFileRestore | EventTypeFileRevert | EventTypeFileRollbackChanges | EventTypeFileSaveCopyReference | EventTypeFileRequestAddDeadline | EventTypeFileRequestChangeFolder | EventTypeFileRequestChangeTitle | EventTypeFileRequestClose | EventTypeFileRequestCreate | EventTypeFileRequestReceiveFile | EventTypeFileRequestRemoveDeadline | EventTypeFileRequestSend | EventTypeGroupAddExternalId | EventTypeGroupAddMember | EventTypeGroupChangeExternalId | EventTypeGroupChangeManagementType | EventTypeGroupChangeMemberRole | EventTypeGroupCreate | EventTypeGroupDelete | EventTypeGroupDescriptionUpdated | EventTypeGroupJoinPolicyUpdated | EventTypeGroupMoved | EventTypeGroupRemoveExternalId | EventTypeGroupRemoveMember | EventTypeGroupRename | EventTypeEmmLoginSuccess | EventTypeLogout | EventTypePasswordLoginFail | EventTypePasswordLoginSuccess | EventTypeResellerSupportSessionEnd | EventTypeResellerSupportSessionStart | EventTypeSignInAsSessionEnd | EventTypeSignInAsSessionStart | EventTypeSsoLoginFail | EventTypeMemberAddName | EventTypeMemberChangeAdminRole | EventTypeMemberChangeEmail | EventTypeMemberChangeName | EventTypeMemberChangeStatus | EventTypeMemberSuggest | EventTypePaperContentAddMember | EventTypePaperContentAddToFolder | EventTypePaperContentArchive | EventTypePaperContentChangeSubscription | EventTypePaperContentCreate | EventTypePaperContentPermanentlyDelete | EventTypePaperContentRemoveFromFolder | EventTypePaperContentRemoveMember | EventTypePaperContentRename | EventTypePaperContentRestore | EventTypePaperDocAddComment | EventTypePaperDocChangeMemberRole | EventTypePaperDocChangeSharingPolicy | EventTypePaperDocDeleted | EventTypePaperDocDeleteComment | EventTypePaperDocDownload | EventTypePaperDocEdit | EventTypePaperDocEditComment | EventTypePaperDocFollowed | EventTypePaperDocMention | EventTypePaperDocRequestAccess | EventTypePaperDocResolveComment | EventTypePaperDocRevert | EventTypePaperDocSlackShare | EventTypePaperDocTeamInvite | EventTypePaperDocUnresolveComment | EventTypePaperDocView | EventTypePaperFolderDeleted | EventTypePaperFolderFollowed | EventTypePaperFolderTeamInvite | EventTypePasswordChange | EventTypePasswordReset | EventTypePasswordResetAll | EventTypeEmmCreateExceptionsReport | EventTypeEmmCreateUsageReport | EventTypeSmartSyncCreateAdminPrivilegeReport | EventTypeTeamActivityCreateReport | EventTypeCollectionShare | EventTypeFileAddComment | EventTypeFileLikeComment | EventTypeFileUnlikeComment | EventTypeNoteAclInviteOnly | EventTypeNoteAclLink | EventTypeNoteAclTeamLink | EventTypeNoteShared | EventTypeNoteShareReceive | EventTypeOpenNoteShared | EventTypeSfAddGroup | EventTypeSfAllowNonMembersToViewSharedLinks | EventTypeSfInviteGroup | EventTypeSfNest | EventTypeSfTeamDecline | EventTypeSfTeamGrantAccess | EventTypeSfTeamInvite | EventTypeSfTeamInviteChangeRole | EventTypeSfTeamJoin | EventTypeSfTeamJoinFromOobLink | EventTypeSfTeamUninvite | EventTypeSharedContentAddInvitees | EventTypeSharedContentAddLinkExpiry | EventTypeSharedContentAddLinkPassword | EventTypeSharedContentAddMember | EventTypeSharedContentChangeDownloadsPolicy | EventTypeSharedContentChangeInviteeRole | EventTypeSharedContentChangeLinkAudience | EventTypeSharedContentChangeLinkExpiry | EventTypeSharedContentChangeLinkPassword | EventTypeSharedContentChangeMemberRole | EventTypeSharedContentChangeViewerInfoPolicy | EventTypeSharedContentClaimInvitation | EventTypeSharedContentCopy | EventTypeSharedContentDownload | EventTypeSharedContentRelinquishMembership | EventTypeSharedContentRemoveInvitee | EventTypeSharedContentRemoveLinkExpiry | EventTypeSharedContentRemoveLinkPassword | EventTypeSharedContentRemoveMember | EventTypeSharedContentRequestAccess | EventTypeSharedContentUnshare | EventTypeSharedContentView | EventTypeSharedFolderChangeConfidentiality | EventTypeSharedFolderChangeLinkPolicy | EventTypeSharedFolderChangeMemberManagementPolicy | EventTypeSharedFolderChangeMemberPolicy | EventTypeSharedFolderCreate | EventTypeSharedFolderMount | EventTypeSharedFolderTransferOwnership | EventTypeSharedFolderUnmount | EventTypeSharedNoteOpened | EventTypeShmodelAppCreate | EventTypeShmodelCreate | EventTypeShmodelDisable | EventTypeShmodelFbShare | EventTypeShmodelGroupShare | EventTypeShmodelRemoveExpiration | EventTypeShmodelSetExpiration | EventTypeShmodelTeamCopy | EventTypeShmodelTeamDownload | EventTypeShmodelTeamShare | EventTypeShmodelTeamView | EventTypeShmodelVisibilityPassword | EventTypeShmodelVisibilityPublic | EventTypeShmodelVisibilityTeamOnly | EventTypeRemoveLogoutUrl | EventTypeRemoveSsoUrl | EventTypeSsoChangeCert | EventTypeSsoChangeLoginUrl | EventTypeSsoChangeLogoutUrl | EventTypeSsoChangeSamlIdentityMode | EventTypeTeamFolderChangeStatus | EventTypeTeamFolderCreate | EventTypeTeamFolderDowngrade | EventTypeTeamFolderPermanentlyDelete | EventTypeTeamFolderRename | EventTypeAccountCaptureChangePolicy | EventTypeAllowDownloadDisabled | EventTypeAllowDownloadEnabled | EventTypeDataPlacementRestrictionChangePolicy | EventTypeDataPlacementRestrictionSatisfyPolicy | EventTypeDeviceApprovalsChangeDesktopPolicy | EventTypeDeviceApprovalsChangeMobilePolicy | EventTypeDeviceApprovalsChangeOverageAction | EventTypeDeviceApprovalsChangeUnlinkAction | EventTypeEmmAddException | EventTypeEmmChangePolicy | EventTypeEmmRemoveException | EventTypeExtendedVersionHistoryChangePolicy | EventTypeFileCommentsChangePolicy | EventTypeFileRequestsChangePolicy | EventTypeFileRequestsEmailsEnabled | EventTypeFileRequestsEmailsRestrictedToTeamOnly | EventTypeGoogleSsoChangePolicy | EventTypeGroupUserManagementChangePolicy | EventTypeMemberRequestsChangePolicy | EventTypeMemberSpaceLimitsAddException | EventTypeMemberSpaceLimitsChangePolicy | EventTypeMemberSpaceLimitsRemoveException | EventTypeMemberSuggestionsChangePolicy | EventTypeMicrosoftOfficeAddinChangePolicy | EventTypeNetworkControlChangePolicy | EventTypePaperChangeDeploymentPolicy | EventTypePaperChangeMemberPolicy | EventTypePaperChangePolicy | EventTypePermanentDeleteChangePolicy | EventTypeSharingChangeFolderJoinPolicy | EventTypeSharingChangeLinkPolicy | EventTypeSharingChangeMemberPolicy | EventTypeSmartSyncChangePolicy | EventTypeSmartSyncNotOptOut | EventTypeSmartSyncOptOut | EventTypeSsoChangePolicy | EventTypeTfaChangePolicy | EventTypeTwoAccountChangePolicy | EventTypeWebSessionsChangeFixedLengthPolicy | EventTypeWebSessionsChangeIdleLengthPolicy | EventTypeTeamProfileAddLogo | EventTypeTeamProfileChangeLogo | EventTypeTeamProfileChangeName | EventTypeTeamProfileRemoveLogo | EventTypeTfaAddBackupPhone | EventTypeTfaAddSecurityKey | EventTypeTfaChangeBackupPhone | EventTypeTfaChangeStatus | EventTypeTfaRemoveBackupPhone | EventTypeTfaRemoveSecurityKey | EventTypeTfaReset | EventTypeOther;

    /**
     * Accepted or opted out of extended version history.
     */
    interface ExtendedVersionHistoryChangePolicyDetails {
      /**
       * New extended version history policy.
       */
      new_value: ExtendedVersionHistoryPolicy;
      /**
       * Previous extended version history policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: ExtendedVersionHistoryPolicy;
    }

    interface ExtendedVersionHistoryPolicyLimited {
      '.tag': 'limited';
    }

    interface ExtendedVersionHistoryPolicyUnlimited {
      '.tag': 'unlimited';
    }

    interface ExtendedVersionHistoryPolicyOther {
      '.tag': 'other';
    }

    type ExtendedVersionHistoryPolicy = ExtendedVersionHistoryPolicyLimited | ExtendedVersionHistoryPolicyUnlimited | ExtendedVersionHistoryPolicyOther;

    /**
     * Provides details about a failure
     */
    interface FailureDetailsLogInfo {
      /**
       * A user friendly explanation of the error. Might be missing due to
       * historical data gap.
       */
      user_friendly_message?: string;
      /**
       * A technical explanation of the error. This is relevant for some errors.
       */
      technical_error_message?: string;
    }

    /**
     * Added a file comment.
     */
    interface FileAddCommentDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Added files and/or folders.
     */
    interface FileAddDetails {
    }

    /**
     * Enabled or disabled commenting on team files.
     */
    interface FileCommentsChangePolicyDetails {
      /**
       * New commenting on team files policy.
       */
      new_value: FileCommentsPolicy;
      /**
       * Previous commenting on team files policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: FileCommentsPolicy;
    }

    interface FileCommentsPolicyDisabled {
      '.tag': 'disabled';
    }

    interface FileCommentsPolicyEnabled {
      '.tag': 'enabled';
    }

    interface FileCommentsPolicyOther {
      '.tag': 'other';
    }

    /**
     * File comments policy
     */
    type FileCommentsPolicy = FileCommentsPolicyDisabled | FileCommentsPolicyEnabled | FileCommentsPolicyOther;

    /**
     * Copied files and/or folders.
     */
    interface FileCopyDetails {
      /**
       * Relocate action details.
       */
      relocate_action_details: Array<RelocateAssetReferencesLogInfo>;
    }

    /**
     * Deleted files and/or folders.
     */
    interface FileDeleteDetails {
    }

    /**
     * Downloaded files and/or folders.
     */
    interface FileDownloadDetails {
    }

    /**
     * Edited files.
     */
    interface FileEditDetails {
    }

    /**
     * Create a copy reference to a file or folder.
     */
    interface FileGetCopyReferenceDetails {
    }

    /**
     * Liked a file comment.
     */
    interface FileLikeCommentDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * File's logged information.
     */
    interface FileLogInfo extends FileOrFolderLogInfo {
    }

    /**
     * Moved files and/or folders.
     */
    interface FileMoveDetails {
      /**
       * Relocate action details.
       */
      relocate_action_details: Array<RelocateAssetReferencesLogInfo>;
    }

    /**
     * Generic information relevant both for files and folders
     */
    interface FileOrFolderLogInfo {
      /**
       * Path relative to event context.
       */
      path: PathLogInfo;
      /**
       * Display name. Might be missing due to historical data gap.
       */
      display_name?: string;
      /**
       * Unique ID. Might be missing due to historical data gap.
       */
      file_id?: string;
    }

    /**
     * Permanently deleted files and/or folders.
     */
    interface FilePermanentlyDeleteDetails {
    }

    /**
     * Previewed files and/or folders.
     */
    interface FilePreviewDetails {
    }

    /**
     * Renamed files and/or folders.
     */
    interface FileRenameDetails {
      /**
       * Relocate action details.
       */
      relocate_action_details: Array<RelocateAssetReferencesLogInfo>;
    }

    /**
     * Added a deadline to a file request.
     */
    interface FileRequestAddDeadlineDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Changed the file request folder.
     */
    interface FileRequestChangeFolderDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Change the file request title.
     */
    interface FileRequestChangeTitleDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Closed a file request.
     */
    interface FileRequestCloseDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Created a file request.
     */
    interface FileRequestCreateDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Received files for a file request.
     */
    interface FileRequestReceiveFileDetails {
      /**
       * File request title.
       */
      request_title: string;
      /**
       * Submitted file names.
       */
      submitted_file_names: Array<string>;
    }

    /**
     * Removed the file request deadline.
     */
    interface FileRequestRemoveDeadlineDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Sent file request to users via email.
     */
    interface FileRequestSendDetails {
      /**
       * File request title.
       */
      request_title: string;
    }

    /**
     * Enabled or disabled file requests.
     */
    interface FileRequestsChangePolicyDetails {
      /**
       * New file requests policy.
       */
      new_value: FileRequestsPolicy;
      /**
       * Previous file requests policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: FileRequestsPolicy;
    }

    /**
     * Enabled file request emails for everyone.
     */
    interface FileRequestsEmailsEnabledDetails {
    }

    /**
     * Allowed file request emails for the team.
     */
    interface FileRequestsEmailsRestrictedToTeamOnlyDetails {
    }

    interface FileRequestsPolicyDisabled {
      '.tag': 'disabled';
    }

    interface FileRequestsPolicyEnabled {
      '.tag': 'enabled';
    }

    interface FileRequestsPolicyOther {
      '.tag': 'other';
    }

    /**
     * File requests policy
     */
    type FileRequestsPolicy = FileRequestsPolicyDisabled | FileRequestsPolicyEnabled | FileRequestsPolicyOther;

    /**
     * Restored deleted files and/or folders.
     */
    interface FileRestoreDetails {
    }

    /**
     * Reverted files to a previous version.
     */
    interface FileRevertDetails {
    }

    /**
     * Rolled back file change location changes.
     */
    interface FileRollbackChangesDetails {
    }

    /**
     * Save a file or folder using a copy reference.
     */
    interface FileSaveCopyReferenceDetails {
      /**
       * Relocate action details.
       */
      relocate_action_details: Array<RelocateAssetReferencesLogInfo>;
    }

    /**
     * Unliked a file comment.
     */
    interface FileUnlikeCommentDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Folder's logged information.
     */
    interface FolderLogInfo extends FileOrFolderLogInfo {
    }

    /**
     * Geographic location details.
     */
    interface GeoLocationLogInfo {
      /**
       * City name.
       */
      city?: string;
      /**
       * Region name.
       */
      region?: string;
      /**
       * Country code.
       */
      country?: string;
      /**
       * IP address.
       */
      ip_address: IpAddress;
    }

    interface GetTeamEventsArg {
      /**
       * Defaults to 1000.
       */
      limit?: number;
      /**
       * Filter the events by account ID. Return ony events with this account_id
       * as either Actor, Context, or Participants.
       */
      account_id?: users_common.AccountId;
      /**
       * Filter by time range.
       */
      time?: team_common.TimeRange;
      /**
       * Filter the returned events to a single category.
       */
      category?: EventCategory;
    }

    interface GetTeamEventsContinueArg {
      /**
       * Indicates from what point to get the next set of events.
       */
      cursor: string;
    }

    /**
     * Bad cursor.
     */
    interface GetTeamEventsContinueErrorBadCursor {
      '.tag': 'bad_cursor';
    }

    interface GetTeamEventsContinueErrorOther {
      '.tag': 'other';
    }

    /**
     * Errors that can be raised when calling getEventsContinue().
     */
    type GetTeamEventsContinueError = GetTeamEventsContinueErrorBadCursor | GetTeamEventsContinueErrorOther;

    /**
     * No user found matching the provided account_id.
     */
    interface GetTeamEventsErrorAccountIdNotFound {
      '.tag': 'account_id_not_found';
    }

    /**
     * Invalid time range.
     */
    interface GetTeamEventsErrorInvalidTimeRange {
      '.tag': 'invalid_time_range';
    }

    interface GetTeamEventsErrorOther {
      '.tag': 'other';
    }

    /**
     * Errors that can be raised when calling getEvents().
     */
    type GetTeamEventsError = GetTeamEventsErrorAccountIdNotFound | GetTeamEventsErrorInvalidTimeRange | GetTeamEventsErrorOther;

    interface GetTeamEventsResult {
      /**
       * List of events.
       */
      events: Array<TeamEvent>;
      /**
       * Pass the cursor into getEventsContinue() to obtain additional events.
       */
      cursor: string;
      /**
       * Is true if there are additional events that have not been returned yet.
       * An additional call to getEventsContinue() can retrieve them.
       */
      has_more: boolean;
    }

    /**
     * Enabled or disabled Google single sign-on for the team.
     */
    interface GoogleSsoChangePolicyDetails {
      /**
       * New Google single sign-on policy.
       */
      new_value: GoogleSsoPolicy;
      /**
       * Previous Google single sign-on policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: GoogleSsoPolicy;
    }

    interface GoogleSsoPolicyDisabled {
      '.tag': 'disabled';
    }

    interface GoogleSsoPolicyEnabled {
      '.tag': 'enabled';
    }

    interface GoogleSsoPolicyOther {
      '.tag': 'other';
    }

    /**
     * Google SSO policy
     */
    type GoogleSsoPolicy = GoogleSsoPolicyDisabled | GoogleSsoPolicyEnabled | GoogleSsoPolicyOther;

    /**
     * Added an external ID for group.
     */
    interface GroupAddExternalIdDetails {
      /**
       * Current external id.
       */
      new_value: team_common.GroupExternalId;
    }

    /**
     * Added team members to a group.
     */
    interface GroupAddMemberDetails {
      /**
       * Is group owner.
       */
      is_group_owner: boolean;
    }

    /**
     * Changed the external ID for group.
     */
    interface GroupChangeExternalIdDetails {
      /**
       * Current external id.
       */
      new_value: team_common.GroupExternalId;
      /**
       * Old external id.
       */
      previous_value: team_common.GroupExternalId;
    }

    /**
     * Changed group management type.
     */
    interface GroupChangeManagementTypeDetails {
      /**
       * New group management type.
       */
      new_value: GroupManagementType;
      /**
       * Previous group management type. Might be missing due to historical data
       * gap.
       */
      previous_value?: GroupManagementType;
    }

    /**
     * Changed the manager permissions belonging to a group member.
     */
    interface GroupChangeMemberRoleDetails {
      /**
       * Is group owner.
       */
      is_group_owner: boolean;
    }

    /**
     * Created a group.
     */
    interface GroupCreateDetails {
      /**
       * Is admin managed group. Might be missing due to historical data gap.
       */
      is_admin_managed?: boolean;
      /**
       * Group join policy.
       */
      join_policy: GroupJoinPolicy;
    }

    /**
     * Deleted a group.
     */
    interface GroupDeleteDetails {
      /**
       * Is admin managed group. Might be missing due to historical data gap.
       */
      is_admin_managed?: boolean;
    }

    /**
     * Updated a group.
     */
    interface GroupDescriptionUpdatedDetails {
    }

    interface GroupJoinPolicyOpen {
      '.tag': 'open';
    }

    interface GroupJoinPolicyRequestToJoin {
      '.tag': 'request_to_join';
    }

    interface GroupJoinPolicyOther {
      '.tag': 'other';
    }

    type GroupJoinPolicy = GroupJoinPolicyOpen | GroupJoinPolicyRequestToJoin | GroupJoinPolicyOther;

    /**
     * Updated a group join policy.
     */
    interface GroupJoinPolicyUpdatedDetails {
      /**
       * Is admin managed group. Might be missing due to historical data gap.
       */
      is_admin_managed?: boolean;
      /**
       * Group join policy.
       */
      join_policy: GroupJoinPolicy;
    }

    /**
     * Group's logged information.
     */
    interface GroupLogInfo {
      /**
       * The unique id of this group. Might be missing due to historical data
       * gap.
       */
      group_id?: team_common.GroupId;
      /**
       * The name of this group.
       */
      display_name: string;
      /**
       * External group ID. Might be missing due to historical data gap.
       */
      external_id?: team_common.GroupExternalId;
    }

    interface GroupManagementTypeAdminManagementGroup {
      '.tag': 'admin_management_group';
    }

    interface GroupManagementTypeMemberManagementGroup {
      '.tag': 'member_management_group';
    }

    interface GroupManagementTypeOther {
      '.tag': 'other';
    }

    type GroupManagementType = GroupManagementTypeAdminManagementGroup | GroupManagementTypeMemberManagementGroup | GroupManagementTypeOther;

    /**
     * Moved a group.
     */
    interface GroupMovedDetails {
    }

    /**
     * Removed the external ID for group.
     */
    interface GroupRemoveExternalIdDetails {
      /**
       * Old external id.
       */
      previous_value: team_common.GroupExternalId;
    }

    /**
     * Removed team members from a group.
     */
    interface GroupRemoveMemberDetails {
    }

    /**
     * Renamed a group.
     */
    interface GroupRenameDetails {
      /**
       * Previous display name.
       */
      previous_value: string;
    }

    /**
     * Changed who can create groups.
     */
    interface GroupUserManagementChangePolicyDetails {
      /**
       * New group users management policy.
       */
      new_value: GroupUserManagementPolicy;
      /**
       * Previous group users management policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: GroupUserManagementPolicy;
    }

    interface GroupUserManagementPolicyAllUsers {
      '.tag': 'all_users';
    }

    interface GroupUserManagementPolicyOnlyAdmins {
      '.tag': 'only_admins';
    }

    interface GroupUserManagementPolicyOther {
      '.tag': 'other';
    }

    type GroupUserManagementPolicy = GroupUserManagementPolicyAllUsers | GroupUserManagementPolicyOnlyAdmins | GroupUserManagementPolicyOther;

    /**
     * Host details.
     */
    interface HostLogInfo {
      /**
       * Host ID. Might be missing due to historical data gap.
       */
      host_id?: number;
      /**
       * Host name. Might be missing due to historical data gap.
       */
      host_name?: string;
    }

    /**
     * Additional information relevant when a new member joins the team.
     */
    interface JoinTeamDetails {
      /**
       * Linked applications.
       */
      linked_apps: Array<UserOrTeamLinkedAppLogInfoReference|UserLinkedAppLogInfoReference|TeamLinkedAppLogInfoReference|AppLogInfoReference>;
      /**
       * Linked devices.
       */
      linked_devices: Array<DeviceLogInfo>;
      /**
       * Linked shared folders.
       */
      linked_shared_folders: Array<FolderLogInfo>;
    }

    interface LinkAudiencePublic {
      '.tag': 'public';
    }

    interface LinkAudienceTeam {
      '.tag': 'team';
    }

    interface LinkAudienceMembers {
      '.tag': 'members';
    }

    interface LinkAudienceOther {
      '.tag': 'other';
    }

    type LinkAudience = LinkAudiencePublic | LinkAudienceTeam | LinkAudienceMembers | LinkAudienceOther;

    /**
     * Signed out.
     */
    interface LogoutDetails {
    }

    /**
     * Set team member name when joining team.
     */
    interface MemberAddNameDetails {
      /**
       * User's name.
       */
      value: UserNameLogInfo;
    }

    /**
     * Change the admin role belonging to team member.
     */
    interface MemberChangeAdminRoleDetails {
      /**
       * New admin role. This field is relevant when the admin role is changed
       * or whenthe user role changes from no admin rights to with admin rights.
       */
      new_value?: AdminRole;
      /**
       * Previous admin role. This field is relevant when the admin role is
       * changed or when the admin role is removed.
       */
      previous_value?: AdminRole;
    }

    /**
     * Changed team member email address.
     */
    interface MemberChangeEmailDetails {
      /**
       * New email.
       */
      new_value: common.EmailAddress;
      /**
       * Previous email. Might be missing due to historical data gap.
       */
      previous_value?: common.EmailAddress;
    }

    /**
     * Changed the membership type (limited vs full) for team member.
     */
    interface MemberChangeMembershipTypeDetails {
      /**
       * Previous membership type.
       */
      prev_value: TeamMembershipType;
      /**
       * New membership type.
       */
      new_value: TeamMembershipType;
    }

    /**
     * Changed team member name.
     */
    interface MemberChangeNameDetails {
      /**
       * New user's name.
       */
      new_value: UserNameLogInfo;
      /**
       * Previous user's name.
       */
      previous_value: UserNameLogInfo;
    }

    /**
     * Changed the membership status of a team member.
     */
    interface MemberChangeStatusDetails {
      /**
       * Previous member status. Might be missing due to historical data gap.
       */
      previous_value?: MemberStatus;
      /**
       * New member status.
       */
      new_value: MemberStatus;
      /**
       * Additional information relevant when a new member joins the team.
       */
      team_join_details?: JoinTeamDetails;
    }

    /**
     * Permanently deleted contents of a removed team member account.
     */
    interface MemberPermanentlyDeleteAccountContentsDetails {
    }

    /**
     * Changed whether users can find the team when not invited.
     */
    interface MemberRequestsChangePolicyDetails {
      /**
       * New member change requests policy.
       */
      new_value: MemberRequestsPolicy;
      /**
       * Previous member change requests policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: MemberRequestsPolicy;
    }

    interface MemberRequestsPolicyDisabled {
      '.tag': 'disabled';
    }

    interface MemberRequestsPolicyRequireApproval {
      '.tag': 'require_approval';
    }

    interface MemberRequestsPolicyAutoApproval {
      '.tag': 'auto_approval';
    }

    interface MemberRequestsPolicyOther {
      '.tag': 'other';
    }

    type MemberRequestsPolicy = MemberRequestsPolicyDisabled | MemberRequestsPolicyRequireApproval | MemberRequestsPolicyAutoApproval | MemberRequestsPolicyOther;

    /**
     * Added an exception for one or more team members to bypass space limits
     * imposed by policy.
     */
    interface MemberSpaceLimitsAddExceptionDetails {
    }

    /**
     * Changed the storage limits applied to team members by policy.
     */
    interface MemberSpaceLimitsChangePolicyDetails {
      /**
       * Previous storage limits policy.
       */
      previous_value: SpaceLimitsLevel;
      /**
       * New storage limits policy.
       */
      new_value: SpaceLimitsLevel;
    }

    /**
     * Changed the status with respect to whether the team member is under or
     * over storage quota specified by policy.
     */
    interface MemberSpaceLimitsChangeStatusDetails {
      /**
       * Previous storage quota status.
       */
      previous_value: SpaceLimitsStatus;
      /**
       * New storage quota status.
       */
      new_value: SpaceLimitsStatus;
    }

    /**
     * Removed an exception for one or more team members to bypass space limits
     * imposed by policy.
     */
    interface MemberSpaceLimitsRemoveExceptionDetails {
    }

    interface MemberStatusNotJoined {
      '.tag': 'not_joined';
    }

    interface MemberStatusInvited {
      '.tag': 'invited';
    }

    interface MemberStatusActive {
      '.tag': 'active';
    }

    interface MemberStatusSuspended {
      '.tag': 'suspended';
    }

    interface MemberStatusRemoved {
      '.tag': 'removed';
    }

    interface MemberStatusOther {
      '.tag': 'other';
    }

    type MemberStatus = MemberStatusNotJoined | MemberStatusInvited | MemberStatusActive | MemberStatusSuspended | MemberStatusRemoved | MemberStatusOther;

    /**
     * Suggested a new team member to be added to the team.
     */
    interface MemberSuggestDetails {
    }

    /**
     * Enabled or disabled the option for team members to suggest new members to
     * add to the team.
     */
    interface MemberSuggestionsChangePolicyDetails {
      /**
       * New team member suggestions policy.
       */
      new_value: MemberSuggestionsPolicy;
      /**
       * Previous team member suggestions policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: MemberSuggestionsPolicy;
    }

    interface MemberSuggestionsPolicyDisabled {
      '.tag': 'disabled';
    }

    interface MemberSuggestionsPolicyEnabled {
      '.tag': 'enabled';
    }

    interface MemberSuggestionsPolicyOther {
      '.tag': 'other';
    }

    /**
     * Member suggestions policy
     */
    type MemberSuggestionsPolicy = MemberSuggestionsPolicyDisabled | MemberSuggestionsPolicyEnabled | MemberSuggestionsPolicyOther;

    /**
     * Transferred contents of a removed team member account to another member.
     */
    interface MemberTransferAccountContentsDetails {
      /**
       * Source asset index.
       */
      src_index: number;
      /**
       * Destination asset index.
       */
      dest_index: number;
    }

    /**
     * Enabled or disabled the Microsoft Office add-in, which lets team members
     * save files to Dropbox directly from Microsoft Office.
     */
    interface MicrosoftOfficeAddinChangePolicyDetails {
      /**
       * New Microsoft Office addin policy.
       */
      new_value: MicrosoftOfficeAddinPolicy;
      /**
       * Previous Microsoft Office addin policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: MicrosoftOfficeAddinPolicy;
    }

    interface MicrosoftOfficeAddinPolicyDisabled {
      '.tag': 'disabled';
    }

    interface MicrosoftOfficeAddinPolicyEnabled {
      '.tag': 'enabled';
    }

    interface MicrosoftOfficeAddinPolicyOther {
      '.tag': 'other';
    }

    /**
     * Microsoft Office addin policy
     */
    type MicrosoftOfficeAddinPolicy = MicrosoftOfficeAddinPolicyDisabled | MicrosoftOfficeAddinPolicyEnabled | MicrosoftOfficeAddinPolicyOther;

    /**
     * An indication that an event was returned with missing details
     */
    interface MissingDetails {
    }

    /**
     * Mobile session.
     */
    interface MobileSessionLogInfo extends SessionLogInfo {
    }

    /**
     * Reference to the MobileSessionLogInfo type, identified by the value of
     * the .tag property.
     */
    interface MobileSessionLogInfoReference extends MobileSessionLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'mobile';
    }

    /**
     * Namespace relative path details.
     */
    interface NamespaceRelativePathLogInfo {
      /**
       * Namespace ID. Might be missing due to historical data gap.
       */
      ns_id?: common.NamespaceId;
      /**
       * A path relative to the specified namespace ID. Might be missing due to
       * historical data gap.
       */
      relative_path?: files.Path;
    }

    /**
     * Enabled or disabled network control.
     */
    interface NetworkControlChangePolicyDetails {
      /**
       * New network control policy.
       */
      new_value: NetworkControlPolicy;
      /**
       * Previous network control policy. Might be missing due to historical
       * data gap.
       */
      previous_value?: NetworkControlPolicy;
    }

    interface NetworkControlPolicyDisabled {
      '.tag': 'disabled';
    }

    interface NetworkControlPolicyEnabled {
      '.tag': 'enabled';
    }

    interface NetworkControlPolicyOther {
      '.tag': 'other';
    }

    /**
     * Network control policy
     */
    type NetworkControlPolicy = NetworkControlPolicyDisabled | NetworkControlPolicyEnabled | NetworkControlPolicyOther;

    /**
     * Non team member's logged information.
     */
    interface NonTeamMemberLogInfo extends UserLogInfo {
    }

    /**
     * Reference to the NonTeamMemberLogInfo type, identified by the value of
     * the .tag property.
     */
    interface NonTeamMemberLogInfoReference extends NonTeamMemberLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'non_team_member';
    }

    /**
     * Changed a Paper document to be invite-only.
     */
    interface NoteAclInviteOnlyDetails {
    }

    /**
     * Changed a Paper document to be link accessible.
     */
    interface NoteAclLinkDetails {
    }

    /**
     * Changed a Paper document to be link accessible for the team.
     */
    interface NoteAclTeamLinkDetails {
    }

    /**
     * Shared Paper document received.
     */
    interface NoteShareReceiveDetails {
    }

    /**
     * Shared a Paper doc.
     */
    interface NoteSharedDetails {
    }

    /**
     * Opened a shared Paper doc.
     */
    interface OpenNoteSharedDetails {
    }

    /**
     * The origin from which the actor performed the action.
     */
    interface OriginLogInfo {
      /**
       * Geographic location details.
       */
      geo_location?: GeoLocationLogInfo;
      /**
       * Host details.
       */
      host?: HostLogInfo;
      /**
       * The method that was used to perform the action.
       */
      access_method: AccessMethodLogInfo;
    }

    interface PaperAccessTypeViewer {
      '.tag': 'viewer';
    }

    interface PaperAccessTypeCommenter {
      '.tag': 'commenter';
    }

    interface PaperAccessTypeEditor {
      '.tag': 'editor';
    }

    interface PaperAccessTypeOther {
      '.tag': 'other';
    }

    type PaperAccessType = PaperAccessTypeViewer | PaperAccessTypeCommenter | PaperAccessTypeEditor | PaperAccessTypeOther;

    /**
     * Changed whether Dropbox Paper, when enabled, is deployed to all teams or
     * to specific members of the team.
     */
    interface PaperChangeDeploymentPolicyDetails {
      /**
       * New Dropbox Paper deployment policy.
       */
      new_value: PaperDeploymentPolicy;
      /**
       * Previous Dropbox Paper deployment policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: PaperDeploymentPolicy;
    }

    /**
     * Changed whether team members can share Paper documents externally (i.e.
     * outside the team), and if so, whether they should be accessible only by
     * team members or anyone by default.
     */
    interface PaperChangeMemberPolicyDetails {
      /**
       * New paper external accessibility policy.
       */
      new_value: PaperMemberPolicy;
      /**
       * Previous paper external accessibility policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: PaperMemberPolicy;
    }

    /**
     * Enabled or disabled Dropbox Paper for the team.
     */
    interface PaperChangePolicyDetails {
      /**
       * New Dropbox Paper policy.
       */
      new_value: PaperPolicy;
      /**
       * Previous Dropbox Paper policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: PaperPolicy;
    }

    /**
     * Added users to the membership of a Paper doc or folder.
     */
    interface PaperContentAddMemberDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Added Paper doc or folder to a folder.
     */
    interface PaperContentAddToFolderDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Parent asset index.
       */
      parent_index: number;
    }

    /**
     * Archived Paper doc or folder.
     */
    interface PaperContentArchiveDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Followed or unfollowed a Paper doc or folder.
     */
    interface PaperContentChangeSubscriptionDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * New subscription level.
       */
      new_subscription_level: PaperTaggedValue;
      /**
       * Previous subscription level. Might be missing due to historical data
       * gap.
       */
      previous_subscription_level?: PaperTaggedValue;
    }

    /**
     * Created a Paper doc or folder.
     */
    interface PaperContentCreateDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Permanently deleted a Paper doc or folder.
     */
    interface PaperContentPermanentlyDeleteDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Removed Paper doc or folder from a folder.
     */
    interface PaperContentRemoveFromFolderDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Removed a user from the membership of a Paper doc or folder.
     */
    interface PaperContentRemoveMemberDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Renamed Paper doc or folder.
     */
    interface PaperContentRenameDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Restored an archived Paper doc or folder.
     */
    interface PaperContentRestoreDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    interface PaperDeploymentPolicyPartial {
      '.tag': 'partial';
    }

    interface PaperDeploymentPolicyFull {
      '.tag': 'full';
    }

    interface PaperDeploymentPolicyOther {
      '.tag': 'other';
    }

    type PaperDeploymentPolicy = PaperDeploymentPolicyPartial | PaperDeploymentPolicyFull | PaperDeploymentPolicyOther;

    /**
     * Added a Paper doc comment.
     */
    interface PaperDocAddCommentDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Changed the access type of a Paper doc member.
     */
    interface PaperDocChangeMemberRoleDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Paper doc access type.
       */
      access_type: PaperAccessType;
    }

    /**
     * Changed the sharing policy for Paper doc.
     */
    interface PaperDocChangeSharingPolicyDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Sharing policy with external users. Might be missing due to historical
       * data gap.
       */
      public_sharing_policy?: string;
      /**
       * Sharing policy with team. Might be missing due to historical data gap.
       */
      team_sharing_policy?: string;
    }

    /**
     * Deleted a Paper doc comment.
     */
    interface PaperDocDeleteCommentDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Paper doc archived.
     */
    interface PaperDocDeletedDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Downloaded a Paper doc in a particular output format.
     */
    interface PaperDocDownloadDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Export file format.
       */
      export_file_format: PaperDownloadFormat;
    }

    /**
     * Edited a Paper doc comment.
     */
    interface PaperDocEditCommentDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Edited a Paper doc.
     */
    interface PaperDocEditDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Followed a Paper doc.
     */
    interface PaperDocFollowedDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Mentioned a member in a Paper doc.
     */
    interface PaperDocMentionDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Requested to be a member on a Paper doc.
     */
    interface PaperDocRequestAccessDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Paper doc comment resolved.
     */
    interface PaperDocResolveCommentDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Restored a Paper doc to previous revision.
     */
    interface PaperDocRevertDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Paper doc link shared via slack.
     */
    interface PaperDocSlackShareDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Paper doc shared with team member.
     */
    interface PaperDocTeamInviteDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Unresolved a Paper doc comment.
     */
    interface PaperDocUnresolveCommentDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
      /**
       * Comment text. Might be missing due to historical data gap.
       */
      comment_text?: string;
    }

    /**
     * Viewed Paper doc.
     */
    interface PaperDocViewDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Paper document's logged information.
     */
    interface PaperDocumentLogInfo {
      /**
       * Papers document Id.
       */
      doc_id: string;
      /**
       * Paper document title.
       */
      doc_title: string;
    }

    interface PaperDownloadFormatDocx {
      '.tag': 'docx';
    }

    interface PaperDownloadFormatHtml {
      '.tag': 'html';
    }

    interface PaperDownloadFormatMarkdown {
      '.tag': 'markdown';
    }

    interface PaperDownloadFormatOther {
      '.tag': 'other';
    }

    type PaperDownloadFormat = PaperDownloadFormatDocx | PaperDownloadFormatHtml | PaperDownloadFormatMarkdown | PaperDownloadFormatOther;

    /**
     * Users added to Paper enabled users list.
     */
    interface PaperEnabledUsersGroupAdditionDetails {
    }

    /**
     * Users removed from Paper enabled users list.
     */
    interface PaperEnabledUsersGroupRemovalDetails {
    }

    /**
     * Paper external sharing policy changed: anyone.
     */
    interface PaperExternalViewAllowDetails {
    }

    /**
     * Paper external sharing policy changed: default team.
     */
    interface PaperExternalViewDefaultTeamDetails {
    }

    /**
     * Paper external sharing policy changed: team-only.
     */
    interface PaperExternalViewForbidDetails {
    }

    /**
     * Paper folder archived.
     */
    interface PaperFolderDeletedDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Followed a Paper folder.
     */
    interface PaperFolderFollowedDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    /**
     * Paper folder's logged information.
     */
    interface PaperFolderLogInfo {
      /**
       * Papers folder Id.
       */
      folder_id: string;
      /**
       * Paper folder name.
       */
      folder_name: string;
    }

    /**
     * Paper folder shared with team member.
     */
    interface PaperFolderTeamInviteDetails {
      /**
       * Event unique identifier.
       */
      event_uuid: string;
    }

    interface PaperMemberPolicyTeamOnly {
      '.tag': 'team_only';
    }

    interface PaperMemberPolicyDefaultTeamOnly {
      '.tag': 'default_team_only';
    }

    interface PaperMemberPolicyDefaultAnyone {
      '.tag': 'default_anyone';
    }

    interface PaperMemberPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for controlling if team members can share Paper documents
     * externally.
     */
    type PaperMemberPolicy = PaperMemberPolicyTeamOnly | PaperMemberPolicyDefaultTeamOnly | PaperMemberPolicyDefaultAnyone | PaperMemberPolicyOther;

    interface PaperPolicyDisabled {
      '.tag': 'disabled';
    }

    interface PaperPolicyEnabled {
      '.tag': 'enabled';
    }

    interface PaperPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for enabling or disabling Dropbox Paper for the team.
     */
    type PaperPolicy = PaperPolicyDisabled | PaperPolicyEnabled | PaperPolicyOther;

    /**
     * Paper tagged value.
     */
    interface PaperTaggedValue {
      /**
       * Tag.
       */
      tag: string;
    }

    /**
     * User details.
     */
    interface ParticipantLogInfoUser {
      '.tag': 'user';
      user: TeamMemberLogInfoReference|NonTeamMemberLogInfoReference|UserLogInfoReference;
    }

    /**
     * Group details.
     */
    interface ParticipantLogInfoGroup {
      '.tag': 'group';
      group: GroupLogInfo;
    }

    interface ParticipantLogInfoOther {
      '.tag': 'other';
    }

    /**
     * A user or group
     */
    type ParticipantLogInfo = ParticipantLogInfoUser | ParticipantLogInfoGroup | ParticipantLogInfoOther;

    /**
     * Changed password.
     */
    interface PasswordChangeDetails {
    }

    /**
     * Failed to sign in using a password.
     */
    interface PasswordLoginFailDetails {
      /**
       * Login failure details.
       */
      error_details: FailureDetailsLogInfo;
    }

    /**
     * Signed in using a password.
     */
    interface PasswordLoginSuccessDetails {
    }

    /**
     * Reset all team member passwords.
     */
    interface PasswordResetAllDetails {
    }

    /**
     * Reset password.
     */
    interface PasswordResetDetails {
    }

    /**
     * Path's details.
     */
    interface PathLogInfo {
      /**
       * Fully qualified path relative to event's context. Might be missing due
       * to historical data gap.
       */
      contextual?: files.Path;
      /**
       * Path relative to the namespace containing the content.
       */
      namespace_relative: NamespaceRelativePathLogInfo;
    }

    /**
     * Enabled or disabled the ability of team members to permanently delete
     * content.
     */
    interface PermanentDeleteChangePolicyDetails {
      /**
       * New permanent delete content policy.
       */
      new_value: ContentPermanentDeletePolicy;
      /**
       * Previous permanent delete content policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: ContentPermanentDeletePolicy;
    }

    interface PlacementRestrictionEuropeOnly {
      '.tag': 'europe_only';
    }

    interface PlacementRestrictionNone {
      '.tag': 'none';
    }

    interface PlacementRestrictionOther {
      '.tag': 'other';
    }

    type PlacementRestriction = PlacementRestrictionEuropeOnly | PlacementRestrictionNone | PlacementRestrictionOther;

    /**
     * Provides the indices of the source asset and the destination asset for a
     * relocate action.
     */
    interface RelocateAssetReferencesLogInfo {
      /**
       * Source asset index.
       */
      src_index: number;
      /**
       * Destination asset index.
       */
      dest_index: number;
    }

    /**
     * Removed single sign-on logout URL.
     */
    interface RemoveLogoutUrlDetails {
      /**
       * Previous single sign-on logout URL.
       */
      previous_value: string;
      /**
       * New single sign-on logout URL. Might be missing due to historical data
       * gap.
       */
      new_value?: string;
    }

    /**
     * Changed the sign-out URL for SSO.
     */
    interface RemoveSsoUrlDetails {
      /**
       * Previous single sign-on logout URL.
       */
      previous_value: string;
    }

    /**
     * Reseller information.
     */
    interface ResellerLogInfo {
      /**
       * Reseller name.
       */
      reseller_name: string;
      /**
       * Reseller ID.
       */
      reseller_id: team_common.ResellerId;
    }

    /**
     * Ended reseller support session.
     */
    interface ResellerSupportSessionEndDetails {
    }

    /**
     * Started reseller support session.
     */
    interface ResellerSupportSessionStartDetails {
    }

    /**
     * Session's logged information.
     */
    interface SessionLogInfo {
      /**
       * Session ID. Might be missing due to historical data gap.
       */
      session_id?: common.SessionId;
    }

    /**
     * Reference to the SessionLogInfo polymorphic type. Contains a .tag
     * property to let you discriminate between possible subtypes.
     */
    interface SessionLogInfoReference extends SessionLogInfo {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "web"|"desktop"|"mobile";
    }

    /**
     * Added the team to a shared folder.
     */
    interface SfAddGroupDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Team name.
       */
      team_name: string;
    }

    /**
     * Allowed non collaborators to view links to files in a shared folder.
     */
    interface SfAllowNonMembersToViewSharedLinksDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Admin settings: team members see a warning before sharing folders outside
     * the team (DEPRECATED FEATURE).
     */
    interface SfExternalInviteWarnDetails {
    }

    /**
     * Invited a group to a shared folder.
     */
    interface SfInviteGroupDetails {
      /**
       * Target asset index.
       */
      target_index: number;
    }

    /**
     * Changed parent of shared folder.
     */
    interface SfNestDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Previous parent namespace ID. Might be missing due to historical data
       * gap.
       */
      prev_parent_ns_id?: common.NamespaceId;
      /**
       * New parent namespace ID. Might be missing due to historical data gap.
       */
      new_parent_ns_id?: common.NamespaceId;
    }

    /**
     * Declined a team member's invitation to a shared folder.
     */
    interface SfTeamDeclineDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Granted access to a shared folder.
     */
    interface SfTeamGrantAccessDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Changed a team member's role in a shared folder.
     */
    interface SfTeamInviteChangeRoleDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * New sharing permission. Might be missing due to historical data gap.
       */
      new_sharing_permission?: string;
      /**
       * Previous sharing permission. Might be missing due to historical data
       * gap.
       */
      previous_sharing_permission?: string;
    }

    /**
     * Invited team members to a shared folder.
     */
    interface SfTeamInviteDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
    }

    /**
     * Joined a team member's shared folder.
     */
    interface SfTeamJoinDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Joined a team member's shared folder from a link.
     */
    interface SfTeamJoinFromOobLinkDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Shared link token key.
       */
      token_key?: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
    }

    /**
     * Unshared a folder with a team member.
     */
    interface SfTeamUninviteDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Sent an email invitation to the membership of a shared file or folder.
     */
    interface SharedContentAddInviteesDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
    }

    /**
     * Added an expiry to the link for the shared file or folder.
     */
    interface SharedContentAddLinkExpiryDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * Expiration starting date.
       */
      expiration_start_date: string;
      /**
       * The number of days from the starting expiration date after which the
       * link will expire.
       */
      expiration_days: number;
    }

    /**
     * Added a password to the link for the shared file or folder.
     */
    interface SharedContentAddLinkPasswordDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Added users and/or groups to the membership of a shared file or folder.
     */
    interface SharedContentAddMemberDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Changed whether members can download the shared file or folder.
     */
    interface SharedContentChangeDownloadsPolicyDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * New downlaod policy.
       */
      new_value: SharedContentDownloadsPolicy;
      /**
       * Previous downlaod policy. Might be missing due to historical data gap.
       */
      previous_value?: SharedContentDownloadsPolicy;
    }

    /**
     * Changed the access type of an invitee to a shared file or folder before
     * the invitation was claimed.
     */
    interface SharedContentChangeInviteeRoleDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * New sharing permission. Might be missing due to historical data gap.
       */
      new_sharing_permission?: string;
      /**
       * Previous sharing permission. Might be missing due to historical data
       * gap.
       */
      previous_sharing_permission?: string;
    }

    /**
     * Changed the audience of the link for a shared file or folder.
     */
    interface SharedContentChangeLinkAudienceDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * New link audience value.
       */
      new_value: LinkAudience;
      /**
       * Previous link audience value. Might be missing due to historical data
       * gap.
       */
      previous_value?: LinkAudience;
    }

    /**
     * Changed the expiry of the link for the shared file or folder.
     */
    interface SharedContentChangeLinkExpiryDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * Expiration starting date.
       */
      expiration_start_date: string;
      /**
       * The number of days from the starting expiration date after which the
       * link will expire.
       */
      expiration_days: number;
    }

    /**
     * Changed the password on the link for the shared file or folder.
     */
    interface SharedContentChangeLinkPasswordDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Changed the access type of a shared file or folder member.
     */
    interface SharedContentChangeMemberRoleDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * New sharing permission. Might be missing due to historical data gap.
       */
      new_sharing_permission?: string;
      /**
       * Previous sharing permission. Might be missing due to historical data
       * gap.
       */
      previous_sharing_permission?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Changed whether members can see who viewed the shared file or folder.
     */
    interface SharedContentChangeViewerInfoPolicyDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * New viewer info policy.
       */
      new_value: SharedContentViewerInfoPolicy;
      /**
       * Previous view info policy. Might be missing due to historical data gap.
       */
      previous_value?: SharedContentViewerInfoPolicy;
    }

    /**
     * Claimed membership to a team member's shared folder.
     */
    interface SharedContentClaimInvitationDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared content link.
       */
      shared_content_link?: string;
    }

    /**
     * Copied the shared file or folder to own Dropbox.
     */
    interface SharedContentCopyDetails {
      /**
       * Shared content link.
       */
      shared_content_link: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Specifies the source and destination indices in the assets list.
       */
      relocate_action_details: RelocateAssetReferencesLogInfo;
    }

    /**
     * Downloaded the shared file or folder.
     */
    interface SharedContentDownloadDetails {
      /**
       * Shared content link.
       */
      shared_content_link: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Target asset index.
       */
      target_index: number;
    }

    interface SharedContentDownloadsPolicyDisabled {
      '.tag': 'disabled';
    }

    interface SharedContentDownloadsPolicyEnabled {
      '.tag': 'enabled';
    }

    interface SharedContentDownloadsPolicyOther {
      '.tag': 'other';
    }

    /**
     * Shared content downloads policy
     */
    type SharedContentDownloadsPolicy = SharedContentDownloadsPolicyDisabled | SharedContentDownloadsPolicyEnabled | SharedContentDownloadsPolicyOther;

    /**
     * Left the membership of a shared file or folder.
     */
    interface SharedContentRelinquishMembershipDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Removed an invitee from the membership of a shared file or folder before
     * it was claimed.
     */
    interface SharedContentRemoveInviteeDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Removed the expiry of the link for the shared file or folder.
     */
    interface SharedContentRemoveLinkExpiryDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Removed the password on the link for the shared file or folder.
     */
    interface SharedContentRemoveLinkPasswordDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Removed a user or a group from the membership of a shared file or folder.
     */
    interface SharedContentRemoveMemberDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
    }

    /**
     * Requested to be on the membership of a shared file or folder.
     */
    interface SharedContentRequestAccessDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
      /**
       * Shared content link.
       */
      shared_content_link?: string;
    }

    /**
     * Unshared a shared file or folder by clearing its membership and turning
     * off its link.
     */
    interface SharedContentUnshareDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name?: string;
    }

    /**
     * Previewed the shared file or folder.
     */
    interface SharedContentViewDetails {
      /**
       * Shared content link.
       */
      shared_content_link: string;
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Target asset index.
       */
      target_index: number;
    }

    interface SharedContentViewerInfoPolicyDisabled {
      '.tag': 'disabled';
    }

    interface SharedContentViewerInfoPolicyEnabled {
      '.tag': 'enabled';
    }

    interface SharedContentViewerInfoPolicyOther {
      '.tag': 'other';
    }

    /**
     * Shared content viewer info policy
     */
    type SharedContentViewerInfoPolicy = SharedContentViewerInfoPolicyDisabled | SharedContentViewerInfoPolicyEnabled | SharedContentViewerInfoPolicyOther;

    /**
     * Set or unset the confidential flag on a shared folder.
     */
    interface SharedFolderChangeConfidentialityDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * New confidentiality value.
       */
      new_value: Confidentiality;
      /**
       * Previous confidentiality value. Might be missing due to historical data
       * gap.
       */
      previous_value?: Confidentiality;
    }

    /**
     * Changed who can access the shared folder via a link.
     */
    interface SharedFolderChangeLinkPolicyDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * New shared folder link policy.
       */
      new_value: SharedFolderLinkPolicy;
      /**
       * Previous shared folder link policy. Might be missing due to historical
       * data gap.
       */
      previous_value?: SharedFolderLinkPolicy;
    }

    /**
     * Changed who can manage the membership of a shared folder.
     */
    interface SharedFolderChangeMemberManagementPolicyDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * New membership management policy.
       */
      new_value: SharedFolderMembershipManagementPolicy;
      /**
       * Previous membership management policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: SharedFolderMembershipManagementPolicy;
    }

    /**
     * Changed who can become a member of the shared folder.
     */
    interface SharedFolderChangeMemberPolicyDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
      /**
       * Shared folder type. Might be missing due to historical data gap.
       */
      shared_folder_type?: string;
      /**
       * New external invite policy.
       */
      new_value: SharedFolderMemberPolicy;
      /**
       * Previous external invite policy. Might be missing due to historical
       * data gap.
       */
      previous_value?: SharedFolderMemberPolicy;
    }

    /**
     * Created a shared folder.
     */
    interface SharedFolderCreateDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Parent namespace ID. Might be missing due to historical data gap.
       */
      parent_ns_id?: common.NamespaceId;
    }

    interface SharedFolderLinkPolicyMembersOnly {
      '.tag': 'members_only';
    }

    interface SharedFolderLinkPolicyMembersAndTeam {
      '.tag': 'members_and_team';
    }

    interface SharedFolderLinkPolicyAnyone {
      '.tag': 'anyone';
    }

    interface SharedFolderLinkPolicyOther {
      '.tag': 'other';
    }

    type SharedFolderLinkPolicy = SharedFolderLinkPolicyMembersOnly | SharedFolderLinkPolicyMembersAndTeam | SharedFolderLinkPolicyAnyone | SharedFolderLinkPolicyOther;

    interface SharedFolderMemberPolicyTeamOnly {
      '.tag': 'team_only';
    }

    interface SharedFolderMemberPolicyAnyone {
      '.tag': 'anyone';
    }

    interface SharedFolderMemberPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for controlling who can become a member of a shared folder
     */
    type SharedFolderMemberPolicy = SharedFolderMemberPolicyTeamOnly | SharedFolderMemberPolicyAnyone | SharedFolderMemberPolicyOther;

    interface SharedFolderMembershipManagementPolicyOwner {
      '.tag': 'owner';
    }

    interface SharedFolderMembershipManagementPolicyEditors {
      '.tag': 'editors';
    }

    interface SharedFolderMembershipManagementPolicyOther {
      '.tag': 'other';
    }

    type SharedFolderMembershipManagementPolicy = SharedFolderMembershipManagementPolicyOwner | SharedFolderMembershipManagementPolicyEditors | SharedFolderMembershipManagementPolicyOther;

    /**
     * Added a shared folder to own Dropbox.
     */
    interface SharedFolderMountDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Transferred the ownership of a shared folder to another member.
     */
    interface SharedFolderTransferOwnershipDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Deleted a shared folder from Dropbox.
     */
    interface SharedFolderUnmountDetails {
      /**
       * Target asset index.
       */
      target_index: number;
      /**
       * Original shared folder name.
       */
      original_folder_name: string;
    }

    /**
     * Shared Paper document was opened.
     */
    interface SharedNoteOpenedDetails {
    }

    /**
     * Changed whether team members can join shared folders owned externally
     * (i.e. outside the team).
     */
    interface SharingChangeFolderJoinPolicyDetails {
      /**
       * New external join policy.
       */
      new_value: SharingFolderJoinPolicy;
      /**
       * Previous external join policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: SharingFolderJoinPolicy;
    }

    /**
     * Changed whether team members can share links externally (i.e. outside the
     * team), and if so, whether links should be accessible only by team members
     * or anyone by default.
     */
    interface SharingChangeLinkPolicyDetails {
      /**
       * New external link accessibility policy.
       */
      new_value: SharingLinkPolicy;
      /**
       * Previous external link accessibility policy. Might be missing due to
       * historical data gap.
       */
      previous_value?: SharingLinkPolicy;
    }

    /**
     * Changed whether team members can share files and folders externally (i.e.
     * outside the team).
     */
    interface SharingChangeMemberPolicyDetails {
      /**
       * New external invite policy.
       */
      new_value: SharingMemberPolicy;
      /**
       * Previous external invite policy. Might be missing due to historical
       * data gap.
       */
      previous_value?: SharingMemberPolicy;
    }

    interface SharingFolderJoinPolicyTeamOnly {
      '.tag': 'team_only';
    }

    interface SharingFolderJoinPolicyAnyone {
      '.tag': 'anyone';
    }

    interface SharingFolderJoinPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for controlling if team members can join shared folders owned by
     * non team members.
     */
    type SharingFolderJoinPolicy = SharingFolderJoinPolicyTeamOnly | SharingFolderJoinPolicyAnyone | SharingFolderJoinPolicyOther;

    interface SharingLinkPolicyTeamOnly {
      '.tag': 'team_only';
    }

    interface SharingLinkPolicyDefaultTeamOnly {
      '.tag': 'default_team_only';
    }

    interface SharingLinkPolicyDefaultAnyone {
      '.tag': 'default_anyone';
    }

    interface SharingLinkPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for controlling if team members can share links externally
     */
    type SharingLinkPolicy = SharingLinkPolicyTeamOnly | SharingLinkPolicyDefaultTeamOnly | SharingLinkPolicyDefaultAnyone | SharingLinkPolicyOther;

    interface SharingMemberPolicyTeamOnly {
      '.tag': 'team_only';
    }

    interface SharingMemberPolicyAnyone {
      '.tag': 'anyone';
    }

    interface SharingMemberPolicyOther {
      '.tag': 'other';
    }

    /**
     * External sharing policy
     */
    type SharingMemberPolicy = SharingMemberPolicyTeamOnly | SharingMemberPolicyAnyone | SharingMemberPolicyOther;

    /**
     * Created a link to a file using an app.
     */
    interface ShmodelAppCreateDetails {
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Shared link token key.
       */
      token_key?: string;
    }

    /**
     * Created a new link.
     */
    interface ShmodelCreateDetails {
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Shared link token key.
       */
      token_key?: string;
    }

    /**
     * Removed a link.
     */
    interface ShmodelDisableDetails {
      /**
       * Sharing permission. Might be missing due to historical data gap.
       */
      sharing_permission?: string;
      /**
       * Shared link token key.
       */
      token_key?: string;
    }

    /**
     * Shared a link with Facebook users.
     */
    interface ShmodelFbShareDetails {
      /**
       * Sharing non member recipients.
       */
      sharing_non_member_recipients: Array<NonTeamMemberLogInfo>;
    }

    /**
     * Shared a link with a group.
     */
    interface ShmodelGroupShareDetails {
    }

    /**
     * Removed the expiration date from a link.
     */
    interface ShmodelRemoveExpirationDetails {
    }

    /**
     * Added an expiration date to a link.
     */
    interface ShmodelSetExpirationDetails {
      /**
       * Expiration starting date.
       */
      expiration_start_date: string;
      /**
       * The number of days from the starting expiration date after which the
       * link will expire.
       */
      expiration_days: number;
    }

    /**
     * Added a team member's file/folder to their Dropbox from a link.
     */
    interface ShmodelTeamCopyDetails {
    }

    /**
     * Downloaded a team member's file/folder from a link.
     */
    interface ShmodelTeamDownloadDetails {
    }

    /**
     * Shared a link with team members.
     */
    interface ShmodelTeamShareDetails {
    }

    /**
     * Opened a team member's link.
     */
    interface ShmodelTeamViewDetails {
    }

    /**
     * Password-protected a link.
     */
    interface ShmodelVisibilityPasswordDetails {
    }

    /**
     * Made a file/folder visible to anyone with the link.
     */
    interface ShmodelVisibilityPublicDetails {
    }

    /**
     * Made a file/folder visible only to team members with the link.
     */
    interface ShmodelVisibilityTeamOnlyDetails {
    }

    /**
     * Ended admin sign-in-as session.
     */
    interface SignInAsSessionEndDetails {
    }

    /**
     * Started admin sign-in-as session.
     */
    interface SignInAsSessionStartDetails {
    }

    /**
     * Changed the default Smart Sync policy for team members.
     */
    interface SmartSyncChangePolicyDetails {
      /**
       * New smart sync policy.
       */
      new_value: SmartSyncPolicy;
      /**
       * Previous smart sync policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: SmartSyncPolicy;
    }

    /**
     * Smart Sync non-admin devices report created.
     */
    interface SmartSyncCreateAdminPrivilegeReportDetails {
    }

    /**
     * Opted team into Smart Sync.
     */
    interface SmartSyncNotOptOutDetails {
      /**
       * Previous Smart Sync opt out policy.
       */
      previous_value: SmartSyncOptOutPolicy;
      /**
       * New Smart Sync opt out policy.
       */
      new_value: SmartSyncOptOutPolicy;
    }

    /**
     * Opted team out of Smart Sync.
     */
    interface SmartSyncOptOutDetails {
      /**
       * Previous Smart Sync opt out policy.
       */
      previous_value: SmartSyncOptOutPolicy;
      /**
       * New Smart Sync opt out policy.
       */
      new_value: SmartSyncOptOutPolicy;
    }

    interface SmartSyncOptOutPolicyOptedOut {
      '.tag': 'opted_out';
    }

    interface SmartSyncOptOutPolicyDefault {
      '.tag': 'default';
    }

    interface SmartSyncOptOutPolicyOther {
      '.tag': 'other';
    }

    type SmartSyncOptOutPolicy = SmartSyncOptOutPolicyOptedOut | SmartSyncOptOutPolicyDefault | SmartSyncOptOutPolicyOther;

    interface SmartSyncPolicyLocalOnly {
      '.tag': 'local_only';
    }

    interface SmartSyncPolicySynced {
      '.tag': 'synced';
    }

    interface SmartSyncPolicyOther {
      '.tag': 'other';
    }

    type SmartSyncPolicy = SmartSyncPolicyLocalOnly | SmartSyncPolicySynced | SmartSyncPolicyOther;

    interface SpaceLimitsLevelGenerous {
      '.tag': 'generous';
    }

    interface SpaceLimitsLevelModerate {
      '.tag': 'moderate';
    }

    interface SpaceLimitsLevelNoLimit {
      '.tag': 'no_limit';
    }

    interface SpaceLimitsLevelStrict {
      '.tag': 'strict';
    }

    interface SpaceLimitsLevelOther {
      '.tag': 'other';
    }

    type SpaceLimitsLevel = SpaceLimitsLevelGenerous | SpaceLimitsLevelModerate | SpaceLimitsLevelNoLimit | SpaceLimitsLevelStrict | SpaceLimitsLevelOther;

    interface SpaceLimitsStatusWithinQuota {
      '.tag': 'within_quota';
    }

    interface SpaceLimitsStatusNearQuota {
      '.tag': 'near_quota';
    }

    interface SpaceLimitsStatusOverQuota {
      '.tag': 'over_quota';
    }

    interface SpaceLimitsStatusOther {
      '.tag': 'other';
    }

    type SpaceLimitsStatus = SpaceLimitsStatusWithinQuota | SpaceLimitsStatusNearQuota | SpaceLimitsStatusOverQuota | SpaceLimitsStatusOther;

    /**
     * Changed the X.509 certificate for SSO.
     */
    interface SsoChangeCertDetails {
      /**
       * SSO certificate details.
       */
      certificate_details: Certificate;
    }

    /**
     * Changed the sign-in URL for SSO.
     */
    interface SsoChangeLoginUrlDetails {
      /**
       * Previous single sign-on login URL.
       */
      previous_value: string;
      /**
       * New single sign-on login URL.
       */
      new_value: string;
    }

    /**
     * Changed the sign-out URL for SSO.
     */
    interface SsoChangeLogoutUrlDetails {
      /**
       * Previous single sign-on logout URL.
       */
      previous_value: string;
      /**
       * New single sign-on logout URL. Might be missing due to historical data
       * gap.
       */
      new_value?: string;
    }

    /**
     * Change the single sign-on policy for the team.
     */
    interface SsoChangePolicyDetails {
      /**
       * New single sign-on policy.
       */
      new_value: SsoPolicy;
      /**
       * Previous single sign-on policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: SsoPolicy;
    }

    /**
     * Changed the SAML identity mode for SSO.
     */
    interface SsoChangeSamlIdentityModeDetails {
      /**
       * Previous single sign-on identity mode.
       */
      previous_value: number;
      /**
       * New single sign-on identity mode.
       */
      new_value: number;
    }

    /**
     * Failed to sign in using SSO.
     */
    interface SsoLoginFailDetails {
      /**
       * Login failure details.
       */
      error_details: FailureDetailsLogInfo;
    }

    interface SsoPolicyDisabled {
      '.tag': 'disabled';
    }

    interface SsoPolicyOptional {
      '.tag': 'optional';
    }

    interface SsoPolicyRequired {
      '.tag': 'required';
    }

    interface SsoPolicyOther {
      '.tag': 'other';
    }

    /**
     * SSO policy
     */
    type SsoPolicy = SsoPolicyDisabled | SsoPolicyOptional | SsoPolicyRequired | SsoPolicyOther;

    /**
     * Created a team activity report.
     */
    interface TeamActivityCreateReportDetails {
      /**
       * Report start date.
       */
      start_date: common.Date;
      /**
       * Report end date.
       */
      end_date: common.Date;
    }

    /**
     * An audit log event.
     */
    interface TeamEvent {
      /**
       * The Dropbox timestamp representing when the action was taken.
       */
      timestamp: common.DropboxTimestamp;
      /**
       * The category that this type of action belongs to.
       */
      event_category: EventCategory;
      /**
       * The entity who actually performed the action.
       */
      actor: ActorLogInfo;
      /**
       * The origin from which the actor performed the action including
       * information about host, ip address, location, session, etc. If the
       * action was performed programmatically via the API the origin represents
       * the API client.
       */
      origin?: OriginLogInfo;
      /**
       * Zero or more users and/or groups that are affected by the action. Note
       * that this list doesn't include any actors or users in context.
       */
      participants?: Array<ParticipantLogInfo>;
      /**
       * Zero or more content assets involved in the action. Currently these
       * include Dropbox files and folders but in the future we might add other
       * asset types such as Paper documents, folders, projects, etc.
       */
      assets?: Array<AssetLogInfo>;
      /**
       * True if the action involved a non team member either as the actor or as
       * one of the affected users.
       */
      involve_non_team_member: boolean;
      /**
       * The user or team on whose behalf the actor performed the action.
       */
      context: ContextLogInfo;
      /**
       * The particular type of action taken.
       */
      event_type: EventType;
      /**
       * The variable event schema applicable to this type of action,
       * instantiated with respect to this particular action.
       */
      details: EventDetails;
    }

    /**
     * Changed the archival status of a team folder.
     */
    interface TeamFolderChangeStatusDetails {
      /**
       * New team folder status.
       */
      new_value: TeamFolderStatus;
      /**
       * Previous team folder status. Might be missing due to historical data
       * gap.
       */
      previous_value?: TeamFolderStatus;
    }

    /**
     * Created a new team folder in active status.
     */
    interface TeamFolderCreateDetails {
    }

    /**
     * Downgraded a team folder to a regular shared folder.
     */
    interface TeamFolderDowngradeDetails {
      /**
       * Target asset index.
       */
      target_index: number;
    }

    /**
     * Permanently deleted an archived team folder.
     */
    interface TeamFolderPermanentlyDeleteDetails {
    }

    /**
     * Renamed an active or archived team folder.
     */
    interface TeamFolderRenameDetails {
      /**
       * Specifies the source and destination indices in the assets list.
       */
      relocate_action_details: RelocateAssetReferencesLogInfo;
    }

    interface TeamFolderStatusArchive {
      '.tag': 'archive';
    }

    interface TeamFolderStatusUnarchive {
      '.tag': 'unarchive';
    }

    interface TeamFolderStatusOther {
      '.tag': 'other';
    }

    type TeamFolderStatus = TeamFolderStatusArchive | TeamFolderStatusUnarchive | TeamFolderStatusOther;

    /**
     * Team linked app
     */
    interface TeamLinkedAppLogInfo extends AppLogInfo {
    }

    /**
     * Reference to the TeamLinkedAppLogInfo type, identified by the value of
     * the .tag property.
     */
    interface TeamLinkedAppLogInfoReference extends TeamLinkedAppLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'team_linked_app';
    }

    /**
     * Team member's logged information.
     */
    interface TeamMemberLogInfo extends UserLogInfo {
      /**
       * Team member ID. Might be missing due to historical data gap.
       */
      team_member_id?: team_common.TeamMemberId;
      /**
       * Team member external ID.
       */
      member_external_id?: team_common.MemberExternalId;
    }

    /**
     * Reference to the TeamMemberLogInfo type, identified by the value of the
     * .tag property.
     */
    interface TeamMemberLogInfoReference extends TeamMemberLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'team_member';
    }

    interface TeamMembershipTypeFree {
      '.tag': 'free';
    }

    interface TeamMembershipTypeFull {
      '.tag': 'full';
    }

    interface TeamMembershipTypeOther {
      '.tag': 'other';
    }

    type TeamMembershipType = TeamMembershipTypeFree | TeamMembershipTypeFull | TeamMembershipTypeOther;

    /**
     * Merged another team into this team.
     */
    interface TeamMergeFromDetails {
      /**
       * The name of the team that was merged into this team.
       */
      team_name: string;
    }

    /**
     * Merged this team into another team.
     */
    interface TeamMergeToDetails {
      /**
       * The name of the team that this team was merged into.
       */
      team_name: string;
    }

    /**
     * Team name details
     */
    interface TeamName {
      /**
       * Team's display name.
       */
      team_display_name: string;
      /**
       * Team's legal name.
       */
      team_legal_name: string;
    }

    /**
     * Added a team logo to be displayed on shared link headers.
     */
    interface TeamProfileAddLogoDetails {
    }

    /**
     * Changed the team logo to be displayed on shared link headers.
     */
    interface TeamProfileChangeLogoDetails {
    }

    /**
     * Changed the team name.
     */
    interface TeamProfileChangeNameDetails {
      /**
       * Previous teams name. Might be missing due to historical data gap.
       */
      previous_value?: TeamName;
      /**
       * New team name.
       */
      new_value: TeamName;
    }

    /**
     * Removed the team logo to be displayed on shared link headers.
     */
    interface TeamProfileRemoveLogoDetails {
    }

    /**
     * Added a backup phone for two-step verification.
     */
    interface TfaAddBackupPhoneDetails {
    }

    /**
     * Added a security key for two-step verification.
     */
    interface TfaAddSecurityKeyDetails {
    }

    /**
     * Changed the backup phone for two-step verification.
     */
    interface TfaChangeBackupPhoneDetails {
    }

    /**
     * Change two-step verification policy for the team.
     */
    interface TfaChangePolicyDetails {
      /**
       * New change policy.
       */
      new_value: TfaPolicy;
      /**
       * Previous change policy. Might be missing due to historical data gap.
       */
      previous_value?: TfaPolicy;
    }

    /**
     * Enabled, disabled or changed the configuration for two-step verification.
     */
    interface TfaChangeStatusDetails {
      /**
       * The new two factor authentication configuration.
       */
      new_value: TfaConfiguration;
      /**
       * The previous two factor authentication configuration. Might be missing
       * due to historical data gap.
       */
      previous_value?: TfaConfiguration;
      /**
       * Used two factor authentication rescue code. This flag is relevant when
       * the two factor authentication configuration is disabled.
       */
      used_rescue_code?: boolean;
    }

    interface TfaConfigurationDisabled {
      '.tag': 'disabled';
    }

    interface TfaConfigurationEnabled {
      '.tag': 'enabled';
    }

    interface TfaConfigurationSms {
      '.tag': 'sms';
    }

    interface TfaConfigurationAuthenticator {
      '.tag': 'authenticator';
    }

    interface TfaConfigurationOther {
      '.tag': 'other';
    }

    /**
     * Two factor authentication configuration. Note: the enabled option is
     * deprecated.
     */
    type TfaConfiguration = TfaConfigurationDisabled | TfaConfigurationEnabled | TfaConfigurationSms | TfaConfigurationAuthenticator | TfaConfigurationOther;

    interface TfaPolicyDisabled {
      '.tag': 'disabled';
    }

    interface TfaPolicyOptional {
      '.tag': 'optional';
    }

    interface TfaPolicyRequired {
      '.tag': 'required';
    }

    interface TfaPolicyOther {
      '.tag': 'other';
    }

    /**
     * Two factor authentication policy
     */
    type TfaPolicy = TfaPolicyDisabled | TfaPolicyOptional | TfaPolicyRequired | TfaPolicyOther;

    /**
     * Removed the backup phone for two-step verification.
     */
    interface TfaRemoveBackupPhoneDetails {
    }

    /**
     * Removed a security key for two-step verification.
     */
    interface TfaRemoveSecurityKeyDetails {
    }

    /**
     * Reset two-step verification for team member.
     */
    interface TfaResetDetails {
    }

    interface TimeUnitMilliseconds {
      '.tag': 'milliseconds';
    }

    interface TimeUnitSeconds {
      '.tag': 'seconds';
    }

    interface TimeUnitMinutes {
      '.tag': 'minutes';
    }

    interface TimeUnitHours {
      '.tag': 'hours';
    }

    interface TimeUnitDays {
      '.tag': 'days';
    }

    interface TimeUnitWeeks {
      '.tag': 'weeks';
    }

    interface TimeUnitMonths {
      '.tag': 'months';
    }

    interface TimeUnitYears {
      '.tag': 'years';
    }

    interface TimeUnitOther {
      '.tag': 'other';
    }

    type TimeUnit = TimeUnitMilliseconds | TimeUnitSeconds | TimeUnitMinutes | TimeUnitHours | TimeUnitDays | TimeUnitWeeks | TimeUnitMonths | TimeUnitYears | TimeUnitOther;

    /**
     * Enabled or disabled the option for team members to link a personal
     * Dropbox account in addition to their work account to the same computer.
     */
    interface TwoAccountChangePolicyDetails {
      /**
       * New two account policy.
       */
      new_value: TwoAccountPolicy;
      /**
       * Previous two account policy. Might be missing due to historical data
       * gap.
       */
      previous_value?: TwoAccountPolicy;
    }

    interface TwoAccountPolicyDisabled {
      '.tag': 'disabled';
    }

    interface TwoAccountPolicyEnabled {
      '.tag': 'enabled';
    }

    interface TwoAccountPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy for pairing personal account to work account
     */
    type TwoAccountPolicy = TwoAccountPolicyDisabled | TwoAccountPolicyEnabled | TwoAccountPolicyOther;

    /**
     * User linked app
     */
    interface UserLinkedAppLogInfo extends AppLogInfo {
    }

    /**
     * Reference to the UserLinkedAppLogInfo type, identified by the value of
     * the .tag property.
     */
    interface UserLinkedAppLogInfoReference extends UserLinkedAppLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'user_linked_app';
    }

    /**
     * User's logged information.
     */
    interface UserLogInfo {
      /**
       * User unique ID. Might be missing due to historical data gap.
       */
      account_id?: users_common.AccountId;
      /**
       * User display name. Might be missing due to historical data gap.
       */
      display_name?: common.DisplayName;
      /**
       * User email address. Might be missing due to historical data gap.
       */
      email?: common.EmailAddress;
    }

    /**
     * Reference to the UserLogInfo polymorphic type. Contains a .tag property
     * to let you discriminate between possible subtypes.
     */
    interface UserLogInfoReference extends UserLogInfo {
      /**
       * Tag identifying the subtype variant.
       */
      '.tag': "team_member"|"non_team_member";
    }

    /**
     * User's name logged information
     */
    interface UserNameLogInfo {
      /**
       * Given name.
       */
      given_name: string;
      /**
       * Surname.
       */
      surname: string;
      /**
       * Locale. Might be missing due to historical data gap.
       */
      locale?: string;
    }

    /**
     * User or team linked app. Used when linked type is missing due to
     * historical data gap.
     */
    interface UserOrTeamLinkedAppLogInfo extends AppLogInfo {
    }

    /**
     * Reference to the UserOrTeamLinkedAppLogInfo type, identified by the value
     * of the .tag property.
     */
    interface UserOrTeamLinkedAppLogInfoReference extends UserOrTeamLinkedAppLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'user_or_team_linked_app';
    }

    /**
     * Web session.
     */
    interface WebSessionLogInfo extends SessionLogInfo {
    }

    /**
     * Reference to the WebSessionLogInfo type, identified by the value of the
     * .tag property.
     */
    interface WebSessionLogInfoReference extends WebSessionLogInfo {
      /**
       * Tag identifying this subtype variant. This field is only present when
       * needed to discriminate between multiple possible subtypes.
       */
      '.tag': 'web';
    }

    /**
     * Changed how long team members can stay signed in to Dropbox on the web.
     */
    interface WebSessionsChangeFixedLengthPolicyDetails {
      /**
       * New session length policy.
       */
      new_value: WebSessionsFixedLengthPolicy;
      /**
       * Previous session length policy.
       */
      previous_value: WebSessionsFixedLengthPolicy;
    }

    /**
     * Changed how long team members can be idle while signed in to Dropbox on
     * the web.
     */
    interface WebSessionsChangeIdleLengthPolicyDetails {
      /**
       * New idle length policy.
       */
      new_value: WebSessionsIdleLengthPolicy;
      /**
       * Previous idle length policy.
       */
      previous_value: WebSessionsIdleLengthPolicy;
    }

    /**
     * Defined fixed session length.
     */
    interface WebSessionsFixedLengthPolicyDefined {
      '.tag': 'defined';
      defined: DurationLogInfo;
    }

    /**
     * Undefined fixed session length.
     */
    interface WebSessionsFixedLengthPolicyUndefined {
      '.tag': 'undefined';
    }

    interface WebSessionsFixedLengthPolicyOther {
      '.tag': 'other';
    }

    /**
     * Web sessions fixed length policy.
     */
    type WebSessionsFixedLengthPolicy = WebSessionsFixedLengthPolicyDefined | WebSessionsFixedLengthPolicyUndefined | WebSessionsFixedLengthPolicyOther;

    /**
     * Defined idle session length.
     */
    interface WebSessionsIdleLengthPolicyDefined {
      '.tag': 'defined';
      defined: DurationLogInfo;
    }

    /**
     * Undefined idle session length.
     */
    interface WebSessionsIdleLengthPolicyUndefined {
      '.tag': 'undefined';
    }

    interface WebSessionsIdleLengthPolicyOther {
      '.tag': 'other';
    }

    /**
     * Web sessions idle length policy.
     */
    type WebSessionsIdleLengthPolicy = WebSessionsIdleLengthPolicyDefined | WebSessionsIdleLengthPolicyUndefined | WebSessionsIdleLengthPolicyOther;

    type AppId = string;

    type IpAddress = string;

    type RequestId = string;

  }

  namespace team_policies {
    /**
     * Emm token is disabled
     */
    interface EmmStateDisabled {
      '.tag': 'disabled';
    }

    /**
     * Emm token is optional
     */
    interface EmmStateOptional {
      '.tag': 'optional';
    }

    /**
     * Emm token is required
     */
    interface EmmStateRequired {
      '.tag': 'required';
    }

    interface EmmStateOther {
      '.tag': 'other';
    }

    type EmmState = EmmStateDisabled | EmmStateOptional | EmmStateRequired | EmmStateOther;

    /**
     * Office Add-In is disabled
     */
    interface OfficeAddInPolicyDisabled {
      '.tag': 'disabled';
    }

    /**
     * Office Add-In is enabled
     */
    interface OfficeAddInPolicyEnabled {
      '.tag': 'enabled';
    }

    interface OfficeAddInPolicyOther {
      '.tag': 'other';
    }

    type OfficeAddInPolicy = OfficeAddInPolicyDisabled | OfficeAddInPolicyEnabled | OfficeAddInPolicyOther;

    /**
     * Team members can only join folders shared by teammates.
     */
    interface SharedFolderJoinPolicyFromTeamOnly {
      '.tag': 'from_team_only';
    }

    /**
     * Team members can join any shared folder, including those shared by users
     * outside the team.
     */
    interface SharedFolderJoinPolicyFromAnyone {
      '.tag': 'from_anyone';
    }

    interface SharedFolderJoinPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy governing which shared folders a team member can join.
     */
    type SharedFolderJoinPolicy = SharedFolderJoinPolicyFromTeamOnly | SharedFolderJoinPolicyFromAnyone | SharedFolderJoinPolicyOther;

    /**
     * Only a teammate can be a member of a folder shared by a team member.
     */
    interface SharedFolderMemberPolicyTeam {
      '.tag': 'team';
    }

    /**
     * Anyone can be a member of a folder shared by a team member.
     */
    interface SharedFolderMemberPolicyAnyone {
      '.tag': 'anyone';
    }

    interface SharedFolderMemberPolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy governing who can be a member of a folder shared by a team member.
     */
    type SharedFolderMemberPolicy = SharedFolderMemberPolicyTeam | SharedFolderMemberPolicyAnyone | SharedFolderMemberPolicyOther;

    /**
     * By default, anyone can access newly created shared links. No login will
     * be required to access the shared links unless overridden.
     */
    interface SharedLinkCreatePolicyDefaultPublic {
      '.tag': 'default_public';
    }

    /**
     * By default, only members of the same team can access newly created shared
     * links. Login will be required to access the shared links unless
     * overridden.
     */
    interface SharedLinkCreatePolicyDefaultTeamOnly {
      '.tag': 'default_team_only';
    }

    /**
     * Only members of the same team can access all shared links. Login will be
     * required to access all shared links.
     */
    interface SharedLinkCreatePolicyTeamOnly {
      '.tag': 'team_only';
    }

    interface SharedLinkCreatePolicyOther {
      '.tag': 'other';
    }

    /**
     * Policy governing the visibility of shared links. This policy can apply to
     * newly created shared links, or all shared links.
     */
    type SharedLinkCreatePolicy = SharedLinkCreatePolicyDefaultPublic | SharedLinkCreatePolicyDefaultTeamOnly | SharedLinkCreatePolicyTeamOnly | SharedLinkCreatePolicyOther;

    /**
     * Policies governing team members.
     */
    interface TeamMemberPolicies {
      /**
       * Policies governing sharing.
       */
      sharing: TeamSharingPolicies;
      /**
       * This describes the Enterprise Mobility Management (EMM) state for this
       * team. This information can be used to understand if an organization is
       * integrating with a third-party EMM vendor to further manage and apply
       * restrictions upon the team's Dropbox usage on mobile devices. This is a
       * new feature and in the future we'll be adding more new fields and
       * additional documentation.
       */
      emm_state: EmmState;
      /**
       * The admin policy around the Dropbox Office Add-In for this team.
       */
      office_addin: OfficeAddInPolicy;
    }

    /**
     * Policies governing sharing within and outside of the team.
     */
    interface TeamSharingPolicies {
      /**
       * Who can join folders shared by team members.
       */
      shared_folder_member_policy: SharedFolderMemberPolicy;
      /**
       * Which shared folders team members can join.
       */
      shared_folder_join_policy: SharedFolderJoinPolicy;
      /**
       * Who can view shared links owned by team members.
       */
      shared_link_create_policy: SharedLinkCreatePolicy;
    }

  }

  /**
   * This namespace contains endpoints and data types for user management.
   */
  namespace users {
    /**
     * The amount of detail revealed about an account depends on the user being
     * queried and the user making the query.
     */
    interface Account {
      /**
       * The user's unique Dropbox ID.
       */
      account_id: users_common.AccountId;
      /**
       * Details of a user's name.
       */
      name: Name;
      /**
       * The user's e-mail address. Do not rely on this without checking the
       * email_verified field. Even then, it's possible that the user has since
       * lost access to their e-mail.
       */
      email: string;
      /**
       * Whether the user has verified their e-mail address.
       */
      email_verified: boolean;
      /**
       * URL for the photo representing the user, if one is set.
       */
      profile_photo_url?: string;
      /**
       * Whether the user has been disabled.
       */
      disabled: boolean;
    }

    /**
     * Basic information about any account.
     */
    interface BasicAccount extends Account {
      /**
       * Whether this user is a teammate of the current user. If this account is
       * the current user's account, then this will be true.
       */
      is_teammate: boolean;
      /**
       * The user's unique team member id. This field will only be present if
       * the user is part of a team and is_teammate is true.
       */
      team_member_id?: string;
    }

    /**
     * Detailed information about the current user's account.
     */
    interface FullAccount extends Account {
      /**
       * The user's two-letter country code, if available. Country codes are
       * based on [ISO 3166-1]{@link http://en.wikipedia.org/wiki/ISO_3166-1}.
       */
      country?: string;
      /**
       * The language that the user specified. Locale tags will be [IETF
       * language tags]{@link http://en.wikipedia.org/wiki/IETF_language_tag}.
       */
      locale: string;
      /**
       * The user's [referral link]{@link https://www.dropbox.com/referrals}.
       */
      referral_link: string;
      /**
       * If this account is a member of a team, information about that team.
       */
      team?: FullTeam;
      /**
       * This account's unique team member id. This field will only be present
       * if team is present.
       */
      team_member_id?: string;
      /**
       * Whether the user has a personal and work account. If the current
       * account is personal, then team will always be null, but is_paired will
       * indicate if a work account is linked.
       */
      is_paired: boolean;
      /**
       * What type of account this user has.
       */
      account_type: users_common.AccountType;
    }

    /**
     * Detailed information about a team.
     */
    interface FullTeam extends Team {
      /**
       * Team policies governing sharing.
       */
      sharing_policies: team_policies.TeamSharingPolicies;
      /**
       * Team policy governing the use of the Office Add-In.
       */
      office_addin_policy: team_policies.OfficeAddInPolicy;
    }

    interface GetAccountArg {
      /**
       * A user's account identifier.
       */
      account_id: users_common.AccountId;
    }

    interface GetAccountBatchArg {
      /**
       * List of user account identifiers.  Should not contain any duplicate
       * account IDs.
       */
      account_ids: Array<users_common.AccountId>;
    }

    /**
     * The value is an account ID specified in GetAccountBatchArg.account_ids
     * that does not exist.
     */
    interface GetAccountBatchErrorNoAccount {
      '.tag': 'no_account';
      no_account: users_common.AccountId;
    }

    interface GetAccountBatchErrorOther {
      '.tag': 'other';
    }

    type GetAccountBatchError = GetAccountBatchErrorNoAccount | GetAccountBatchErrorOther;

    /**
     * The specified GetAccountArg.account_id does not exist.
     */
    interface GetAccountErrorNoAccount {
      '.tag': 'no_account';
    }

    interface GetAccountErrorOther {
      '.tag': 'other';
    }

    type GetAccountError = GetAccountErrorNoAccount | GetAccountErrorOther;

    interface IndividualSpaceAllocation {
      /**
       * The total space allocated to the user's account (bytes).
       */
      allocated: number;
    }

    /**
     * Representations for a person's name to assist with internationalization.
     */
    interface Name {
      /**
       * Also known as a first name.
       */
      given_name: string;
      /**
       * Also known as a last name or family name.
       */
      surname: string;
      /**
       * Locale-dependent name. In the US, a person's familiar name is their
       * given_name, but elsewhere, it could be any combination of a person's
       * given_name and surname.
       */
      familiar_name: string;
      /**
       * A name that can be used directly to represent the name of a user's
       * Dropbox account.
       */
      display_name: string;
      /**
       * An abbreviated form of the person's name. Their initials in most
       * locales.
       */
      abbreviated_name: string;
    }

    /**
     * The user's space allocation applies only to their individual account.
     */
    interface SpaceAllocationIndividual {
      '.tag': 'individual';
      individual: IndividualSpaceAllocation;
    }

    /**
     * The user shares space with other members of their team.
     */
    interface SpaceAllocationTeam {
      '.tag': 'team';
      team: TeamSpaceAllocation;
    }

    interface SpaceAllocationOther {
      '.tag': 'other';
    }

    /**
     * Space is allocated differently based on the type of account.
     */
    type SpaceAllocation = SpaceAllocationIndividual | SpaceAllocationTeam | SpaceAllocationOther;

    /**
     * Information about a user's space usage and quota.
     */
    interface SpaceUsage {
      /**
       * The user's total space usage (bytes).
       */
      used: number;
      /**
       * The user's space allocation.
       */
      allocation: SpaceAllocation;
    }

    /**
     * Information about a team.
     */
    interface Team {
      /**
       * The team's unique ID.
       */
      id: string;
      /**
       * The name of the team.
       */
      name: string;
    }

    interface TeamSpaceAllocation {
      /**
       * The total space currently used by the user's team (bytes).
       */
      used: number;
      /**
       * The total space allocated to the user's team (bytes).
       */
      allocated: number;
    }

    type GetAccountBatchResult = Array<BasicAccount>;

  }

  /**
   * This namespace contains common data types used within the users namespace
   */
  namespace users_common {
    /**
     * The basic account type.
     */
    interface AccountTypeBasic {
      '.tag': 'basic';
    }

    /**
     * The Dropbox Pro account type.
     */
    interface AccountTypePro {
      '.tag': 'pro';
    }

    /**
     * The Dropbox Business account type.
     */
    interface AccountTypeBusiness {
      '.tag': 'business';
    }

    /**
     * What type of account this user has.
     */
    type AccountType = AccountTypeBasic | AccountTypePro | AccountTypeBusiness;

    type AccountId = string;

  }

}
