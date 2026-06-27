'use client'

import { useLang } from '@/lib/i18n/context'

const SITE_URL = 'https://your-domain.com'

function Code({ children }: { children: string }) {
  return (
    <code className='rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-700'>{children}</code>
  )
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className='relative'>
      {lang && <span className='absolute right-2 top-1.5 text-[10px] text-gray-400'>{lang}</span>}
      <pre className='overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-200'>
        <code>{children}</code>
      </pre>
    </div>
  )
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className='flex items-start gap-3'>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
        {method}
      </span>
      <div>
        <Code>{path}</Code>
        <p className='mt-1 text-xs text-[var(--color-ink-soft)]'>{desc}</p>
      </div>
    </div>
  )
}

export function AdminDocsPage() {
  const { t } = useLang()

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-semibold text-[var(--color-ink)]'>{t.admin.docsTitle}</h2>
        <p className='text-sm text-[var(--color-ink-soft)]'>{t.admin.docsDesc}</p>
      </div>

      {/* Random Image API */}
      <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur space-y-4'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>{t.admin.docsRandomTitle}</h3>
        <p className='text-xs text-[var(--color-ink-soft)]'>{t.admin.docsRandomDesc}</p>

        <div className='space-y-3'>
          <Endpoint method='GET' path='/api/random' desc={t.admin.docsRandomDefault} />
          <Endpoint method='GET' path='/api/random?format=json' desc={t.admin.docsRandomJson} />
        </div>

        <div>
          <p className='mb-2 text-xs font-medium text-[var(--color-ink)]'>{t.admin.docsRandomResponse}</p>
          <CodeBlock lang='json'>{`{
  "id": "abcd1234",
  "filename": "photo.jpg",
  "width": 1920,
  "height": 1080,
  "mimeType": "image/jpeg",
  "links": {
    "raw": "https://raw.githubusercontent.com/.../photo.jpg",
    "cdn": "https://cdn.jsdelivr.net/gh/.../photo.jpg",
    "customCdn": "https://cdn.example.com/photo.jpg",
    "markdown": "![photo.jpg](https://cdn.jsdelivr.net/gh/.../photo.jpg)"
  }
}`}</CodeBlock>
        </div>

        <div>
          <p className='mb-2 text-xs font-medium text-[var(--color-ink)]'>使用示例</p>
          <CodeBlock>{`# 直接嵌入（302 跳转）
<img src="${SITE_URL}/api/random" />

# 头像 API
<img src="${SITE_URL}/api/random" style="border-radius:50%" />

# 获取 JSON 数据
curl ${SITE_URL}/api/random?format=json`}</CodeBlock>
        </div>
      </div>

      {/* Images List API */}
      <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur space-y-4'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>{t.admin.docsImagesTitle}</h3>
        <p className='text-xs text-[var(--color-ink-soft)]'>{t.admin.docsImagesDesc}</p>

        <Endpoint method='GET' path='/api/images' desc={t.admin.docsImagesDesc} />

        <div>
          <p className='mb-2 text-xs font-medium text-[var(--color-ink)]'>{t.admin.docsImagesParams}</p>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-[var(--color-border)] text-[var(--color-ink-soft)]'>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.docsParamName}</th>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.docsParamType}</th>
                  <th className='pb-2 font-medium'>{t.admin.docsParamDesc}</th>
                </tr>
              </thead>
              <tbody className='text-[var(--color-ink)]'>
                <tr className='border-b border-[var(--color-border)]'>
                  <td className='py-2 pr-3'><Code>page</Code></td>
                  <td className='py-2 pr-3'>number</td>
                  <td className='py-2'>页码，默认 1</td>
                </tr>
                <tr className='border-b border-[var(--color-border)]'>
                  <td className='py-2 pr-3'><Code>pageSize</Code></td>
                  <td className='py-2 pr-3'>number</td>
                  <td className='py-2'>每页数量，默认 30，最大 100</td>
                </tr>
                <tr className='border-b border-[var(--color-border)]'>
                  <td className='py-2 pr-3'><Code>publicOnly</Code></td>
                  <td className='py-2 pr-3'>boolean</td>
                  <td className='py-2'>仅返回公开图片，设为 <Code>true</Code></td>
                </tr>
                <tr className='border-b border-[var(--color-border)]'>
                  <td className='py-2 pr-3'><Code>search</Code></td>
                  <td className='py-2 pr-3'>string</td>
                  <td className='py-2'>按文件名搜索</td>
                </tr>
                <tr className='border-b border-[var(--color-border)]'>
                  <td className='py-2 pr-3'><Code>yearMonth</Code></td>
                  <td className='py-2 pr-3'>string</td>
                  <td className='py-2'>按拍摄年月筛选，格式 <Code>2026-06</Code></td>
                </tr>
                <tr className='border-b border-[var(--color-border)]'>
                  <td className='py-2 pr-3'><Code>camera</Code></td>
                  <td className='py-2 pr-3'>string</td>
                  <td className='py-2'>按相机型号筛选</td>
                </tr>
                <tr>
                  <td className='py-2 pr-3'><Code>lens</Code></td>
                  <td className='py-2 pr-3'>string</td>
                  <td className='py-2'>按镜头型号筛选</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <p className='mb-2 text-xs font-medium text-[var(--color-ink)]'>示例</p>
          <CodeBlock>{`# 获取公开图片列表
curl "${SITE_URL}/api/images?publicOnly=true&page=1&pageSize=10"

# 按时间筛选
curl "${SITE_URL}/api/images?publicOnly=true&yearMonth=2026-06"`}</CodeBlock>
        </div>
      </div>

      {/* Auth */}
      <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>{t.admin.docsAuthTitle}</h3>
        <p className='mt-2 text-xs text-[var(--color-ink-soft)]'>{t.admin.docsAuthDesc}</p>
      </div>
    </div>
  )
}
