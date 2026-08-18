import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationManager, NotificationPreferences } from '../services/notification_manager';

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    setLoading(true);
    const loadedPrefs = await NotificationManager.loadPreferences();
    setPrefs(loadedPrefs);
    setLoading(false);
  };

  const toggleSwitch = async (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    await NotificationManager.savePreferences(newPrefs);
  };

  if (loading || !prefs) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>إعدادات الإشعارات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>تفعيل الإشعارات بالكامل</Text>
              <Text style={styles.rowDesc}>السماح للتطبيق بإرسال أي نوع من الإشعارات.</Text>
            </View>
            <Switch
              value={prefs.global_enabled}
              onValueChange={() => toggleSwitch('global_enabled')}
              trackColor={{ false: '#5a3b49', true: '#c9a96e' }}
            />
          </View>
        </View>

        {prefs.global_enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التفضيلات المخصصة</Text>
            
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>إشعارات الأذان</Text>
                <Text style={styles.rowDesc}>تنبيهات دقيقة بأوقات الصلاة يومياً.</Text>
              </View>
              <Switch
                value={prefs.adhan_enabled}
                onValueChange={() => toggleSwitch('adhan_enabled')}
                trackColor={{ false: '#5a3b49', true: '#c9a96e' }}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>تنبيهات العبادات</Text>
                <Text style={styles.rowDesc}>تنبيهات يومية للعبادات المستمرة كالأذكار.</Text>
              </View>
              <Switch
                value={prefs.worship_enabled}
                onValueChange={() => toggleSwitch('worship_enabled')}
                trackColor={{ false: '#5a3b49', true: '#c9a96e' }}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>إشعارات المحتوى الجديد</Text>
                <Text style={styles.rowDesc}>إشعار فوري عند إضافة الإدارة لقسم نظري أو عملي جديد.</Text>
              </View>
              <Switch
                value={prefs.new_sections_enabled}
                onValueChange={() => toggleSwitch('new_sections_enabled')}
                trackColor={{ false: '#5a3b49', true: '#c9a96e' }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#29121c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 169, 110, 0.28)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f7eadc',
    fontFamily: 'Amiri',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'rgba(60, 30, 40, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e5c891',
    marginBottom: 15,
    fontFamily: 'Amiri',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 169, 110, 0.16)',
  },
  rowText: {
    flex: 1,
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f7eadc',
    fontFamily: 'Amiri',
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 13,
    color: '#cbb9a0',
    fontFamily: 'Amiri',
    textAlign: 'right',
  },
});
