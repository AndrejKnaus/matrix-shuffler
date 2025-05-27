<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import PixiVisualization from './components/PixiVisualization.vue'

const showViews = ref(false)
const selectedView = ref('matrix')

const showSettingsBar = ref(false)
const currentSettingsType = ref<string | null>(null) // e.g., 'circlesViewSettings', 'rawDataSettings'

const showImportModal = ref(false) // New ref for modal visibility

function openViewSettings(viewType: string) {
  selectedView.value = viewType // Assuming you have this for the main content
  currentSettingsType.value = `${viewType}Settings`
  showSettingsBar.value = true
  // Potentially hide settings bar if the same view's settings are clicked again
}

function handleImportData() {
  // Logic to show an import modal
  console.log('Show import modal')
  showImportModal.value = true // Open the modal
}

function closeImportModal() {
  showImportModal.value = false // Close the modal
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <nav class="main-nav">
        <ul>
          <li class="dropdown">
            <a href="#" class="dropbtn">File</a>
            <div class="dropdown-content">
              <a href="#" @click.prevent="handleImportData">Import Data</a>
              <a href="#">Load Example Dataset</a>
              <a href="#">Export Data</a>
              <a href="#">Export as PNG</a>
              <a href="#">Export as SVG</a>
            </div>
          </li>
          <li class="dropdown">
            <a href="#" class="dropbtn">View</a>
            <div class="dropdown-content">
              <a href="#" @click.prevent="openViewSettings('rawData')">Display as Raw Data</a>
              <a href="#" @click.prevent="openViewSettings('circles')">Display as Circles</a>
              <a href="#">etc.</a>
            </div>
          </li>
          <li class="dropdown">
            <a href="#" class="dropbtn">Actions</a>
            <div class="dropdown-content">
              <a href="#">Reset Data Order</a>
              <a href="#">Apply Reordering Algorithm</a>
            </div>
          </li>
          <li class="dropdown">
            <a href="#" class="dropbtn">Help</a>
            <div class="dropdown-content">
              <a href="#">About</a>
              <a href="#">Github</a>
              <a href="#">How to Use</a>
            </div>
          </li>
        </ul>
      </nav>
    </header>

    <main class="content-area">
      <!--<img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />-->

      <div class="wrapper">
        <HelloWorld msg="Welcome to Matrix Shuffler!" />

        <!--
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>
        -->
        <!-- PixiJS Visualization View -->
        <div class="visualization-view">
          <PixiVisualization
            :width="800"
            :height="600"
            :matrixSize="10"
            :cellSize="40"
            :padding="2"
            :useRandomData="true"
          />
        </div>
      </div>
    </main>

    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <button class="modal-close-button" @click="closeImportModal">&times;</button>
        <h3>Import Data</h3>
        <p>Select the dataset</p>
        <!-- Example: File input for import -->
        <input type="file" @change="() => console.log('File selected for import')" />
        <div class="modal-actions">
          <button @click="closeImportModal">Cancel</button>
          <button
            @click="
              () => {
                console.log('Perform import')
                closeImportModal()
              }
            "
          >
            Import
          </button>
        </div>
      </div>
    </div>

    <!--
  <RouterView />
  --></div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  width: 100%;
  background-color: #333; /* Example background color */
  color: white;
  position: fixed; /* Fixes the header at the top */
  top: 0;
  left: 0;
  z-index: 1000; /* Ensures header is above other content */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-nav ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: flex-start; /* Or center, space-around, etc. */
}

.main-nav li {
  position: relative; /* For dropdown positioning */
}

.main-nav a.dropbtn {
  display: block;
  color: white;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
}

.main-nav li a:hover,
.dropdown:hover .dropbtn {
  background-color: #555; /* Darker background on hover */
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
}

/* Change color of dropdown links on hover */
.dropdown-content a:hover {
  background-color: #ddd;
}

/* Show the dropdown menu on hover */
.dropdown:hover .dropdown-content {
  display: block;
}

.content-area {
  margin-top: 60px; /* Adjust this value based on the actual height of your fixed header */
  padding: 1rem;
  overflow-y: auto; /* If content might overflow */
  flex-grow: 1;
}

/* Original styles, may need adjustment based on new layout */
header {
  /* This was the old header, now .content-area might take its role for some styles */
  line-height: 1.5;
  /* max-height: 100vh; Removed as .app-container and .content-area handle height */
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Ensure modal is on top */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 80%;
  position: relative;
}

.modal-close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #333;
}

.modal-actions {
  margin-top: 20px;
  text-align: right;
}

.modal-actions button {
  margin-left: 10px;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions button:first-child {
  background-color: #eee;
  border: 1px solid #ccc;
}

.modal-actions button:last-child {
  background-color: #4caf50; /* Example primary action color */
  color: white;
  border: 1px solid #4caf50;
}

@media (min-width: 1024px) {
  .content-area header {
    /* Targeting the old header element if it's still used inside content-area */
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  .content-area header .wrapper {
    /* Targeting the old header's wrapper */
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
