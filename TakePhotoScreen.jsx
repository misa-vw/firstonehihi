import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ Fixed import - ensure Camera is imported as a named export
import { Camera } from 'expo-camera';

const { width, height } = Dimensions.get('window');

// Dummy data - replace with real API data
const DUMMY_HELP_CONTENT = {
  title: "Guide de prise de photo",
  instructions: [
    "Alignez votre visage et votre cou dans les lignes blanches",
    "Allumez la lumière si vous êtes dans le noir",
    "Détendez-vous et maintenez votre téléphone stable pour éviter le flou"
  ]
};

// ✅ Fixed: Use React.memo for better performance and ensure it's a proper React component
const FaceOutlineOverlay = React.memo(() => {
  return (
    <View style={styles.faceOutlineContainer}>
      <View style={styles.faceOutline}>
        <View style={styles.headCircle} />
        <View style={styles.shouldersShape} />
      </View>
    </View>
  );
});

// ✅ Fixed: Explicit prop typing and React.memo
const HelpModal = React.memo(({ visible, onClose, helpContent }) => {
  const content = helpContent || DUMMY_HELP_CONTENT;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{content.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {content.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.retourButton} onPress={onClose}>
            <Text style={styles.retourButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// ✅ Fixed: Main component with React.memo and proper destructuring
const TakePhotoScreen = React.memo(({
  onBack,
  navigation,
  photoType = 'profile',
  returnScreen = 'PhotoProfilScreen',
}) => {
  // ✅ Fixed: Use Camera.Constants for camera types instead of strings
  const [cameraType, setCameraType] = useState(Camera.Constants?.Type?.front || 'front');
  const [hasPermission, setHasPermission] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  
  // UI state
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Camera ref
  const cameraRef = useRef(null);

  // Backend API placeholder functions
  const uploadImage = async (photoUri) => {
    // TODO: Replace with actual image upload API
    console.log('🔄 Uploading image to backend:', photoUri);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const uploadedImageUrl = `https://api.example.com/images/${Date.now()}.jpg`;
      console.log('✅ Image uploaded successfully:', uploadedImageUrl);
      return uploadedImageUrl;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  };

  const savePhotoData = async (photoData) => {
    // TODO: Replace with actual API call to save photo metadata
    console.log('🔄 Saving photo data:', photoData);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Photo data saved successfully');
    } catch (error) {
      console.error('❌ Error saving photo data:', error);
      throw error;
    }
  };

  const handleTakePhoto = async () => {
    console.log('📸 Photo capture initiated');
    console.log('🔄 Processing photo...');
    
    if (!cameraRef.current || isCapturing) {
      console.log('⚠️ Camera not ready or already capturing');
      return;
    }

    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log('📷 Photo taken successfully:', photo.uri);
      setCapturedPhoto(photo);

      // TODO: integrate backend upload logic here later
      const uploadedUrl = await uploadImage(photo.uri);
      
      await savePhotoData({
        uri: photo.uri,
        uploadedUrl,
        type: photoType,
        timestamp: new Date().toISOString(),
      });

      if (navigation) {
        console.log('🔄 Navigating back to:', returnScreen);
        navigation.navigate(returnScreen, {
          photoUri: photo.uri,
          uploadedUrl,
          photoType,
        });
      } else {
        console.log(`🔄 Navigation to ${returnScreen} with photo data...`);
      }

    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFlipCamera = () => {
    console.log('🔄 Flipping camera...');
    console.log('📱 Current camera type:', cameraType);
    
    // ✅ Fixed: Use proper Camera.Constants for camera types
    setCameraType(prev => {
      if (Camera.Constants?.Type) {
        return prev === Camera.Constants.Type.front 
          ? Camera.Constants.Type.back 
          : Camera.Constants.Type.front;
      } else {
        // Fallback for older versions
        return prev === 'front' ? 'back' : 'front';
      }
    });
  };

  const handleBack = () => {
    console.log('🔙 Back pressed from camera screen');
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    } else {
      console.log('🔄 Back navigation placeholder...');
    }
  };

  const handleHelpPress = () => {
    console.log('❓ Help button pressed');
    setIsHelpVisible(true);
  };

  const handleHelpClose = () => {
    console.log('❌ Help modal closed');
    setIsHelpVisible(false);
  };

  // Request camera permissions
  useEffect(() => {
    const getCameraPermissions = async () => {
      console.log('🔄 Requesting camera permissions...');
      
      try {
        // ✅ Enhanced error checking and handling
        if (typeof Camera === 'undefined' || !Camera) {
          console.error('❌ Camera component not available');
          setHasPermission(false);
          return;
        }

        // Check if getCameraPermissionsAsync exists
        if (!Camera.getCameraPermissionsAsync) {
          console.error('❌ Camera.getCameraPermissionsAsync not available');
          setHasPermission(false);
          return;
        }

        const { status: existingStatus } = await Camera.getCameraPermissionsAsync();
        console.log('📋 Existing camera permission status:', existingStatus);
        
        if (existingStatus === 'granted') {
          console.log('✅ Camera permission already granted');
          setHasPermission(true);
          return;
        }

        console.log('🔄 Requesting new camera permission...');
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('📸 Camera permission request result:', status);
        
        if (status === 'granted') {
          console.log('✅ Camera permission granted');
          setHasPermission(true);
        } else {
          console.log('❌ Camera permission denied');
          setHasPermission(false);
        }
        
      } catch (error) {
        console.error('❌ Error requesting camera permissions:', error);
        setHasPermission(false);
      }
    };

    getCameraPermissions();
  }, []);

  // Loading state while checking permissions
  if (hasPermission === null) {
    console.log('⏳ Checking camera permissions...');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Demande d'autorisation de caméra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    console.log('🚫 Camera permission denied - showing error screen');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Accès à la caméra refusé</Text>
          <Text style={styles.errorSubtext}>
            Veuillez autoriser l'accès à la caméra dans les paramètres
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              console.log('🔄 Retrying camera permission...');
              setHasPermission(null);
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Enhanced camera component validation
  console.log('📷 Rendering camera interface with type:', cameraType);
  
  // Additional validation for Camera component
  if (typeof Camera !== 'function' && typeof Camera !== 'object') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Caméra non disponible</Text>
          <Text style={styles.errorSubtext}>
            Le composant caméra n'est pas disponible sur cette plateforme
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRENDRE UNE PHOTO</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          onCameraReady={() => {
            setIsReady(true);
            console.log('📷 Camera ready for capture');
          }}
        >
          <FaceOutlineOverlay />
        </Camera>
      </View>

      <View style={styles.helpBarContainer}>
        <TouchableOpacity style={styles.helpBar} onPress={handleHelpPress}>
          <Text style={styles.helpBarText}>Utilisez le plan comme guide</Text>
          <Ionicons name="help-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <View style={styles.controlSpacer} />
          
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={!isReady || isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
            <Ionicons name="camera-reverse" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <HelpModal
        visible={isHelpVisible}
        onClose={handleHelpClose}
        helpContent={DUMMY_HELP_CONTENT}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
    marginLeft: -34,
  },
  headerSpacer: {
    width: 34,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  camera: {
    flex: 1,
  },
  faceOutlineContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOutline: {
    alignItems: 'center',
  },
  headCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  shouldersShape: {
    width: 160,
    height: 80,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  helpBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  helpBar: {
    backgroundColor: '#1a365d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },
  helpBarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlSpacer: {
    width: 50,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonDisabled: {
    backgroundColor: '#ccc',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxWidth: width - 40,
    minWidth: width - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginTop: 7,
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  retourButton: {
    backgroundColor: '#1a365d',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retourButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ✅ Set display names for better debugging
FaceOutlineOverlay.displayName = 'FaceOutlineOverlay';
HelpModal.displayName = 'HelpModal';
TakePhotoScreen.displayName = 'TakePhotoScreen';

export default TakePhotoScreen;