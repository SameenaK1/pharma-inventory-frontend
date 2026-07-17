import React from 'react';
import { Pill, Search, Bell, MapPin } from 'lucide-react';
import { 
  TextInput, 
  ActionIcon, 
  Group, 
  Avatar, 
  Badge, 
  Box, 
  Container,
  Text
} from '@mantine/core';

export default function Header() {
  return (
    <header mb="32px" pb="8px" style={{ borderBottom: '1px solid #e2e8f0' }}>
      <Container size="xl" px="lg">
        <Group justify="space-between" align="center">
          {/* 1. Brand Logo Area (Left) */}
          <Group 
            bg="blue.0" 
            px="md" 
            py="sm" 
            gap="md"
            style={{ borderRadius: '8px' }}
          >
            <Pill size={24} c="blue.6" />
            <Text size="34px" fw="800" c="gray.9">
              Pharma<Text c="blue.6">Track</Text>
            </Text>
          </Group>

          {/* 2. Expanded Middle Search Bar (Occupies the center space beautifully) */}
          <Box flex={1} mx="xl" style={{ maxWidth: '600px' }}>
            <TextInput
              placeholder="Quick search medicines, batches, manufacturers..."
              leftSection={<Search size={18} c="gray.4" />}
              radius="md"
              size="md"
              styles={{
                input: {
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  height: '46px',
                  '&:focus': {
                    borderColor: '#2563eb'
                  }
                }
              }}
            />
          </Box>
          
          {/* User Info */}
          <Group gap="xs" style={{ cursor: 'pointer' }}>
            <Avatar color="blue" radius="xl" size="md">AD</Avatar>
            <Text size="sm" fw="600" c="gray.8">Admin Depot</Text>
          </Group>
        </Group>
      </Container>
    </header>
  );
}