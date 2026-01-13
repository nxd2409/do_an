export class MeetingDto {
    id: any | null = '';
    name: any | null = '';
    roomId: any | null = '';
    notes: any | null = '';
    meetContent: any | null = '';
    personal: MeetingPersonal[] = [];
    files: any[] = [];
    expectedStartTime: any | null = '';
    status: number = 0;
    address : string | null = '';
    refrenceFileId : string | null = '';
    roomLayouts?: MeetingRoomLayout[] = [];
    votes?: MeetingVote[] = [];
}

export class MeetingPersonal {
    id: any | null = '';
    pId: any | null = '';
    meetingId: any | null = '';
    expanded: any | null = '';
    userName: any | null = '';
    fullName: any | null = '';
    password: any | null = '';
    phone: any | null = '';
    email: any | null = '';
    address: any | null = '';
    orgId: any | null = '';
    titleCode: any | null = '';
    faceId: any | null = '';
    refrenceFileId: any | null = '';
    type: any | null = '';
    isChuTri: any | null = '';
    isThuKy: any | null = '';
    isThanhVien: any | null = '';
    isParticipateInVoting: any | null = '';
    typeBuildTree: any | null = '';
    title: any | null = {}
}

export class MeetingRoomLayout {
    id?: string;
    meetingId?: string;
    roomItemId?: string;
    userId?: string;
    isActive?: boolean;
    createBy?: string;
    createDate?: Date;
    updateBy?: string;
    updateDate?: Date;
}

export class MeetingVote {
    id: any | null = '';
    meetingId: any | null = '';
    name: any | null = '';
    notes: any | null = '';
    refrenceFileId: any | null = '';
    time: number = 1;
    status: number = 0;
    sumPersonalVote: any | null = '';
    sumResults: any | null = '';
    sumResultsPercentage: any | null = '';
    tanThanh: any | null = '';
    tanThanhPercentage: any | null = '';
    khongTanThanh: any | null = '';
    khongTanThanhPercentage: any | null = '';
    khongBieuQuyet: any | null = '';
    khongBieuQuyetPercentage: any | null = '';
    files: any[] = [];
    results: any[] = []
}
