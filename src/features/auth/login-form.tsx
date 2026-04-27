import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { IconAlertCircle } from '@tabler/icons-react';
import type z from 'zod';
import { LoginSchema } from '@/lib/validations';
import { useAppForm } from '@/components/form/hooks';
import { authClient } from '@/lib/auth-client';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

type FormData = z.infer<typeof LoginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      username: '',
      password: '',
    } as FormData,
    validators: {
      onSubmit: LoginSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);

      const response = await authClient.signIn.username({
        username: value.username,
        password: value.password,
        callbackURL: '/',
      });

      if (response?.data?.user) {
        toast.success('Success', {
          description: 'You are now logged in',
        });

        navigate({ to: '/' });
      } else {
        setError(response?.error?.message || 'Something went wrong');
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-4">
        <form.AppField name="username">
          {(field) => (
            <field.Input
              label="Username"
              description="At least 3 characters"
              descPosition="after-field"
              placeholder="tku.ss"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.PasswordInput
              label="Password"
              description="At least 8 characters"
              descPosition="after-field"
              placeholder="********"
            />
          )}
        </form.AppField>

        {!!error && (
          <Alert
            variant="destructive"
            className="bg-destructive/10 border-destructive/20 border"
          >
            <IconAlertCircle />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="text-wrap">
              {error}
              {error === 'Invalid email or password' && '. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          )}
        />
      </FieldGroup>
    </form>
  );
};

export { LoginForm };
