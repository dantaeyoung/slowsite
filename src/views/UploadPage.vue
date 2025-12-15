<template>
  <div class="upload-page">
    <h1>Upload Card</h1>

    <div v-if="!uploadComplete" class="upload-form">
      <!-- Image Preview -->
      <div class="preview-container" v-if="imagePreview">
        <img :src="imagePreview" alt="Preview" class="image-preview" />
        <button @click="clearImage" class="clear-btn">Clear</button>
      </div>

      <!-- File Input -->
      <div v-else class="file-input-container">
        <label for="file-input" class="file-label">
          <span>Tap to take photo or select image</span>
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          capture="environment"
          @change="onFileSelect"
          class="file-input"
        />
      </div>

      <!-- Page Name Input -->
      <div class="form-group" v-if="imagePreview">
        <label for="page-name">Page Name (slug)</label>
        <input
          id="page-name"
          v-model="pageName"
          type="text"
          placeholder="e.g., home, about, my-desk"
          class="text-input"
        />
        <p class="hint">This will be the URL: /{{ pageName || 'page-name' }}</p>
      </div>

      <!-- Upload Button -->
      <button
        v-if="imagePreview && pageName"
        @click="uploadCard"
        :disabled="uploading"
        class="upload-btn"
      >
        {{ uploading ? 'Uploading...' : 'Create Page' }}
      </button>

      <!-- Progress -->
      <div v-if="uploading" class="progress-container">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
        <span>{{ Math.round(uploadProgress) }}%</span>
      </div>

      <!-- Error -->
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- Success State -->
    <div v-else class="success">
      <p>Page created successfully!</p>
      <router-link :to="'/' + pageName" class="view-link">
        View {{ pageName }}
      </router-link>
      <button @click="reset" class="another-btn">Upload Another</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storage, database } from '../firebase'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { ref as dbRef, set } from 'firebase/database'

const selectedFile = ref(null)
const imagePreview = ref(null)
const pageName = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadComplete = ref(false)
const error = ref(null)

const onFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearImage = () => {
  selectedFile.value = null
  imagePreview.value = null
}

const uploadCard = async () => {
  if (!selectedFile.value || !pageName.value) return

  uploading.value = true
  error.value = null

  try {
    // Create storage reference
    const fileName = `${pageName.value}-${Date.now()}.${selectedFile.value.name.split('.').pop()}`
    const fileRef = storageRef(storage, `cards/${fileName}`)

    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(fileRef, selectedFile.value)

    uploadTask.on('state_changed',
      (snapshot) => {
        uploadProgress.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      },
      (err) => {
        error.value = 'Upload failed: ' + err.message
        uploading.value = false
      },
      async () => {
        try {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

          // Save page data to database
          const pageRef = dbRef(database, `pages/${pageName.value}`)
          await set(pageRef, {
            pageId: pageName.value,
            imagePath: downloadURL,
            imageMap: [],
            createdAt: Date.now()
          })

          uploading.value = false
          uploadComplete.value = true
        } catch (err) {
          error.value = 'Failed to save page: ' + err.message
          uploading.value = false
        }
      }
    )
  } catch (err) {
    error.value = 'Error: ' + err.message
    uploading.value = false
  }
}

const reset = () => {
  selectedFile.value = null
  imagePreview.value = null
  pageName.value = ''
  uploading.value = false
  uploadProgress.value = 0
  uploadComplete.value = false
  error.value = null
}
</script>

<style scoped>
.upload-page {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
}

.file-input-container {
  border: 3px dashed #ccc;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.file-input-container:hover {
  border-color: #3476df;
}

.file-label {
  display: block;
  font-size: 18px;
  color: #666;
  cursor: pointer;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: pointer;
}

.file-input-container {
  position: relative;
}

.preview-container {
  text-align: center;
}

.image-preview {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.clear-btn {
  margin-top: 10px;
  padding: 8px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.form-group {
  margin-top: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.text-input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: #3476df;
}

.hint {
  margin-top: 8px;
  color: #888;
  font-size: 14px;
}

.upload-btn {
  width: 100%;
  margin-top: 20px;
  padding: 16px;
  font-size: 18px;
  background: #3476df;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover:not(:disabled) {
  background: #2860b8;
}

.upload-btn:disabled {
  background: #99b8e8;
  cursor: not-allowed;
}

.progress-container {
  margin-top: 15px;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  height: 24px;
}

.progress-bar {
  height: 100%;
  background: #3476df;
  transition: width 0.3s;
}

.progress-container span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
}

.error {
  margin-top: 15px;
  color: #d32f2f;
  text-align: center;
}

.success {
  text-align: center;
  padding: 40px 20px;
}

.success p {
  font-size: 20px;
  color: #2e7d32;
  margin-bottom: 20px;
}

.view-link {
  display: inline-block;
  padding: 14px 30px;
  background: #3476df;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 15px;
}

.another-btn {
  display: block;
  margin: 0 auto;
  padding: 10px 20px;
  background: none;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>
