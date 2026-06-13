import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import GlassCard from '../components/GlassCard';
import { playClickSound, playSaveSound, playDeleteSound, playErrorSound } from '../utils/sounds';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerModalVisible, setLedgerModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    image: '',
  });
  const [ledgerEntries, setLedgerEntries] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const saved = await AsyncStorage.getItem('customers');
      if (saved) setCustomers(JSON.parse(saved));
    } catch (error) {
      console.error('Load customers error:', error);
    }
  };

  const saveCustomers = async (newCustomers) => {
    try {
      await AsyncStorage.setItem('customers', JSON.stringify(newCustomers));
      setCustomers(newCustomers);
    } catch (error) {
      console.error('Save customers error:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      playErrorSound();
      Alert.alert('Error', 'Please fill name and phone number');
      return;
    }

    const newCustomer = {
      id: selectedCustomer?.id || Date.now(),
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      image: formData.image,
      outstanding: selectedCustomer?.outstanding || 0,
      createdAt: selectedCustomer?.createdAt || new Date().toISOString(),
    };

    let newCustomers;
    if (selectedCustomer) {
      newCustomers = customers.map(c => c.id === selectedCustomer.id ? newCustomer : c);
      playSaveSound();
      Alert.alert('Success', 'Customer updated successfully');
    } else {
      newCustomers = [...customers, newCustomer];
      playSaveSound();
      Alert.alert('Success', 'Customer added successfully');
    }

    saveCustomers(newCustomers);
    resetForm();
    setModalVisible(false);
  };

  const handleDelete = (customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newCustomers = customers.filter(c => c.id !== customer.id);
            saveCustomers(newCustomers);
            playDeleteSound();
            Alert.alert('Deleted', 'Customer removed successfully');
          },
        },
      ]
    );
  };

  const viewLedger = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const sales = await AsyncStorage.getItem('sales');
      const allSales = sales ? JSON.parse(sales) : [];
      const customerSales = allSales.filter(s => s.customerId === customer.id);
      setLedgerEntries(customerSales);
      setLedgerModalVisible(true);
    } catch (error) {
      console.error('Load ledger error:', error);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      image: '',
    });
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      image: customer.image || '',
    });
    setModalVisible(true);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const CustomerCard = ({ customer }) => (
    <LinearGradient
      colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']}
      style={{
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
      }}
    >
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
        {customer.image ? (
          <Image source={{ uri: customer.image }} style={{ width: 50, height: 50, borderRadius: 25 }} />
        ) : (
          <Icon name="person-outline" size={28} color="#64748B" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{customer.name}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => openEditModal(customer)}>
              <Icon name="create-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(customer)}>
              <Icon name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{customer.phone}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <TouchableOpacity onPress={() => viewLedger(customer)}>
            <Text style={{ fontSize: 11, color: '#3B82F6' }}>View Ledger</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, fontWeight: '600', color: customer.outstanding > 0 ? '#EF4444' : '#10B981' }}>
            Outstanding: ₹{customer.outstanding?.toLocaleString() || 0}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#050816' }}>
      {/* Header */}
      <LinearGradient
        colors={['#121A2E', '#0B111E']}
        style={{ paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 }}
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>
          Customers <Text style={{ color: '#8B5CF6' }}>Directory</Text>
        </Text>
        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{customers.length} registered customers</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 28, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1E293B' }}>
          <Icon name="search-outline" size={20} color="#64748B" />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: '#FFFFFF', fontSize: 14 }}
            placeholder="Search customers..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CustomerCard customer={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="people-outline" size={64} color="#1E293B" />
            <Text style={{ fontSize: 14, color: '#64748B', marginTop: 16 }}>No customers found</Text>
            <Text style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>Tap + to add your first customer</Text>
          </View>
        }
      />

      {/* Add FAB */}
      <TouchableOpacity
        onPress={() => { playClickSound(); resetForm(); setModalVisible(true); }}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#8B5CF6',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#8B5CF6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#121A2E', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
              </Text>
              <TouchableOpacity onPress={() => { playClickSound(); setModalVisible(false); resetForm(); }}>
                <Icon name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', marginBottom: 20 }}>
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' }}>
                  <Icon name="camera-outline" size={28} color="#64748B" />
                </View>
              )}
              <Text style={{ fontSize: 12, color: '#8B5CF6', marginTop: 8 }}>Add Photo</Text>
            </TouchableOpacity>

            <TextInput
              style={inputStyle}
              placeholder="Customer Name"
              placeholderTextColor="#64748B"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={inputStyle}
              placeholder="Phone Number"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
            <TextInput
              style={inputStyle}
              placeholder="Address"
              placeholderTextColor="#64748B"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <TouchableOpacity
              onPress={handleSave}
              style={{ backgroundColor: '#8B5CF6', padding: 16, borderRadius: 28, alignItems: 'center', marginTop: 20 }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                {selectedCustomer ? 'UPDATE CUSTOMER' : 'ADD CUSTOMER'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ledger Modal */}
      <Modal visible={ledgerModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#121A2E', borderRadius: 28, margin: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Ledger: {selectedCustomer?.name}</Text>
              <TouchableOpacity onPress={() => { playClickSound(); setLedgerModalVisible(false); }}>
                <Icon name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ledgerEntries}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
                  <Text style={{ fontSize: 13, color: '#FFFFFF' }}>Invoice: {item.invoiceNumber}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Amount: ₹{item.total.toLocaleString()}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Date: {new Date(item.dateTime).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 11, color: item.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B' }}>Status: {item.paymentStatus}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748B', padding: 20 }}>No transactions</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#0F172A',
  borderRadius: 16,
  padding: 14,
  marginBottom: 12,
  color: '#FFFFFF',
  fontSize: 14,
  borderWidth: 1,
  borderColor: '#1E293B',
};
