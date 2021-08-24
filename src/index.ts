/**
 * 
 * @typedef   {Object} ContractCreateRequest
 * @property  {string} id
 * @property  {string} name 文件名称
 * @property  {number} length 文件大小
 * @property  {string} hash 文件字节数组的哈希值，采用 sha1 算法，hex (16 进制)表示。
 * 
 * @typedef {Object} ContractUploadRequest
 * @property {string} contract_id
 * @property {number} index 已上传文件的字节数。
 * @property {Object} inputStream 文件数据，在 HTTP entity body 里面使用 multipart/form-data 格式或仅为文件数据，此 参数不参加签名。
 * 
 * @typedef {Object} ContractUploadResponse
 * @property {string} contract_id
 * @property {number} upload_length
 * 
 * @typedef {Object} ContractStampRequest pdf文件左下角为原点
 * @property {string} contract_id
 * @property {string} status 合同是否完成签署(0:未完成 1:完成)
 * @property {string} partyA userid
 * @property {string} partyB userid
 * 
 * @typedef {Object} ContractStampResponse
 * @property {string} user_id
 * @property {string} file_id
 * 
 * @typedef {Object} ContractStampRequest
 * @property {string} contract_id
 * @property {string} status
 * 
 * @typedef {Object} AccessTokenResponse
 * @property {string} access_token
 * @property {string} expires_in
 * @property {string} user_id
 * 
 * @typedef {Object} AccountRequest
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [out_id]
 * 
 * @typedef {Object} ExistResponse
 * @property {boolean} account_exist
 * @property {boolean} account_permission
 * 
 * @typedef {Object} VerifyRequest
 * @property {string} access_token
 * @property {string} [type] 认证类型 1:企业四要素 2:个人银联三、四要素 3:个人二要素 4:人脸识别
 * 
 * @typedef {Object} CardVerifyRequest
 * @property {string} access_token
 * @property {string} real_name
 * @property {string} card
 * 
 * @typedef {Object} CardVerifyResponse
 * @property {boolean} verify
 * @property {string} verifyMsg
 * @property {number} verifyStatecode
 * 
 * @typedef {Object & CardVerifyRequest} StampCreateRequest
 * @property {string} [stamp] 签章图片，最大不要超过 1M;图片文件采用 base64 编码 优先级:1
 * @property {string} [type] 1:个人章 2:企业章 优先级:2
 * 
 * @typedef {Object} ViewContractRequest
 * @property {string} access_token
 * @property {string} contract_id
 * @property {number} t 北京时间(距离 1970 年的毫秒数)
 * 
 * @typedef {import('form-data').Headers}
 */

// TODO access_token传参改本地管理
import { ParsedUrlQueryInput, stringify } from 'querystring'
import { createHash } from 'crypto'
import pick from 'lodash/fp/pick'
import compact from 'lodash/fp/compact'
import omit from 'lodash/fp/omit'
import set from 'lodash/fp/set'
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import rp from 'request-promise'
import fs from 'fs'
import { promisify } from 'util'
import { AccountResponse, CommonRequest, ContractLengthResponse, ContractResponse, ContractStampRequest, ContractStampWrapResponse, ContractUploadRequest, HasStampResponse, IsCertInstallResponse, StampCreateRequest, VerifyResponse } from './@types'

type URL = string

class Cunnar {
  appKey: string;
  appSecret: string;
  api: AxiosInstance;

  constructor(appKey: string, appSecret: string, isTest?: boolean) {
    this.appKey = appKey;
    this.appSecret = appSecret;
    this.api = Axios.create({
      baseURL: isTest ? 'https://t.cunnar.com' : 'https://www.cunnar.com',
      timeout: 5000,
      transformRequest: [(data) => {
        return stringify(data);
      }]
    });
    this.api.interceptors.request.use(config => {
      function setValue<T extends keyof AxiosRequestConfig>(field: T, val: AxiosRequestConfig[T]) {
        config[field] = val;
      }
      ['params', 'data'].forEach(field => {
        const fieldKey = field as keyof AxiosRequestConfig
        if (config[fieldKey] && !config.onUploadProgress) {
          setValue(fieldKey, this.getSignedParam(config[fieldKey], appSecret))
        }
      })
      return config;
    })
    this.api.interceptors.response.use(config => {
      return config.data;
    }, err => {
      throw err.response.data
    })
  }

  /**
   * 
   * @param {URL} url 
   * @param {ContractUploadRequest} params 
   * @returns {Promise}
   */
  async doUpload(url: URL, params: ContractUploadRequest) {
    const signed = omit('inputStream')(this.getSignedParam<ContractUploadRequest>(params, this.appSecret));
    delete signed.inputStream;
    const result = await rp({
      method: 'POST',
      uri: `${this.api.defaults.baseURL}${url}?${stringify(signed as ParsedUrlQueryInput)}`,
      formData: {
        inputStream: {
          value: params.inputStream,
          options: {
            filename: params.inputStream.path,
          }
        }
      }
    })
    return result && JSON.parse(result)
  }

  /**
   * 
   * @param {AccountRequest} params 
   * @returns {string} userid
   */
  async createAccount(params = {}) {
    const data = await this.api.post<void, AccountResponse>('/opencloud/api/account/create.json', {
      ...params
    });
    return data && data.user_id;
  }

  /**
   * 
   * @param {ContractCreateRequest} params 
   * @returns {string} contactid
   */
  async createContract(params = {}) {
    const data = await this.api.post<void, ContractResponse>('/opencloud/api/contract/create.json', {
      ...params,
    });
    return data && data.contract_id;
  }
  /**
   * 合同上传过后以后再访问可能302。此时新创建的合同和之前上传的内容相同。
   * @param {ContractUploadRequest} params 
   * @returns {ContractUploadResponse} 
   */
  async uploadContract(params: ContractUploadRequest) {
    const data = await this.doUpload('/opencloud/api/contract/upload.json', {
      ...params
    })
    return data;
  }
  /**
   * 
   * @param {string} contractId 
   * @returns {string} 
   */
  async getContractLength(contractId: string) {
    const data = await this.api.get<void, ContractLengthResponse>('/opencloud/api/contract/length.json', {
      params: {
        contract_id: contractId
      }
    });
    return data && data.upload_length;
  }

  /**
   * 合同签章
  * @param {ContractStampRequest} params 
   * @returns {[ContractStampResponse]}
   */
  async contractStamp(params: ContractStampRequest) {
    const param = compact([params.partyA, params.partyB].map((party, index) => {
      return party && `${party},${index * 270},100,1,300,144`;
    })).join('|')
    const data = await this.api.post<void, ContractStampWrapResponse>('/opencloud/api/contract/stamp.json', {
      ...pick(['contract_id'])(params),
      status: params.status === 'completed' ? 1 : 0,
      param,
    });
    return data && data.stamps;
  }

  /**
   * 
   * @param {string} userId 
   * @returns {AccessTokenResponse}
   */
  async getAccessToken(userId: string) {
    const data = await this.api.get('/opencloud/api/account/access_token.json', {
      params: {
        user_id: userId
      }
    });
    return data;
  }

  /**
   * 
   * @param {AccountRequest} params 
   * @returns {ExistResponse}
   */
  async exists(params = {}) {
    const data = await this.api.get('/opencloud/api/account/exist.json', {
      params
    });
    return data;
  }

  /**
   * 获取已授权账号标识user_id
   * @param {AccountRequest} params 
   * @returns {string} userid
   */
  async getKey(params = {}) {
    const data = await this.api.get<void, AccountResponse>('/opencloud/api/account/get_key.json', {
      params
    })
    return data && data.user_id;
  }

  /**
   * 获取实名认证状态
   * @param {VerifyRequest} params 
   * @returns {boolean}
   */
  async isVerified(params = {}) {
    const data = await this.api.get<void, VerifyResponse>('/opencloud/api/account/verify.json', {
      params
    })
    return data.verify;
  }

  /**
   * 
   * @param {CardVerifyRequest} params 
   * @returns {CardVerifyResponse}
   */
  async cardVerify(params = {}) {
    const data = await this.api.post('/opencloud/api/account/card_verify.json', {
      ...params
    })
    return data;
  }

  /**
   * 获取账号电子签章状态
   * 电子签章图片通过/opencloud/api/account/stamp/download.json?access_token=xx下载
   * @param {string} accessToken 
   * @returns {boolean}
   */
  async hasStamp(accessToken: string) {
    const data = await this.api.get<void, HasStampResponse>('/opencloud/api/account/stamp.json', {
      params: {
        access_token: accessToken
      }
    })
    return data && data.stamp;
  }

  /**
   * 账号生成电子签章图片
   * @param {StampCreateRequest} params 
   * @returns {boolean}
   */
  async createStamp(params: StampCreateRequest) {
    let setStamp = (params: StampCreateRequest) => params
    if (params.stamp) {
      const file = await promisify(fs.readFile)(params.stamp);
      const base64 = new Buffer(file).toString('base64');
      setStamp = set('stamp', base64);
    }
    const data = await this.api.post<void, HasStampResponse>('/opencloud/api/account/stamp.json', setStamp({
      ...params,
    }))
    return data.stamp
  }

  /**
   * 账号申请第三方证书
   * @param {string} accessToken 
   * @returns {boolean}
   */
  async isCertInstall(accessToken: string) {
    const data = await this.api.post<void, IsCertInstallResponse>('/opencloud/api/account/cert/itrus.json', {
      access_token: accessToken
    })
    return data.cert_install;
  }

  /**
   * 
   * @param {ViewContractRequest} params 
   * @returns {string}
   */
  async getContractUrl(params = {}) {
    const data = await this.api.get('/opencloud/api/account/hcontract', {
      params
    })
    return data;

  }

  /**
   * 
   * @param {string} contractId 
   * @param {string} targetPath 
   * @returns 
   */
  async downloadContract(contractId: string, targetPath: string) {
    const signed = (this.getSignedParam({
      contract_id: contractId
    }, this.appSecret));
    const data = await rp({
      url: `${this.api.defaults.baseURL}/opencloud/api/contract/download.json?${stringify(signed)}`,
      resolveWithFullResponse: true,
    }).pipe(fs.createWriteStream(targetPath))
    return data;
  }

  /**
   * 
   * @param {string} accessToken 
   * @param {string} targetPath 
   * @returns 
   */
  async downloadStamp(accessToken: string, targetPath: string) {
    const data = await rp({
      url: `${this.api.defaults.baseURL}/opencloud/api/account/stamp/download.json?access_token=${accessToken}`,
      resolveWithFullResponse: true,
    }).pipe(fs.createWriteStream(targetPath))
    return data;

  }

  /**
   * 
   * @param {Params} params 
   * @param {string} secret 
   * @return {Params}
   */
  getSignedParam = function <T>(params: T & CommonRequest, secret: string): T {
    const dumpParams = {
      app_key: this.appKey,
      sign_type: 'MD5',
      ...params,
    }
    delete dumpParams.sign;
    delete dumpParams.sign_type;
    return {
      ...dumpParams,
      sign_type: 'MD5',
      sign: sign(dumpParams, secret),
    }
  }
}



const sha256Hex = function (buffer: Buffer) {
  return createHash('sha1').update(buffer).digest('hex');
}

/**
 * 
 * @param {Params} params 
 * @param {string} secret 
 * @return {string}
 */
const sign = function <T>(params: T, secret: string) {
  let signStr = '';
  let keys = Object.keys(params).sort();
  signStr = compact(keys.map(key => {
    return key !== 'inputStream' ? `${key}=${params[key as (keyof T)]}` : '';
  })).join('&')
  signStr = signStr + secret;
  return createHash('md5').update(signStr).digest('hex')
}





export {
  Cunnar,
  sha256Hex,
  sign
}