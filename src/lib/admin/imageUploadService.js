import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

const BUCKET = 'noticeboard-images';
const MAX_WIDTH = 1200;
const QUALITY = 0.8;

/**
 * Pick an image from the device gallery.
 * Returns the local URI or null if cancelled.
 */
export async function pickImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

/**
 * Compress an image to a max width and JPEG quality.
 * Returns the compressed local URI.
 */
export async function compressImage(uri) {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
}

/**
 * Upload a local image to Supabase Storage.
 * Path: noticeboard-images/{noticeId}/{timestamp}.jpg
 * Returns the public URL on success.
 */
export async function uploadToStorage(localUri, noticeId) {
  const fileName = `${noticeId}/${Date.now()}.jpg`;

  let body;
  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    body = await response.arrayBuffer();
  } else {
    const file = new ExpoFile(localUri);
    body = await file.arrayBuffer();
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, body, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Pick, compress, and upload an image for a noticeboard entry.
 * Returns { url } or null if user cancelled.
 */
export async function pickAndUploadNoticeImage(noticeId) {
  const uri = await pickImage();
  if (!uri) return null;

  const compressed = await compressImage(uri);
  const url = await uploadToStorage(compressed, noticeId);
  return { url };
}
