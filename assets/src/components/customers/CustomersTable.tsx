import React from 'react';
import {Link} from 'react-router-dom';
import {Box, Flex} from 'theme-ui';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {TablePaginationConfig} from 'antd/lib/table';
import {Customer} from '../../types';
import {
  notification,
  Badge,
  Button,
  Dropdown,
  Menu,
  Table,
  Text,
  Tooltip,
} from '../common';
import {SettingOutlined} from '../icons';
import {StartConversationWrapper} from '../conversations/StartConversationButton';

// TODO: create date utility methods so we don't have to do this everywhere
dayjs.extend(utc);

const CustomersTable = ({
  loading,
  customers,
  currentlyOnline = {},
  shouldIncludeAnonymous,
  action,
  onUpdate,
  pagination,
}: {
  loading?: boolean;
  customers: Array<Customer>;
  currentlyOnline?: Record<string, any>;
  shouldIncludeAnonymous?: boolean;
  action?: (customer: Customer) => React.ReactElement;
  pagination?: false | TablePaginationConfig;
  onUpdate?: () => Promise<void>;
}) => {
  const isCustomerOnline = (customer: Customer) => {
    const {id: customerId} = customer;

    return currentlyOnline[customerId];
  };

  const data = customers
    // Only show customers with email by default
    .filter((customer) => (shouldIncludeAnonymous ? true : !!customer.email))
    .map((customer) => {
      return {key: customer.id, ...customer};
    })
    // TODO: make sorting configurable from the UI
    .sort((a, b) => {
      if (isCustomerOnline(a)) {
        return -1;
      } else if (isCustomerOnline(b)) {
        return 1;
      }

      const bLastSeen = b.last_seen_at || b.last_seen;
      const aLastSeen = a.last_seen_at || a.last_seen;

      // TODO: fix how we set `last_seen`!
      return +new Date(bLastSeen) - +new Date(aLastSeen);
    });

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (value: string) => {
        return value ? (
          <Text>{value}</Text>
        ) : (
          <Text style={{opacity: 0.8}} type="secondary">
            --
          </Text>
        );
      },
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record: Customer) => {
        const hasEmail = record.email && record.email.length > 0;

        return value ? (
          <Text>{value}</Text>
        ) : (
          <Text style={{opacity: 0.8}} type="secondary">
            {hasEmail ? '--' : 'Anonymous User'}
          </Text>
        );
      },
    },
    {
      title: 'Last seen',
      dataIndex: 'last_seen_at',
      key: 'last_seen_at',
      render: (value: string, record: Customer) => {
        const {id, pathname, current_url, last_seen} = record;
        const formatted = dayjs.utc(value || last_seen).format('MMMM DD, YYYY');
        const isOnline = currentlyOnline[id];

        if (isOnline) {
          return <Badge status="processing" text="Online now!" />;
        }

        return (
          <Box>
            <Text>{formatted}</Text>
            <Box sx={{fontSize: 12, lineHeight: 1.4}}>
              {pathname && (
                <Text type="secondary">
                  {' '}
                  on
                  <Tooltip title={current_url} placement="right">
                    <Text code>{pathname}</Text>
                  </Tooltip>
                </Text>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      title: 'Timezone',
      dataIndex: 'time_zone',
      key: 'time_zone',
      render: (value: string) => {
        return value ? <Text>{value}</Text> : <Text type="secondary">--</Text>;
      },
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      render: (value: string, record: Customer) => {
        const {id: customerId} = record;

        return (
          <Flex sx={{justifyContent: 'flex-end'}}>
            <StartConversationWrapper
              customerId={customerId}
              onInitializeNewConversation={(conversation) =>
                notification.success({
                  message: `Message successfully sent.`,
                  description: (
                    <Text>
                      Click{' '}
                      <a href={`/conversations/all?cid=${conversation.id}`}>
                        here
                      </a>{' '}
                      to view the conversation.
                    </Text>
                  ),
                  duration: 10,
                })
              }
            >
              {(handleOpenNewConversationModal) => {
                const handleMenuClick = (data: any) => {
                  switch (data.key) {
                    case 'message':
                      return handleOpenNewConversationModal();
                    default:
                      return null;
                  }
                };

                return (
                  <Dropdown
                    overlay={
                      <Menu onClick={handleMenuClick}>
                        <Menu.Item key="profile">
                          <Link to={`/customers/${customerId}`}>
                            View profile
                          </Link>
                        </Menu.Item>
                        <Menu.Item key="message">
                          Start new conversation
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <Button icon={<SettingOutlined />} />
                  </Dropdown>
                );
              }}
            </StartConversationWrapper>
          </Flex>
        );
      },
    },
  ];

  return (
    <Table
      loading={loading}
      dataSource={data}
      columns={columns}
      pagination={pagination}
    />
  );
};

export default CustomersTable;
