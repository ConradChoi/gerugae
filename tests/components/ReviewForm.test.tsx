import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const reviewSingleMock = vi.fn()
const tagInsertMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'review_tags') {
        return { insert: tagInsertMock }
      }
      return {
        insert: () => ({ select: () => ({ single: reviewSingleMock }) }),
      }
    },
  }),
}))

import { ReviewForm } from '@/components/ReviewForm'

const TAGS = [
  { id: 't1', label: '대금지연' },
  { id: 't2', label: '소통미흡' },
]

beforeEach(() => {
  reviewSingleMock.mockReset()
  tagInsertMock.mockReset()
  reviewSingleMock.mockResolvedValue({ data: { id: 'r1' }, error: null })
  tagInsertMock.mockResolvedValue({ error: null })
  vi.stubGlobal('location', { href: '' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderForm() {
  render(<ReviewForm companyId="c1" companyName="주식회사 거르개" tags={TAGS} />)
}

describe('ReviewForm', () => {
  it('별점을 고르지 않으면 등록하지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('후기 내용'), '충분히 긴 후기 내용입니다.')
    await user.click(screen.getByRole('button', { name: '후기 등록' }))

    expect(await screen.findByText('별점을 선택해 주세요.')).toBeInTheDocument()
    expect(reviewSingleMock).not.toHaveBeenCalled()
  })

  it('내용이 10자 미만이면 등록하지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '4점' }))
    await user.type(screen.getByLabelText('후기 내용'), '짧음')
    await user.click(screen.getByRole('button', { name: '후기 등록' }))

    expect(await screen.findByText('후기는 10자 이상 입력해 주세요.')).toBeInTheDocument()
    expect(reviewSingleMock).not.toHaveBeenCalled()
  })

  it('선택한 태그를 함께 저장하고 기업 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '4점' }))
    await user.click(screen.getByRole('button', { name: '대금지연' }))
    await user.type(screen.getByLabelText('후기 내용'), '대금 지급이 두 달 밀렸습니다.')
    await user.click(screen.getByRole('button', { name: '후기 등록' }))

    await waitFor(() => {
      expect(tagInsertMock).toHaveBeenCalledWith([{ review_id: 'r1', tag_id: 't1' }])
    })
    expect(window.location.href).toBe('/companies/c1')
  })

  it('이미 후기를 남긴 기업이면 안내 문구를 보여준다', async () => {
    reviewSingleMock.mockResolvedValue({ data: null, error: { code: '23505' } })
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '5점' }))
    await user.type(screen.getByLabelText('후기 내용'), '두 번째 후기를 시도합니다.')
    await user.click(screen.getByRole('button', { name: '후기 등록' }))

    expect(
      await screen.findByText(/주식회사 거르개에는 이미 후기를 남기셨습니다/)
    ).toBeInTheDocument()
    expect(window.location.href).toBe('')
  })
})
