// components/inventory.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import {
    Container,
    Grid,
    Paper,
    Stack,
    Group,
    Title,
    Text,
    TextInput,
    Select,
    Table,
    Badge,
    Skeleton,
    Alert,
    Radio,
    ScrollArea,
    Pagination, Popover, ActionIcon, Modal, Button,
} from '@mantine/core';
import {
    IconSearch,
    IconAlertCircle,
    IconAlertTriangle,
    IconArrowsSort,
    IconSparkles,
    IconInbox, IconEdit, IconTrash, IconPlus, IconListDetails
} from '@tabler/icons-react';
import { getInventoryList, API_BASE_URL, deleteInventoryItem, type InventoryRecord } from '../services/api';
import AddInventory from './addinventory';

type SortOption = 'insert_date' | 'expiry_date' | 'manufacturer_name';

const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
    { value: 'insert_date', label: 'Newest Stock', description: 'Recently added items first' },
    { value: 'expiry_date', label: 'Expiry Date', description: 'Soonest to expire first' },
    { value: 'manufacturer_name', label: 'Manufacturer', description: 'Alphabetical by manufacturer' },
];

const NEW_STOCK_THRESHOLD_DAYS = 7;
const EXPIRY_WARNING_DAYS = 60;
const TABLE_COLUMN_COUNT = 8;
const SKELETON_ROW_COUNT = 6;

function formatExpiryDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpiringSoon(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;
    const diffDays = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= EXPIRY_WARNING_DAYS;
}

function isNewestStock(insertDateStr: string): boolean {
    const date = new Date(insertDateStr);
    if (Number.isNaN(date.getTime())) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= NEW_STOCK_THRESHOLD_DAYS;
}




function renderStatusBadge(row: InventoryRecord) {
    if (row.stock_quantity === 0) {
        return (
            <Badge color="red" variant="light" radius="sm">
                Out of Stock
            </Badge>
        );
    }
    if (row.stock_quantity <= (row.stock_alert_threshold ?? 10)) {
        return (
            <Badge color="yellow" variant="light" radius="sm">
                Low Stock
            </Badge>
        );
    }
    if (isNewestStock(row.insert_date)) {
        return (
            <Badge color="blue" variant="filled" radius="sm" leftSection={<IconSparkles size={12} />}>
                Newest
            </Badge>
        );
    }
    return (
        <Badge color="green" variant="light" radius="sm">
            In Stock
        </Badge>
    );
}

export default function Inventory() {

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('insert_date');
    const [activePage, setActivePage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);

    const [records, setRecords] = useState<InventoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.ceil(totalRecords / pageSize);

    const [debouncedSearch] = useDebouncedValue(searchTerm, 350);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUpdateRecord = (row: any) => {
        setSelectedMedicine(row); // Save clicked row data
        setModalOpen(true);       // Launch popup
    };

    const handleAddNew = () => {
        setSelectedMedicine(null); // No initial data => modal renders in "add" mode
        setModalOpen(true);
    };
    // Reset page to 1 when filters or page size change
    useEffect(() => {
        setActivePage(1);
    }, [searchTerm, pageSize]);
    const [popoverOpened, { toggle, close }] = useDisclosure(false);
    // Fetch live inventory data whenever filters, sort, or page changes (runs on mount too).
    useEffect(() => {
        let ignore = false;

        async function loadInventory() {
            setLoading(true);
            setError(null);
            try {
                const response = await getInventoryList({
                    search: debouncedSearch.trim() || undefined, // This triggers the backend OR clause across name, manufacturer, and composition
                    sortBy: sortOption,
                    page: activePage,
                    limit: pageSize,
                });

                if (ignore) return;

                const rows = response.data ?? [];
                const total = response.pagination?.total || 0;
                setRecords(rows);
                setTotalRecords(total);
            } catch (err) {
                if (ignore) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to reach the inventory server. Please try again shortly.'
                );
                setRecords([]);
                setTotalRecords(0);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadInventory();
        return () => {
            ignore = true;
        };
    }, [debouncedSearch, sortOption, activePage, pageSize, refreshKey]);

    // The backend only supports server-side sorting for name/manufacturer_name/type/composition columns,
    // so "Newest Stock" and "Expiry Date" are guaranteed client-side to keep the UX correct.
    const sortedRecords = useMemo(() => {
        const rows = [...records];
        switch (sortOption) {
            case 'expiry_date':
                rows.sort((a, b) => {
                    if (!a.expiry_date) return 1;
                    if (!b.expiry_date) return -1;
                    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
                });
                break;
            case 'manufacturer_name':
                rows.sort((a, b) => (a.manufacturer_name || '').localeCompare(b.manufacturer_name || ''));
                break;
            case 'insert_date':
            default:
                rows.sort((a, b) => new Date(b.insert_date).getTime() - new Date(a.insert_date).getTime());
        }
        return rows;
    }, [records, sortOption]);

    const [deleteRecord, setDeleteRecord] = useState<InventoryRecord | null>(null);

    const handleDeleteRecord = async () => {
        if (!deleteRecord) return;
        try {
            setError(null);
            await deleteInventoryItem({ id: deleteRecord.id, user: 'Sameena', reason: 'Not required' });
            setRecords((prev) => prev.filter((item) => item.id !== deleteRecord.id));
            setTotalRecords((prev) => Math.max(0, prev - 1));
            setDeleteRecord(null); // Close modal on success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
            setDeleteRecord(null);
        }
    };
    return (
        <Container fluid px={0} py="md">
            <Stack gap={4} mb="lg">
                <Title order={2}>Inventory Management</Title>
                <Text c="dimmed" size="sm">
                    Browse, search and sort medicines currently available in stock.
                </Text>
            </Stack>

            <Grid gap="lg" align="flex-start">
                <Grid.Col span={12}>
                    {/* Filters & Dynamic Popover Sorting Panel */}
                    <Paper withBorder radius="md" p="md" shadow="xs" mb="md">
                        <Group align="flex-end" gap="md" style={{ width: '100%', flexWrap: 'nowrap' }}>
                            <Group grow style={{ flex: 1 }} align="flex-end" gap="md">
                                <TextInput
                                    label="Search"
                                    placeholder="Search by medicine, manufacturer or composition..."
                                    leftSection={<IconSearch size={16} />}
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                                />
                            </Group>
                            <Popover
                                opened={popoverOpened}
                                onChange={toggle}
                                position="bottom-end"
                                withArrow
                                shadow="md"
                                width={320}
                            >
                                <Popover.Target>
                                    <div
                                        style={{
                                            marginTop: 22,
                                            height: 36,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                        onClick={toggle}
                                    >
                                        <ActionIcon
                                            variant={popoverOpened ? 'filled' : 'light'}
                                            color="blue"
                                            h={36}
                                            w="auto"
                                            px="md"
                                            title="Sort Options"
                                            style={{ gap: 8 }}
                                        >
                                            <IconArrowsSort size={16} />
                                            <Text size="sm" fw={500} span>Order By</Text>
                                        </ActionIcon>
                                    </div>
                                </Popover.Target>

                                <Popover.Dropdown p="md">
                                    <Group gap={6} mb="md">


                                    </Group>

                                    <Radio.Group
                                        value={sortOption}
                                        onChange={(value) => {
                                            setSortOption(value as SortOption);
                                            close();
                                        }}
                                    >
                                        <Stack gap="xs">
                                            {SORT_OPTIONS.map((option) => (
                                                <Paper
                                                    key={option.value}
                                                    withBorder
                                                    radius="sm"
                                                    p="sm"
                                                    style={{
                                                        borderColor: sortOption === option.value ? 'var(--mantine-color-blue-5)' : undefined,
                                                        backgroundColor: sortOption === option.value ? 'var(--mantine-color-blue-0)' : undefined,
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => {
                                                        setSortOption(option.value);
                                                        close();
                                                    }}
                                                >
                                                    <Radio
                                                        value={option.value}
                                                        label={
                                                            <Stack gap={0}>
                                                                <Text size="sm" fw={600}>
                                                                    {option.label}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">
                                                                    {option.description}
                                                                </Text>
                                                            </Stack>
                                                        }
                                                    />
                                                </Paper>
                                            ))}

                                            <Paper withBorder radius="sm" p="sm" style={{ opacity: 0.55, cursor: 'not-allowed' }}>
                                                <Group gap="xs" wrap="nowrap">
                                                    <IconSparkles size={16} />
                                                    <Stack gap={0}>
                                                        <Text size="sm" fw={600}>
                                                            More options
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            Additional sort properties coming soon
                                                        </Text>
                                                    </Stack>
                                                </Group>
                                            </Paper>
                                        </Stack>
                                    </Radio.Group>
                                </Popover.Dropdown>
                            </Popover>
                            {/* Add New Inventory */}
                            <Button
                                leftSection={<IconPlus size={16} />}
                                variant="filled"
                                color="blue"
                                h={36}
                                mt={22}
                                onClick={handleAddNew}
                            >
                                Add Inventory
                            </Button>
                        </Group>
                    </Paper>

                    <Paper withBorder radius="md" p="md" shadow="xs">
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Medicines</Title>
                            <Text size="sm" c="dimmed">
                                {loading ? 'Loading records…' : `${sortedRecords.length} of ${totalRecords} item${totalRecords === 1 ? '' : 's'} found`}
                            </Text>
                        </Group>

                        {error && (
                            <Alert
                                icon={<IconAlertCircle size={18} />}
                                color="red"
                                variant="light"
                                title="Unable to load inventory"
                                radius="md"
                                mb="md"
                            >
                                {error} Please verify the API server is running at {API_BASE_URL}.
                            </Alert>
                        )}

                        <ScrollArea h={550} offsetScrollbars type="scroll" scrollbarSize={8}>
                            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md" withTableBorder stickyHeader style={{ fontSize: '70%' }}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Medicine Name</Table.Th>
                                        <Table.Th>Manufacturer</Table.Th>
                                        <Table.Th>Compound 1</Table.Th>
                                        <Table.Th>Compound 2</Table.Th>
                                        <Table.Th ta="right">Quantity</Table.Th>
                                        <Table.Th>Expiry Date</Table.Th>
                                        <Table.Th>Status</Table.Th>
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

                                    {!loading && !error && sortedRecords.length === 0 && (
                                        <Table.Tr>
                                            <Table.Td colSpan={TABLE_COLUMN_COUNT}>
                                                <Stack align="center" gap={4} py="xl">
                                                    <IconInbox size={28} color="var(--mantine-color-gray-5)" />
                                                    <Text c="dimmed" size="sm">
                                                        No inventory items match your current filters.
                                                    </Text>
                                                </Stack>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}

                                    {!loading &&
                                        !error &&
                                        sortedRecords.map((row) => (
                                            <Table.Tr key={row.id}>
                                                <Table.Td>

                                                    <b>   {row.name}</b>
                                                    <br></br>


                                                    {row.pack_size_label}


                                                </Table.Td>
                                                <Table.Td>{row.manufacturer_name}</Table.Td>

                                                <Table.Td>{row.composition1 || '—'}</Table.Td>
                                                <Table.Td>{row.composition2 || '—'}</Table.Td>
                                                <Table.Td ta="right">{row.stock_quantity}</Table.Td>
                                                <Table.Td>
                                                    <Group gap={4} wrap="nowrap">
                                                        
                                                        {formatExpiryDate(row.expiry_date)}

                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>{renderStatusBadge(row)}</Table.Td>
                                                <Table.Td>
                                                    <Group justify="center" gap={4} wrap="nowrap">
                                                        <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => handleUpdateRecord(row)}>
                                                            <IconEdit style={{ width: 16, height: 16 }} />
                                                        </ActionIcon>

                                                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => setDeleteRecord(row)}>
                                                            <IconTrash style={{ width: 16, height: 16 }} />
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
                </Grid.Col>


            </Grid>

            <Modal
                opened={!!deleteRecord}
                onClose={() => setDeleteRecord(null)}
                title={<Text fw={700} color="red.7">Warning: Permanent Action</Text>}

                centered={false}
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                <Text size="sm" mb="lg">
                    Are you sure you want to delete <strong>{deleteRecord?.name}</strong>?
                </Text>
                <Group justify="flex-end" gap="sm">
                    <Button variant="light" color="gray" size="xs" onClick={() => setDeleteRecord(null)}>Cancel</Button>
                    <Button variant="filled" color="red" size="xs" onClick={handleDeleteRecord}>Yes, Delete</Button>
                </Group>
            </Modal>
            <AddInventory
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                initialData={selectedMedicine}
                onSuccess={() => {
                    setModalOpen(false);
                    setSelectedMedicine(null);
                    setRefreshKey((key) => key + 1);
                }}
            />
        </Container>
    );
}
