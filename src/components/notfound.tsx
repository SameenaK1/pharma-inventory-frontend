import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Text, 
  Title, 
  Button, 
  Card,
  Group,
  Stack
} from '@mantine/core';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Card 
      p="xl" 
      radius="md" 
      withBorder
      style={{ 
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Stack align="center" gap="md">
        <Title order={1} size="48" c="red.6" fw="bold">
          404
        </Title>
        <Title order={2} size="24" c="gray.9" fw="600">
          Page Not Found
        </Title>
        <Text 
          c="gray.6" 
          size="16"
          style={{ maxWidth: '400px' }}
        >
          The page you are looking for doesn't exist or has been moved.
        </Text>
        <Button 
          onClick={() => navigate('/')}
          color="blue"
          size="md"
          fw="500"
          style={{ 
            transition: 'background-color 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Go to Dashboard
        </Button>
      </Stack>
    </Card>
  );
}