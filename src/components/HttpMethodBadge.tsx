import { HttpMethod } from '@/types/postman';
import { cn } from '@/lib/utils';

interface HttpMethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-method-get text-black',
  POST: 'bg-method-post text-black',
  PUT: 'bg-method-put text-white',
  DELETE: 'bg-method-delete text-white',
  PATCH: 'bg-method-patch text-white',
  HEAD: 'bg-muted text-muted-foreground',
  OPTIONS: 'bg-muted text-muted-foreground',
};

export function HttpMethodBadge({ method, className }: HttpMethodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-bold rounded',
        methodColors[method],
        className
      )}
    >
      {method}
    </span>
  );
}