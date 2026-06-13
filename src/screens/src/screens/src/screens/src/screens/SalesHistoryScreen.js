import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import GlassCard from '../components/GlassCard';
import { playClickSound, playDeleteSound } from '../utils/sounds';

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const saved = await AsyncStorage.getItem('sales');
      if (saved) {
        const salesData = JSON.parse(saved);
        setSales(salesData);
        applyFilters(salesData);
      }
    } catch (error) {
      console.error('Load sales error:', error);
    }
  };

  const applyFilters = (data) => {
    let filtered = [...data];
    const today = moment().format('YYYY-MM-DD');
    const thisWeek = moment().subtract(7, 'days').format('YYYY-MM-DD');
    const thisMonth = moment().startOf('month').format('YYYY-MM-DD');

    if (dateFilter === 'today') {
      filtered = filtered.filter(s => s.date === today);
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(s => s.date >= thisWeek);
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(s => s.date >= thisMonth);
    } else if (dateFilter === 'custom' && startDate && endDate) {
      filtered = filtered.filter(s => s.date >= startDate && s.date <= endDate);
    }

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSales(filtered);
  };

  useEffect(() => {
    applyFilters(sales);
  }, [dateFilter, searchQuery, startDate, endDate]);

  const deleteSale = (sale) => {
    Alert.alert(
      'Delete Sale',
      `Are you sure you want to delete invoice ${sale.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newSales = sales.filter(s => s.id !== sale.id);
            await AsyncStorage.setItem('sales', JSON.stringify(newSales));
            loadSales();
            playDeleteSound();
            Alert.alert('Deleted', 'Sale record removed');
          },
        },
      ]
    );
  };

  const getTotalForPeriod = () => {
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  };

  const getProfitForPeriod = () => {
    return filteredSales.reduce((sum, s) => sum + (s.total - s.cost), 0);
  };

  const SaleCard = ({ sale }) => (
    <LinearGradient
      colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']}
      style={{ borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B82F6' }}>{sale.invoiceNumber}</Text>
        <View style={{ backgroundColor: sale.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 10, color: sale.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B', fontWeight: '600' }}>{sale.paymentStatus}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{sale.customerName}</Text>
      <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>{sale.customerPhone}</Text>
      <Text style={{ fontSize: 11, color: '#94A3B8' }}>Items: {sale.items.length}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6' }}>₹{sale.total.toLocaleString()}</Text>
        <Text style={{ fontSize: 10, color: '#64748B' }}>{moment(sale.dateTime).format('DD MMM YYYY, hh:mm A')}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 }}>
        <TouchableOpacity onPress={() => { playClickSound(); setSelectedSale(sale); setDetailModal(true); }} style={{ flex: 1, backgroundColor: '#0F172A', padding: 10, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#3B82F6' }}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteSale(sale)} style={{ flex: 1, backgroundColor: '#0F172A', padding: 10, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#EF4444' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#050816' }}>
      {/* Header */}
      <LinearGradient colors={['#121A2E', '#0B111E']} style={{ paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>Sales <Text style={{ color: '#3B82F6' }}>History</Text></Text>
        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{filteredSales.length} transactions</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Search */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 28, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1E293B' }}>
            <Icon name="search-outline" size={20} color="#64748B" />
            <TextInput
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: '#FFFFFF', fontSize: 14 }}
              placeholder="Search by customer or invoice..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Date Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['all', 'today', 'week', 'month', 'custom'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => { playClickSound(); setDateFilter(filter); if (filter !== 'custom') setShowCustomDate(false); else setShowCustomDate(true); }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: dateFilter === filter ? '#3B82F6' : '#0F172A' }}
              >
                <Text style={{ fontSize: 12, color: dateFilter === filter ? '#FFFFFF' : '#94A3B8', fontWeight: '500' }}>
                  {filter === 'all' ? 'All' : filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'Custom'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Custom Date Range */}
        {showCustomDate && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1E293B' }}>
              <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>From</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                value={startDate}
                onChangeText={setStartDate}
                style={{ color: '#FFFFFF', fontSize: 12 }}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1E293B' }}>
              <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>To</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                value={endDate}
                onChangeText={setEndDate}
                style={{ color: '#FFFFFF', fontSize: 12 }}
              />
            </View>
          </View>
        )}

        {/* Summary Stats */}
        <GlassCard style={{ marginBottom: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 10, color: '#64748B' }}>Total Sales</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#3B82F6' }}>₹{getTotalForPeriod().toLocaleString()}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: '#64748B' }}>Total Profit</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#10B981' }}>₹{getProfitForPeriod().toLocaleString()}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: '#64748B' }}>Transactions</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{filteredSales.length}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Sales List */}
        {filteredSales.map(sale => (
          <SaleCard key={sale.id} sale={sale} />
        ))}

        {filteredSales.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="cart-outline" size={64} color="#1E293B" />
            <Text style={{ fontSize: 14, color: '#64748B', marginTop: 16 }}>No sales found</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#121A2E', borderRadius: 28, margin: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Invoice Details</Text>
              <TouchableOpacity onPress={() => { playClickSound(); setDetailModal(false); }}>
                <Icon name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {selectedSale && (
              <>
                <Text style={{ fontSize: 14, color: '#3B82F6', marginBottom: 4 }}>{selectedSale.invoiceNumber}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>{selectedSale.customerName}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>{selectedSale.customerPhone}</Text>
                <View style={{ borderTopWidth: 1, borderTopColor: '#1E293B', paddingTop: 12 }}>
                  {selectedSale.items.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#FFFFFF' }}>{item.name} x{item.quantity}</Text>
                      <Text style={{ fontSize: 13, color: '#3B82F6' }}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: '#1E293B', marginTop: 12, paddingTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: '#94A3B8' }}>Total</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#3B82F6' }}>₹{selectedSale.total.toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>Date</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{moment(selectedSale.dateTime).format('DD MMM YYYY, hh:mm A')}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
