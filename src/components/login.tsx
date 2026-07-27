import { useState, useCallback, type ChangeEvent } from 'react';
import { useGoogleLogin, type TokenResponse } from '@react-oauth/google';
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

// Premium Medical/Pharma Cross Icon
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

// Google Brand Vector Icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <path
      fill="#EA4335"
      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
    />
    <path
      fill="#4285F4"
      d="M16.04 15.345c-1.077.736-2.423 1.164-4.04 1.164a7.076 7.076 0 0 1-6.734-4.855L1.24 14.77C3.198 18.723 7.27 21.42 12 21.42c2.995 0 5.764-1.1 7.818-3l-3.778-3.075Z"
    />
    <path
      fill="#FBBC05"
      d="M5.266 14.235A7.034 7.034 0 0 1 4.91 12c0-.79.13-1.554.356-2.264L1.24 6.62A11.96 11.96 0 0 0 0 12c0 1.92.455 3.733 1.24 5.35l4.026-3.115Z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.275c0-.827-.074-1.623-.21-2.395H12v4.51h6.46a5.523 5.523 0 0 1-2.42 3.625l3.777 3.075c2.21-2.037 3.673-5.043 3.673-8.815Z"
    />
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

  // Re-validate confirmPassword in real time whenever the password changes during registration.
  const handlePasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      form.setFieldValue('password', event.currentTarget.value);
      if (type === 'register' && form.values.confirmPassword.length > 0) {
        form.validateField('confirmPassword');
      }
    },
    [form, type]
  );
const login = useGoogleLogin({
  

  onSuccess: async (tokenResponse) => {
    console.log('1️⃣ Success Object Received:', tokenResponse);

    // 2. Safe-check if access_token exists on the response object
    if (!tokenResponse || !tokenResponse.access_token) {
      console.error(
        '❌ No access_token found in response! You might be getting an Authorization Code instead.',
        'Object keys available:', Object.keys(tokenResponse)
      );
      return;
    }

    try {
      console.log('2️⃣ Sending authorized request to Google API using token...');
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      
      console.log('3️⃣ API Response Status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Google API HTTP Error: ${res.status} - ${errorText}`);
      }
      
      const profileData = await res.json();
      console.log('4️⃣ SUCCESS! ALL EXTRACTED GOOGLE DATA:', profileData);
      
      const dbPayload = {
        googleId: profileData.sub,
        email: profileData.email,
        name: profileData.name,
        avatar: profileData.picture,
        role: form.values.role, 
        createdAt: new Date().toISOString()
      };
      
      console.log('5️⃣ Formatted DB Object:', dbPayload);
      alert(`Success! Data structured for ${dbPayload.name}`);

    } catch (err) {
      console.error('🚨 Fetch failure caught inside try/catch block:', err);
    }
  },
  onError: (err) => console.error('❌ OAuth Flow Aborted globally:', err)
});
  const handleSubmit = useCallback(
    (values: FormValues) => {
      if (type === 'login') {
        console.log('Pharma Sign In Payload:', values);
      } else {
        console.log('Pharma Sign Up Payload:', values);
      }
    },
    [type]
  );

  const toggleAuthMode = useCallback(() => {
    form.reset();
    setType((prev) => (prev === 'login' ? 'register' : 'login'));
  }, [form]);

  const handleGoogleSuccess = useCallback(
    async (tokenResponse: TokenResponse) => {
      const accessToken = tokenResponse.access_token;
      const payload = {
        token: accessToken,
        role: form.values.role,
      };

      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Google auth request failed: ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        console.log('Google backend auth success:', data);
      } catch (error) {
        console.error('Google backend auth error:', error);
      }
    },
    [form.values.role]
  );

const handleGoogleLogin = useGoogleLogin({
  // Force the implicit flow (which yields an access_token directly on the frontend)
  flow: 'implicit', 

  // Pass custom query parameters like prompt inside the extended configuration object
  overrideScope: false, // Ensures it doesn't break standard scopes

  onSuccess: async (tokenResponse) => {
    console.log('✅ Access Token:', tokenResponse.access_token);
    // ... your fetch and database mapping payload code
  },
  onError: (error) => console.error(error),
  
  // To pass custom parameters directly to the underlying Google identity services auth client:
  hint: undefined, 
  // If your library version doesn't accept prompt at the top level, 
  // we clear the error by structuring it natively or clearing browser connections.
});

  return (
    <Box className={classes.clinicalGradient}>
      <Container size={440} w="100%" mx="auto">
        {/* Brand Header */}
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

        {/* Auth Card */}
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

              <Button
                type="submit"
                fullWidth
                radius="md"
                size="md"
                mt="xs"
                className={classes.submitButton}
              >
                {type === 'login' ? 'Secure Sign In' : 'Register Account'}
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Anchor
              component="button"
              type="button"
              onClick={toggleAuthMode}
              size="xs"
              fw={500}
              className={classes.toggleAnchor}
            >
              {type === 'login'
                ? "Don't have an account? Register here"
                : 'Already have an account? Sign in'}
            </Anchor>
          </Group>

          <Divider
            label="Institutional Verification"
            labelPosition="center"
            my="lg"
            color="slate.1"
          />

          {/* Google Workspace Button */}
          {/* <Button
  type="button" // 🌟 Explicitly prevents the browser from treating this as a form submit
  variant="default"
  fullWidth
  leftSection={<GoogleIcon />}
  onClick={(e) => handleGoogleLogin(e)} // 🌟 Pass the event object here
  radius="md"
  size="md"
  fw={500}
  className={classes.googleButton}
>
  {type === 'login'
    ? 'Continue with Google Workspace'
    : 'Sign up with Google Workspace'}
</Button>*/}
          <Button 
  type="button" // 🌟 Explicitly tells the browser NOT to treat this as a form submit
  fullWidth 
  color="blue" 
  onClick={(e) => {
    e.preventDefault(); // 🌟 Stops the page from refreshing/reloading
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