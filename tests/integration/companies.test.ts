import { describe, it, expect } from 'vitest'
import { anonClient, hasCredentials, randomName, signUpUser } from './helpers'

describe.skipIf(!hasCredentials)('companies 테이블 RLS / 제약', () => {
  it('로그인 사용자는 기업을 등록할 수 있고, 등록자가 created_by로 기록된다', async () => {
    const { client, userId } = await signUpUser('등록자')

    const { data, error } = await client
      .from('companies')
      .insert({ name: randomName('주식회사'), category: '웹에이전시' })
      .select('id, name, created_by')
      .single()

    expect(error).toBeNull()
    expect(data?.created_by).toBe(userId)
  })

  it('비로그인 사용자는 기업 목록을 읽을 수 없다', async () => {
    const { client } = await signUpUser('작성자')
    await client.from('companies').insert({ name: randomName('비공개확인'), category: '원천사' })

    const anon = anonClient()
    const { data } = await anon.from('companies').select('id')

    expect(data).toEqual([])
  })

  it('같은 사업자등록번호로는 중복 등록할 수 없다', async () => {
    const { client } = await signUpUser('중복테스트')
    const bizNumber = String(Date.now()).slice(-10)

    const first = await client
      .from('companies')
      .insert({ name: randomName('첫번째'), category: '원천사', biz_reg_number: bizNumber })
      .select('id')
      .single()
    expect(first.error).toBeNull()

    const second = await client
      .from('companies')
      .insert({ name: randomName('두번째'), category: '원천사', biz_reg_number: bizNumber })
      .select('id')
      .single()

    expect(second.error).not.toBeNull()
  })

  it('다른 사람이 등록한 기업 정보는 수정할 수 없다', async () => {
    const owner = await signUpUser('주인')
    const stranger = await signUpUser('남')

    const { data: company } = await owner.client
      .from('companies')
      .insert({ name: randomName('원본'), category: '인력회사' })
      .select('id, name')
      .single()

    await stranger.client.from('companies').update({ name: '바뀐이름' }).eq('id', company!.id)

    const { data: after } = await owner.client
      .from('companies')
      .select('name')
      .eq('id', company!.id)
      .single()

    expect(after?.name).toBe(company!.name)
  })
})

describe.skipIf(!hasCredentials)('reviews 테이블 RLS / 제약', () => {
  it('기업당 한 사람은 후기를 하나만 남길 수 있다', async () => {
    const { client } = await signUpUser('리뷰어')
    const { data: company } = await client
      .from('companies')
      .insert({ name: randomName('리뷰대상'), category: '원천사' })
      .select('id')
      .single()

    const first = await client
      .from('reviews')
      .insert({ company_id: company!.id, rating: 4, content: '대금 지급이 정확했습니다.' })
      .select('id')
      .single()
    expect(first.error).toBeNull()

    const second = await client
      .from('reviews')
      .insert({ company_id: company!.id, rating: 2, content: '두 번째 후기 시도' })
      .select('id')
      .single()

    expect(second.error).not.toBeNull()
  })

  it('별점은 1~5 범위를 벗어날 수 없다', async () => {
    const { client } = await signUpUser('별점테스트')
    const { data: company } = await client
      .from('companies')
      .insert({ name: randomName('별점대상'), category: '원천사' })
      .select('id')
      .single()

    const { error } = await client
      .from('reviews')
      .insert({ company_id: company!.id, rating: 6, content: '범위를 벗어난 별점' })

    expect(error).not.toBeNull()
  })

  it('본인 후기는 수정·삭제할 수 있고, 남의 후기는 건드릴 수 없다', async () => {
    const author = await signUpUser('후기작성자')
    const stranger = await signUpUser('타인')

    const { data: company } = await author.client
      .from('companies')
      .insert({ name: randomName('권한확인'), category: '원천사' })
      .select('id')
      .single()

    const { data: review } = await author.client
      .from('reviews')
      .insert({ company_id: company!.id, rating: 3, content: '원래 작성한 후기 내용입니다.' })
      .select('id')
      .single()

    await stranger.client.from('reviews').update({ content: '침입을 시도하는 내용입니다.' }).eq('id', review!.id)
    await stranger.client.from('reviews').delete().eq('id', review!.id)

    const { data: survived } = await author.client
      .from('reviews')
      .select('content')
      .eq('id', review!.id)
      .single()
    expect(survived?.content).toBe('원래 작성한 후기 내용입니다.')

    const { error: updateError } = await author.client
      .from('reviews')
      .update({ content: '수정한 후기 내용입니다.' })
      .eq('id', review!.id)
    expect(updateError).toBeNull()

    await author.client.from('reviews').delete().eq('id', review!.id)
    const { data: deleted } = await author.client
      .from('reviews')
      .select('id')
      .eq('id', review!.id)
      .maybeSingle()
    expect(deleted).toBeNull()
  })
})

describe.skipIf(!hasCredentials)('tags / review_tags', () => {
  it('고정 태그 목록을 읽을 수 있고 후기에 연결할 수 있다', async () => {
    const { client } = await signUpUser('태그테스트')

    const { data: tags, error: tagError } = await client.from('tags').select('id, label')
    expect(tagError).toBeNull()
    expect((tags ?? []).length).toBeGreaterThanOrEqual(6)

    const { data: company } = await client
      .from('companies')
      .insert({ name: randomName('태그대상'), category: '원천사' })
      .select('id')
      .single()
    const { data: review } = await client
      .from('reviews')
      .insert({ company_id: company!.id, rating: 5, content: '태그를 붙일 후기 내용입니다.' })
      .select('id')
      .single()

    const { error } = await client
      .from('review_tags')
      .insert({ review_id: review!.id, tag_id: tags![0].id })

    expect(error).toBeNull()
  })
})

describe.skipIf(!hasCredentials)('community_posts 테이블 RLS', () => {
  it('정보글을 쓰고 본인 글만 수정할 수 있다', async () => {
    const author = await signUpUser('정보글작성자')
    const stranger = await signUpUser('정보글타인')

    const { data: company } = await author.client
      .from('companies')
      .insert({ name: randomName('정보글대상'), category: '웹에이전시' })
      .select('id')
      .single()

    const { data: post, error } = await author.client
      .from('community_posts')
      .insert({ company_id: company!.id, title: '계약 팁', content: '지급일을 명시하세요.' })
      .select('id, title')
      .single()
    expect(error).toBeNull()

    await stranger.client.from('community_posts').update({ title: '침입' }).eq('id', post!.id)

    const { data: after } = await author.client
      .from('community_posts')
      .select('title')
      .eq('id', post!.id)
      .single()
    expect(after?.title).toBe('계약 팁')
  })
})
