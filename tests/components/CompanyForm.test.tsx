import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const insertSingleMock = vi.fn()
const maybeSingleMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({ single: insertSingleMock }),
      }),
      select: () => ({
        eq: () => ({ maybeSingle: maybeSingleMock }),
      }),
    }),
  }),
}))

import { CompanyForm } from '@/components/CompanyForm'

beforeEach(() => {
  insertSingleMock.mockReset()
  maybeSingleMock.mockReset()
  insertSingleMock.mockResolvedValue({ data: { id: 'c1' }, error: null })
  vi.stubGlobal('location', { href: '' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('기업 이름'), '주식회사 거르개')
  await user.selectOptions(screen.getByLabelText('분류'), '웹에이전시')
}

describe('CompanyForm', () => {
  it('분류를 고르지 않으면 에러를 보여주고 등록하지 않는다', async () => {
    const user = userEvent.setup()
    render(<CompanyForm />)

    await user.type(screen.getByLabelText('기업 이름'), '주식회사 거르개')
    await user.click(screen.getByRole('button', { name: '등록하고 후기 쓰기' }))

    expect(await screen.findByText('분류를 선택해 주세요.')).toBeInTheDocument()
    expect(insertSingleMock).not.toHaveBeenCalled()
  })

  it('사업자등록번호 자릿수가 맞지 않으면 에러를 보여준다', async () => {
    const user = userEvent.setup()
    render(<CompanyForm />)

    await fill(user)
    await user.type(screen.getByLabelText('사업자등록번호 (선택)'), '123-45-678')
    await user.click(screen.getByRole('button', { name: '등록하고 후기 쓰기' }))

    expect(await screen.findByText('사업자등록번호는 숫자 10자리입니다.')).toBeInTheDocument()
    expect(insertSingleMock).not.toHaveBeenCalled()
  })

  it('등록에 성공하면 기업 상세로 이동한다', async () => {
    const user = userEvent.setup()
    render(<CompanyForm />)

    await fill(user)
    await user.click(screen.getByRole('button', { name: '등록하고 후기 쓰기' }))

    await waitFor(() => {
      expect(window.location.href).toBe('/companies/c1')
    })
  })

  it('사업자등록번호가 중복이면 기존 기업을 안내한다', async () => {
    insertSingleMock.mockResolvedValue({ data: null, error: { code: '23505' } })
    maybeSingleMock.mockResolvedValue({
      data: { id: 'existing', name: '기존 거르개', category: '원천사' },
      error: null,
    })

    const user = userEvent.setup()
    render(<CompanyForm />)

    await fill(user)
    await user.type(screen.getByLabelText('사업자등록번호 (선택)'), '1234567890')
    await user.click(screen.getByRole('button', { name: '등록하고 후기 쓰기' }))

    expect(
      await screen.findByText('같은 사업자등록번호로 이미 등록된 기업이 있습니다')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /기존 거르개/ })).toHaveAttribute(
      'href',
      '/companies/existing'
    )
    expect(window.location.href).toBe('')
  })
})
