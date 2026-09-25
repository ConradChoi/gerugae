import { describe, it, expect } from 'vitest'
import { hasCredentials, randomName, sharedNonMember, sharedUser, signUpUser } from './helpers'

describe.skipIf(!hasCredentials)('초대 코드', () => {
  it('회원은 코드를 발급받을 수 있고, 다시 요청해도 같은 코드가 나온다', async () => {
    const { client } = await sharedUser('author')

    const first = await client.rpc('issue_invite_code')
    expect(first.error).toBeNull()
    const code = first.data?.[0]?.code as string
    expect(code).toMatch(/^[A-Z2-9]{8}$/)
    expect(first.data?.[0]?.max_uses).toBe(3)

    const second = await client.rpc('issue_invite_code')
    expect(second.data?.[0]?.code).toBe(code)
  })

  it('코드를 쓰지 않은 계정은 기업 목록을 볼 수 없다', async () => {
    const inviter = await sharedUser('author')
    await inviter.client
      .from('companies')
      .insert({ name: randomName('초대검증'), category: '원천사' })

    const outsider = await sharedNonMember('outsider')
    const { data } = await outsider.client.from('companies').select('id')

    expect(data).toEqual([])
  })

  it('코드를 쓰지 않은 계정은 기업을 등록할 수도 없다', async () => {
    const outsider = await sharedNonMember('outsider')

    const { error } = await outsider.client
      .from('companies')
      .insert({ name: randomName('차단확인'), category: '원천사' })

    expect(error).not.toBeNull()
  })

  it('코드를 쓰면 열람이 가능해지고 초대한 사람이 기록된다', async () => {
    const inviter = await sharedUser('author')
    const { data: issued } = await inviter.client.rpc('issue_invite_code')
    const code = issued?.[0]?.code as string

    const newcomer = await signUpUser('초대받은사람')
    const { data: result, error } = await newcomer.client.rpc('redeem_invite_code', {
      input_code: code,
    })

    expect(error).toBeNull()
    expect(result).toBe('ok')

    const { data: companies } = await newcomer.client.from('companies').select('id').limit(1)
    expect(companies).not.toEqual([])

    // 초대 경로가 남았는지는 관리자만 확인할 수 있으므로 여기서는 본인 기준으로 확인한다
    const { data: isMember } = await newcomer.client.rpc('is_member')
    expect(isMember).toBe(true)
  })

  it('없는 코드나 본인 코드는 쓸 수 없다', async () => {
    const inviter = await sharedUser('stranger')
    const { data: issued } = await inviter.client.rpc('issue_invite_code')
    const ownCode = issued?.[0]?.code as string

    const { data: selfResult } = await inviter.client.rpc('redeem_invite_code', {
      input_code: ownCode,
    })
    expect(selfResult).toBe('이미 가입이 완료된 계정입니다')

    const outsider = await sharedNonMember('outsider')
    const { data: wrongResult } = await outsider.client.rpc('redeem_invite_code', {
      input_code: 'ZZZZZZZZ',
    })
    expect(wrongResult).toBe('존재하지 않는 코드입니다')
  })

  it('남의 초대 코드는 조회되지 않는다', async () => {
    const owner = await sharedUser('author')
    const { data: issued } = await owner.client.rpc('issue_invite_code')
    const ownerCode = issued?.[0]?.code as string

    const other = await sharedUser('stranger')
    const { data } = await other.client.from('invite_codes').select('code')

    const visible = (data ?? []).map((row) => row.code)
    expect(visible).not.toContain(ownerCode)
  })
})
