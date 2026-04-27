import { LoginForm } from './login-form';
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Highlighter } from '@/components/ui/highlighter';

export const Login = () => {
  return (
    <FieldSet className="flex flex-col space-y-4 text-center">
      <FieldLegend className="text-2xl! font-bold tracking-wide">
        Sign In to{' '}
        <Highlighter
          action="underline"
          color="#1685f5"
          className="font-esbuild!"
          strokeWidth={2}
          padding={0}
        >
          tku.ss
        </Highlighter>
      </FieldLegend>
      <FieldDescription className="text-muted-foreground w-full text-center text-base!">
        Enter your username and password to get access
      </FieldDescription>
      <FieldGroup>
        <LoginForm />
      </FieldGroup>
    </FieldSet>
  );
};
