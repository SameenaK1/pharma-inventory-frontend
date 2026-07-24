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
    Pagination, Popover, ActionIcon, Menu, rem
} from '@mantine/core';
import {
    IconSearch,
    IconCategory,
    IconFlask,
    IconAlertCircle,
    IconAlertTriangle,
    IconArrowsSort,
    IconSparkles,
    IconInbox, IconDotsVertical, IconEdit, IconTrash
} from '@tabler/icons-react';
import { getInventoryList, API_BASE_URL, type InventoryRecord } from '../services/api';


type SortOption = 'insert_date' | 'expiry_date' | 'manufacturer_name';

const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
    { value: 'insert_date', label: 'Newest Stock', description: 'Recently added items first' },
    { value: 'expiry_date', label: 'Expiry Date', description: 'Soonest to expire first' },
    { value: 'manufacturer_name', label: 'Manufacturer', description: 'Alphabetical by manufacturer' },
];

const NEW_STOCK_THRESHOLD_DAYS = 7;
const EXPIRY_WARNING_DAYS = 60;
const TABLE_COLUMN_COUNT = 9;
const SKELETON_ROW_COUNT = 6;

function mergeUniqueOptions(existing: string[], incoming: (string | null | undefined)[]): string[] {
    const merged = new Set(existing);
    incoming.forEach((value) => {
        if (value && value.trim()) merged.add(value);
    });
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
}

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
const handleUpdateRecord = (record: InventoryRecord) => {
    console.log('Update requested for record:', record.id, record.name);
    // TODO: Open your edit modal or trigger edit form logic here
};

const handleDeleteRecord = (record: InventoryRecord) => {
    console.log('Delete requested for record:', record.id, record.name);
    // TODO: Connect your delete API call or open confirmation modal here
};

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
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [comp1Filter, setComp1Filter] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>('insert_date');
    const [activePage, setActivePage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const [comp1Options, setComp1Options] = useState<string[]>([]);

    const [records, setRecords] = useState<InventoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.ceil(totalRecords / 50);

    const [debouncedSearch] = useDebouncedValue(searchTerm, 350);

    // Reset page to 1 when filters change
    useEffect(() => {
        setActivePage(1);
    }, [searchTerm, typeFilter, comp1Filter]);
    const [popoverOpened, { toggle, close }] = useDisclosure(false);
    // Fetch live inventory data whenever filters, sort, or page changes (runs on mount too).
    useEffect(() => {
        let ignore = false;

        async function loadInventory() {
            setLoading(true);
            setError(null);
            try {
                const response = await getInventoryList({
                    name: debouncedSearch.trim() || undefined,
                    type: typeFilter ?? undefined,
                    composition1: comp1Filter ?? undefined,
                    sortBy: sortOption,
                    page: activePage,
                    limit: 50,
                });

                if (ignore) return;

                const rows = response.data ?? [];
                const total = response.pagination?.total || 0;
                setRecords(rows);
                setTotalRecords(total);
                setTypeOptions((prev) => mergeUniqueOptions(prev, rows.map((r) => r.type)));
                setComp1Options((prev) => mergeUniqueOptions(prev, rows.map((r) => r.composition1)));
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
    }, [debouncedSearch, typeFilter, comp1Filter, sortOption, activePage]);

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
                                    label="Medicine Name"
                                    placeholder="Search by name..."
                                    leftSection={<IconSearch size={16} />}
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                                />
                                <Select
                                    label="Type"
                                    placeholder="All types"
                                    data={typeOptions}
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                    leftSection={<IconCategory size={16} />}
                                    clearable
                                />
                                <Select
                                    label="Compound 1"
                                    placeholder="All compounds"
                                    data={comp1Options}
                                    value={comp1Filter}
                                    onChange={setComp1Filter}
                                    leftSection={<IconFlask size={16} />}
                                    clearable
                                />
                            </Group>

                            {/* Sort Actions Popover */}
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
                                                        {isExpiringSoon(row.expiry_date) && (
                                                            <IconAlertTriangle size={14} color="var(--mantine-color-orange-6)" />
                                                        )}

                                                        {formatExpiryDate(row.expiry_date)}

                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>{renderStatusBadge(row)}</Table.Td>
                                                <Table.Td>
                                                    <Group justify="center">
                                                        <Menu position="bottom-end" shadow="sm" transitionProps={{ transition: 'pop' }} withArrow>
                                                            <Menu.Target>
                                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                                    <IconDotsVertical size={16} />
                                                                </ActionIcon>
                                                            </Menu.Target>
                                                            <Menu.Dropdown>
                                                                <Menu.Item
                                                                    leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
                                                                    onClick={() => handleUpdateRecord(row)}
                                                                >
                                                                    Edit Item
                                                                </Menu.Item>
                                                                <Menu.Item
                                                                    color="red"
                                                                    leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                                                                    onClick={() => handleDeleteRecord(row)}
                                                                >
                                                                    Delete Item
                                                                </Menu.Item>
                                                            </Menu.Dropdown>
                                                        </Menu>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>

                        {totalPages > 1 && (
                            <Group justify="center" mt="md">
                                <Pagination
                                    total={totalPages}
                                    value={activePage}
                                    onChange={setActivePage}
                                    size="sm"
                                    boundaries={1}
                                    siblings={1}
                                />
                            </Group>
                        )}
                    </Paper>
                </Grid.Col>


            </Grid>
        </Container>
    );
}
//    {/* Right control sidebar: order by */}
//         <Grid.Col span={{ base: 12, lg: 4 }}>
//           <Paper withBorder radius="md" p="md" shadow="xs" style={{ position: 'sticky', top: 16 }}>
//             <Group gap={6} mb="md">
//               <IconArrowsSort size={18} />
//               <Title order={4}>Order By</Title>
//             </Group>

//             <Radio.Group value={sortOption} onChange={(value) => setSortOption(value as SortOption)}>
//               <Stack gap="xs">
//                 {SORT_OPTIONS.map((option) => (
//                   <Paper
//                     key={option.value}
//                     withBorder
//                     radius="sm"
//                     p="sm"
//                     style={{
//                       borderColor: sortOption === option.value ? 'var(--mantine-color-blue-5)' : undefined,
//                       backgroundColor: sortOption === option.value ? 'var(--mantine-color-blue-0)' : undefined,
//                       cursor: 'pointer',
//                     }}
//                     onClick={() => setSortOption(option.value)}
//                   >
//                     <Radio
//                       value={option.value}
//                       label={
//                         <Stack gap={0}>
//                           <Text size="sm" fw={600}>
//                             {option.label}
//                           </Text>
//                           <Text size="xs" c="dimmed">
//                             {option.description}
//                           </Text>
//                         </Stack>
//                       }
//                     />
//                   </Paper>
//                 ))}

//                 {/* Reserved slot for additional sort properties to be discussed */}
//                 <Paper withBorder radius="sm" p="sm" style={{ opacity: 0.55, cursor: 'not-allowed' }}>
//                   <Group gap="xs" wrap="nowrap">
//                     <IconSparkles size={16} />
//                     <Stack gap={0}>
//                       <Text size="sm" fw={600}>
//                         More options
//                       </Text>
//                       <Text size="xs" c="dimmed">
//                         Additional sort properties coming soon
//                       </Text>
//                     </Stack>
//                   </Group>
//                 </Paper>
//               </Stack>
//             </Radio.Group>
//           </Paper>
//         </Grid.Col>