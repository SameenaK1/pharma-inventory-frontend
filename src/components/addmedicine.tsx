// components/AddInventory.tsx
import { useState, useCallback } from 'react';
// Make sure to import the CSS file if you haven't in your app's root (e.g., main.tsx or _app.tsx)
import '@mantine/dates/styles.css';
import { notifications } from '@mantine/notifications';
import { Check, AlertTriangle } from 'lucide-react'; // Optional: for clean status icons
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
import { UploadCloud, Plus, X } from 'lucide-react';
import { debounce } from '../utils/debounce';
import type { Medicine } from '../services/api';
import { getMedicineByName, getManufacturerName, addInventory, type InventoryItem } from '../services/api';

// Manufacturer type for type safety
export type Manufacturer = {
  id: number;
  name: string;
};

export default function AddInventory() {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [alertthreshold, setalertthreshold] = useState<number | string>(6);
  const [medicineName, setMedicineName] = useState('');
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [composition1, setComposition1] = useState('');
  const [composition2, setComposition2] = useState('');
  const [manufacturer, setmanufacturer] = useState('')
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<Manufacturer[]>([]);
  const [manufacturerLoading, setManufacturerLoading] = useState(false);
  const [packsize, setpacksize] = useState<number | string>(0);
  const [error, setError] = useState<string | null>(null);
  const [purchasePrice, setPurchasePrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(0);
  const [mrp, setMrp] = useState<number | string>(0);
  const [medicineType, setMedicineType] = useState<string | null>(""); // Sets Allopathy as default
  const [dosageForm, setDosageForm] = useState<string | null>('');
const [isSubmitted, setIsSubmitted] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Add validation for required fields
  const isMedicineNameValid = medicineName.trim().length > 0;
const isQuantityValid = Number(quantity) >= 1; // Ensures it's a valid number

// The form is only submittable if both fields check out
const isFormValid = isMedicineNameValid && isQuantityValid;

  // Handle form submission
  const handleSubmit = async () => {
  setIsSubmitted(true); 

  if (!isFormValid) {
    
    const missingFields: string[] = [];
    if (!isMedicineNameValid) missingFields.push("Medicine Name");
    if (!isQuantityValid) missingFields.push("Quantity in Stock");

    notifications.show({
      title: 'Validation Error',
      message: `Please fill out the required field(s): ${missingFields.join(', ')} before submitting.`,
      color: 'red',
      icon: <AlertTriangle size={16} />,
      autoClose: 5000,
    });
    
    return; 
  }

  // 2. Database/API Submission
  try {
    const item: InventoryItem = {
      name: medicineName,
      manufacturername: manufacturer,
      type: medicineType || "Allopathy",
      packsizelabel: packsize?.toString() || "",
      composition1: composition1,
      composition2: composition2,
      mrp: Number(mrp) || 0,
      stockquantity: Number(quantity) || 0,
      purchaseprice: Number(purchasePrice) || 0,
      sellingprice: Number(sellingPrice) || 0,
      stockalertthreshold: Number(alertthreshold) || 0,
      expirydate: expiryDate || "",
      username: "admin",
      insertdate: "2026-07-21",
      updatedate: "2026-07-21"
    };

    const response = await addInventory(item);
    
    notifications.show({
      title: 'Success!',
      message: `${medicineName} has been successfully added to the inventory records.`,
      color: 'green',
      icon: <Check size={16} />,
      autoClose: 4000,
    });
    
    clearSelection();

  } catch (err) {
    setError('Failed to add medicine. Please try again.');
    notifications.show({
      title: 'Submission Failed',
      message: 'Server error encountered while saving inventory data. If the issue persists, contact support.',
      color: 'red',
      icon: <AlertTriangle size={16} />,
      autoClose: 5000,
    });
  }
};

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

  // Generic debounced search hook
  const useDebouncedSearch = (
    apiFunction: (query: string) => Promise<any>,
    setSuggestions: (data: any[]) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    emptyValue: () => void = () => { }
  ) => {
    const debouncedSearch = useCallback(
      debounce(async (name: string, isSelection: boolean = false) => {
        if (isSelection || !name.trim()) {
          emptyValue();
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const response = await apiFunction(name);
          setSuggestions(response.data || []);
          setError(null);
        } catch (error) {
          setSuggestions([]);
          setError('Failed to fetch data. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 1000),
      [apiFunction]
    );

    return debouncedSearch;
  };

  // Medicine search setup
  const debouncedSearch = useDebouncedSearch(
    getMedicineByName,
    setSuggestions,
    setLoading,
    setError,
    () => setSuggestions([])
  );

  // Manufacturer search setup
  const debouncedManufacturerSearch = useDebouncedSearch(
    getManufacturerName,
    setManufacturerSuggestions,
    setManufacturerLoading,
    setError,
    () => setManufacturerSuggestions([])
  );

  // Handle medicine name change
  const handleMedicineNameChange = (value: string) => {
    setMedicineName(value);
    debouncedSearch(value);
  };

  // Handle medicine selection from autocomplete
  const handleMedicineSelect = (medicine: Medicine) => {
    setComposition1(medicine.composition1 || '');
    setComposition2(medicine.composition2 || '');
    setmanufacturer(medicine.manufacturer_name || '');
    setpacksize(medicine.pack_size_label || '');
    setLoading(false);
    setSuggestions([]);
  };

  // Handle manufacturer name change
  const handleManufacturerNameChange = (value: string) => {
    setmanufacturer(value);
    if (!value.trim()) {
      setManufacturerSuggestions([]);
      setManufacturerLoading(false);
      return;
    }
    debouncedManufacturerSearch(value);
  };

  // Handle manufacturer selection from autocomplete
  const handleManufacturerSelect = (manufacturerName: string) => {
    setmanufacturer(manufacturerName);
    setManufacturerSuggestions([]);
    setManufacturerLoading(false);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedMedicine(null);
    setMedicineName('');
    setComposition1('');
    setComposition2('');
    setmanufacturer('');
    setQuantity(1);
    setalertthreshold(6);
    setpacksize(0);
    setPurchasePrice(0);
    setSellingPrice(0);
    setMrp(0);
    setSuggestions([]);
    setExpiryDate("");
    setManufacturerSuggestions([]);
    setMedicineType('');
    setDosageForm('');
    setIsSubmitted(false);
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

              <Box>
                <Autocomplete
                  label="Medicine Name"
                  placeholder="Search medicine..."
                  required // Adds a visual red asterisk next to the label
  error={isSubmitted && !isMedicineNameValid ? "Medicine name is required" : null}
                  value={medicineName}
                  onChange={(value) => {
                    handleMedicineNameChange(value);

                    const medicine = suggestions.find(med => med.name === value);

                    if (medicine) {
                      handleMedicineSelect(medicine);
                      setLoading(false);
                      // Pass true to tell the upcoming debounce execution to do nothing
                      debouncedSearch(value, true);
                    } else {
                      // Normal typing runs the search normally
                      debouncedSearch(value, false);
                    }
                  }}
                  data={suggestions.map((med) => ({
                    value: `${med.name}||id:${med.id}`,
                    label: med.name
                  }))}
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
                value={medicineType}
                onChange={setMedicineType}
                searchable
                styles={inputStyles}
                clearable
              />

              <Select
                label="Dosage Form"
                placeholder="e.g., Tablet"
                data={['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment']}
                value={dosageForm}
                onChange={setDosageForm}
                searchable
                styles={inputStyles}
                clearable
              />

            </SimpleGrid>
          </Box>

          {/* ROW 2: Composition & Manufacturer Metrics */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="blue.7">2. Formula & Logistics</Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Autocomplete
                label="Manufacturer"
                placeholder="Search manufacturer..."
                value={manufacturer}
                onChange={(value) => {
                  // Check if the value is from suggestions (manufacturer name)
                  const selectedManufacturer = manufacturerSuggestions.find(m => m.name === value);
                  if (selectedManufacturer) {
                    handleManufacturerSelect(value);
                    return;
                  }
                  handleManufacturerNameChange(value);
                }}
                data={manufacturerSuggestions.map(manufacturer => ({
                  value: manufacturer.name,
                  label: manufacturer.name
                }))}
                rightSection={manufacturerLoading ? <Loader size="sm" /> : null}
                rightSectionWidth={40}
                styles={inputStyles}
              />

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


            </SimpleGrid>
          </Box>

          <Box>
            <Text fw={600} size="sm" mb="sm" c="blue.7">3. Stock Controls & Pricing</Text>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">

              {/* Left Column: Stock Logistics */}
              <Stack gap="md">
               <NumberInput
  label="Quantity in Stock"
  required
  value={quantity}
  onChange={setQuantity}
  min={0}
  error={isSubmitted && !isQuantityValid ? "Stock quantity must be 1 or greater" : null}
  styles={inputStyles}
/>
                <NumberInput
                  label="Stock Alert Threshold(Months)"
                  value={alertthreshold}
                  onChange={setalertthreshold}
                  min={0}
                  max={60}
                  styles={inputStyles}
                />
                <TextInput
                  label="Pack Size"
                  placeholder="e.g., 10 Tablets"
                  value={packsize}
                  onChange={(event) => setpacksize(event.currentTarget.value)}
                  styles={inputStyles}
                />
              </Stack>

              {/* Middle Column: Financial Data */}
              <Stack gap="md">
                <NumberInput
                  label="Purchase Price (₹)"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  min={0}
                  decimalScale={2}
                  styles={inputStyles}
                />
                <NumberInput
                  label="Selling Price (₹)"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={setSellingPrice}
                  min={0}
                  decimalScale={2}
                  styles={inputStyles}
                />
                <NumberInput
                  label="MRP (₹)"
                  placeholder="0.00"
                  value={mrp}
                  onChange={setMrp}
                  min={0}
                  decimalScale={2}
                  styles={inputStyles}
                />
              </Stack>

              {/* Right Column: Expiry & Media Zone */}
              <Stack gap="md">
                <TextInput
                  type="date"
                  label="Expiry Date"
                  value={expiryDate || ''} // Guarantee it's never undefined
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setExpiryDate(event.target.value)}
                  styles={inputStyles}
                />          <Box style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Text size="sm" fw={500} mb="xs" c="gray.8">Product Image</Text>
                  <Box
                    p="md"
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      flexGrow: 1,
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      border: '2px dashed #e2e8f0',
                      borderRadius: '12px',
                    }}
                  >
                    <UploadCloud size={20} style={{ color: '#228be6', marginBottom: '4px' }} />
                    <Text size="xs" fw={500} c="gray.6">Drag & drop image or</Text>
                    <Text size="xs" fw={700} c="blue">Click to Browse</Text>
                  </Box>
                </Box>
              </Stack>

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
            style={{ marginRight: 'auto' }}
            onClick={clearSelection}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            radius="md"
            size="md"
            leftSection={<Plus size={16} />}
            style={{ boxShadow: '0 4px 12px rgba(34, 138, 230, 0.25)' }}
           
            onClick={handleSubmit}
          >
            Save & Add Item
          </Button>
        </Group>

      </Paper>
    </Container>
  );
}