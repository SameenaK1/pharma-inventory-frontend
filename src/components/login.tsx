import { useState, useCallback, type ChangeEvent } from 'react';
import { useGoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google'; // 🌟 Imported One-Tap Hook
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Divider,
  Stack,
  SegmentedControl,
  Center,
  Box,
  ThemeIcon,
  Anchor,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import classes from './login.module.css';
import { useNavigate } from 'react-router';
const ROLE_OPTIONS = [
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Doctor', value: 'doctor' },
  { label: 'Admin', value: 'admin' },
] as const;

type Role = (typeof ROLE_OPTIONS)[number]['value'];
type AuthMode = 'login' | 'register';

interface FormValues {
  role: Role;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const PharmaIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function LoginPage() {
  const [type, setType] = useState<AuthMode>('login');

  const form = useForm<FormValues>({
    initialValues: {
      role: 'pharmacist',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (val) =>
        type === 'register' && val.trim().length < 2 ? 'Full name is required' : null,
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) =>
        val.length < 6 ? 'Password is too short (min 6 characters)' : null,
      confirmPassword: (val, values) =>
        type === 'register' && val !== values.password ? 'Passwords do not match' : null,
    },
  });

  // Common function to process profile tokens from Google
const navigate = useNavigate();

  const handleGoogleSuccessResponse = useCallback(async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential || credentialResponse.access_token;
      if (!token) return;

      // ... your auth logic ...

      // Now 'navigate' is recognized and will work perfectly
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 800);

    } catch (err) {
      console.error('🚨 Error handling login response:', err);
    }
  }, [navigate]);

 useGoogleOneTapLogin({
  onSuccess: (credentialResponse) => {
    console.log('One Tap Success:', credentialResponse);
    handleGoogleSuccessResponse(credentialResponse);
  },
  onError: () => {
    console.log('One-Tap skipped: No active Google session found in this browser profile.');
  },
  // Prevents the script from throwing strict network breaks if clicking away
  cancel_on_tap_outside: true, 
});

  // 2. FALLBACK MANUAL BUTTON LOGIN
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleSuccessResponse(tokenResponse);
    },
    onError: (err) => console.error('❌ Button Flow Aborted:', err)
  });

  const handlePasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      form.setFieldValue('password', event.currentTarget.value);
      if (type === 'register' && form.values.confirmPassword.length > 0) {
        form.validateField('confirmPassword');
      }
    },
    [form, type]
  );

  const handleSubmit = useCallback(
    (values: FormValues) => {
      console.log('Form Submit Payload:', values);
    },
    []
  );

  const toggleAuthMode = useCallback(() => {
    form.reset();
    setType((prev) => (prev === 'login' ? 'register' : 'login'));
  }, [form]);

  return (
    <Box className={classes.clinicalGradient}>
      <Container size={440} w="100%" mx="auto">
        <Center mb="xl" style={{ flexDirection: 'column' }}>
          <ThemeIcon
            size={54}
            radius="xl"
            variant="gradient"
            gradient={{ from: '#0284c7', to: '#0ea5e9' }}
          >
            <PharmaIcon />
          </ThemeIcon>
          <Title order={2} mt="md" fw={800} className={classes.brandTitle}>
            PharmaConnect
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            {type === 'login' ? 'Secure Portal Gateway' : 'Create Staff Account'}
          </Text>
        </Center>

        <Paper withBorder shadow="xl" p={32} radius="lg" className={classes.authCard}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Box>
                <Text size="xs" fw={600} c="dimmed" mb={8} tt="uppercase">
                  Select Portal Role
                </Text>
                <SegmentedControl
                  fullWidth
                  radius="md"
                  key={form.key('role')}
                  {...form.getInputProps('role')}
                  data={[...ROLE_OPTIONS]}
                  className={classes.roleControl}
                />
              </Box>

              {type === 'register' && (
                <TextInput
                  label="Full Name"
                  placeholder="Dr. Alex Carter"
                  required
                  radius="md"
                  key={form.key('name')}
                  {...form.getInputProps('name')}
                />
              )}

              <TextInput
                label="Work Email"
                placeholder="name@pharmacy.com"
                required
                radius="md"
                key={form.key('email')}
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                required
                radius="md"
                key={form.key('password')}
                value={form.values.password}
                onChange={handlePasswordChange}
                error={form.errors.password}
              />

              {type === 'register' && (
                <PasswordInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  required
                  radius="md"
                  key={form.key('confirmPassword')}
                  {...form.getInputProps('confirmPassword')}
                />
              )}

              <Button type="submit" fullWidth radius="md" size="md" mt="xs">
                {type === 'login' ? 'Secure Sign In' : 'Register Account'}
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Anchor component="button" type="button" onClick={toggleAuthMode} size="xs" fw={500}>
              {type === 'login' ? "Don't have an account? Register here" : 'Already have an account? Sign in'}
            </Anchor>
          </Group>

          <Divider label="Institutional Verification" labelPosition="center" my="lg" color="slate.1" />

          <Button 
            type="button" 
            fullWidth 
            color="blue" 
            onClick={(e) => {
              e.preventDefault(); 
              login();
            }}
          >
            Sign in with Google
          </Button>
        </Paper>

        <Text ta="center" size="xs" c="dimmed" mt="xl">
          Authorized personnel only. Activities are logged and monitored.
        </Text>
      </Container>
    </Box>
  );
}