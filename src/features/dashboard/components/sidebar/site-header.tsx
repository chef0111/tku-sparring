import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  title?: React.ReactNode;
}

export const SiteHeader = ({
  children,
  title,
  className,
  action,
}: HeaderProps) => {
  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center gap-2 border-b px-4',
        className
      )}
    >
      <SidebarTrigger className="-ml-2" />
      <Separator
        orientation="vertical"
        className="bg-muted-foreground/50 my-auto h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="text-primary mx-1 ml-2 text-lg font-semibold">
            {title}
          </BreadcrumbItem>
          {action && <BreadcrumbSeparator />}
          {action && (
            <BreadcrumbItem className="text-primary text-lg font-semibold">
              {action}
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      {children}
    </div>
  );
};
