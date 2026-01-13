export class SignalRAction {
    static readonly RaiseHand = 0;
    static readonly ToggleVideo = 1;
    static readonly ToggleAudio = 2;
    static readonly SendMessage = 3;
    static readonly StartMeeting = 4;
    static readonly EndMeeting = 5;
    static readonly StartRecord = 6;
    static readonly EndRecord = 7;
    static readonly UploadFile = 8;
    static readonly IntoTheMeeting = 9;
    static readonly ExitTheMeeting = 10;
    static readonly CreateMeetingVote = 11;
    static readonly StartVoting = 12;
    static readonly EndVoting = 13;
    static readonly KickParticipant = 14;
    static readonly ControlParticipant = 15;
    static readonly SyncParticipantState = 16;
    static readonly ToggleAllMedia = 17;
    static readonly UpdateExcalidraw = 18;
    static readonly DeleteExcalidraw = 19;
    static readonly BroadcastTranscription = 20;
}