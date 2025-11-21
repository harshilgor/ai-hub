import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import type { Node, Edge } from '@xyflow/react';
import 'reactflow/dist/style.css';
import { Search, Save, Share2, Download, Zap } from 'lucide-react';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {
  startup: { color: '#3B82F6', icon: '🚀' },
  paper: { color: '#8B5CF6', icon: '📄' },
  concept: { color: '#6B7280', icon: '💡' },
  investor: { color: '#F59E0B', icon: '💰' },
  person: { color: '#10B981', icon: '👤' },
};

export default function KnowledgeGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [searchTerm, setSearchTerm] = useState('');
  const [graphName, setGraphName] = useState('Untitled Graph');
  const [isEditing, setIsEditing] = useState(false);

  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const exampleSearches = [
    'Multimodal Models',
    'AI Healthcare',
    'OpenAI',
    'Computer Vision',
    'Agent Systems',
  ];

  const createGraph = (topic: string) => {
    // Create a sample graph based on the topic
    const centerNode: Node = {
      id: '1',
      type: 'default',
      position: { x: 400, y: 200 },
      data: {
        label: (
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-2xl">💡</span>
            <span className="font-bold">{topic}</span>
          </div>
        ),
      },
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    };

    const relatedNodes: Node[] = [
      {
        id: '2',
        position: { x: 200, y: 100 },
        data: {
          label: (
            <div className="flex items-center gap-2 px-3 py-2">
              <span>🚀</span>
              <span>NeuralMed</span>
            </div>
          ),
        },
        style: {
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
        },
      },
      {
        id: '3',
        position: { x: 600, y: 100 },
        data: {
          label: (
            <div className="flex items-center gap-2 px-3 py-2">
              <span>🚀</span>
              <span>CodeWeaver AI</span>
            </div>
          ),
        },
        style: {
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
        },
      },
      {
        id: '4',
        position: { x: 150, y: 300 },
        data: {
          label: (
            <div className="flex items-center gap-2 px-3 py-2">
              <span>📄</span>
              <span>Key Research</span>
            </div>
          ),
        },
        style: {
          background: '#8B5CF6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
        },
      },
      {
        id: '5',
        position: { x: 650, y: 300 },
        data: {
          label: (
            <div className="flex items-center gap-2 px-3 py-2">
              <span>💰</span>
              <span>Sequoia Capital</span>
            </div>
          ),
        },
        style: {
          background: '#F59E0B',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
        },
      },
      {
        id: '6',
        position: { x: 400, y: 400 },
        data: {
          label: (
            <div className="flex items-center gap-2 px-3 py-2">
              <span>💡</span>
              <span>Related Concepts</span>
            </div>
          ),
        },
        style: {
          background: '#6B7280',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
        },
      },
    ];

    const newEdges: Edge[] = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
      },
      {
        id: 'e1-3',
        source: '1',
        target: '3',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
      },
      {
        id: 'e1-4',
        source: '1',
        target: '4',
        animated: true,
        style: { stroke: '#8B5CF6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' },
      },
      {
        id: 'e2-5',
        source: '2',
        target: '5',
        style: { stroke: '#F59E0B', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
      },
      {
        id: 'e3-5',
        source: '3',
        target: '5',
        style: { stroke: '#F59E0B', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
      },
      {
        id: 'e1-6',
        source: '1',
        target: '6',
        animated: true,
        style: { stroke: '#6B7280', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6B7280' },
      },
    ];

    setNodes([centerNode, ...relatedNodes]);
    setEdges(newEdges);
    setSearchTerm('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      createGraph(searchTerm);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] relative">
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 glass-card border-b border-light-border dark:border-dark-border p-4">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">
          {/* Graph Name */}
          {isEditing ? (
            <input
              type="text"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="text-xl font-bold bg-transparent border-b-2 border-primary-light dark:border-primary-dark focus:outline-none"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-bold cursor-pointer hover:text-primary-light dark:hover:text-primary-dark"
              onClick={() => setIsEditing(true)}
            >
              {graphName}
            </h1>
          )}

          <div className="flex-1"></div>

          {/* Actions */}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      {nodes.length === 0 ? (
        // Empty State
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-light-bg to-light-card dark:from-dark-bg dark:to-dark-card">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-2xl px-6"
          >
            <div className="text-6xl mb-6">🕸️</div>
            <h2 className="text-3xl font-bold mb-4">Start exploring the AI landscape</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">
              Enter any AI topic, company, or concept to build your knowledge graph
            </p>

            <form onSubmit={handleSearch} className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter any AI topic, company, or concept..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-light-card dark:bg-dark-card border-2 border-light-border dark:border-dark-border focus:border-primary-light dark:focus:border-primary-dark focus:outline-none text-lg"
              />
            </form>

            <div className="flex flex-wrap justify-center gap-3">
              <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Try:</span>
              {exampleSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => createGraph(search)}
                  className="px-4 py-2 rounded-lg glass-card border border-light-border dark:border-dark-border hover:border-primary-light dark:hover:border-primary-dark hover:scale-105 transition-all text-sm font-medium"
                >
                  {search}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        // Graph Canvas
        <div className="h-full pt-20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-gradient-to-br from-light-bg to-light-card dark:from-dark-bg dark:to-dark-card"
          >
            <Background color="#aaa" gap={16} />
            <Controls className="glass-card border border-light-border dark:border-dark-border rounded-lg overflow-hidden" />
          </ReactFlow>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 glass-card rounded-xl p-4 border border-light-border dark:border-dark-border">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Node Types
            </h3>
            <div className="space-y-2">
              {Object.entries(nodeTypes).map(([type, { color, icon }]) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                  <span>{icon}</span>
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="absolute top-24 left-6 right-6 max-w-md">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Add to graph..."
                className="w-full pl-10 pr-4 py-2 rounded-lg glass-card border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

