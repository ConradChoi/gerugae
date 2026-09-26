import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Markdown from 'react-markdown'
import { prepareLegalDocument } from '@/lib/legal-document'
import styles from './LegalDocument.module.css'

/**
 * 약관·처리방침은 docs/legal 의 마크다운 하나만 고쳐 두면 화면에도 반영되게 한다.
 * 문서를 두 벌로 관리하면 반드시 어긋난다.
 */
export async function LegalDocument({ file, title }: { file: string; title: string }) {
  const source = await readFile(join(process.cwd(), 'docs', 'legal', file), 'utf8')
  const document = prepareLegalDocument(source)

  if (!document.ready) {
    return (
      <article className={styles.doc}>
        <h1>{title}</h1>
        <div className={styles.notice} role="status">
          <p>
            <strong>준비 중입니다.</strong>
          </p>
          <p>
            내용을 확정하는 대로 이곳에 공개합니다. 그때까지 궁금한 점은 운영자에게 문의해
            주십시오.
          </p>
        </div>
      </article>
    )
  }

  return (
    <article className={styles.doc}>
      <Markdown>{document.body}</Markdown>
    </article>
  )
}
