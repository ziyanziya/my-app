import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from '../services/auth-api';
import Colors from '../constants/Colors';
import { Stack, router } from 'expo-router';

type UserNotification = {
  id: number;
  title: string;
  body: string;
  data?: { type?: string; deepLink?: string; [key: string]: any };
  read_at: string | null;
  created_at: string;
};

export default function NotificationsScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('authToken').then(setToken);
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${getAuthApiBaseUrl()}/inbox?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();
      setNotifications(json.data?.items || []);
      if (json.data?.unreadCount !== undefined) {
        import('expo-notifications').then(Notifications => {
          Notifications.setBadgeCountAsync(json.data.unreadCount);
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (item: UserNotification) => {
    if (!item.read_at) {
      try {
        await fetch(`${getAuthApiBaseUrl()}/inbox/${item.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n));
        import('expo-notifications').then(async Notifications => {
          const count = await Notifications.getBadgeCountAsync();
          if (count > 0) Notifications.setBadgeCountAsync(count - 1);
        });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
    
    // Deep Link Navigation
    let parsedData = item.data;
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData); } catch {}
    }
    if (parsedData && (parsedData as any).deepLink) {
       // @ts-ignore
       router.push((parsedData as any).deepLink);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${getAuthApiBaseUrl()}/inbox/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      import('expo-notifications').then(Notifications => Notifications.setBadgeCountAsync(0));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const renderItem = ({ item }: { item: UserNotification }) => {
    let parsedData = item.data;
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData); } catch {}
    }
    const type = (parsedData as any)?.type || 'system';
    const isUnread = !item.read_at;
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => markAsRead(item)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={type === 'announcement' ? 'megaphone' : 'notifications'} size={24} color={Colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, isUnread && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString('ar-SA')} - {new Date(item.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'الإشعارات',
          headerRight: () => (
            <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: 15 }}>
              <Ionicons name="checkmark-done" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )
        }} 
      />
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color={Colors.gray} />
              <Text style={styles.emptyText}>لا توجد إشعارات حالياً</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.1)',
  },
  unreadCard: {
    backgroundColor: 'rgba(212, 165, 116, 0.05)',
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15, // RTL
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'right',
  },
  unreadText: {
    fontWeight: '800',
    color: Colors.primary,
  },
  body: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'right',
  },
  time: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
    textAlign: 'right',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Colors.gray,
    fontSize: 16,
    marginTop: 10,
    fontFamily: 'Amiri_400Regular',
  }
});
