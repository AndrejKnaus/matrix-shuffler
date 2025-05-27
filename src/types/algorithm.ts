export type algorithmType = '2DSort' | '2Sum' | 'Spectral' | 'BiMax' | 'ClassicalMDS' | 'AHC'

export interface Algorithm {
  type: algorithmType
  displayName: string
  description: string
}

export interface TwoDSortAlgorithm extends Algorithm {
  type: '2DSort'
  displayName: '2D Sort'
  description: 'A 2D sorting algorithm that arranges data points in a two-dimensional space based on their values.'
}

export interface TwoSumAlgorithm extends Algorithm {
  type: '2Sum'
  displayName: '2-Sum'
  description: 'A two-sum algorithm that finds pairs of numbers in a dataset that sum to a specific target.'
}
export interface SpectralAlgorithm extends Algorithm {
  type: 'Spectral'
  displayName: 'Spectral Clustering'
  description: 'A clustering algorithm that uses the eigenvalues of a similarity matrix to reduce dimensionality before clustering.'
}
export interface BiMaxAlgorithm extends Algorithm {
  type: 'BiMax'
  displayName: 'BiMax'
  description: 'A biclustering algorithm that identifies submatrices in a data matrix where the rows and columns are highly correlated.'
}
export interface ClassicalMDSAlgorithm extends Algorithm {
  type: 'ClassicalMDS'
  displayName: 'Classical MDS'
  description: 'Classical Multidimensional Scaling (MDS) is a technique used for visualizing the level of similarity of individual cases of a dataset.'
}
export interface AgglomerativeHierarchicalClusteringAlgorithm extends Algorithm {
  type: 'AHC'
  displayName: 'Agglomerative Hierarchical Clustering'
  description: 'A clustering algorithm that builds a hierarchy of clusters by iteratively merging the closest pairs of clusters.'
}
