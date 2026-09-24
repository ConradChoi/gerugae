import { describe, it, expect } from 'vitest'
import { hasCredentials, randomName, sharedUser } from './helpers'

async function createReview() {
  const { client } = await sharedUser('author')
  const { data: company } = await client
    .from('companies')
    .insert({ name: randomName('신고대상'), category: '원천사' })
    .select('id')
    .single()
  const { data: review } = await client
    .from('reviews')
    .insert({ company_id: company!.id, rating: 2, content: '신고 검증용 후기 내용입니다.' })
    .select('id')
    .single()
  return { companyId: company!.id, reviewId: review!.id }
}

describe.skipIf(!hasCredentials)('reports 테이블', () => {
  it('로그인 사용자는 후기를 신고할 수 있다', async () => {
    const { reviewId } = await createReview()
    const { client } = await sharedUser('stranger')

    const { data, error } = await client
      .from('reports')
      .insert({
        target_type: 'review',
        target_id: reviewId,
        reason: '허위사실',
        detail: '사실과 다른 내용입니다.',
      })
      .select('id, status')
      .single()

    expect(error).toBeNull()
    expect(data?.status).toBe('pending')
  })

  it('같은 대상을 두 번 신고할 수 없다', async () => {
    const { reviewId } = await createReview()
    const { client } = await sharedUser('stranger')

    await client
      .from('reports')
      .insert({ target_type: 'review', target_id: reviewId, reason: '욕설/비방' })

    const { error } = await client
      .from('reports')
      .insert({ target_type: 'review', target_id: reviewId, reason: '허위사실' })

    expect(error).not.toBeNull()
  })

  it('남이 낸 신고는 보이지 않는다', async () => {
    const { reviewId } = await createReview()
    const reporter = await sharedUser('stranger')
    await reporter.client
      .from('reports')
      .insert({ target_type: 'review', target_id: reviewId, reason: '명예훼손' })

    const other = await sharedUser('author')
    const { data } = await other.client
      .from('reports')
      .select('id')
      .eq('target_id', reviewId)

    expect(data).toEqual([])
  })

  it('관리자가 아니면 신고를 처리할 수 없다', async () => {
    const { reviewId } = await createReview()
    const reporter = await sharedUser('stranger')
    const { data: report } = await reporter.client
      .from('reports')
      .insert({ target_type: 'review', target_id: reviewId, reason: '기타' })
      .select('id')
      .single()

    await reporter.client.from('reports').update({ status: 'hidden' }).eq('id', report!.id)

    const { data: after } = await reporter.client
      .from('reports')
      .select('status')
      .eq('id', report!.id)
      .single()

    expect(after?.status).toBe('pending')
  })

  it('관리자가 아니면 남의 후기를 가릴 수 없다', async () => {
    const { reviewId } = await createReview()
    const { client } = await sharedUser('stranger')

    await client.from('reviews').update({ hidden_at: new Date().toISOString() }).eq('id', reviewId)

    const author = await sharedUser('author')
    const { data } = await author.client
      .from('reviews')
      .select('hidden_at')
      .eq('id', reviewId)
      .single()

    expect(data?.hidden_at).toBeNull()
  })
})

describe.skipIf(!hasCredentials)('프로필 권한', () => {
  it('사용자가 스스로 관리자 권한을 가질 수 없다', async () => {
    const { client, userId } = await sharedUser('stranger')

    await client.from('profiles').update({ is_admin: true }).eq('id', userId)

    // is_admin 컬럼은 조회 권한이 없으므로 함수로 확인한다
    const { data } = await client.rpc('is_admin')

    expect(data).toBe(false)
  })

  it('닉네임은 여전히 수정할 수 있다', async () => {
    const { client, userId } = await sharedUser('stranger')
    const nickname = randomName('닉').slice(0, 20)

    const { error } = await client.from('profiles').update({ nickname }).eq('id', userId)
    expect(error).toBeNull()

    const { data } = await client.from('profiles').select('nickname').eq('id', userId).single()
    expect(data?.nickname).toBe(nickname)
  })
})

describe.skipIf(!hasCredentials)('관리자 정보 노출 차단', () => {
  it('일반 사용자는 누가 관리자인지 조회할 수 없다', async () => {
    const { client } = await sharedUser('stranger')

    const { error } = await client.from('profiles').select('id, nickname, is_admin').limit(1)

    expect(error).not.toBeNull()
  })

  it('닉네임 조회는 계속 가능하다', async () => {
    const { client } = await sharedUser('stranger')

    const { data, error } = await client.from('profiles').select('id, nickname').limit(1)

    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })

  it('본인의 관리자 여부는 is_admin 함수로 확인할 수 있다', async () => {
    const { client } = await sharedUser('stranger')

    const { data, error } = await client.rpc('is_admin')

    expect(error).toBeNull()
    expect(data).toBe(false)
  })
})
