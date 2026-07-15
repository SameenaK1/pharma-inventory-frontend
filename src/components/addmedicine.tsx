// components/AddInventory.tsx
import React, { useState } from 'react';
import { 
  Stack,
  Paper, 
  Title, 
  Text, 
  TextInput, 
  SimpleGrid, 
  Select, 
  NumberInput, 
  Button, 
  Group, 
  SegmentedControl, 
  Box, 
  Breadcrumbs, 
  Anchor 
} from '@mantine/core';
import { Calendar, FileText, UploadCloud, Plus, X } from 'lucide-react';

export default function AddInventory() {
  const [status, setStatus] = useState('active');
  const [quantity, setQuantity] = useState<number | string>(1);

  // Breadcrumbs navigation mapping
  const items = [
    { title: 'Dashboard', href: '#' },
    { title: 'Inventory', href: '#' },
    { title: 'Add New Item', href: '#' },
  ].map((item, index) => (
    <Anchor href={item.href} key={index} size="sm" c="dimmed">
      {item.title}
    </Anchor>
  ));

  return (
    <Box style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* 1. Breadcrumbs */}
      <Breadcrumbs mb="md">{items}</Breadcrumbs>

      {/* 2. Form Card Wrapper */}
      <Paper 
        p="xl" 
        radius="lg" 
        style={{ 
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Title order={2} fw={700} style={{ color: '#1e293b' }}>
          Add New Inventory Item
        </Title>
        <Text size="sm" c="dimmed" mb="xl">
          Enter the details for the new medicine or pharmaceutical product below.
        </Text>

        {/* 3. Responsive Grid System */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" verticalSpacing="lg">
          
          {/* COLUMN 1 & COLUMN 2 (Form Inputs) */}
          <SimpleGrid cols={2} style={{ gridColumn: 'span 2' }} spacing="md">
            
            <TextInput 
              label="Medicine Name" 
              placeholder="Paracetamol 500mg" 
              required 
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />
            
            <TextInput 
              label="Generic Name" 
              placeholder="e.g., Acetaminophen" 
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <Select
              label="Dosage Form"
              placeholder="e.g., Tablet"
              data={['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment']}
              searchable
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <TextInput 
              label="Batch Number" 
              placeholder="e.g., BATCH-12345" 
              rightSection={<FileText size={16} color="#94a3b8" />}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <TextInput 
              label="Expiry Date" 
              placeholder="May 15, 2026" 
              rightSection={<Calendar size={16} color="#94a3b8" />}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <NumberInput
              label="Quantity in Stock"
              value={quantity}
              onChange={setQuantity}
              min={0}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <NumberInput 
              label="Purchase Price (per unit, ₹)" 
              placeholder="₹"
              min={0}
              decimalScale={2}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <NumberInput 
              label="Selling Price (per unit, ₹)" 
              placeholder="₹"
              min={0}
              decimalScale={2}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <NumberInput 
              label="Stock Alert Threshold" 
              placeholder="0"
              min={0}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <Select
              label="Manufacturer"
              placeholder="Select manufacturer"
              data={['Cipla', 'Sun Pharma', 'Dr. Reddy\'s', 'Lupin', 'Abbott']}
              searchable
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

          </SimpleGrid>

          {/* COLUMN 3 (Media Upload & Status Badge Toggle) */}
          <Stack gap="lg">
            
            {/* Image Upload Box */}
            <Box>
              <Text size="sm" fw={500} mb={5} style={{ color: '#2d3748' }}>Image Upload</Text>
              <Paper
                p="xl"
                radius="lg"
                style={{
                  border: '2px dashed #cbd5e1',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minHeight: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <UploadCloud size={32} color="#2563eb" style={{ marginBottom: '8px' }} />
                <Text size="xs" fw={500} style={{ color: '#475569' }}>
                  Drag and drop medicine image or
                </Text>
                <Text size="xs" fw={700} c="blue">
                  Click to Upload <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Max 2MB)</span>
                </Text>
              </Paper>
            </Box>

            {/* Status Toggle Box */}
            <Box>
              <Text size="sm" fw={500} mb={5} style={{ color: '#2d3748' }}>Status badge</Text>
              <SegmentedControl
                fullWidth
                value={status}
                onChange={setStatus}
                color="blue"
                radius="md"
                size="md"
                data={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />
            </Box>

          </Stack>

        </SimpleGrid>

        {/* 4. Action Buttons at the bottom right */}
        <Group justify="flex-end" mt="2xl" pt="md" style={{ borderTop: '1px solid #f1f5f9' }}>
          <Button 
            variant="outline" 
            color="gray" 
            radius="md" 
            size="md"
            leftSection={<X size={16} />}
          >
            Cancel
          </Button>
          <Button 
            color="blue" 
            radius="md" 
            size="md"
            leftSection={<Plus size={16} />}
            style={{ paddingLeft: '24px', paddingRight: '24px' }}
          >
            Save & Add Item
          </Button>
        </Group>

      </Paper>
    </Box>
  );
}