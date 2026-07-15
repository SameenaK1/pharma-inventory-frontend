// components/Sidebar.tsx
import React, { useState } from 'react';
import { Stack, NavLink, ActionIcon, Tooltip } from '@mantine/core';
import { LayoutDashboard, Pill, ShoppingCart, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // 👈 1. Import Link and useLocation

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation(); // 👈 2. Track the active page by current URL

  const linksData = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} />, path: '/' },
   { id: 'inventory', label: 'Inventory', icon: <Pill size={19} />, path: '/addmedicine' },
    { id: 'sales', label: 'Sales Logs', icon: <ShoppingCart size={19} />, path: '/sales' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={19} />, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: <Settings size={19} />, path: '/settings' },
  ];

  return (
    <div style={{ 
      width: isOpen ? '260px' : '80px',
      backgroundColor: '#ffffff',
      padding: '24px 16px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      height: 'fit-content',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative'
    }}>
      
      <ActionIcon 
        variant="light" 
        color="blue" 
        radius="xl" 
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '20px',
          right: isOpen ? '16px' : 'calc(50% - 14px)',
          transition: 'all 0.3s ease',
          zIndex: 10
        }}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </ActionIcon>

      {isOpen && <div style={{ height: '12px' }} />}

      <Stack gap="xs" style={{ marginTop: !isOpen ? '28px' : '0' }}>
        {linksData.map((item) => {
          // 3. Determine if this tab's path matches the current browser URL
          const isActive = location.pathname === item.path;

          const navLinkEl = (
            <NavLink
              key={item.id}
              component={Link} // 👈 4. Tell Mantine to render as a Router Link
              to={item.path}   // 👈 5. Use the "to" prop instead of "href"
              label={isOpen ? item.label : null}
              leftSection={item.icon}
              active={isActive}
              color="blue"
              variant="light"
              style={{ 
                borderRadius: '10px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: !isOpen ? 'center' : 'flex-start',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#2563eb' : '#475569',
                transition: 'all 0.2s ease',
                padding: !isOpen ? '0' : '0 12px',
              }}
            />
          );

          return isOpen ? (
            navLinkEl
          ) : (
            <Tooltip key={item.id} label={item.label} position="right" withArrow transitionProps={{ duration: 150 }}>
              <div>{navLinkEl}</div>
            </Tooltip>
          );
        })}
      </Stack>
    </div>
  );
}