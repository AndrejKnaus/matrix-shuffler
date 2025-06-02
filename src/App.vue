<script setup lang="ts">
import { ref } from 'vue'
import Introduction from './components/Introduction.vue'
import PixiVisualizationWrapper from './components/PixiVisualizationWrapper.vue'
import { useVisualizationStore } from './stores/visualization'
import type { VisualizationEncoding } from './types/visualizationConfig'

const showImportModal = ref(false) // New ref for modal visibility

const visualizationStore = useVisualizationStore()

const setEncoding = (encoding: VisualizationEncoding) => {
  visualizationStore.setEncoding(encoding)
}

function handleImportData() {
  showImportModal.value = true
}

function closeImportModal() {
  showImportModal.value = false
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
              <a href="#" @click.prevent="setEncoding('circle')">Display as Circles</a>
              <a href="#" @click.prevent="setEncoding('color')">Display as Colors</a>
              <a href="#" @click.prevent="setEncoding('circle-color')">Display as Circle+Color</a>
              <a href="#" @click.prevent="setEncoding('color-text')">Display as Color+Text</a>
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
        <Introduction msg="Welcome to Matrix Shuffler!" />

        <!--
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>
        -->
        <!-- PixiJS Visualization View -->
        <div class="visualization-view">
          <PixiVisualizationWrapper :useRandomData="true" :matrixSize="10" />
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
  width: 100vw;
  overflow: hidden;
}

.app-header {
  width: 100%;
  background-color: var(--color-primary);
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
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
  background-color: var(--color-primary-light);
  color: var(--color-on-hover);
  transition: 0.1s;
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: none;
  position: absolute;
  background-color: var(--color-background-soft);
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
  flex: 1 1 0;
  width: 100%;
  height: calc(100vh - 60px); /* header height */
  margin-top: 60px; /* header height */
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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

.visualization-view {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
}
</style>
