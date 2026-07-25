import { useState, useEffect } from 'react';
import { 
  Modal, 
  SimpleGrid, 
  Stack, 
  Box, 
  TextInput, 
  NumberInput, 
  Autocomplete, 
  Text, 
  Group, 
  Button,
  ThemeIcon,
  Divider
} from '@mantine/core';
import { 
  IconAlertTriangle, 
  IconCheck, 
  IconPlus, 
  IconX, 
  IconCloudUpload, 
  IconPill, 
  IconFlask, 
  IconCoins,
  IconCalendarEvent
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { addInventory, type InventoryItem } from '../services/api';

interface InventoryModalFormProps {
  opened: boolean;
  onClose: () => void;
  initialData?: any; 
  onSuccess?: () => void; 
}

export default function InventoryModalForm({ opened, onClose, initialData, onSuccess }: InventoryModalFormProps) {
  // --- STATES ---
  const [quantity, setQuantity] = useState<number | string>(1);
  const [alertthreshold, setAlertThreshold] = useState<number | string>(6);
  const [medicineName, setMedicineName] = useState('');
  const [composition1, setComposition1] = useState('');
  const [composition2, setComposition2] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [packsize, setPackSize] = useState<number | string>('');
  const [purchasePrice, setPurchasePrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(0);
  const [mrp, setMrp] = useState<number | string>(0);
  const [medicineType, setMedicineType] = useState<string | null>("Allopathy"); 
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [originalIdentity, setOriginalIdentity] = useState<{
    name: string;
    manufacturer: string;
    packsize: string;
    composition1: string;
  } | null>(null);

  // Identity fields are part of the DB unique constraint (name, manufacturer_name,
  // pack_size_label, composition1, user_name) - they must stay locked once a record exists.
  const isEditMode = !!initialData;

  // --- VALIDATION ---
  const isMedicineNameValid = medicineName.trim().length > 0;
  const isQuantityValid = Number(quantity) >= 0;
  const isFormValid = isMedicineNameValid && isQuantityValid;

  useEffect(() => {
    if (opened) {
      if (initialData) {
        setMedicineName(initialData.name || '');
        setManufacturer(initialData.manufacturername || initialData.manufacturer_name || '');
        setMedicineType(initialData.type || 'Allopathy');
        setPackSize(initialData.pack_size_label || initialData.pack_size_label || '');
        setComposition1(initialData.composition1 || '');
        setComposition2(initialData.composition2 || '');
        setMrp(initialData.mrp || 0);
        setQuantity(initialData.stock_quantity || 0);
        setPurchasePrice(initialData.purchase_price || 0);
        setSellingPrice(initialData.selling_price || 0);
        setAlertThreshold(initialData.stock_alert_threshold || 6);
        setExpiryDate(initialData.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '');
        setOriginalIdentity({
          name: initialData.name || '',
          manufacturer: initialData.manufacturername || initialData.manufacturer_name || '',
          packsize: (initialData.pack_size_label ?? '').toString(),
          composition1: initialData.composition1 || '',
        });
      } else {
        setOriginalIdentity(null);
        resetFormFields();
      }
    }
  }, [initialData, opened]);

  const handleSubmit = async () => {
    setIsSubmitted(true); 
    if (!isFormValid) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please complete all required fields.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
      return; 
    }

    if (originalIdentity) {
      const identityChanged =
        medicineName !== originalIdentity.name ||
        manufacturer !== originalIdentity.manufacturer ||
        (packsize?.toString() || '') !== originalIdentity.packsize ||
        composition1 !== originalIdentity.composition1;

      if (identityChanged) {
        notifications.show({
          title: 'Locked Fields Modified',
          message: 'Medicine Name, Manufacturer, Pack Size and Primary Composition identify this record and cannot be changed here. Discard changes and create a new entry instead.',
          color: 'red',
          icon: <IconAlertTriangle size={16} />,
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const item: InventoryItem = {
        name: medicineName,
        manufacturername: manufacturer,
        type: medicineType || 'Allopathy',
        packsizelabel: packsize?.toString() || '',
        composition1,
        composition2,
        mrp: Number(mrp) || 0,
        stockquantity: Number(quantity) || 0,
        purchaseprice: Number(purchasePrice) || 0,
        sellingprice: Number(sellingPrice) || 0,
        stockalertthreshold: Number(alertthreshold) || 0,
        expirydate: expiryDate || '',
        username: 'admin',
        insertdate: new Date().toISOString(),
        updatedate: new Date().toISOString(),
      };

      await addInventory(item);

      notifications.show({
        title: 'Success!',
        message: initialData
          ? 'Inventory record updated successfully.'
          : `${medicineName} has been added to the inventory records.`,
        color: 'teal',
        icon: <IconCheck size={16} />,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Server error encountered while saving inventory data.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormFields = () => {
    setMedicineName('');
    setComposition1('');
    setComposition2('');
    setManufacturer('');
    setQuantity(1);
    setAlertThreshold(6);
    setPackSize('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setMrp(0);
    setExpiryDate('');
    setMedicineType('Allopathy');
    setIsSubmitted(false);
  };

  // Modern UI Input shared styling
  const inputStyles = {
    root: { marginBottom: '4px' },
    label: { fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' },
    input: { 
      height: '42px', 
      borderRadius: '10px', 
      border: '1px solid #cbd5e1',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: '#228be6',
        boxShadow: '0 0 0 3px rgba(34, 138, 230, 0.1)'
      },
      '&:disabled, &:readOnly, &[readonly]': {
        color: '#1e293b',
        opacity: 1,
        WebkitTextFillColor: '#1e293b',
        backgroundColor: '#eef2f6',
        cursor: 'not-allowed'
      }
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      size="80%" 
      radius="24px" 
      centered
      withCloseButton
      title={
        <Group gap="sm">
          <ThemeIcon variant="light" color="blue" size="lg" radius="md">
            {initialData ? <IconPill size={20} /> : <IconPlus size={20} />}
          </ThemeIcon>
          <Box>
            <Text fw={700} size="lg" c="#0f172a" style={{ lineHeight: 1.2 }}>
              {initialData ? "Modify Stock Registry" : "Provision New Stock"}
            </Text>
            <Text size="xs" c="slate.5" fw={400}>
              Configure pharmaceutical catalog items and baseline controls
            </Text>
          </Box>
        </Group>
      }
      styles={{
        header: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          padding: '24px 32px',
        },
        close: {
          color: '#e9e9e9',
          borderRadius: '50%',
          '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
        },
        body: {
          padding: '32px',
          backgroundColor: '#f8fafc', // Soft dashboard background
        },
        overlay: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(15, 23, 42, 0.25)',
        }
      }}
    >
      <Stack gap="xl">
        
        {/* SECTION 1: Product Definition */}
        <Box style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <Group gap="xs" mb="md">
            <IconPill size={16} style={{ color: '#228be6' }} />
            <Text fw={700} size="sm" c="#1e293b" style={{ letterSpacing: '0.3px' }}>1. Core Classifications</Text>
          </Group>
          
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <Autocomplete
              label="Medicine Name"
              placeholder="e.g. Lipitor 20mg"
              required
              readOnly={isEditMode}
              error={isSubmitted && !isMedicineNameValid ? "Name required" : null}
              value={medicineName}
              onChange={setMedicineName}
              data={[]}
              styles={inputStyles}
            />

             <NumberInput
                label="Physical Stock Quantity"
                required
                value={quantity}
                onChange={setQuantity}
                min={0}
                error={isSubmitted && !isQuantityValid ? "Required" : null}
                styles={inputStyles}
              />
            <TextInput
                type="date"
                label="Batch Expiry Validation"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                styles={inputStyles}
                leftSection={<IconCalendarEvent size={16} style={{ color: '#94a3b8' }} />}
              />
          </SimpleGrid>
        </Box>

        {/* SECTION 2: Formulations & Lineage */}
        <Box style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <Group gap="xs" mb="md">
            <IconFlask size={16} style={{ color: '#228be6' }} />
            <Text fw={700} size="sm" c="#1e293b">2. Molecular Profile & Origin</Text>
          </Group>
          
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <Autocomplete
              label="Manufacturer Entity"
              placeholder="Search producers..."
              readOnly={isEditMode}
              value={manufacturer}
              onChange={setManufacturer}
              data={[]}
              styles={inputStyles}
            />

            <TextInput
              label="Primary Active Composition"
              placeholder="e.g. Atorvastatin 20mg"
              readOnly={isEditMode}
              value={composition1}
              onChange={(e) => setComposition1(e.currentTarget.value)}
              styles={inputStyles}
            />

            <TextInput
              label="Secondary Composition"
              placeholder="Optional structural compounds"
              value={composition2}
              onChange={(e) => setComposition2(e.currentTarget.value)}
              styles={inputStyles}
            />
          </SimpleGrid>
        </Box>

        {/* SECTION 3: Valuation, Volumes & Assets */}
        <Box style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <Group gap="xs" mb="lg">
            <IconCoins size={16} style={{ color: '#228be6' }} />
            <Text fw={700} size="sm" c="#1e293b">3. Financial Ledger & Auditing</Text>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {/* Column A: Physical Units */}
            <Stack gap="md">
             
              <NumberInput
                label="Minimum Allocation Threshold"
                value={alertthreshold}
                onChange={setAlertThreshold}
                min={0}
                styles={inputStyles}
              />
              <TextInput
                label="Packaging Metric Label"
                placeholder="e.g. 10 Tabs / Strip"
                readOnly={isEditMode}
                value={packsize}
                onChange={(e) => setPackSize(e.currentTarget.value)}
                styles={inputStyles}
              />
              <NumberInput
                label="Acquisition Price (₹)"
                value={purchasePrice}
                onChange={setPurchasePrice}
                min={0}
                decimalScale={2}
                styles={inputStyles}
              />
            </Stack>

            {/* Column B: Pricing Indices */}
            <Stack gap="md">
              
              <NumberInput
                label="Outward Retail Price (₹)"
                value={sellingPrice}
                onChange={setSellingPrice}
                min={0}
                decimalScale={2}
                styles={inputStyles}
              />
              <NumberInput
                label="Maximum Retail Price (MRP ₹)"
                value={mrp}
                onChange={setMrp}
                min={0}
                decimalScale={2}
                styles={inputStyles}
              />
            </Stack>

            {/* Column C: Lifespan & Assets */}
            <Stack gap="md">
             
              
              <Box style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Text size="13px" fw={600} mb="6px" c="#334155">Media Asset Attachment</Text>
                <Box
                  style={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    flexGrow: 1,
                    minHeight: '112px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#228be6';
                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                >
                  <IconCloudUpload size={22} style={{ color: '#228be6', marginBottom: '6px' }} />
                  <Text size="xs" fw={600} c="#475569">Drop package thumbnail here</Text>
                  <Text size="10px" c="#94a3b8" mt={2}>Supported: PNG, JPEG up to 2MB</Text>
                </Box>
              </Box>
            </Stack>
          </SimpleGrid>
        </Box>
      </Stack>

      {/* FOOTER ACTIONS FRAME */}
      <Box mt={32}>
        <Divider color="#e2e8f0" mb="xl" />
        <Group justify="flex-end" gap="md">
          <Button
            variant="subtle"
            color="gray"
            radius="cbc"
            size="md"
            leftSection={<IconX size={16} />}
            style={{ borderRadius: '10px', color: '#64748b' }}
            onClick={onClose}
            disabled={isSaving}
          >
            Discard Changes
          </Button>
          <Button
            color="blue"
            size="md"
            leftSection={<IconCheck size={16} />}
            style={{ 
              borderRadius: '10px',
              paddingLeft: '24px',
              paddingRight: '24px',
              boxShadow: '0 4px 12px rgba(34, 138, 230, 0.25)',
              fontWeight: 600
            }}
            onClick={handleSubmit}
            loading={isSaving}
          >
            Commit Entry
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}