export interface SettingRegisterFaceIdResponse {
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number,
    face_embedding: object[],
    score: number,
    gender: string,
    age: number,
    face_mask_status: string,
    is_spoof: boolean
}