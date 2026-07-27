import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
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
  Group
} from '@mantine/core';
import { useForm } from '@mantine/form';

// Premium Medical/Pharma Cross Icon
const PharmaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Google Brand Vector Icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
    <path fill="#4285F4" d="M16.04 15.345c-1.077.736-2.423 1.164-4.04 1.164a7.076 7.076 0 0 1-6.734-4.855L1.24 14.77C3.198 18.723 7.27 21.42 12 21.42c2.995 0 5.764-1.1 7.818-3l-3.778-3.075Z"/>
    <path fill="#FBBC05" d="M5.266 14.235A7.034 7.034 0 0 1 4.91 12c0-.79.13-1.554.356-2.264L1.24 6.62A11.96 11.96 0 0 0 0 12c0 1.92.455 3.733 1.24 5.35l4.026-3.115Z"/>
    <path fill="#4285F4" d="M23.49 12.275c0-.827-.074-1.623-.21-2.395H12v4.51h6.46a5.523 5.523 0 0 1-2.42 3.625l3.777 3.075c2.21-2.037 3.673-5.043 3.673-8.815Z"/>
  </svg>
);

export function LoginPage() {
  const [type, setType] = useState<'login' | 'register'>('login');

  const form = useForm({
    initialValues: { 
      role: 'pharmacist', 
      name: '', 
      email: '', 
      password: '',
      confirmPassword: '' // Tracks check verification field
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) => (val.length < 6 ? 'Password is too short (min 6 characters)' : null),
      name: (val) => (type === 'register' && val.trim().length < 2 ? 'Full name is required' : null),
      confirmPassword: (val, values) => 
        type === 'register' && val !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    if (type === 'login') {
      console.log('Pharma Sign In Payload:', values);
    } else {
      console.log('Pharma Sign Up Payload:', values);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google Auth Access Granted:', tokenResponse);
    },
    onError: (error) => {
      console.error('Google Auth Failed:', error);
    },
  });

  return (
    <Box 
      style={{ 
        background: 'linear-gradient(135deg, #f0f7fa 0%, #e1eff6 100%)', // Medical Sky Gradient
        minHeight: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <Container size={440} w="100%" mx="auto">
        {/* Brand Header */}
        <Center mb="xl" style={{ flexDirection: 'column' }}>
          <ThemeIcon size={54} radius="xl" variant="gradient" gradient={{ from: '#0284c7', to: '#0ea5e9' }}>
            <PharmaIcon />
          </ThemeIcon>
          <Title order={2} mt="md" fw={800} style={{ color: '#0f172a', letterSpacing: '-0.5px' }}>
            PharmaConnect
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            {type === 'login' ? 'Secure Portal Gateway' : 'Create Staff Account'}
          </Text>
        </Center>

        {/* Auth Card */}
        <Paper withBorder shadow="xl" p={32} radius="lg" style={{ borderColor: '#dbeafe', backgroundColor: '#ffffff' }}>
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
  data={[
    { label: 'Pharmacist', value: 'pharmacist' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Admin', value: 'admin' },
  ]}
  styles={{
    root: { backgroundColor: '#f1f5f9' },
    indicator: { backgroundColor: '#0284c7' },
    // Standard CSS class selectors passed explicitly as string keys
    label: { color: '#475569' }
  }}
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
                {...form.getInputProps('password')}
              />

              {/* Dynamic Confirm Password Block */}
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
                style={{ backgroundColor: '#0284c7' }} // Pure Clinical Medical Blue
              >
                {type === 'login' ? 'Secure Sign In' : 'Register Account'}
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Anchor
              component="button"
              type="button"
              style={{ color: '#0284c7' }}
              onClick={() => {
                form.reset();
                setType(type === 'login' ? 'register' : 'login');
              }}
              size="xs"
              fw={500}
            >
              {type === 'login' ? "Don't have an account? Register here" : 'Already have an account? Sign in'}
            </Anchor>
          </Group>

          <Divider label="Institutional Verification" labelPosition="center" my="lg" color="slate.1" />

          {/* Google Workspace Button */}
          <Button 
            variant="default" 
            fullWidth
            leftSection={<GoogleIcon />} 
            onClick={() => handleGoogleLogin()}
            radius="md"
            size="md"
            fw={500}
            styles={{
              root: { border: '1px solid #cbd5e1', '&:hover': { backgroundColor: '#f8fafc' } }
            }}
          >
            {type === 'login' ? 'Continue with Google Workspace' : 'Sign up with Google Workspace'}
          </Button>
        </Paper>
        
        <Text ta="center" size="xs" c="dimmed" mt="xl">
          Authorized personnel only. Activities are logged and monitored.
        </Text>
      </Container>
    </Box>
  );
}