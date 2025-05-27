// filepath: src/components/Visualization.vue
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useDatasetStore, type DataRow } from '@/stores/dataset'
import * as d3 from 'd3'

const datasetStore = useDatasetStore()
const svgRef = ref<SVGSVGElement | null>(null)

const dataToVisualize = computed(() => datasetStore.parsedData)

const drawChart = (data: DataRow[] | null) => {
  if (!svgRef.value) return;

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove() // Clear previous chart

  if (!data || data.length === 0) {
    svg.append('text')
      .attr('x', 250)
      .attr('y', 150)
      .attr('text-anchor', 'middle')
      .text(datasetStore.error ? '' : 'No data to visualize or data is empty.');
    return
  }

  const margin = { top: 20, right: 30, bottom: 40, left: 50 }
  const width = 500 - margin.left - margin.right
  const height = 300 - margin.top - margin.bottom

  const chart = svg
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const firstRow = data[0];
  const numericKeys = Object.keys(firstRow).filter(key => typeof firstRow[key] === 'number');

  if (numericKeys.length < 2) {
    chart.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .text('Need at least two numeric columns for this example scatter plot.');
    return;
  }

  const xKey = numericKeys[0];
  const yKey = numericKeys[1];

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d[xKey] as number) as [number, number])
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d[yKey] as number) as [number, number])
    .range([height, 0])
    .nice();

  chart.selectAll<SVGCircleElement, DataRow>('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d[xKey] as number))
    .attr('cy', d => yScale(d[yKey] as number))
    .attr('r', 4)
    .attr('fill', 'steelblue')
    .style('opacity', 0.7);

  chart.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append('text')
      .attr('x', width)
      .attr('y', margin.bottom - 10)
      .attr('fill', '#000')
      .attr('text-anchor', 'end')
      .text(xKey);

  chart.append('g')
    .call(d3.axisLeft(yScale))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', 0)
      .attr('fill', '#000')
      .attr('text-anchor', 'end')
      .text(yKey);
}

watch(dataToVisualize, (newData) => {
  drawChart(newData)
}, { deep: true })

onMounted(() => {
  drawChart(dataToVisualize.value)
})

</script>

<template>
  <div class="visualization-container">
    <h3>D3.js Data Visualization</h3>
    <svg ref="svgRef"></svg>
    <div v-if="!datasetStore.hasData && !datasetStore.error && !dataToVisualize">
      <p>Please upload a dataset to see the visualization.</p>
    </div>
    <div v-if="datasetStore.error && !datasetStore.hasData">
      <p style="color: red;">{{ datasetStore.error }}</p>
    </div>
  </div>
</template>

<style scoped>
.visualization-container {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  background-color: #fdfdfd;
  text-align: center;
}
svg {
  display: inline-block; /* Center SVG if container is text-align: center */
  background-color: #f0f0f0;
  border: 1px solid #ccc;
}
</style>
