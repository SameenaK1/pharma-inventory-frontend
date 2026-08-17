import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  SimpleGrid,
  Stack,
  Box,
  TextInput,
  NumberInput,
  Autocomplete,
  Select,
  Text,
  Group,
  Button,
  ThemeIcon,
  Divider,
  Loader,
  Tooltip
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconPill,
  IconFlask,
  IconCoins,
  IconCalendarEvent,
  IconInfoCircle,
  IconX
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { debounce } from '../utils/debounce';
import {
  addInventory,
  getMedicineByName,
  getManufacturerName,
  type InventoryItem,
  type Medicine,
  type Manufacturer
} from '../services/api';

// Manufacturer type for type safety
// export type Manufacturer = {
//   id: number;
//   name: string;
// };

interface InventoryModalFormProps {
  opened: boolean;
  onClose: () => void;
  initialData?: any;
  onSuccess?: () => void;
}

export default function InventoryModalForm({
  opened,
  onClose,
  initialData,
  onSuccess
}: InventoryModalFormProps) {
  // --- STATES ---
  const [quantity, setQuantity] = useState<number | string>(1);
  const [alertthreshold, setAlertThreshold] = useState<number | string>(6);
  const [medicineName, setMedicineName] = useState('');
  const [composition1, setComposition1] = useState('');
  const [composition2, setComposition2] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [packsize, setPackSize] = useState<number | string>('');
  const [batchNumber, setBatchNumber] = useState('');
  const [shelfrackinfo, setshelfrackinfo] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(0);
  const [mrp, setMrp] = useState<number | string>(0);
  const [medicineType, setMedicineType] = useState('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [warningModalOpened, setWarningModalOpened] = useState<boolean>(false);

  // --- API FETCHING STATES ---
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [confirmedManufacturer, setConfirmedManufacturer] = useState<string>('');
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<Manufacturer[]>([]);
  const [manufacturerLoading, setManufacturerLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [originalIdentity, setOriginalIdentity] = useState<{
    name: string;
    manufacturer: string;
    packsize: string;
    composition1: string;
  } | null>(null);


  // --- STRICT VALIDATION RULES ---
  const isMedicineNameValid = medicineName.trim().length > 0 && medicineName.length <= 500;
  const isManufacturerValid = manufacturer.trim().length > 0 && manufacturer.length <= 500;
  const isTypeValid = !!medicineType && medicineType.trim().length > 0;
  const isBatchNumberValid = batchNumber.trim().length > 0 && batchNumber.length <= 100;
  const isQuantityValid = quantity !== '' && Number(quantity) > 0;
  const isExpiryDateValid = expiryDate.trim().length > 0;
  const isSellingPriceValid = sellingPrice !== '' && Number(sellingPrice) > 0;
  const isMrpValid = mrp !== '' && Number(mrp) > 0;

  const isFormValid =
    isMedicineNameValid &&
    isManufacturerValid &&
    isTypeValid &&
    isBatchNumberValid &&
    isQuantityValid &&
    isExpiryDateValid &&
    isSellingPriceValid &&
    isMrpValid;

  const isMissingWarningFields = (Number(purchasePrice) <= 0) || (composition1.trim().length === 0);

  // --- API DEBOUNCE & FETCH LOGIC ---
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

  const debouncedSearch = useDebouncedSearch(
    getMedicineByName,
    setSuggestions,
    setLoading,
    setError,
    () => setSuggestions([])
  );

  const debouncedManufacturerSearch = useDebouncedSearch(
    getManufacturerName,
    setManufacturerSuggestions,
    setManufacturerLoading,
    setError,
    () => setManufacturerSuggestions([])
  );

  const handleMedicineNameChange = (value: string) => {
    setMedicineName(value);
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setComposition1(medicine.composition1 || '');
    setComposition2(medicine.composition2 || '');
    setPackSize(medicine.pack_size_label || '');
    if (medicine.type) setMedicineType(medicine.type);
    setMedicineType(medicine.type || 'Allopathy'); // Default to 'Allopathy' if type is missing
    // Update both manufacturer states here
    setManufacturer(medicine.manufacturer_name || '');
    setConfirmedManufacturer(medicine.manufacturer_name || '');

    setLoading(false);
    setSuggestions([]);
  }

  const handleManufacturerNameChange = (value: string) => {
    setManufacturer(value);
    setConfirmedManufacturer(''); // Clear confirmation because user is typing a new search
    if (!value.trim()) {
      setManufacturerSuggestions([]);
      setManufacturerLoading(false);
      return;
    }
    debouncedManufacturerSearch(value);
  };

  const handleManufacturerSelect = (manufacturerName: string) => {
    setManufacturer(manufacturerName);
    setConfirmedManufacturer(manufacturerName); // Confirm the selection
    setManufacturerSuggestions([]);
    setManufacturerLoading(false);
  };

  // --- LIFECYCLE & SUBMISSION ---
  useEffect(() => {
    if (opened) {
      if (initialData) {
        setMedicineName(initialData.name || '');
        setManufacturer(initialData.manufacturername || initialData.manufacturer_name || '');
        setMedicineType(initialData.type || 'Allopathy');
        setPackSize(initialData.pack_size_label || '');
        setComposition1(initialData.composition1 || '');
        setComposition2(initialData.composition2 || '');
        setMrp(initialData.mrp || 0);
        setBatchNumber(initialData.batch_number || '');
        setshelfrackinfo(initialData.shelf_rack_info || '');
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
        const initialMfg = initialData.manufacturername || initialData.manufacturer_name || '';
        setManufacturer(initialMfg);
        setConfirmedManufacturer(initialMfg); // Set this here
      } else {
        setOriginalIdentity(null);
        resetFormFields();
      }
    }
  }, [initialData, opened]);

  const handleInitialSubmitCheck = () => {
    setIsSubmitted(true);

    if (!isFormValid) {
      notifications.show({
        title: 'Required Fields Missing',
        message: 'Please fill out all mandatory fields highlighted in red.',
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
          title: 'Locked Records Altered',
          message: 'Core details cannot be altered on active stock items here. Create a new baseline record instead.',
          color: 'red',
          icon: <IconAlertTriangle size={16} />,
        });
        return;
      }
    }

    if (isMissingWarningFields) {
      setWarningModalOpened(true);
      return;
    }

    executeDatabaseInsert();
  };

  const executeDatabaseInsert = async () => {
    setIsSaving(true);
    setWarningModalOpened(false);

    try {
      const item: InventoryItem = {
        name: medicineName,
        manufacturername: manufacturer,
        type: medicineType || 'Allopathy',
        packsizelabel: packsize?.toString() || '',
        composition1,
        composition2,
        mrp: Number(mrp) || 0,
        batchnumber: batchNumber,
        shelfrackinfo: shelfrackinfo,
        stockquantity: Number(quantity) || 0,
        purchaseprice: Number(purchasePrice) || 0,
        sellingprice: Number(sellingPrice) || 0,
        stockalertthreshold: Number(alertthreshold) || 0,
        expirydate: expiryDate || '',
        insertdate: new Date().toISOString(),
        updatedate: new Date().toISOString(),
      };

      await addInventory(item);

      notifications.show({
        title: 'Success!',
        message: initialData ? 'Inventory record updated successfully.' : `${medicineName} saved to registry.`,
        color: 'teal',
        icon: <IconCheck size={16} />,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Server Error Encountered',
        message: err instanceof Error ? err.message : 'Database error encountered while saving layout data.',
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
    setBatchNumber('');
    setshelfrackinfo('');
    setAlertThreshold(6);
    setPackSize('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setMrp(0);
    setExpiryDate('');
    setMedicineType('Allopathy');
    setIsSubmitted(false);
    setWarningModalOpened(false);
    setSuggestions([]);
    setManufacturerSuggestions([]);
    setSelectedMedicine(null);
    setConfirmedManufacturer('');
  };

  // --- STYLING ---
  const getInputStyles = (isValid: boolean) => {
    const errorActive = isSubmitted && !isValid;
    return {
      root: { marginBottom: '4px' },
      label: { fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' },
      input: {
        height: '42px',
        borderRadius: '10px',
        border: errorActive ? '2px solid #fa5252' : '1px solid #cbd5e1',
        backgroundColor: errorActive ? '#fff5f5' : '#ffffff',
        transition: 'all 0.2s ease',
        '&:focus': {
          borderColor: errorActive ? '#fa5252' : '#228be6',
          boxShadow: errorActive ? '0 0 0 3px rgba(250, 82, 82, 0.15)' : '0 0 0 3px rgba(34, 138, 230, 0.1)'
        },
        '&:disabled, &:readOnly': {
          color: '#1e293b',
          backgroundColor: '#eef2f6',
          cursor: 'not-allowed'
        }
      },
      error: { color: '#fa5252', fontSize: '11px', marginTop: '4px', fontWeight: 500 }
    };
  };

  const getWarningFieldStyles = (isEmpty: boolean) => {
    const warningActive = isSubmitted && isEmpty;
    return {
      root: { marginBottom: '4px' },
      label: { fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' },
      input: {
        height: '42px',
        borderRadius: '10px',
        border: warningActive ? '2px solid #fab005' : '1px solid #cbd5e1',
        backgroundColor: warningActive ? '#fff9db' : '#ffffff',
        transition: 'all 0.2s ease',
        '&:focus': { borderColor: warningActive ? '#fab005' : '#228be6' }
      }
    };
  };

  const renderLabelWithTooltip = (label: string, helpText: string) => (
    <Box
      component="span"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        verticalAlign: 'middle'
      }}
    >
      <Text component="span" size="sm" fw={500} c="#334155" style={{ lineHeight: 1.2 }}>
        {label}
      </Text>
      <Tooltip label={helpText} withArrow position="top-start" multiline w={260}>
        <ThemeIcon
          component="span"
          variant="light"
          size="sm"
          radius="xl"
          color="blue"
          style={{ cursor: 'help', display: 'inline-flex' }}
        >
          <IconInfoCircle size={12} />
        </ThemeIcon>
      </Tooltip>
    </Box>
  );

  return (
    <>
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
              <IconPill size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="lg" c="#0f172a" style={{ lineHeight: 1.2 }}>
                {initialData ? "Edit Medicine Details" : "Add New Medicine"}
              </Text>
              <Text size="xs" c="slate.5" fw={400}>
                Enter basic medicine details, prices, and locations below.
              </Text>
            </Box>
          </Group>
        }
        styles={{
          header: { backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', padding: '24px 32px' },
          close: { color: '#cbd5e1', borderRadius: '50%', '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' } },
          body: { padding: '32px', backgroundColor: '#f8fafc' },
          overlay: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.25)' }
        }}
      >
        <Stack gap="xl">
          {/* SECTION 1: Product Definition */}
          <Box style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7' }}>
            <Group gap="xs" mb="md">
              <IconPill size={16} style={{ color: '#228be6' }} />
              <Text fw={700} size="sm" c="#1e293b">1. Basic Medicine & Batch Details</Text>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg">
              <Box>

                <Autocomplete
                  label={renderLabelWithTooltip(
                    'Medicine Name',
                    'Type the medicine name to search existing records. Choosing a suggestion auto-fills known details like composition and manufacturer.'
                  )}
                  placeholder="Search medicine..."
                  required
                  error={isSubmitted && !isMedicineNameValid ? "Medicine name is required" : null}
                  value={medicineName}
                  onChange={(value) => {
                    handleMedicineNameChange(value);
                    const medicine = suggestions.find(med => med.name === value);
                    if (medicine) {
                      handleMedicineSelect(medicine);
                      setLoading(false);
                      debouncedSearch(value, true);
                    } else {
                      debouncedSearch(value, false);
                    }
                  }}
                  data={suggestions.map((med) => ({
                    value: `${med.name}||id:${med.id}`,
                    label: med.name
                  }))}
                  rightSection={loading ? <Loader size="sm" /> : null}
                  rightSectionWidth={40}
                  styles={getInputStyles(isMedicineNameValid)}
                />
                {/* Show 0 records ONLY when actively searching and no results are returned */}
                {medicineName.trim() &&
                  !loading &&
                  suggestions.length === 0 &&
                  medicineName !== initialData?.name &&
                  medicineName !== selectedMedicine?.name && (
                    <Text size="xs" c="red.6" mt={4} fw={500}>
                      0 records found
                    </Text>
                  )}
                {/* Show search suggestions count only when actively typing dropdown alternatives */}
                {medicineName.trim() && !loading && suggestions.length > 0 && medicineName !== selectedMedicine?.name && (
                  <Text size="xs" c="dimmed" mt={4}>
                    {suggestions.length} found
                  </Text>
                )}
              </Box>

              <NumberInput
                label={renderLabelWithTooltip(
                  'Stock Quantity (Number of Packs)',
                  'Enter how many packs you currently have for this batch. This value is used for available stock calculations and low-stock alerts.'
                )}
                placeholder="Enter pack quantity"
                required
                value={quantity}
                onChange={setQuantity}
                min={0}
                error={isSubmitted && !isQuantityValid ? "Quantity must be greater than 0" : null}
                styles={getInputStyles(isQuantityValid)}
              />

              <TextInput
                label={renderLabelWithTooltip(
                  'Batch Number (Lot No.)',
                  'Use the manufacturer lot or batch code printed on the package. This helps with expiry tracking, recalls, and audit history.'
                )}
                placeholder="e.g. BT-9921"
                required
                error={isSubmitted && !isBatchNumberValid ? "Batch code required" : null}
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.currentTarget.value)}
                styles={getInputStyles(isBatchNumberValid)}
              />

              <TextInput
                type="date"
                label={renderLabelWithTooltip(
                  'Expiry Date',
                  'Select the exact expiry date for this batch so the system can help prevent selling expired stock.'
                )}
                required
                error={isSubmitted && !isExpiryDateValid ? "Select date" : null}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                styles={getInputStyles(isExpiryDateValid)}
                leftSection={<IconCalendarEvent size={16} style={{ color: '#94a3b8' }} />}
              />
            </SimpleGrid>
          </Box>

          {/* SECTION 2: Formulations & Lineage */}
          <Box style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7' }}>
            <Group gap="xs" mb="md">
              <IconFlask size={16} style={{ color: '#228be6' }} />
              <Text fw={700} size="sm" c="#1e293b">2. Category & Manufacturer Info</Text>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg">
              <Box>
                <Autocomplete
                  label={renderLabelWithTooltip(
                    'Manufacturer / Company Name',
                    'Search and select the medicine manufacturer. Using a consistent manufacturer name keeps reports and records clean.'
                  )}
                  placeholder="e.g. Cipla Ltd"
                  error={isSubmitted && !isManufacturerValid ? "Manufacturer required" : null}
                  value={manufacturer}
                  onChange={(value) => {
                    const selectedManufacturer = manufacturerSuggestions.find(m => m.name === value);
                    if (selectedManufacturer) {
                      handleManufacturerSelect(value);
                      return;
                    }
                    handleManufacturerNameChange(value);
                  }}
                  data={manufacturerSuggestions.map(m => m.name)}
                  rightSection={manufacturerLoading ? <Loader size="sm" /> : null}
                  rightSectionWidth={40}
                  styles={getInputStyles(isManufacturerValid)}
                />
                {/* Safe from false positives: Checks against initial data, auto-fill, and selected states */}
                {manufacturer.trim() &&
                  !manufacturerLoading &&
                  manufacturerSuggestions.length === 0 &&
                  manufacturer !== confirmedManufacturer && (
                    <Text size="xs" c="red.6" mt={4} fw={500}>
                      0 records found
                    </Text>
                  )}
              </Box>

              <Select
                label={renderLabelWithTooltip(
                  'Medicine Type (Category)',
                  'Choose the product category for filtering and reporting. Example: Allopathy, Ayurvedic, Homeopathy, or Surgical.'
                )}
                required
                data={['Allopathy', 'Ayurvedic', 'Homeopathy', 'Surgical', 'Other']}
                error={isSubmitted && !isTypeValid ? "Select category" : null}
                value={medicineType}
                onChange={(value) => setMedicineType(value || '')}
                styles={getInputStyles(isTypeValid)}
              />

              <TextInput
                label={renderLabelWithTooltip(
                  'Main Formula / Active Composition',
                  'Add the main active ingredient and strength, such as Paracetamol 650 mg. This helps pharmacists identify substitutes safely.'
                )}
                placeholder="e.g. Paracetamol IP 650mg"
                value={composition1}
                onChange={(e) => setComposition1(e.currentTarget.value)}
                styles={getWarningFieldStyles(composition1.trim().length === 0)}
              />

              <TextInput
                label={renderLabelWithTooltip(
                  'Secondary Formula / Ingredients',
                  'Optionally include additional ingredients, combinations, or notes that support better identification and counseling.'
                )}
                placeholder="Optional additional ingredients"
                value={composition2}
                onChange={(e) => setComposition2(e.currentTarget.value)}
                styles={getInputStyles(true)}
              />
            </SimpleGrid>
          </Box>

          {/* SECTION 3: Valuation, Volumes & Assets */}
          <Box style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7' }}>
            <Group gap="xs" mb="lg">
              <IconCoins size={16} style={{ color: '#228be6' }} />
              <Text fw={700} size="sm" c="#1e293b">3. Pricing & Storage Locations</Text>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              <Stack gap="md">
                <NumberInput
                  label={renderLabelWithTooltip(
                    'Purchase Price / Cost Price (₹)',
                    'Enter the amount paid per pack. This is useful for profit analysis and reorder planning.'
                  )}
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  min={0}
                  decimalScale={2}
                  styles={getWarningFieldStyles(Number(purchasePrice) <= 0)}
                />
                <NumberInput
                  label={renderLabelWithTooltip(
                    'Selling Price to Customer (₹)',
                    'Set the actual selling price charged to customers for one pack.'
                  )}
                  placeholder="Retail rate"
                  required
                  value={sellingPrice}
                  onChange={setSellingPrice}
                  min={0}
                  decimalScale={2}
                  error={isSubmitted && !isSellingPriceValid ? "Selling price required" : null}
                  styles={getInputStyles(isSellingPriceValid)}
                />
                <NumberInput
                  label={renderLabelWithTooltip(
                    'Maximum Retail Price (MRP ₹)',
                    'Enter the printed MRP from the package. This helps ensure the selling price does not exceed legal retail limits.'
                  )}
                  placeholder="Printed price on pack"
                  required
                  value={mrp}
                  onChange={setMrp}
                  min={0}
                  decimalScale={2}
                  error={isSubmitted && !isMrpValid ? "MRP required" : null}
                  styles={getInputStyles(isMrpValid)}
                />
              </Stack>

              <Stack gap="md">
                <NumberInput
                  label={renderLabelWithTooltip(
                    'Low Stock Alert Threshold',
                    'Set the minimum quantity at which this item should be flagged for restocking.'
                  )}
                  value={alertthreshold}
                  onChange={setAlertThreshold}
                  min={0}
                  styles={getInputStyles(true)}
                />
                <TextInput
                  label={renderLabelWithTooltip(
                    'Pack Size (Units inside 1 item)',
                    'Describe how many units are inside one pack, for example 10 tablets or 100 ml bottle.'
                  )}
                  placeholder="e.g. 10 Tablets / Strip"
                  value={packsize}
                  onChange={(e) => setPackSize(e.currentTarget.value)}
                  styles={getInputStyles(true)}
                />
                <TextInput
                  label={renderLabelWithTooltip(
                    'Storage Location (Shelf / Rack Number)',
                    'Record where this stock is physically stored so staff can locate it quickly during dispensing.'
                  )}
                  placeholder="e.g. A-12, Row 3"
                  value={shelfrackinfo}
                  onChange={(e) => setshelfrackinfo(e.currentTarget.value)}
                  styles={getInputStyles(true)}
                />
              </Stack>

              <Stack gap="md">
                <Box style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {renderLabelWithTooltip(
                    'Medicine Package Image',
                    'Attach a clear package photo to help visual verification during receiving and dispensing. This area is currently a placeholder.'
                  )}
                  <Box
                    style={{
                      textAlign: 'center',
                      flexGrow: 1,
                      minHeight: '112px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      border: '1.5px dashed #cbd5e1',
                      borderRadius: '12px'
                    }}
                  >
                    <Text size="xs" fw={600} c="#475569">Photo Attachment Area</Text>
                    <Text size="10px" c="#94a3b8" mt={2}>Supported formats: PNG, JPG up to 2MB</Text>
                  </Box>
                </Box>
              </Stack>
            </SimpleGrid>
          </Box>
        </Stack>

        <Box mt={32}>
          <Divider color="#e2e8f0" mb="xl" />
          <Group justify="flex-end" gap="md">
            <Button
              variant="subtle"
              color="gray"
              size="md"
              leftSection={<IconX size={16} />}
              style={{ borderRadius: '10px', color: '#64748b' }}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              size="md"
              leftSection={<IconCheck size={16} />}
              style={{ borderRadius: '10px', fontWeight: 600 }}
              onClick={handleInitialSubmitCheck}
              loading={isSaving}
            >
              Save Stock Registry
            </Button>
          </Group>
        </Box>
      </Modal>

      <Modal
        opened={warningModalOpened}
        onClose={() => setWarningModalOpened(false)}
        size="md"
        radius="16px"
        centered
        withCloseButton={false}
        styles={{
          body: { padding: '24px' },
          overlay: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
          }
        }}
      >
        <Stack gap="md" align="center" style={{ textAlign: 'center' }}>
          <ThemeIcon variant="light" color="amber" size="xl" radius="50%">
            <IconAlertTriangle size={28} />
          </ThemeIcon>

          <Box>
            <Text fw={700} size="lg" c="#0f172a" mb={6}>
              Missing Recommended Information
            </Text>
            <Text size="sm" c="#64748b" style={{ lineHeight: 1.5 }}>
              You have left <b>Purchase Price</b> or <b>Main Formula</b> completely empty. Do you want to continue saving the stock anyway?
            </Text>
          </Box>

          <Divider color="#f1f5f9" style={{ width: '100%' }} mt="xs" />

          <Group justify="center" gap="sm" style={{ width: '100%' }}>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setWarningModalOpened(false)}
              style={{
                borderRadius: '8px',
                flex: 1,
                border: '1px solid #cbd5e1',
                color: '#000000'
              }}
            >
              Cancel & Fix
            </Button>
            <Button
              color="gray"
              onClick={executeDatabaseInsert}
              loading={isSaving}
              style={{
                borderRadius: '8px',
                flex: 1,
                border: '1px solid #cbd5e1',
                color: '#000000'
              }}
            >
              Yes, Save Anyway
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}