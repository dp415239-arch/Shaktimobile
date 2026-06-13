import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import GlassCard from '../components/GlassCard';
import { playClickSound, playSaveSound, playErrorSound } from '../utils/sounds';

export default function SalesScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const productsData = await AsyncStorage.getItem('products');
      const customersData = await AsyncStorage.getItem('customers');
      if (productsData) setProducts(JSON.parse(productsData));
      if (customersData) setCustomers(JSON.parse(customersData));
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleProductSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 1) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 10));
    } else {
      setSuggestions([]);
    }
  };

  const addProductToCart = (product) => {
    const existing = selectedItems.find(item => item.id === product.id);
    if (existing) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    }
    setSearchQuery('');
    setSuggestions([]);
    playClickSound();
  };

  const updateQuantity = (id, delta) => {
    const item = selectedItems.find(i => i.id === id);
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      setSelectedItems(selectedItems.filter(i => i.id !== id));
    } else {
      setSelectedItems(selectedItems.map(i =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      ));
    }
    playClickSound();
  };

  const removeItem = (id) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
    playClickSound();
  };

  const handleCustomerSearch = (text) => {
    setCustomerSearch(text);
    if (text.length > 1) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(text.toLowerCase())
      );
      setCustomerSuggestions(filtered.slice(0, 10));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomerSuggestions([]);
    playClickSound();
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
  };

  const calculateCost = () => {
    return selectedItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
  };

  const generateInvoiceNumber = () => {
    return `INV-${moment().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000)}`;
  };

  const saveSale = async () => {
    if (selectedItems.length === 0) {
      playErrorSound();
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    if (!selectedCustomer) {
      playErrorSound();
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    const sale = {
      id: Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      dateTime: new Date().toISOString(),
      date: moment().format('YYYY-MM-DD'),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      items: selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.salePrice,
        cost: item.purchasePrice,
      })),
      total: calculateTotal(),
      cost: calculateCost(),
      paymentStatus,
      profit: calculateTotal() - calculateCost(),
    };

    // Update stock
    const updatedProducts = products.map(product => {
      const soldItem = selectedItems.find(i => i.id === product.id);
      if (soldItem) {
        return { ...product, quantity: product.quantity - soldItem.quantity };
      }
      return product;
    });

    // Update customer outstanding
    const updatedCustomers = customers.map(customer => {
      if (customer.id === selectedCustomer.id) {
        const newOutstanding = (customer.outstanding || 0) + (paymentStatus === 'Paid' ? 0 : sale.total);
        return { ...customer, outstanding: newOutstanding };
      }
      return customer;
    });

    // Save sales history
    const existingSales = await AsyncStorage.getItem('sales');
    const sales = existingSales ? JSON.parse(existingSales) : [];
    sales.unshift(sale);
    await AsyncStorage.setItem('sales', JSON.stringify(sales));
    await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
    await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));

    playSaveSound();
    Alert.alert('Success', `Sale completed!\nInvoice: ${sale.invoiceNumber}`);
    
    // Reset form
    setSelectedItems([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setPaymentStatus('Paid');
    loadData();
  };

  const totalAmount = calculateTotal();
  const totalProfit = totalAmount - calculateCost();

  return (
    <View style={{ flex: 1, backgroundColor: '#050816' }}>
      {/* Header */}
      <LinearGradient
        colors={['#121A2E', '#0B111E']}
        style={{ paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 }}
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>
          New <Text style={{ color: '#10B981' }}>Sale</Text>
        </Text>
        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Complete customer transaction</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Customer Selection */}
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 }}>Customer Details</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1E293B' }}>
            <Icon name="person-outline" size={20} color="#64748B" />
            <TextInput
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: '#FFFFFF', fontSize: 14 }}
              placeholder="Search customer..."
              placeholderTextColor="#64748B"
              value={customerSearch}
              onChangeText={handleCustomerSearch}
            />
          </View>
          {customerSuggestions.length > 0 && (
            <View style={{ marginTop: 8, backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B' }}>
              {customerSuggestions.map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  onPress={() => selectCustomer(customer)}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}
                >
                  <Text style={{ fontSize: 14, color: '#FFFFFF' }}>{customer.name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>{customer.phone}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedCustomer && (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12 }}>
              <Text style={{ fontSize: 13, color: '#3B82F6' }}>Selected: {selectedCustomer.name}</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Outstanding: ₹{selectedCustomer.outstanding?.toLocaleString() || 0}</Text>
            </View>
          )}
        </GlassCard>

        {/* Product Search */}
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 }}>Add Products</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1E293B' }}>
            <Icon name="search-outline" size={20} color="#64748B" />
            <TextInput
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: '#FFFFFF', fontSize: 14 }}
              placeholder="Search product..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={handleProductSearch}
            />
          </View>
          {suggestions.length > 0 && (
            <View style={{ marginTop: 8, backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B' }}>
              {suggestions.map(product => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => addProductToCart(product)}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text style={{ fontSize: 14, color: '#FFFFFF' }}>{product.name}</Text>
                  <Text style={{ fontSize: 13, color: '#3B82F6' }}>₹{product.salePrice}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Cart Items */}
        {selectedItems.length > 0 && (
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Cart Items</Text>
            {selectedItems.map(item => (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>₹{item.salePrice}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
                    <Icon name="remove-circle-outline" size={24} color="#EF4444" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', width: 30, textAlign: 'center' }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
                    <Icon name="add-circle-outline" size={24} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Icon name="trash-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Payment Section */}
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 12 }}>Payment Details</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>Total Amount:</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6' }}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>Total Cost:</Text>
            <Text style={{ fontSize: 14, color: '#64748B' }}>₹{calculateCost().toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>Profit:</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>₹{totalProfit.toLocaleString()}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setPaymentStatus('Paid')}
              style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: paymentStatus === 'Paid' ? '#10B981' : '#0F172A', alignItems: 'center' }}
            >
              <Text style={{ color: paymentStatus === 'Paid' ? '#FFFFFF' : '#94A3B8', fontWeight: '600' }}>Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPaymentStatus('COD')}
              style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: paymentStatus === 'COD' ? '#F59E0B' : '#0F172A', alignItems: 'center' }}
            >
              <Text style={{ color: paymentStatus === 'COD' ? '#FFFFFF' : '#94A3B8', fontWeight: '600' }}>COD</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveSale}
          style={{ backgroundColor: '#10B981', padding: 18, borderRadius: 28, alignItems: 'center', marginBottom: 20 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>COMPLETE SALE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
