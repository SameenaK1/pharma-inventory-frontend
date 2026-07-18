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
  Box, 
  Breadcrumbs, 
  Anchor,
  Container,
  Autocomplete,
  Loader
} from '@mantine/core';
import { Calendar, UploadCloud, Plus, X } from 'lucide-react';
import { debounce } from '../utils/debounce';
import type { Medicine } from '../services/api';
import { getMedicineByName } from '../services/api';

export default function AddInventory() {
  const [quantity, setQuantity] = useState<number | string>(1);
   const [alertthreshold, setalertthreshold] = useState<number | string>(10);
  const [medicineName, setMedicineName] = useState('');
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [composition1, setComposition1] = useState('');
  const [composition2, setComposition2] = useState('');

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
    console.log('Selected medicine:', medicine);
    setSelectedMedicine(medicine);
    setMedicineName(medicine.name);
    setComposition1(medicine.composition1 || '');
    setComposition2(medicine.composition2 || '');
    setSuggestions([]);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedMedicine(null);
    setMedicineName('');
    setComposition1('');
    setComposition2('');
    setSuggestions([]);
  };

  const inputStyles = { input: { height: '42px', borderRadius: '8px' } };

  return (
    <Container size="xl" px="lg" py="xl">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs mb="lg">{items}</Breadcrumbs>

      {/* 2. Unified Master Card Wrapper */}
      <Paper 
        p={{ base: 'lg', md: 'xl' }} 
        radius="xl" 
        withBorder
        shadow="md"
        bg="white"
      >
        {/* Card Header Header */}
        <Box mb="xl" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <Title order={2} fw={700} c="gray.9" mb="xs">
            Add New Inventory Item
          </Title>
          <Text size="sm" c="dimmed">
            Enter the details for the new medicine or pharmaceutical product below to update stock records.
          </Text>
        </Box>

        {/* Form Controls Container */}
        <Stack gap="xl">
          
          {/* ROW 1: Medicine Basic Identification */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="blue.7">1. Product Core Details</Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Box pos="relative">
                {selectedMedicine ? (
                  <Box p="xs" bg="blue.0" mb="xs" style={{ borderRadius: '6px' }}>
                    <Group justify="space-between" mb={2}>
                      <Text fw={600} size="10px" c="blue.7">Selected:</Text>
                      <Button size="xs" variant="subtle" color="red" p={0} style={{ height: 'auto' }} onClick={clearSelection}>
                        <X size={12} />
                      </Button>
                    </Group>
                    <Text size="xs" fw={500} c="gray.9" truncate>{selectedMedicine.name}</Text>
                  </Box>
                ) : null}
                
                <Autocomplete
                  label="Medicine Name"
                  placeholder="Search medicine..."
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
                  styles={inputStyles}
                />
                {medicineName && !selectedMedicine && (
                  <Text size="xs" c="dimmed" mt={4}>
                    {suggestions.length} found
                  </Text>
                )}
              </Box>
              
              <Select
                label="Medicine Type"
                placeholder="e.g., Allopathy"
                data={['Allopathy', 'Ayurvedic', 'Homeopathic']}
                searchable
                styles={inputStyles}
              />

              <Select
                label="Dosage Form"
                placeholder="e.g., Tablet"
                data={['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment']}
                searchable
                styles={inputStyles}
              />

              {/* <TextInput 
                label="Batch Number" 
                placeholder="e.g., BATCH-12345" 
                rightSection={<FileText size={16} style={{ color: '#94a3b8' }} />}
                styles={inputStyles}
              /> */}
            </SimpleGrid>
          </Box>

          {/* ROW 2: Composition & Manufacturer Metrics */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="blue.7">2. Formula & Logistics</Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <TextInput 
                label="Composition 1" 
                placeholder="e.g., Paracetamol 500mg"
                value={composition1}
                onChange={(event) => setComposition1(event.currentTarget.value)}
                styles={inputStyles}
              />
              <TextInput 
                label="Composition 2" 
                placeholder="e.g., Croscarmellose Sodium"
                value={composition2}
                onChange={(event) => setComposition2(event.currentTarget.value)}
                styles={inputStyles}
              />
              
              <Select
                label="Manufacturer"
                placeholder="Select manufacturer"
                data={['Cipla', 'Sun Pharma', 'Dr. Reddy\'s', 'Lupin', 'Abbott']}
                searchable
                styles={inputStyles}
              />
            </SimpleGrid>
          </Box>

          {/* ROW 3: Balanced Inventory Grid containing Prices & Upload side by side */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="blue.7">3. Stock Controls & Assets</Text>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              
              {/* Left Side (Takes up 2 columns out of 3): Pure Numeric Metrics */}
              <div style={{ gridColumn: 'span 2' }}>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <NumberInput
                    label="Quantity in Stock"
                    value={quantity}
                    onChange={setQuantity}
                    min={0}
                    styles={inputStyles}
                  />
                  <NumberInput 
                    label="Stock Alert Threshold" 
                    value={alertthreshold}
                    onChange={setalertthreshold}
                    min={0}
                    styles={inputStyles}
                  />
                  <TextInput 
                    label="Expiry Date" 
                    placeholder="May 15, 2026" 
                    rightSection={<Calendar size={16} style={{ color: '#94a3b8' }} />}
                    styles={inputStyles}
                  />
                  <NumberInput 
                    label="Purchase Price (₹)" 
                    placeholder="₹ 0.00"
                    min={0}
                    decimalScale={2}
                    styles={inputStyles}
                  />
                  <NumberInput 
                    label="Selling Price (₹)" 
                    placeholder="₹ 0.00"
                    min={0}
                    decimalScale={2}
                    styles={inputStyles}
                  />
                  <NumberInput 
                    label="MRP (₹)" 
                    placeholder="₹ 0.00"
                    min={0}
                    decimalScale={2}
                    styles={inputStyles}
                  />
                </SimpleGrid>
              </div>

              {/* Right Side (Takes up 1 column out of 3): Media & Status Toggle */}
              <div style={{ gridColumn: 'span 1' }}>
                <Stack gap="md" style={{ height: '100%', justifyContent: 'space-between' }}>
                 
                  {/* Image Drop Zone Box */}
                  <Box style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Text size="sm" fw={500} mb="xs" c="gray.8">Product Image</Text>
                    <Box
                      p="md"
                      style={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        flexGrow: 1,
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#f8fafc',
                        border: '2px dashed #e2e8f0',
                        borderRadius: '12px',
                      }}
                    >
                      <UploadCloud size={24} style={{ color: '#228be6', marginBottom: '4px' }} />
                      <Text size="xs" fw={500} c="gray.6">Drag & drop image or</Text>
                      <Text size="xs" fw={700} c="blue">Click to Browse</Text>
                    </Box>
                  </Box>
                </Stack>
              </div>

            </SimpleGrid>
          </Box>

        </Stack>

        {/* 4. Action Row inside the Card Body */}
       <Group justify="flex-end" mt={40} pt="lg" style={{ borderTop: '1px solid #e2e8f0' }}>
          <Button 
            variant="subtle" 
            color="gray" 
            radius="md" 
            size="md"
            leftSection={<X size={16} />}
            style={{ marginRight: 'auto' }} // Pushes Cancel to the far left, creating a massive break before Save
          >
            Cancel
          </Button>
          <Button 
            color="blue" 
            radius="md" 
            size="md"
            leftSection={<Plus size={16} />}
            style={{ boxShadow: '0 4px 12px rgba(34, 138, 230, 0.25)' }}
          >
            Save & Add Item
          </Button>
        </Group>

      </Paper>
    </Container>
  );
}