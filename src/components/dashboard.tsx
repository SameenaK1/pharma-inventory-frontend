import { useState } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Activity, 
  ArrowUpRight
} from 'lucide-react';
import { 
  Table, 
  Badge, 
  Text, 
  Grid, 
  Group, 
  Paper, 
  Container, 
  Title, 
  Anchor,
  Stack
} from '@mantine/core';
  
const initialInventory = [
  { id: 'M001', name: 'Amoxicillin 500mg', batch: 'B-AMX92', stock: 14, price: 450, expiry: '2026-09-15', status: 'Low Stock' },
  { id: 'M002', name: 'Paracetamol 650mg', batch: 'B-PCM04', stock: 450, price: 20, expiry: '2028-04-20', status: 'Good' },
  { id: 'M003', name: 'Metformin 1000mg', batch: 'B-MET44', stock: 85, price: 180, expiry: '2027-11-05', status: 'Good' },
  { id: 'M004', name: 'Ibuprofen 400mg', batch: 'B-IBU11', stock: 0, price: 90, expiry: '2026-08-30', status: 'Out of Stock' },
  { id: 'M005', name: 'Atorvastatin 20mg', batch: 'B-ATO08', stock: 120, price: 340, expiry: '2026-09-01', status: 'Good' },
  { id: 'M006', name: 'Cetirizine 10mg', batch: 'B-CET88', stock: 95, price: 45, expiry: '2026-08-10', status: 'Good' },
];

const salesData = [
  { id: 'TX101', item: 'Paracetamol 650mg', qty: 5, total: 100, time: '10 mins ago' },
  { id: 'TX102', item: 'Atorvastatin 20mg', qty: 2, total: 680, time: '45 mins ago' },
  { id: 'TX103', item: 'Metformin 1000mg', qty: 3, total: 540, time: '2 hours ago' },
];

export default function Dashboard() {
  const [inventory] = useState(initialInventory);
  const [sales] = useState(salesData);

  // 2. LIVE DASHBOARD CALCULATIONS
  const totalSalesRevenue = sales.reduce((acc, current) => acc + current.total, 0);
  const totalItemsInStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  
  const outOfStockItems = inventory.filter(item => item.stock === 0);
  const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= 20);
  
  // Calculate medicines expiring within the next 60 days
  const expiringMedicines = inventory.filter(item => {
    const expiryDate = new Date(item.expiry);
    const currentDate = new Date();
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Good': return 'green';
      case 'Low Stock': return 'orange';
      case 'Out of Stock': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" px="lg">
      {/* 4-COLUMN TOP CALCULATION METRICS */}
      <Grid gutter="md" mb="32px">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder shadow="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={600} c="gray.6" tt="uppercase" lh="xs">
                  Today's Sales Revenue
                </Text>
                <Title order={3} fw={700} c="gray.9" mt="xs">
                  ₹{totalSalesRevenue.toLocaleString('en-IN')}
                </Title>
              </div>
              <Paper bg="green.0" c="green.6" p="md" radius="md">
                <DollarSign size={24} />
              </Paper>
            </Group>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder shadow="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={600} c="gray.6" tt="uppercase" lh="xs">
                  Out of Stock SKUs
                </Text>
                <Title order={3} fw={700} c={outOfStockItems.length > 0 ? 'red' : 'gray.9'} mt="xs">
                  {outOfStockItems.length}
                </Title>
              </div>
              <Paper bg="red.0" c="red.6" p="md" radius="md">
                <AlertTriangle size={24} />
              </Paper>
            </Group>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder shadow="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={600} c="gray.6" tt="uppercase" lh="xs">
                  Expiring Soon (&lt;60d)
                </Text>
                <Title order={3} fw={700} c={expiringMedicines.length > 0 ? 'orange' : 'gray.9'} mt="xs">
                  {expiringMedicines.length}
                </Title>
              </div>
              <Paper bg="orange.0" c="orange.6" p="md" radius="md">
                <Calendar size={24} />
              </Paper>
            </Group>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder shadow="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={600} c="gray.6" tt="uppercase" lh="xs">
                  Total Stock Volume
                </Text>
                <Title order={3} fw={700} c="gray.9" mt="xs">
                  {totalItemsInStock}
                </Title>
              </div>
              <Paper bg="blue.0" c="blue.6" p="md" radius="md">
                <Activity size={24} />
              </Paper>
            </Group>
          </Paper>
        </Grid.Col>
      </MantineGrid>

      {/* CENTRAL APP LAYOUT ROW SPLIT */}
      <Grid gutter="lg">
        {/* LEFT COLUMN: CRITICAL DATA TABLES */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            {/* Main Stock Inventory Status */}
            <Paper p="md" withBorder shadow="xs">
              <Title order={3} fw={700} c="gray.9" mb="md">
                Global Stock Metrics
              </Title>
              <Table striped>
                <thead>
                  <tr>
                    <th>Medicine Label</th>
                    <th>Batch No.</th>
                    <th>Available Vol.</th>
                    <th>Exp. Window</th>
                    <th>Status Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td fw={600} c="gray.9">{item.name}</td>
                      <td ta="left" fontFamily="monospace" c="gray.6">{item.batch}</td>
                      <td>{item.stock} boxes</td>
                      <td c="gray.6">{item.expiry}</td>
                      <td>
                        <Badge 
                          color={getStatusColor(item.status) as any}
                          variant="light"
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Paper>

            {/* Special Focus: Critical Warnings Box */}
            <Grid gutter="md">
              {/* Out of Stock Warning Container */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder>
                  <Group align="center" gap="xs" mb="md">
                    <AlertTriangle size={16} c="red.6" />
                    <Title order={4} fw={700} c="red.6" size="sm">
                      Immediate Out-of-Stock Risk
                    </Title>
                  </Group>
                  {outOfStockItems.length === 0 ? (
                    <Text size="sm" c="gray.6">
                      All lines clean. Zero stock depletion.
                    </Text>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      {outOfStockItems.concat(lowStockItems).map((item) => (
                        <li key={item.id} style={{ marginBottom: '4px' }}>
                          <strong>{item.name}</strong> ({item.stock} left)
                        </li>
                      ))}
                    </ul>
                  )}
                </Paper>
              </Grid.Col>

              {/* Impending Expiry Warnings Container */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder>
                  <Group align="center" gap="xs" mb="md">
                    <Calendar size={16} c="orange.6" />
                    <Title order={4} fw={700} c="orange.6" size="sm">
                      Impending Expiry (&lt; 60 Days)
                    </Title>
                  </Group>
                  {expiringMedicines.length === 0 ? (
                    <Text size="sm" c="gray.6">
                      Zero batches approaching immediate discard window.
                    </Text>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      {expiringMedicines.map((item) => (
                        <li key={item.id} style={{ marginBottom: '4px' }}>
                          {item.name} <span style={{ color: 'red', fontWeight: 600 }}>
                            (Exp: {item.expiry})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Grid.Col>

        {/* RIGHT COLUMN: AI CONSOLE & LIVE BILLING FLOW */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            {/* Shelf Life Watchlist */}
            <Paper p="md" withBorder>
              <Group justify="space-between" align="center" mb="md">
                <Title order={3} fw={700} c="gray.9">
                  Shelf Life Watchlist
                </Title>
                <Anchor size="xs" c="blue.6" fw={600} style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  View Schedule <ArrowUpRight size={14} />
                </Anchor>
              </Group>

              <Stack gap="md">
                {[
                  { name: 'Cetirizine 10mg', batch: 'B-CET88', stock: 95, date: 'Aug 10', color: 'red' },
                  { name: 'Ibuprofen 400mg', batch: 'B-IBU11', stock: 0, date: 'Aug 30', color: 'orange' },
                  { name: 'Atorvastatin 20mg', batch: 'B-ATO08', stock: 120, date: 'Sep 01', color: 'orange' },
                ].map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <Text fw={600} size="sm" c="gray.9">{item.name}</Text>
                      <Text size="xs" c="gray.6">
                        Batch: {item.batch} • {item.stock} boxes at risk
                      </Text>
                    </div>
                    <Badge color={item.color as any} size="sm" fw={700}>
                      {item.date}
                    </Badge>
                  </div>
                ))}
              </Stack>
            </Paper>

            {/* Recent Counter Sales Component */}
            <Paper p="md" withBorder>
              <Group justify="space-between" align="center" mb="md">
                <Title order={3} fw={700} c="gray.9">
                  Live Store Logs
                </Title>
                <Anchor size="xs" c="blue.6" fw={600} style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  View Logs <ArrowUpRight size={14} />
                </Anchor>
              </Group>
              <Stack gap="md">
                {sales.map((sale) => (
                  <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <Text fw={600} size="sm" c="gray.9">{sale.item}</Text>
                      <Text size="xs" c="gray.6">
                        Qty: {sale.qty} units • {sale.time}
                      </Text>
                    </div>
                    <Text fw={700} size="sm" c="gray.9">
                      ₹{sale.total}
                    </Text>
                  </div>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </MantineContainer>
  );
}