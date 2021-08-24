import { AxiosResponse } from 'axios';
import fs from 'fs'


export type CommonRequest = {
    sign?: string;
}
export type AccountResponse = {
    user_id: string;
}
export type ContractResponse = {
    contract_id: string;
}
export type ContractLengthResponse = {
    upload_length: string;
}
export type ContractStampWrapResponse = {
    stamps: [ContractStampResponse]
}
export type VerifyResponse = {
    verify: boolean;
}
export type HasStampResponse = {
    stamp: boolean;
}
export type IsCertInstallResponse = {
    cert_install: boolean;
}
export type ContractCreateRequest = CommonRequest & {
    id: string;
    /**
     * 文件名称
     */
    name: string;
    /**
     * 文件大小
     */
    length: number;
    /**
     * 文件字节数组的哈希值，采用 sha1 算法，hex (16 进制)表示。
     */
    hash: string;
};
export type ContractUploadRequest = ContractCreateRequest & {
    contract_id: string;
    /**
     * 已上传文件的字节数。
     */
    index: number;
    /**
     * 文件数据，在 HTTP entity body 里面使用 multipart/form-data 格式或仅为文件数据，此 参数不参加签名。
     */
    inputStream?: fs.ReadStream;
};
export type ContractUploadResponse = {
    contract_id: string;
    upload_length: number;
};
/**
 * pdf文件左下角为原点
 */
export type ContractStampRequest = {
    contract_id: string;
    /**
     * 合同是否完成签署(0:未完成 1:完成)
     */
    status: string;
    /**
     * userid
     */
    partyA: string;
    /**
     * userid
     */
    partyB: string;
};
export type ContractStampResponse = {
    user_id: string;
    file_id: string;
};
export type AccessTokenResponse = {
    access_token: string;
    expires_in: string;
    user_id: string;
};
export type AccountRequest = {
    phone?: string;
    email?: string;
    out_id?: string;
};
export type ExistResponse = {
    account_exist: boolean;
    account_permission: boolean;
};
export type VerifyRequest = {
    access_token: string;
    /**
     * 认证类型 1:企业四要素 2:个人银联三、四要素 3:个人二要素 4:人脸识别
     */
    type?: string;
};
export type CardVerifyRequest = {
    access_token: string;
    real_name: string;
    card: string;
};
export type CardVerifyResponse = {
    verify: boolean;
    verifyMsg: string;
    verifyStatecode: number;
};
export type StampCreateRequest = CardVerifyRequest & {
    stamp?: string;
};
export type ViewContractRequest = {
    access_token: string;
    contract_id: string;
    /**
     * 北京时间(距离 1970 年的毫秒数)
     */
    t: number;
};
/**
 *
 * @param {Params} params
 * @param {string} secret
 * @return {string}
 */
export function sign(params: any, secret: string): string;
/**
 *
 * @param {Params} params
 * @param {string} secret
 * @return {Params}
 */
export function getSignedParam(params: any, secret: string): any;
/**
 *
 * @param {AccountRequest} params
 * @returns {string} userid
 */
export function createAccount(params?: AccountRequest): string;
/**
 *
 * @param {ContractCreateRequest} params
 * @returns {string} contactid
 */
export function createContract(params?: ContractCreateRequest): string;
/**
 * 账号生成电子签章图片
 * @param {StampCreateRequest} params
 * @returns {boolean}
 */
export function createStamp(params?: StampCreateRequest): boolean;
/**
 * 合同上传过后以后再访问可能302。此时新创建的合同和之前上传的内容相同。
 * @param {ContractUploadRequest} params
 * @returns {ContractUploadResponse}
 */
export function uploadContract(params?: ContractUploadRequest): ContractUploadResponse;
/**
 *
 * @param {string} contractId
 * @returns {string}
 */
export function getContractLength(contractId: string): string;
/**
 * 合同签章
 * @param {ContractStampRequest} params
 * @returns {[ContractStampResponse]}
 */
export function contractStamp(params?: ContractStampRequest): [ContractStampResponse];
/**
 *
 * @param {string} userId
 * @returns {AccessTokenResponse}
 */
export function getAccessToken(userId: string): AccessTokenResponse;
/**
 *
 * @param {AccountRequest} params
 * @returns {ExistResponse}
 */
export function exists(params?: AccountRequest): ExistResponse;
/**
 * 获取已授权账号标识user_id
 * @param {AccountRequest} params
 * @returns {string} userid
 */
export function getKey(params?: AccountRequest): string;
/**
 * 获取实名认证状态
 * @param {VerifyRequest} params
 * @returns {boolean}
 */
export function isVerified(params?: VerifyRequest): boolean;
/**
 *
 * @param {CardVerifyRequest} params
 * @returns {CardVerifyResponse}
 */
export function cardVerify(params?: CardVerifyRequest): CardVerifyResponse;
/**
 * 获取账号电子签章状态
 * 电子签章图片通过/opencloud/api/account/stamp/download.json?access_token=xx下载
 * @param {string} accessToken
 * @returns {boolean}
 */
export function hasStamp(accessToken: string): boolean;
/**
 * 账号申请第三方证书
 * @param {string} accessToken
 * @returns {boolean}
 */
export function isCertInstall(accessToken: string): boolean;
/**
 *
 * @param {ViewContractRequest} params
 * @returns {string}
 */
export function getContractUrl(params?: ViewContractRequest): string;
export function sha256Hex(buffer: any): any;
/**
 *
 * @param {string} contractId
 * @param {string} targetPath
 * @returns
 */
export function downloadContract(contractId: string, targetPath: string): Promise<any>;
/**
 *
 * @param {string} accessToken
 * @param {string} targetPath
 * @returns
 */
export function downloadStamp(accessToken: string, targetPath: string): Promise<any>;
