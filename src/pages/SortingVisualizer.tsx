import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Home, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type SortingAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

interface ArrayElement {
  value: number;
  isCompared: boolean;
  isSwapped: boolean;
  isSorted: boolean;
}

const SortingVisualizer = () => {
  const [array, setArray] = useState<ArrayElement[]>([]);
  const [arraySize, setArraySize] = useState([20]);
  const [speed, setSpeed] = useState([5]);
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble');
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const animationRef = useRef<NodeJS.Timeout[]>([]);
  const isRunningRef = useRef(false);
  const navigate = useNavigate();

  const generateRandomArray = useCallback(() => {
    if (isRunning) return;
    
    const newArray = Array.from({ length: arraySize[0] }, () => ({
      value: Math.floor(Math.random() * 290) + 10,
      isCompared: false,
      isSwapped: false,
      isSorted: false
    }));
    setArray(newArray);
  }, [arraySize, isRunning]);

  const useCustomArray = () => {
    if (isRunning) return;
    
    const values = customInput.split(',').map(val => parseInt(val.trim()));
    if (values.some(val => isNaN(val) || val < 10 || val > 300)) {
      toast.error("Enter only numbers between 10 and 300, comma-separated");
      return;
    }
    
    const newArray = values.map(value => ({
      value,
      isCompared: false,
      isSwapped: false,
      isSorted: false
    }));
    setArray(newArray);
    setCustomInput('');
    toast.success("Custom array loaded!");
  };

  const sleep = (ms: number) => {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      animationRef.current.push(timeout);
    });
  };

  const stopSorting = () => {
    animationRef.current.forEach(timeout => clearTimeout(timeout));
    animationRef.current = [];
    isRunningRef.current = false;
    setIsRunning(false);
    setArray(prev => prev.map(el => ({ ...el, isCompared: false, isSwapped: false })));
  };

  const updateArray = (newArray: ArrayElement[]) => {
    setArray([...newArray]);
  };

  // Sorting Algorithms
  const bubbleSort = async (arr: ArrayElement[]) => {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!isRunningRef.current) return;
        
        arr[j].isCompared = true;
        arr[j + 1].isCompared = true;
        updateArray(arr);
        await sleep(1100 - speed[0] * 100);
        
        if (arr[j].value > arr[j + 1].value) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          arr[j].isSwapped = true;
          arr[j + 1].isSwapped = true;
          updateArray(arr);
          await sleep(1100 - speed[0] * 100);
        }
        
        arr[j].isCompared = false;
        arr[j + 1].isCompared = false;
        arr[j].isSwapped = false;
        arr[j + 1].isSwapped = false;
      }
      arr[n - i - 1].isSorted = true;
      updateArray(arr);
    }
    arr[0].isSorted = true;
    updateArray(arr);
  };

  const selectionSort = async (arr: ArrayElement[]) => {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      arr[minIdx].isCompared = true;
      
      for (let j = i + 1; j < n; j++) {
        if (!isRunningRef.current) return;
        
        arr[j].isCompared = true;
        updateArray(arr);
        await sleep(1100 - speed[0] * 100);
        
        if (arr[j].value < arr[minIdx].value) {
          arr[minIdx].isCompared = false;
          minIdx = j;
          arr[minIdx].isCompared = true;
        } else {
          arr[j].isCompared = false;
        }
        updateArray(arr);
      }
      
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        arr[i].isSwapped = true;
        arr[minIdx].isSwapped = true;
        updateArray(arr);
        await sleep(1100 - speed[0] * 100);
        arr[minIdx].isSwapped = false;
      }
      
      arr[i].isCompared = false;
      arr[i].isSwapped = false;
      arr[i].isSorted = true;
      updateArray(arr);
    }
    arr[n - 1].isSorted = true;
    updateArray(arr);
  };

const insertionSort = async (arr: ArrayElement[]) => {
    for (let i = 1; i < arr.length; i++) {
      if (!isRunningRef.current) return;
      
      const key = arr[i];
      let j = i - 1;
      
      arr[i].isCompared = true;
      updateArray(arr);
      await sleep(1100 - speed[0] * 100);
      
      while (j >= 0 && arr[j].value > key.value) {
        if (!isRunningRef.current) return;
        
        arr[j].isCompared = true;
        arr[j + 1] = arr[j];
        arr[j + 1].isSwapped = true;
        updateArray(arr);
        await sleep(1100 - speed[0] * 100);
        
        arr[j + 1].isSwapped = false;
        arr[j].isCompared = false;
        j--;
      }
      
      arr[j + 1] = key;
      arr[j + 1].isCompared = false;
      updateArray(arr);
    }
    
    // Mark all as sorted
    arr.forEach(el => el.isSorted = true);
    updateArray(arr);
  };

  const mergeSort = async (arr: ArrayElement[], left: number = 0, right: number = arr.length - 1) => {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      
      await mergeSort(arr, left, mid);
      await mergeSort(arr, mid + 1, right);
      await merge(arr, left, mid, right);
    }
  };

  const merge = async (arr: ArrayElement[], left: number, mid: number, right: number) => {
    if (!isRunningRef.current) return;
    
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
      if (!isRunningRef.current) return;
      
      // Highlight elements being compared
      arr[k].isCompared = true;
      updateArray(arr);
      await sleep(1100 - speed[0] * 100);
      
      if (leftArr[i].value <= rightArr[j].value) {
        arr[k] = { ...leftArr[i], isSwapped: true };
        i++;
      } else {
        arr[k] = { ...rightArr[j], isSwapped: true };
        j++;
      }
      
      updateArray(arr);
      await sleep(1100 - speed[0] * 100);
      
      arr[k].isCompared = false;
      arr[k].isSwapped = false;
      k++;
    }
    
    while (i < leftArr.length) {
      if (!isRunningRef.current) return;
      arr[k] = { ...leftArr[i], isSwapped: true };
      updateArray(arr);
      await sleep(1100 - speed[0] * 100);
      arr[k].isSwapped = false;
      i++;
      k++;
    }
    
    while (j < rightArr.length) {
      if (!isRunningRef.current) return;
      arr[k] = { ...rightArr[j], isSwapped: true };
      updateArray(arr);
      await sleep(1100 - speed[0] * 100);
      arr[k].isSwapped = false;
      j++;
      k++;
    }
    
    // Mark sorted section
    if (left === 0 && right === arr.length - 1) {
      arr.forEach(el => el.isSorted = true);
      updateArray(arr);
    }
  };

  const quickSort = async (arr: ArrayElement[], low: number = 0, high: number = arr.length - 1) => {
    if (low < high) {
      const pivotIndex = await partition(arr, low, high);
      await quickSort(arr, low, pivotIndex - 1);
      await quickSort(arr, pivotIndex + 1, high);
    }
    
    // Mark all as sorted when done
    if (low === 0 && high === arr.length - 1) {
      arr.forEach(el => el.isSorted = true);
      updateArray(arr);
    }
  };

  const partition = async (arr: ArrayElement[], low: number, high: number): Promise<number> => {
    if (!isRunningRef.current) return low;
    
    const pivot = arr[high];
    pivot.isCompared = true;
    updateArray(arr);
    await sleep(1100 - speed[0] * 100);
    
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
      if (!isRunningRef.current) return low;
      
      arr[j].isCompared = true;
      updateArray(arr);
      await sleep(1100 - speed[0] * 100);
      
      if (arr[j].value < pivot.value) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        arr[i].isSwapped = true;
        arr[j].isSwapped = true;
        updateArray(arr);
        await sleep(1100 - speed[0] * 100);
        arr[i].isSwapped = false;
        arr[j].isSwapped = false;
      }
      
      arr[j].isCompared = false;
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    arr[i + 1].isSwapped = true;
    arr[high].isSwapped = true;
    updateArray(arr);
    await sleep(1100 - speed[0] * 100);
    
    arr[i + 1].isSwapped = false;
    arr[high].isSwapped = false;
    pivot.isCompared = false;
    updateArray(arr);
    
    return i + 1;
  };

  const startSorting = async () => {
    if (array.length === 0) {
      toast.error("Generate an array first!");
      return;
    }
    
    setIsRunning(true);
    isRunningRef.current = true;
    const arrayCopy = [...array];
    
    try {
      switch (algorithm) {
        case 'bubble':
          await bubbleSort(arrayCopy);
          break;
        case 'selection':
          await selectionSort(arrayCopy);
          break;
        case 'insertion':
          await insertionSort(arrayCopy);
          break;
        case 'merge':
          await mergeSort(arrayCopy);
          break;
        case 'quick':
          await quickSort(arrayCopy);
          break;
        default:
          toast.error("Algorithm not implemented yet!");
      }
      toast.success("Sorting completed!");
    } catch (error) {
      console.error("Sorting error:", error);
    } finally {
      isRunningRef.current = false;
      setIsRunning(false);
    }
  };

  // Initialize array on mount
  useEffect(() => {
    const newArray = Array.from({ length: 20 }, () => ({
      value: Math.floor(Math.random() * 290) + 10,
      isCompared: false,
      isSwapped: false,
      isSorted: false
    }));
    setArray(newArray);
  }, []);

  // Regenerate array only when array size changes (not when sorting completes)
  useEffect(() => {
    if (!isRunning) {
      const newArray = Array.from({ length: arraySize[0] }, () => ({
        value: Math.floor(Math.random() * 290) + 10,
        isCompared: false,
        isSwapped: false,
        isSorted: false
      }));
      setArray(newArray);
    }
  }, [arraySize]);

  const getBarColor = (element: ArrayElement) => {
    if (element.isSorted) return 'bg-green-400';
    if (element.isSwapped) return 'bg-accent-pink';
    if (element.isCompared) return 'bg-accent-cyan';
    return 'bg-primary-blue';
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-animated"></div>
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="glass-container max-w-7xl mx-auto p-6 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="title-section">🔢 Sorting Visualizer</h1>
            <Button onClick={() => navigate('/')} className="btn-glass">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>

          {/* Visualization Area */}
          <div className="glass-container p-6 mb-6 min-h-[400px] flex items-end justify-center">
            <div className="flex items-end gap-1 overflow-x-auto w-full justify-center">
              {array.map((element, index) => (
                <div
                  key={index}
                  className={`transition-all duration-200 rounded-t ${getBarColor(element)} relative min-w-[8px] flex items-end justify-center`}
                  style={{
                    height: `${element.value}px`,
                    width: `${Math.max(800 / array.length, 8)}px`
                  }}
                >
                  {array.length <= 30 && (
                    <span className="text-xs text-white font-bold mb-1">
                      {element.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel */}
            <div className="glass-container p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Array Size: {arraySize[0]}</label>
                <Slider
                  value={arraySize}
                  onValueChange={setArraySize}
                  max={100}
                  min={5}
                  step={5}
                  disabled={isRunning}
                  className="mb-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Speed: {speed[0]}</label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  max={10}
                  min={1}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Algorithm</label>
                <Select value={algorithm} onValueChange={(value: SortingAlgorithm) => setAlgorithm(value)} disabled={isRunning}>
                  <SelectTrigger className="input-glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bubble">Bubble Sort</SelectItem>
                    <SelectItem value="selection">Selection Sort</SelectItem>
                    <SelectItem value="insertion">Insertion Sort</SelectItem>
                    <SelectItem value="merge">Merge Sort</SelectItem>
                    <SelectItem value="quick">Quick Sort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Panel */}
            <div className="glass-container p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Button 
                  onClick={generateRandomArray} 
                  disabled={isRunning}
                  className="btn-glass w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate New Array
                </Button>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 10,50,30,80,20"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    disabled={isRunning}
                    className="input-glass flex-1"
                  />
                  <Button onClick={useCustomArray} disabled={isRunning} className="btn-glass">
                    Use
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={startSorting} 
                    disabled={isRunning || array.length === 0}
                    className="btn-glass btn-primary flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Sorting
                  </Button>
                  
                  <Button 
                    onClick={stopSorting} 
                    disabled={!isRunning}
                    className="btn-glass"
                    variant="destructive"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>

              {/* Algorithm Explanation */}
              <div className="mt-6 p-4 bg-glass-bg rounded-lg border border-glass-border">
                <h4 className="text-sm font-medium mb-2">Algorithm Explanation:</h4>
                <div className="text-xs space-y-2">
                  {algorithm === 'bubble' && (
                    <div>
                      <p className="font-medium text-accent-cyan">Bubble Sort</p>
                      <p>Compares adjacent elements and swaps them if they're in wrong order. Repeats until no swaps needed.</p>
                      <p className="text-accent-pink">Time: O(n²) | Space: O(1)</p>
                    </div>
                  )}
                  {algorithm === 'selection' && (
                    <div>
                      <p className="font-medium text-accent-cyan">Selection Sort</p>
                      <p>Finds minimum element and places it at the beginning. Repeats for remaining unsorted portion.</p>
                      <p className="text-accent-pink">Time: O(n²) | Space: O(1)</p>
                    </div>
                  )}
                  {algorithm === 'insertion' && (
                    <div>
                      <p className="font-medium text-accent-cyan">Insertion Sort</p>
                      <p>Builds sorted array one element at a time by inserting each element into its correct position.</p>
                      <p className="text-accent-pink">Time: O(n²) | Space: O(1)</p>
                    </div>
                  )}
                  {algorithm === 'merge' && (
                    <div>
                      <p className="font-medium text-accent-cyan">Merge Sort</p>
                      <p>Divides array into halves, sorts them recursively, then merges sorted halves back together.</p>
                      <p className="text-accent-pink">Time: O(n log n) | Space: O(n)</p>
                    </div>
                  )}
                  {algorithm === 'quick' && (
                    <div>
                      <p className="font-medium text-accent-cyan">Quick Sort</p>
                      <p>Picks a pivot, partitions array around it, then recursively sorts the partitions.</p>
                      <p className="text-accent-pink">Time: O(n log n) avg, O(n²) worst | Space: O(log n)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 p-4 bg-glass-bg rounded-lg border border-glass-border">
                <h4 className="text-sm font-medium mb-2">Color Legend:</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary-blue rounded"></div>
                    <span>Unsorted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent-cyan rounded"></div>
                    <span>Comparing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent-pink rounded"></div>
                    <span>Swapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <span>Sorted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;