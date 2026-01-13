export interface SettingRegisterFaceIdRequest {
    file: File|null, 
    anti_spoofing: boolean, 
    threshold_spoofing: number, 
    collection_name: string
}