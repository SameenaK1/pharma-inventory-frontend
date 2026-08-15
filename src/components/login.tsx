import { useState, useCallback, type ChangeEvent, useEffect } from 'react';
import {
  TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack, SegmentedControl, Center, Box, ThemeIcon, Anchor, Group
} from '@mantine/core';
import { useForm } from '@mantine/form';
import classes from './login.module.css';
import { useNavigate } from 'react-router';
import { useAuth } from '../services/authcontext';

import { loginUser, sendRegistrationOtp, verifyRegistrationOtp, finalizeRegistration } from '../services/api';

const ROLE_OPTIONS = [
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Doctor', value: 'doctor' },
  { label: 'Admin', value: 'admin' },
] as const;

type Role = (typeof ROLE_OPTIONS)[number]['value'];
// 🌟 The 4 distinct UI states
type AuthMode = 'login' | 'register_email' | 'register_otp' | 'register_details';

interface FormValues {
  role: Role;
  fullname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

const PharmaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function LoginPage() {
  const { login } = useAuth();
  const { register } = useAuth();
  const [type, setType] = useState<AuthMode>('login');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  const form = useForm<FormValues>({
    initialValues: {
      role: 'pharmacist', fullname: '', username: '', email: '', password: '', confirmPassword: '', otp: '',
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      otp: (val) => type === 'register_otp' && val.trim().length !== 6 ? 'Please enter the 6-digit code' : null,
      fullname: (val) => type === 'register_details' && val.trim().length < 2 ? 'Full name required' : null,
      username: (val) => type === 'register_details' && val.trim().length < 3 ? 'Username required' : null,
      password: (val) => (type === 'login' || type === 'register_details') && val.length < 6 ? 'Password too short' : null,
      confirmPassword: (val, values) => type === 'register_details' && val !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    form.setFieldValue('password', event.currentTarget.value);
    if (type === 'register_details' && form.values.confirmPassword.length > 0) {
      form.validateField('confirmPassword');
    }
  }, [form, type]
  );

  useEffect(() => {
    // 🌟 Change 'NodeJS.Timeout' to 'any' (or just remove the type entirely)
    let intervalId: any;

    if (type === 'register_otp' && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [type, countdown]);

  const handleResendOtp = useCallback(async () => {
    if (countdown > 0 || loading) return;

    setLoading(true);
    try {
      // 🌟 Ensure 'const' is present here
      const data = await sendRegistrationOtp(form.values.email);

      const payload = data && data.data ? data.data : data;
      if (payload && payload.success === false) {
        throw new Error(payload.error);
      }

      setOtpToken(payload.token); // If using the stateless crypto method
      setCountdown(60);
    } catch (error: any) {
      form.setFieldError('otp', error.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  }, [form.values.email, countdown, loading]);

  const handleSubmit = useCallback(async (values: FormValues) => {
    setLoading(true);
    setSuccessMsg("");

    try {
    
      // --- FLOW 1: LOGIN ---
      if (type === 'login') {
        await login({ email: values.email, password: values.password });

        // Cookie is automatically set by the browser. Just navigate!
        navigate('/dashboard');
      }
      // --- FLOW 2: SEND OTP ---
      // --- STEP 1: Sending Email ---
      if (type === 'register_email') {
        const data = await sendRegistrationOtp(values.email);
        const payload = data && data.data ? data.data : data;

        if (payload && payload.success === false) throw new Error(payload.error);


        setOtpToken(payload.token); // Save token in React state
        setCountdown(60);
        setType('register_otp');
      }

      // --- STEP 2: Verifying Code ---
      else if (type === 'register_otp') {
     
        const data = await verifyRegistrationOtp(
          values.email,
          values.otp,
          otpToken
        );

        const payload = data && data.data ? data.data : data;
        if (payload && payload.success === false) throw new Error(payload.error);

        setOtpToken(null);
        setType('register_details');
      }
      // --- FLOW 4: FINALIZE REGISTRATION ---
      else if (type === 'register_details') {
        await register({
          role: values.role,
          fullname: values.fullname,
          username: values.username,
          email: values.email,
          password: values.password
        });
        setSuccessMsg("Account created successfully!");
        // Context state is updated, cookie is set. Just navigate!
        navigate('/dashboard');
      }

    } catch (error: any) {

      const errorMessage = error.message || 'Server connection lost. Please try again.';

      if (type === 'register_otp') {
        form.setFieldError('otp', errorMessage);
      } else if (errorMessage.toLowerCase().includes('password')) {
        form.setFieldError('password', errorMessage); // Displays under Password field
      } else {
        form.setFieldError('email', errorMessage); // Displays under Email field
      }

    } finally {
      setLoading(false);
    }
  }, [type, navigate, form, otpToken, login, register]);

  // const finalizeAuth = (payload: any, email: string) => {
  //   const authPayload = { username: payload.username || email.split('@')[0], token: payload.token }; +

  //     localStorage.setItem('user', JSON.stringify(authPayload));
  //   dispatch({ type: 'LOGIN', payload: authPayload });
  //   setTimeout(() => navigate('/dashboard'), 1500);
  // };

  const toggleAuthMode = useCallback(() => {
    form.reset();
    setType((prev) => (prev === 'login' ? 'register_email' : 'login'));
  }, [form]);

  return (
    <Box className={classes.clinicalGradient}>
      <Container size={440} w="100%" mx="auto">
        <Center mb="xl" style={{ flexDirection: 'column' }}>
          <ThemeIcon size={54} radius="xl" variant="gradient" gradient={{ from: '#0284c7', to: '#0ea5e9' }}>
            <PharmaIcon />
          </ThemeIcon>
          <Title order={2} mt="md" fw={800}>PharmaConnect</Title>
          <Text c="dimmed" size="sm" mt={4}>
            {type === 'login' && 'Secure Portal Gateway'}
            {type === 'register_email' && 'Create Staff Account'}
            {type === 'register_otp' && 'Verify Your Email'}
            {type === 'register_details' && 'Finalize Profile'}
          </Text>
        </Center>

        <Paper withBorder shadow="xl" p={32} radius="lg" className={classes.authCard}>
          {successMsg && <Text c="teal" fw={600} ta="center" mb="md">{successMsg}</Text>}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">

              {/* --- 1. LOGIN UI --- */}
              {type === 'login' && (
                <>
                  <TextInput label="Work Email" placeholder="name@pharmacy.com" required radius="md" {...form.getInputProps('email')} />
                  <PasswordInput label="Password" placeholder="••••••••" required radius="md" {...form.getInputProps('password')} />
                </>
              )}

              {/* --- 2. REGISTER EMAIL UI --- */}
              {type === 'register_email' && (
                <TextInput label="Work Email" placeholder="name@pharmacy.com" required radius="md" {...form.getInputProps('email')} />
              )}

              {/* --- 3. REGISTER OTP UI --- */}
              {type === 'register_otp' && (
                <Box ta="center">
                  <Text size="sm" mb="md">We sent a 6-digit verification code to <br /><Text component="span" fw={700}>{form.values.email}</Text></Text>
                  <TextInput placeholder="Enter 6-digit code" maxLength={6} required radius="md" size="lg" styles={{ input: { textAlign: 'center', letterSpacing: '2px', fontSize: '18px' } }} {...form.getInputProps('otp')} />
                </Box>
              )}

              {/* --- 4. REGISTER DETAILS UI --- */}
              {type === 'register_details' && (
                <>
                  <SegmentedControl fullWidth radius="md" data={[...ROLE_OPTIONS]} {...form.getInputProps('role')} />
                  <TextInput label="Work Email" disabled radius="md" value={form.values.email} description="Verified Email Address" />
                  <TextInput label="Full Name" placeholder="Dr. Alex Carter" required radius="md" {...form.getInputProps('fullname')} />
                  <TextInput label="Username" placeholder="alexcarter99" required radius="md" {...form.getInputProps('username')} />
                  <PasswordInput label="Create Password" placeholder="••••••••" required radius="md" value={form.values.password} onChange={handlePasswordChange} error={form.errors.password} />
                  <PasswordInput label="Confirm Password" placeholder="••••••••" required radius="md" {...form.getInputProps('confirmPassword')} />
                </>
              )}

              {/* --- BUTTONS --- */}
              {type === 'register_otp' ? (
                <Group grow mt="xs">
                  {/* 🌟 Resend OTP Button with Live Countdown */}
                  <Button
                    variant="default"
                    radius="md"
                    disabled={countdown > 0 || loading}
                    onClick={handleResendOtp}
                    styles={{
                      label: { fontSize: countdown > 0 ? '12px' : '14px' } // Shrinks text slightly while counting down
                    }}
                  >
                    {countdown > 0
                      ? `Regenerate after ${formatTime(countdown)}`
                      : 'Resend OTP'}
                  </Button>

                  <Button type="submit" radius="md" loading={loading}>
                    Verify Code
                  </Button>
                </Group>
              ) : (
                <Button type="submit" fullWidth radius="md" mt="xs" loading={loading}>
                  {type === 'login'
                    ? 'Secure Sign In'
                    : type === 'register_details'
                      ? 'Register Profile'
                      : 'Send Verification Code'}
                </Button>
              )}
            </Stack>
          </form>

          {/* HIDE BOTTOM LINKS DURING MID-REGISTRATION */}
          {(type === 'login' || type === 'register_email') && (
            <>
              <Group justify="center" mt="md">
                <Anchor component="button" type="button" onClick={toggleAuthMode} size="xs" fw={500}>
                  {type === 'login' ? "Don't have an account? Register here" : 'Already have an account? Sign in'}
                </Anchor>
              </Group>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}