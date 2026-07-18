// components/AddInventory.tsx
import { useState, useCallback } from 'react';
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
  Anchor,
  Container,
  Autocomplete,
  Loader
} from '@mantine/core';
import { Calendar, FileText, UploadCloud, Plus, X } from 'lucide-react';
import { debounce } from '../utils/debounce';
import type { Medicine } from '../services/api';
import { getMedicineByName } from '../services/api';

export default function AddInventory() {
  const [status, setStatus] = useState('active');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [medicineName, setMedicineName] = useState('');
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

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

  // Debounced function to search medicines
  const debouncedSearch = useCallback(
    debounce(async (name: string) => {
      if (!name.trim()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getMedicineByName(name);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching medicine data:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 1000),
    []
  );

  // Handle medicine name change
  const handleMedicineNameChange = (value: string) => {
    setMedicineName(value);
    debouncedSearch(value);
  };

  // Handle medicine selection from autocomplete
  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setMedicineName(medicine.name);
    setSuggestions([]);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedMedicine(null);
    setMedicineName('');
    setSuggestions([]);
  };

  return (
    <Container size="xl" px="lg">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs mb="md">{items}</Breadcrumbs>

      {/* 2. Form Card Wrapper */}
      <Paper 
        p="xl" 
        radius="lg" 
        withBorder
        shadow="md"
      >
        <Title order={2} fw={700} c="gray.9">
          Add New Inventory Item
        </Title>
        <Text size="sm" c="dimmed" mb="xl">
          Enter the details for the new medicine or pharmaceutical product below.
        </Text>

        {/* 3. Responsive Grid System */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" verticalSpacing="lg">
          
          {/* COLUMN 1 & COLUMN 2 (Form Inputs) */}
          <SimpleGrid cols={2} style={{ gridColumn: 'span 2' }} spacing="md">
            
            <Box pos="relative">
              {selectedMedicine ? (
                <Box p="md" bg="blue.50" style={{ borderRadius: '8px' }} mb="md">
                  <Group justify="space-between" mb="sm">
                    <Text fw={600} size="sm">Selected Medicine:</Text>
                    <Button size="xs" variant="subtle" color="red" onClick={clearSelection}>
                      <X size={14} />
                    </Button>
                  </Group>
                  <Text size="sm" fw={500}>{selectedMedicine.name}</Text>
                  <Text size="xs" c="dimmed">{selectedMedicine.manufacturer_name}</Text>
                  <Text size="xs" c="dimmed">{selectedMedicine.pack_size_label}</Text>
                </Box>
              ) : null}
              
              <Autocomplete
                label="Medicine Name"
                placeholder="Start typing medicine name..."
                value={medicineName}
                onChange={handleMedicineNameChange}
                data={suggestions.map(med => med.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const input = event.currentTarget as HTMLInputElement;
                    const value = input.value;
                    const medicine = suggestions.find(med => med.name === value);
                    if (medicine) {
                      handleMedicineSelect(medicine);
                    }
                  }
                }}
                rightSection={loading ? <Loader size="sm" /> : null}
                rightSectionWidth={40}
                styles={{ input: { height: '42px', borderRadius: '8px' } }}
              />
              {medicineName && !selectedMedicine && (
                <Text size="xs" c="dimmed" mt={4}>
                  {suggestions.length} medicine(s) found
                </Text>
              )}
            </Box>
            
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
              rightSection={<FileText size={16}  />}
              styles={{ input: { height: '42px', borderRadius: '8px' } }}
            />

            <TextInput 
              label="Expiry Date" 
              placeholder="May 15, 2026" 
              rightSection={<Calendar size={16}/>}
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
              <Text size="sm" fw={500} mb={5} c="gray.8">Image Upload</Text>
              <Paper
                p="xl"
                radius="lg"
                withBorder
                style={{
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
                <UploadCloud size={32} style={{ marginBottom: '8px' }} />
                <Text size="xs" fw={500} c="gray.6">
                  Drag and drop medicine image or
                </Text>
                <Text size="xs" fw={700} c="blue">
                  Click to Upload <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Max 2MB)</span>
                </Text>
              </Paper>
            </Box>

            {/* Status Toggle Box */}
            <Box>
              <Text size="sm" fw={500} mb={5} c="gray.8">Status badge</Text>
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
    </Container>
  );
}