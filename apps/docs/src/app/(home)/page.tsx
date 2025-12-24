import { BookIcon, type LucideIcon, WebhookIcon } from 'lucide-react'
import type { LinkProps } from 'next/link'
import Link from 'next/link'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export default function DocsPage(): ReactElement {
  return (
    <main className='container flex max-w-[1300px] flex-col py-16'>
      <h1 className='font-semibold text-2xl md:text-3xl'>
        Welcome to the Starter Kit
      </h1>
     

      <div className='mt-8 grid grid-cols-1 gap-4 text-left md:grid-cols-2'>
        <DocumentationItem
          title='📚 Documentation'
          description='Get started with the Fumadocs framework.'
          icon={{ icon: BookIcon, id: '(index)' }}
          href='/docs'
          colorClass='bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
          iconColorClass='bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400'
        />

        <DocumentationItem
          title='🔧 Tool Rank'
          description="Get started with Fumadocs's API reference feature."
          icon={{ icon: WebhookIcon, id: 'api-reference' }}
          href='/docs/comparisons/_tool_rank'
          colorClass='bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50'
          iconColorClass='bg-purple-500/20 border-purple-500/40 text-purple-600 dark:text-purple-400'
        />
      </div>
    </main>
  )
}

function DocumentationItem({
  title,
  description,
  icon: { icon: ItemIcon, id },
  href,
  colorClass,
  iconColorClass,
}: {
  title: string
  description: string
  icon: {
    icon: LucideIcon
    id: string
  }
  href: string
  colorClass?: string
  iconColorClass?: string
}): ReactElement {
  return (
    <Item href={href} colorClass={colorClass}>
      <Icon className={id} iconColorClass={iconColorClass}>
        <ItemIcon className='size-full' />
      </Icon>
      <h2 className='mb-2 font-semibold text-lg'>{title}</h2>
      <p className='text-fd-muted-foreground text-sm'>{description}</p>
    </Item>
  )
}

function Icon({
  className,
  children,
  iconColorClass,
}: {
  className?: string
  children: ReactNode
  iconColorClass?: string
}): ReactElement {
  return (
    <div
      className={cn(
        'mb-2 size-9 rounded-lg border p-1.5 shadow-fd-primary/30',
        iconColorClass || className
      )}
      style={{
        boxShadow: 'inset 0px 8px 8px 0px var(--tw-shadow-color)',
      }}
    >
      {children}
    </div>
  )
}

function Item(
  props: LinkProps & { className?: string; children: ReactNode; colorClass?: string }
): ReactElement {
  const { className, children, colorClass, ...rest } = props
  return (
    <Link
      {...rest}
      className={cn(
        'rounded-2xl border border-border bg-fd-accent/30 p-6 shadow-lg backdrop-blur-lg transition-all hover:bg-fd-accent',
        colorClass,
        className
      )}
    >
      {children}
    </Link>
  )
}
