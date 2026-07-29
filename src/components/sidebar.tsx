import { useState } from 'react';
import { Stack, NavLink, ActionIcon, Tooltip, Box, Group, Title } from '@mantine/core';
import { LayoutDashboard, Pill, Boxes, ShoppingCart, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const linksData = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} />, path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: <Boxes size={19} />, path: '/inventory' },
    { id: 'addmedicine', label: 'Add Medicine', icon: <Pill size={19} />, path: '/addmedicine' },
    { id: 'sales', label: 'Sales Logs', icon: <ShoppingCart size={19} />, path: '/sales' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={19} />, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: <Settings size={19} />, path: '/settings' },
  ];

  return (
    <Box
      component="aside"
      w={isOpen ? 260 : 80}
      h="100vh"
      p="md"
      bg="white"
      style={{
        borderRight: '1px solid var(--mantine-color-gray-3)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Top Brand Block & Toggle Action Trigger */}
      <Group justify={isOpen ? 'space-between' : 'center'} mb="xl" h={40}>
        {isOpen && (
          <Group gap="xs">
            <Pill size={24} color="blue" style={{ border: 'none' }} />
            <Title order={4} c="dark.4">
              <span style={{ color: 'var(--mantine-color-blue-filled)' }}>Pharma</span>Track
            </Title>
          </Group>
        )}
        
        <ActionIcon
          variant="light"
          color="blue"
          radius="xl"
          size="md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </ActionIcon>
      </Group>

      {/* Navigation Stack Layout */}
      <Stack gap="xs" style={{ flexGrow: 1 }}>
        {linksData.map((item) => {
          const isActive = location.pathname === item.path;

          const navLinkEl = (
            <NavLink
              key={item.id}
              component={Link}
              to={item.path}
              label={isOpen ? item.label : null}
              leftSection={item.icon}
              active={isActive}
              color="blue"
              variant="light"
              h={46}
              styles={{
                root: {
                  borderRadius: 'var(--mantine-radius-md)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  padding: !isOpen ? '0' : '0 12px',
                  justifyContent: !isOpen ? 'center' : 'flex-start',
                },
                body: {
                  // Prevents text rendering bugs during dynamic width transition
                  display: isOpen ? 'block' : 'none', 
                }
              }}
            />
          );

          return isOpen ? (
            navLinkEl
          ) : (
            <Tooltip
              key={item.id}
              label={item.label}
              position="right"
              withArrow
              transitionProps={{ duration: 150 }}
            >
              {/* Box wrapper provides clear anchor context for tooltip target positioning */}
              <Box>{navLinkEl}</Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}