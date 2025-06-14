import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';

export default function ViewTechnicianProfile({ route }) {
  const { technicianId } = route.params;
  const [profile, setProfile] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://192.168.43.237:5000/api/technician/${technicianId}/profile`
        );
        setProfile(response.data.profile);
        setAvgRating(response.data.avgRating);
        setTotalRatings(response.data.totalRatings);
      } catch (err) {
        console.error('API Error:', err);
        setError('Unable to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [technicianId]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('⭐');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>👤</Text>
        <Text style={styles.errorText}>No profile found</Text>
        <Text style={styles.errorSubtext}>This technician hasn't set up their profile yet</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👨‍🔧</Text>
        </View>
        <Text style={styles.title}>Technician Profile</Text>
        
        {/* Rating Section */}
        <View style={styles.ratingContainer}>
          <Text style={styles.starsText}>{renderStars(parseFloat(avgRating))}</Text>
          <View style={styles.ratingDetails}>
            <Text style={styles.ratingValue}>{avgRating}</Text>
            <Text style={styles.ratingCount}>({totalRatings} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Profile Information */}
      <View style={styles.contentContainer}>
        
        {/* Bio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionText}>
              {profile.bio || 'No bio available'}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionText}>
              {profile.location || 'Location not specified'}
            </Text>
          </View>
        </View>

        {/* Availability Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🕒</Text>
            <Text style={styles.sectionTitle}>Availability</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={[
              styles.availabilityBadge, 
              profile.availability === 'Available' ? styles.availableBadge : styles.unavailableBadge
            ]}>
              <Text style={[
                styles.availabilityText,
                profile.availability === 'Available' ? styles.availableText : styles.unavailableText
              ]}>
                {profile.availability || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛠️</Text>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
          </View>
          <View style={styles.sectionContent}>
            {profile.skills && profile.skills.length > 0 ? (
              <View style={styles.skillsContainer}>
                {profile.skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No skills listed</Text>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#4A90E2',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starsText: {
    fontSize: 20,
    marginBottom: 8,
  },
  ratingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F39C12',
    marginRight: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  sectionContent: {
    padding: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
  },
  availabilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  availableBadge: {
    backgroundColor: '#D5FDDF',
  },
  unavailableBadge: {
    backgroundColor: '#FADBD8',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  availableText: {
    color: '#27AE60',
  },
  unavailableText: {
    color: '#E74C3C',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  skillText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 16,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
});