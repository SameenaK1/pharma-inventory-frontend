// components/Invoices.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconEye,
  IconInbox,
  IconListDetails,
  IconPencil,
  IconReceipt,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import {
  getBillingInvoice,
  listBillingInvoices,
  updateBillingInvoice,
  type BillingInvoiceDetail,
  type BillingInvoiceItem,
  type BillingInvoiceListItem,
} from '../services/billing';
import { API_BASE_URL } from '../services/apiClient';

const TABLE_COLUMN_COUNT = 8;
const SKELETON_ROW_COUNT = 6;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PAYMENT_COLORS: Record<string, string> = {
  Cash: 'green',
  UPI: 'violet',
  Card: 'blue',
  Credit: 'orange',
};

// Postgres DECIMAL columns arrive as strings, so coerce before formatting.
const money = (value: string | number | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Postgres DATE columns can serialize as "YYYY-MM-DD" or a full ISO timestamp.
// Parsing the date parts directly avoids an off-by-one caused by timezone shifting.
function formatInvoiceDate(value: string | null): string {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value).slice(0, 10);
  const month = MONTHS[Number(match[2]) - 1] ?? '';
  return `${match[3]} ${month} ${match[1]}`;
}

function PaymentBadge({ paymentType }: { paymentType: string }) {
  return (
    <Badge color={PAYMENT_COLORS[paymentType] ?? 'gray'} variant="light" radius="sm">
      {paymentType || '—'}
    </Badge>
  );
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, 350);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  const [records, setRecords] = useState<BillingInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.ceil(totalRecords / pageSize);

  // View modal state
  const [viewInvoice, setViewInvoice] = useState<BillingInvoiceListItem | null>(null);
  const [viewDetail, setViewDetail] = useState<BillingInvoiceDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // Edit modal state
  const [editInvoice, setEditInvoice] = useState<BillingInvoiceListItem | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset to the first page whenever search or page size changes.
  useEffect(() => {
    setActivePage(1);
  }, [searchTerm, pageSize]);

  useEffect(() => {
    let ignore = false;

    async function loadInvoices() {
      setLoading(true);
      setError(null);
      try {
        const response = await listBillingInvoices({ page: activePage, limit: pageSize });
        if (ignore) return;

        const rows = response.data ?? [];
        const total = response.pagination?.total ?? 0;
        setRecords(rows);
        setTotalRecords(total);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to reach the billing server. Please try again shortly.'
        );
        setRecords([]);
        setTotalRecords(0);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadInvoices();
    return () => {
      ignore = true;
    };
  }, [activePage, pageSize, refreshKey]);

  // The list endpoint has no server-side search yet, so filter the current page client-side.
  const filteredRecords = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return records;
    return records.filter((row) =>
      [row.invoice_number, row.customer_name, row.doctor_name, row.payment_type, row.phone_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [records, debouncedSearch]);

  const openView = async (row: BillingInvoiceListItem) => {
    setViewInvoice(row);
    setViewDetail(null);
    setViewError(null);
    setViewLoading(true);
    try {
      const response = await getBillingInvoice(row.invoice_number);
      setViewDetail(response.data ?? null);
      if (!response.data) setViewError('No details found for this invoice.');
    } catch (err) {
      setViewError(err instanceof Error ? err.message : 'Failed to load invoice details.');
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (row: BillingInvoiceListItem) => {
    setEditInvoice(row);
    setEditError(null);
    setEditForm({
      doctorName: row.doctor_name ?? '',
      paymentType: row.payment_type ?? 'Cash',
      customerName: row.customer_name ?? '',
      phoneNumber: row.phone_number ?? '',
      patientAge: row.patient_age != null ? String(row.patient_age) : '',
      patientGender: row.patient_gender ?? '',
      address: row.address ?? '',
      gstin: row.gstin ?? '',
    });
  };

  const setField = (field: string, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveEdit = async () => {
    if (!editInvoice) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateBillingInvoice(editInvoice.invoice_number, {
        doctorName: editForm.doctorName.trim() || undefined,
        paymentType: editForm.paymentType || 'Cash',
        customerName: editForm.customerName.trim() || undefined,
        phoneNumber: editForm.phoneNumber.trim() || undefined,
        patientAge: editForm.patientAge === '' ? null : Number(editForm.patientAge),
        patientGender: editForm.patientGender || undefined,
        address: editForm.address.trim() || undefined,
        gstin: editForm.gstin.trim() || undefined,
      });
      setEditInvoice(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update invoice.');
    } finally {
      setEditSaving(false);
    }
  };

  const invoice = viewDetail?.invoice ?? viewInvoice;
  const items = viewDetail?.items ?? [];

  return (
    <Container fluid px={0} py="md">
      <Stack gap={4} mb="lg">
        <Title order={2}>Billing Invoices</Title>
        <Text c="dimmed" size="sm">
          Browse and review every pharmacy invoice you have generated.
        </Text>
      </Stack>

      <Paper withBorder radius="md" p="md" shadow="xs" mb="md">
        <Group align="flex-end" gap="md" style={{ width: '100%', flexWrap: 'nowrap' }}>
          <Group grow style={{ flex: 1 }} align="flex-end">
            <TextInput
              label="Search"
              placeholder="Search by invoice number, customer, doctor or payment type..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
          </Group>
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            mt={22}
            onClick={() => setRefreshKey((key) => key + 1)}
            title="Refresh invoices"
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Paper>

      <Paper withBorder radius="md" p="md" shadow="xs">
        <Group justify="space-between" mb="md">
          <Title order={4}>Invoices</Title>
          <Text size="sm" c="dimmed">
            {loading
              ? 'Loading records…'
              : `${filteredRecords.length} of ${totalRecords} invoice${totalRecords === 1 ? '' : 's'} found`}
          </Text>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            variant="light"
            title="Unable to load invoices"
            radius="md"
            mb="md"
          >
            {error} Please verify the API server is running at {API_BASE_URL}.
          </Alert>
        )}

        <ScrollArea h={550} offsetScrollbars type="scroll" scrollbarSize={8}>
          <Table
            striped
            highlightOnHover
            verticalSpacing="sm"
            horizontalSpacing="md"
            withTableBorder
            stickyHeader
            style={{ fontSize: '75%' }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Doctor</Table.Th>
                <Table.Th>Payment</Table.Th>
                <Table.Th ta="right">Items</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading &&
                Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
                  <Table.Tr key={`skeleton-${rowIndex}`}>
                    {Array.from({ length: TABLE_COLUMN_COUNT }).map((__, colIndex) => (
                      <Table.Td key={colIndex}>
                        <Skeleton height={16} radius="sm" />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}

              {!loading && !error && filteredRecords.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={TABLE_COLUMN_COUNT}>
                    <Stack align="center" gap={4} py="xl">
                      <IconInbox size={28} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" size="sm">
                        No invoices match your current filters.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              )}

              {!loading &&
                !error &&
                filteredRecords.map((row) => (
                  <Table.Tr key={row.invoice_number}>
                    <Table.Td>
                      <b>{row.invoice_number}</b>
                    </Table.Td>
                    <Table.Td>{formatInvoiceDate(row.invoice_date)}</Table.Td>
                    <Table.Td>{row.customer_name || '—'}</Table.Td>
                    <Table.Td>{row.doctor_name || '—'}</Table.Td>
                    <Table.Td>
                      <PaymentBadge paymentType={row.payment_type} />
                    </Table.Td>
                    <Table.Td ta="right">{row.total_quantity}</Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {money(row.final_payable)}
                    </Table.Td>
                    <Table.Td>
                      <Group justify="center" gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={() => openView(row)}
                          title="View invoice"
                        >
                          <IconEye style={{ width: 16, height: 16 }} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          size="sm"
                          onClick={() => openEdit(row)}
                          title="Modify invoice"
                        >
                          <IconPencil style={{ width: 16, height: 16 }} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="space-between" mt="md">
          <Select
            value={String(pageSize)}
            onChange={(value) => setPageSize(Number(value) || 10)}
            data={['5', '10', '20', '50']}
            leftSection={<IconListDetails size={16} />}
            w={90}
            size="sm"
            radius="md"
            allowDeselect={false}
          />
          {totalPages > 1 && (
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={setActivePage}
              size="sm"
              boundaries={1}
              siblings={1}
            />
          )}
        </Group>
      </Paper>

      {/* ------------------------------ View modal ------------------------------ */}
      <Modal
        opened={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={
          <Group gap="xs">
            <IconReceipt size={18} />
            <Text fw={700}>{viewInvoice?.invoice_number}</Text>
          </Group>
        }
        size={960}
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        {viewLoading && (
          <Stack gap="xs">
            <Skeleton height={16} radius="sm" />
            <Skeleton height={16} radius="sm" />
            <Skeleton height={16} radius="sm" />
          </Stack>
        )}

        {viewError && !viewLoading && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light" radius="md">
            {viewError}
          </Alert>
        )}

        {!viewLoading && !viewError && invoice && (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              <div>
                <Text size="xs" c="dimmed">Invoice date</Text>
                <Text fw={600}>{formatInvoiceDate(invoice.invoice_date)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Payment type</Text>
                <PaymentBadge paymentType={invoice.payment_type} />
              </div>
              <div>
                <Text size="xs" c="dimmed">Created by</Text>
                <Text fw={600}>{invoice.created_by || '—'}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Customer</Text>
                <Text fw={600}>{invoice.customer_name || '—'}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Doctor</Text>
                <Text fw={600}>{invoice.doctor_name || '—'}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Phone</Text>
                <Text fw={600}>{invoice.phone_number || '—'}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Age / Gender</Text>
                <Text fw={600}>
                  {invoice.patient_age != null ? `${invoice.patient_age} yrs` : '—'}
                  {invoice.patient_gender ? ` · ${invoice.patient_gender}` : ''}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">GSTIN</Text>
                <Text fw={600}>{invoice.gstin || '—'}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Address</Text>
                <Text fw={600}>{invoice.address || '—'}</Text>
              </div>
            </SimpleGrid>

            <Divider />

            <ScrollArea offsetScrollbars scrollbarSize={8}>
              <Table striped withTableBorder verticalSpacing="xs" horizontalSpacing="xs" fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Medicine</Table.Th>
                    <Table.Th>Batch</Table.Th>
                    <Table.Th>Expiry</Table.Th>
                    <Table.Th ta="right">Qty</Table.Th>
                    <Table.Th>Pack</Table.Th>
                    <Table.Th ta="right">MRP</Table.Th>
                    <Table.Th ta="right">Selling</Table.Th>
                    <Table.Th ta="right">GST %</Table.Th>
                    <Table.Th ta="right">Taxable</Table.Th>
                    <Table.Th ta="right">Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={10}>
                        <Text c="dimmed" ta="center" py="md">
                          No line items recorded for this invoice.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {items.map((item: BillingInvoiceItem) => (
                    <Table.Tr key={item.item_id}>
                      <Table.Td>
                        <b>{item.medicine_name}</b>
                      </Table.Td>
                      <Table.Td>{item.batch}</Table.Td>
                      <Table.Td>{formatInvoiceDate(item.expiry_date)}</Table.Td>
                      <Table.Td ta="right">{item.qty}</Table.Td>
                      <Table.Td>{item.pack}</Table.Td>
                      <Table.Td ta="right">{money(item.mrp)}</Table.Td>
                      <Table.Td ta="right">{money(item.selling_price)}</Table.Td>
                      <Table.Td ta="right">{Number(item.gst_percentage ?? 0)}%</Table.Td>
                      <Table.Td ta="right">{money(item.taxable_amount)}</Table.Td>
                      <Table.Td ta="right">{money(item.total)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Divider />

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <div>
                <Text size="xs" c="dimmed">Total quantity</Text>
                <Text fw={600}>{invoice.total_quantity}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Gross amount</Text>
                <Text fw={600}>{money(invoice.gross_amount)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Discount</Text>
                <Text fw={600} c="red">-{money(invoice.discount_amount)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Flat discount</Text>
                <Text fw={600}>-{money(invoice.flat_discount)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Subtotal</Text>
                <Text fw={600}>{money(invoice.subtotal)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Final payable</Text>
                <Text fw={700} c="blue">{money(invoice.final_payable)}</Text>
              </div>
            </SimpleGrid>
          </Stack>
        )}

        <Group justify="flex-end" mt="lg">
          <Button variant="light" color="gray" onClick={() => setViewInvoice(null)}>
            Close
          </Button>
        </Group>
      </Modal>

      {/* ------------------------------ Edit modal ------------------------------ */}
      <Modal
        opened={!!editInvoice}
        onClose={() => setEditInvoice(null)}
        title={
          <Group gap="xs">
            <IconPencil size={18} />
            <Text fw={700}>Modify {editInvoice?.invoice_number}</Text>
          </Group>
        }
        size={520}
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <Stack gap="sm">
          {editError && (
            <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light" radius="md">
              {editError}
            </Alert>
          )}

          <Text size="xs" c="dimmed">
            Only customer and payment details can be changed. Line items and amounts are locked once an invoice is generated.
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Customer name"
              placeholder="Full name"
              value={editForm.customerName ?? ''}
              onChange={(event) => setField('customerName', event.currentTarget.value)}
            />
            <TextInput
              label="Doctor name"
              placeholder="Dr. Name"
              value={editForm.doctorName ?? ''}
              onChange={(event) => setField('doctorName', event.currentTarget.value)}
            />
            <Select
              label="Payment type"
              data={['Cash', 'UPI', 'Card', 'Credit']}
              value={editForm.paymentType ?? 'Cash'}
              onChange={(value) => setField('paymentType', value ?? 'Cash')}
            />
            <TextInput
              label="Phone number"
              placeholder="10-digit mobile number"
              value={editForm.phoneNumber ?? ''}
              onChange={(event) => setField('phoneNumber', event.currentTarget.value)}
            />
            <TextInput
              label="Age"
              placeholder="Years"
              value={editForm.patientAge ?? ''}
              onChange={(event) => setField('patientAge', event.currentTarget.value)}
            />
            <Select
              label="Gender"
              placeholder="Select gender"
              data={['Female', 'Male', 'Other', 'Prefer not to say']}
              value={editForm.patientGender ?? null}
              onChange={(value) => setField('patientGender', value ?? '')}
            />
            <TextInput
              label="GSTIN"
              placeholder="For business customers"
              value={editForm.gstin ?? ''}
              onChange={(event) => setField('gstin', event.currentTarget.value)}
            />
            <TextInput
              label="Address"
              placeholder="Billing address"
              value={editForm.address ?? ''}
              onChange={(event) => setField('address', event.currentTarget.value)}
            />
          </SimpleGrid>
        </Stack>

        <Group justify="flex-end" gap="sm" mt="lg">
          <Button variant="light" color="gray" onClick={() => setEditInvoice(null)}>
            Cancel
          </Button>
          <Button color="blue" onClick={handleSaveEdit} loading={editSaving} disabled={editSaving}>
            Save changes
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
