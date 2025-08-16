// src/features/components/MemoryProfiler.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { usePDFEditor } from '../pdf-editor/PDFEditorContext';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Zap, Trash2 } from 'lucide-react';

interface MemoryStats {
  totalElements: number;
  memoryUsage: number;
  renderTime: number;
  pageCount: number;
  isHighUsage: boolean;
}

export const MemoryProfiler: React.FC = () => {
  const { state } = usePDFEditor();
  const { calculateMetrics, cleanupMemory } = usePerformanceOptimization();
  const [stats, setStats] = useState<MemoryStats>({
    totalElements: 0,
    memoryUsage: 0,
    renderTime: 0,
    pageCount: 0,
    isHighUsage: false
  });
  const [isVisible, setIsVisible] = useState(false);

  // Calculate current memory statistics
  const updateStats = useCallback(() => {
    const metrics = calculateMetrics();
    
    const totalElements = Object.values(state.annotations).flat().length +
                         Object.values(state.textElements).flat().length +
                         Object.values(state.imageElements).flat().length +
                         Object.values(state.whiteoutBlocks).flat().length +
                         Object.values(state.freeformElements).flat().length +
                         Object.values(state.formFields).flat().length;

    const memoryUsage = metrics.memoryUsage;
    const isHighUsage = memoryUsage > 50 * 1024 * 1024; // 50MB threshold

    setStats({
      totalElements,
      memoryUsage,
      renderTime: metrics.renderTime,
      pageCount: state.totalPages,
      isHighUsage
    });
  }, [calculateMetrics, state]);

  // Update stats periodically
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  // Auto-show profiler if memory usage is high
  useEffect(() => {
    if (stats.isHighUsage && !isVisible) {
      setIsVisible(true);
    }
  }, [stats.isHighUsage, isVisible]);

  // Format memory size
  const formatMemorySize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle memory cleanup
  const handleCleanup = useCallback(() => {
    cleanupMemory();
    updateStats();
  }, [cleanupMemory, updateStats]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Zap className="h-4 w-4 mr-1" />
        Performance
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Performance Monitor
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Memory Usage */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Memory Usage</span>
            <span className={stats.isHighUsage ? 'text-red-600' : 'text-green-600'}>
              {formatMemorySize(stats.memoryUsage)}
            </span>
          </div>
          <Progress 
            value={Math.min((stats.memoryUsage / (100 * 1024 * 1024)) * 100, 100)} 
            className="h-2"
          />
          {stats.isHighUsage && (
            <div className="flex items-center text-xs text-red-600 mt-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              High memory usage detected
            </div>
          )}
        </div>

        {/* Element Count */}
        <div className="flex justify-between text-xs">
          <span>Total Elements:</span>
          <span>{stats.totalElements}</span>
        </div>

        {/* Page Count */}
        <div className="flex justify-between text-xs">
          <span>PDF Pages:</span>
          <span>{stats.pageCount}</span>
        </div>

        {/* Render Time */}
        <div className="flex justify-between text-xs">
          <span>Last Render:</span>
          <span>{stats.renderTime.toFixed(1)}ms</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanup}
            className="flex-1 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Cleanup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={updateStats}
            className="flex-1 text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Performance Tips */}
        {stats.isHighUsage && (
          <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
            <strong>Tips:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Reduce number of elements per page</li>
              <li>• Use smaller image sizes</li>
              <li>• Clear unused annotations</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
