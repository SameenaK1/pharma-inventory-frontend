import React from 'react';
import { Pill, Search, Bell, MapPin } from 'lucide-react';
import { TextInput, ActionIcon, Group, Avatar, Badge, Box } from '@mantine/core';

export default function Header() {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '32px',
      padding: '8px 0', 
      borderBottom: '1px solid #e2e8f0'
    }}>
      {/* 1. Brand Logo Area (Left) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#eff6ff',
        }}>
          <Pill size={24} style={{ color: '#2563eb' }} />
       
      
          <span style={{ 
            fontSize: '34px', 
            fontWeight: '800', 
            color: '#0f172a', 
            display: 'block',
            lineHeight: 1.1
          }}>
            Pharma<span style={{ color: '#2563eb' }}>Track</span>
          </span>
            </div>
       

      {/* 2. Expanded Middle Search Bar (Occupies the center space beautifully) */}
      <Box style={{ flex: 1, maxWidth: '600px', margin: '0 40px' }}>
        <TextInput
          placeholder="Quick search medicines, batches, manufacturers..."
          leftSection={<Search size={18} color="#94a3b8" />}
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
        

   
<Group gap="xs" style={{ cursor: 'pointer' }}>
  <Avatar color="blue" radius="xl" size="md">AD</Avatar>
  
    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
      Admin Depot
    </span>
 
  
</Group>
      

    </header>
  );
}