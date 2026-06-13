import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import GlassCard from '../components/GlassCard';
import { playClickSound } from '../utils/sounds';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [salesData, setSalesData] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [revenueGrowth, setRevenueGrowth] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const products = JSON.parse(await AsyncStorage.getItem('products') || '[]');
      const sales = JSON.parse(await AsyncStorage.getItem('sales') || '[]');
      const expensesData = JSON.parse(await AsyncStorage.getItem('expenses') || '[]');

      // Daily sales for last 7 days
      const last7Days = [];
      const dailySales = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        last7Days.push(moment().subtract(i, 'days').format('DD MMM'));
        const daySales = sales.filter(s => s.date === date).reduce((sum, s) => sum + s.total, 0);
        dailySales.push(daySales);
      }
      setSalesData(dailySales);

      // Monthly sales
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlyData = [];
      for (let i = 0; i < 6; i++) {
        const monthSales = sales.filter(s => moment(s.date).month() === i).reduce((sum, s) => sum + s.total, 0);
        monthlyData.push(monthSales);
      }
      setMonthlySales(monthlyData);

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
        .map(([name, qty]) => ({ name, quantity: qty }));
      setTopProducts(top);

      // Expenses
      const expenseCategories = expensesData.reduce((acc, e) => {
        acc[e.name] = (acc[e.name] || 0) + e.amount;
        return acc;
      }, {});
      const expenseChartData = Object.entries(expenseCategories).map(([name, amount]) => ({
        name: name.slice(0, 10),
        amount,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        legendFontColor: '#94A3B8',
        legendFontSize: 10,
      }));
      setExpenses(expenseChartData);

      // Revenue growth
      const lastMonthSales = sales.filter(s => moment(s.date).month() === moment().month() - 1).reduce((sum, s) => sum + s.total, 0);
      const thisMonthSales = sales.filter(s => moment(s.date).month() === moment().month()).reduce((sum, s) => sum + s.total, 0);
      const growth = lastMonthSales ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1) : 0;
      setRevenueGrowth(growth);
    } catch (error) {
      console.error('Load analytics error:', error);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: '#121A2E',
    backgroundGradientTo: '#121A2E',
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForDots: { r: '6', strokeWidth: '2', stroke: '#3B82F6' },
  };

  const pieChartData = [
    { name: 'Products', amount: 65, color: '#3B82F6', legendFontColor: '#94A3B8', legendFontSize: 10 },
    { name: 'Services', amount: 25, color: '#10B981', legendFontColor: '#94A3B8', legendFontSize: 10 },
    { name: 'Accessories', amount: 10, color: '#F59E0B', legendFontColor: '#94A3B8', legendFontSize: 10 },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#050816' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Header */}
      <LinearGradient colors={['#121A2E', '#0B111E']} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>Business <Text style={{ color: '#8B5CF6' }}>Analytics</Text></Text>
        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Real-time insights & metrics</Text>
      </LinearGradient>

      {/* Revenue Growth */}
      <GlassCard style={{ marginBottom: 16, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Revenue Growth</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: revenueGrowth >= 0 ? '#10B981' : '#EF4444' }}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
            </Text>
            <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>vs last month</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 12, borderRadius: 20 }}>
            <Icon name="trending-up" size={32} color="#10B981" />
          </View>
        </View>
      </GlassCard>

      {/* Daily Sales Chart */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Daily Sales (Last 7 Days)</Text>
        <LineChart
          data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: salesData }] }}
          width={width - 48}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 16, marginLeft: -16 }}
          formatYLabel={(value) => `₹${parseInt(value).toLocaleString()}`}
        />
      </GlassCard>

      {/* Monthly Sales Chart */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Monthly Sales</Text>
        <BarChart
          data={{ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ data: monthlySales }] }}
          width={width - 48}
          height={200}
          chartConfig={chartConfig}
          style={{ borderRadius: 16, marginLeft: -16 }}
          formatYLabel={(value) => `₹${parseInt(value / 1000)}k`}
        />
      </GlassCard>

      {/* Top Selling Products */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Top Selling Products</Text>
        {topProducts.map((product, index) => (
          <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: index < topProducts.length - 1 ? 1 : 0, borderBottomColor: '#1E293B' }}>
            <Text style={{ fontSize: 13, color: '#FFFFFF' }}>{index + 1}. {product.name}</Text>
            <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '600' }}>{product.quantity} sold</Text>
          </View>
        ))}
      </GlassCard>

      {/* Expense Distribution */}
      {expenses.length > 0 && (
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Expense Distribution</Text>
          <PieChart
            data={expenses}
            width={width - 48}
            height={180}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </GlassCard>
      )}

      {/* Inventory Analytics */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Inventory Health</Text>
        <PieChart
          data={pieChartData}
          width={width - 48}
          height={180}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="0"
          absolute
        />
      </GlassCard>
    </ScrollView>
  );
}
