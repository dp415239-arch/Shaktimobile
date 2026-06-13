import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

// Components
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { playClickSound, playSaveSound } from '../utils/sounds';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    todayProfit: 0,
    stockItems: 0,
    pendingPayments: 0,
    totalCustomers: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const products = JSON.parse(await AsyncStorage.getItem('products') || '[]');
      const sales = JSON.parse(await AsyncStorage.getItem('sales') || '[]');
      const customers = JSON.parse(await AsyncStorage.getItem('customers') || '[]');
      const expenses = JSON.parse(await AsyncStorage.getItem('expenses') || '[]');

      // Calculate stats
      const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
      const todaySales = sales.filter(s => s.date === moment().format('YYYY-MM-DD'));
      const todayProfit = todaySales.reduce((sum, s) => sum + (s.total - s.cost), 0);
      const stockItems = products.reduce((sum, p) => sum + p.quantity, 0);
      const pendingPayments = customers.reduce((sum, c) => sum + c.outstanding, 0);
      const totalCustomers = customers.length;

      setStats({
        totalSales,
        todayProfit,
        stockItems,
        pendingPayments,
        totalCustomers,
      });

      // Low stock products
      const lowStock = products.filter(p => p.quantity <= 5 && p.quantity > 0);
      setLowStockProducts(lowStock);

      // Recent sales (last 5)
      const recent = [...sales].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 5);
      setRecentSales(recent);

      // Sales data for chart
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const daySales = sales.filter(s => s.date === date).reduce((sum, s) => sum + s.total, 0);
        last7Days.push(daySales);
      }
      setSalesData(last7Days);

      // Top selling products
      const productSales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
      });
      const top = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));
      setTopProducts(top);

    } catch (error) {
      console.error('Load data error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const StatCard = ({ title, value, subtitle, icon, color, gradient }) => (
    <LinearGradient
      colors={gradient || ['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']}
      style={{
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 0.5 }}>{title}</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: color, marginTop: 4 }}>
            {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
          </Text>
          <Text style={{ fontSize: 10, color: '#10B981', marginTop: 4 }}>{subtitle}</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: 12, borderRadius: 20 }}>
          <Icon name={icon} size={28} color={color} />
        </View>
      </View>
    </LinearGradient>
  );

  const chartConfig = {
    backgroundGradientFrom: '#121A2E',
    backgroundGradientTo: '#121A2E',
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#050816' }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>
            SHAKTI <Text style={{ color: '#3B82F6' }}>MOBILE</Text>
          </Text>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>TRUST · QUALITY · SERVICE</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => playClickSound()}>
            <Icon name="notifications-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => playClickSound()}>
            <Icon name="settings-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date and Time */}
      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>
        {moment().format('DD MMM YYYY, hh:mm A')} · Live
      </Text>

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ width: '48%' }}>
          <StatCard
            title="TOTAL SALES"
            value={stats.totalSales}
            subtitle="↑ 12.5% from last month"
            icon="trending-up-outline"
            color="#3B82F6"
            gradient={['rgba(59, 130, 246, 0.15)', 'rgba(30, 41, 59, 0.4)']}
          />
        </View>
        <View style={{ width: '48%' }}>
          <StatCard
            title="TODAY'S PROFIT"
            value={stats.todayProfit}
            subtitle="↑ 8.2% from yesterday"
            icon="cash-outline"
            color="#10B981"
            gradient={['rgba(16, 185, 129, 0.15)', 'rgba(30, 41, 59, 0.4)']}
          />
        </View>
        <View style={{ width: '48%' }}>
          <StatCard
            title="STOCK ITEMS"
            value={stats.stockItems}
            subtitle="Total items in stock"
            icon="cube-outline"
            color="#F59E0B"
            gradient={['rgba(245, 158, 11, 0.15)', 'rgba(30, 41, 59, 0.4)']}
          />
        </View>
        <View style={{ width: '48%' }}>
          <StatCard
            title="PENDING PAYMENTS"
            value={stats.pendingPayments}
            subtitle={`${stats.pendingPayments > 0 ? stats.pendingPayments / 5000 : 5} Pending`}
            icon="alert-circle-outline"
            color="#EF4444"
            gradient={['rgba(239, 68, 68, 0.15)', 'rgba(30, 41, 59, 0.4)']}
          />
        </View>
      </View>

      {/* Business Overview Chart */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Business Overview</Text>
          <Text style={{ fontSize: 11, color: '#64748B' }}>Last 7 Days</Text>
        </View>
        <LineChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: salesData }],
          }}
          width={width - 64}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 16, marginLeft: -20 }}
          formatYLabel={(value) => `₹${parseInt(value).toLocaleString()}`}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 8 }}>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Sales</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6' }}>₹1,25,000</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Profit</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>₹12,750</Text>
          </View>
        </View>
      </GlassCard>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <GlassCard style={{ marginBottom: 16, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#F59E0B' }}>⚠️ LOW STOCK ALERT</Text>
            <TouchableOpacity onPress={() => { playClickSound(); navigation.navigate('Products'); }}>
              <Text style={{ fontSize: 11, color: '#3B82F6' }}>View All</Text>
            </TouchableOpacity>
          </View>
          {lowStockProducts.slice(0, 4).map((product, index) => (
            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: index < lowStockProducts.length - 1 ? 1 : 0, borderBottomColor: 'rgba(30, 41, 59, 0.5)' }}>
              <Text style={{ fontSize: 13, color: '#E2E8F0' }}>{product.name}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#F59E0B' }}>{product.quantity} Left</Text>
            </View>
          ))}
        </GlassCard>
      )}

      {/* Recent Sales */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Recent Sales</Text>
          <TouchableOpacity onPress={() => { playClickSound(); navigation.navigate('SalesHistory'); }}>
            <Text style={{ fontSize: 11, color: '#3B82F6' }}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentSales.map((sale, index) => (
          <View key={index} style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{sale.customerName}</Text>
              <View style={{ backgroundColor: sale.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, color: sale.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B', fontWeight: '600' }}>{sale.paymentStatus}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>
              {sale.items[0]?.name} ({sale.items[0]?.quantity})
              {sale.items.length > 1 ? ` + ${sale.items.length - 1} more` : ''}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#3B82F6' }}>₹{sale.total.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#64748B' }}>{moment(sale.dateTime).format('DD MMM YYYY, hh:mm A')}</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Customers Stat */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B' }}>TOTAL CUSTOMERS</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#8B5CF6', marginTop: 4 }}>{stats.totalCustomers}</Text>
            <Text style={{ fontSize: 10, color: '#10B981', marginTop: 4 }}>↑ 18 This Month</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: 16, borderRadius: 24 }}>
            <Icon name="people" size={32} color="#8B5CF6" />
          </View>
        </View>
      </GlassCard>

      {/* Add Sale Floating Button */}
      <TouchableOpacity
        onPress={() => { playClickSound(); navigation.navigate('Sales'); }}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#3B82F6',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}
