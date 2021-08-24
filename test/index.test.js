const { Cunnar, sha256Hex, sign } = require('../src/index');
const fs = require('fs');
const path = require('path')
const { promisify } = require('util');

const appKey = process.env.APPKEY;
const appSecret = process.env.APPSECRET;
const mobile = process.env.MOBILE;
const userId = process.env.CUNNARUSERID;
const isTest = true;
const cunnar = new Cunnar(appKey, appSecret, isTest);

describe("utils test", () => {
  test("sign correct", async () => {
    const input = { app_key: appKey, email: 'test@cunnar.com', phone: mobile}
    const result = cunnar.getSignedParam(input, appSecret)
    expect(result).toStrictEqual({"app_key": appKey, "email": "test@cunnar.com", "phone": mobile, "sign": sign(input, appSecret), "sign_type": "MD5"})
  });
  test("create account", async() => {
    const result = await cunnar.createAccount({ email: 'test@cunnar.com'});
    expect(result).toBe(userId);
  })
  test("get access Token", async () => {
    const result = await cunnar.getAccessToken(userId);
    expect(result).toHaveProperty("access_token")
  })
  test("user id exists?", async () => {
    const result = await cunnar.exists({ phone: mobile})
    expect(result.account_exist).toBe(true);
  })

  test("get authed key", async () => {
    const result = await cunnar.getKey({ phone: mobile })
    expect(result).toBe(userId);
  })

  test("verify kyc status", async () => {
    const result = await cunnar.isVerified({ access_token: '9b276917-504c-4bd2-9682-1107104ff7a0' })
    expect(result).toBe(true);
  })

  test("card verify", async () => {
    const result = await cunnar.cardVerify({ access_token: 'bcaea5d9-e00e-4cc6-8809-07377e8a1e0d', real_name: 'YOURNAME', card: '352202199X080100XY'})
    expect(result.verify).toBe(true);
  })

  test("has stamp", async () => {
    const result = await cunnar.hasStamp('9b276917-504c-4bd2-9682-1107104ff7a0')
    expect(result).toBe(true);
  })

  test("create a contract", async () => {
    const fileBuffer = await promisify(fs.readFile)(path.resolve('./output1.pdf'));
    const result = await cunnar.createContract({ id: '611a2c9d64788db6e57fb7c4', name: '这是一份测试合同,俺是乙方4', length: fileBuffer.length, hash: sha256Hex(fileBuffer), file_create_time: +new Date()})
    expect(typeof result).toBe("string");
  })

  test("upload a contract", async () => {
    const stream = fs.createReadStream(path.resolve('./output1.pdf'));
    const result = await cunnar.uploadContract({ contract_id: '2217067', index: 0, inputStream: stream })
    expect(typeof result).toBe("string")
  })

  test("get contract upload length", async () => {
    const result = await cunnar.getContractLength('2217067')
    expect(result).toBe(0)
  })

  test("get contract url", async () => {
    const result = await cunnar.getContractUrl({ access_token: '306b633c-d272-4471-a653-1d95c7766632', contract_id: '2206467', t: +new Date()})
    expect(result).toBe(0)
  })


  test("download a stamp", async () => {
    const result = await cunnar.downloadStamp('6cf80feb-f1a0-4589-9f20-4a36937f0e01', 'stampb.png');
    expect(result).toBe(0)
  })

  test("create stamp", async () => {
    const result = await cunnar.createStamp({ access_token:'6cf80feb-f1a0-4589-9f20-4a36937f0e01', real_name: 'YOURNAME', card: '352202199X080100XY',  type: '1', stamp: '签章绝对路径'})
    expect(result).toBe(true)
  })

  test("is cert install", async () => {
    const result = await cunnar.isCertInstall('bcaea5d9-e00e-4cc6-8809-07377e8a1e0d')
    expect(result).toBe(true)
  })

  test("do stamp", async () => {
    const contractId = 'XXXXXXX';
    const result = await cunnar.contractStamp({ contract_id: contractId, status: 0, partyA: userId, partyB: '176176X'})
    await downloadContract(contractId, 'result.pdf');
    expect(result).toBe(true)
  })
  test("download a contract", async () => {
    const result = await cunnar.downloadContract('XXXXXXX', 'result.pdf');
    expect(result).toBe(0)
  })
});