import { LockIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

export const Unauthorized = () => {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon />
        </EmptyMedia>
        <EmptyTitle>Login Required</EmptyTitle>
        <EmptyDescription>
          Sign in to access tournament settings and athlete information.
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="primary" asChild>
        <Link to="/login">Login to Continue</Link>
      </Button>
    </Empty>
  );
};
