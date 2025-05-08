import { useState, useRef } from "react";
import { Line } from 'react-chartjs-2';
import {Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, ChartData as ChartJSType, ChartEvent, ActiveElement, Plugin} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

const palette30 = [
  '#e6194b', // red
  '#3cb44b', // green
  '#ffe119', // yellow
  '#4363d8', // blue
  '#f58231', // orange
  '#911eb4', // purple
  '#46f0f0', // cyan
  '#f032e6', // magenta
  '#bcf60c', // lime
  '#fabebe', // pink
  '#008080', // teal
  '#e6beff', // lavender
  '#9a6324', // brown
  '#fffac8', // light yellow
  '#800000', // maroon
  '#aaffc3', // mint
  '#808000', // olive
  '#ffd8b1', // peach
  '#000075', // dark blue
  '#808080', // gray
  '#000000', // black
  '#a9a9a9', // dark gray
  '#ff4500', // orange red
  '#2e8b57', // sea green
  '#1e90ff', // dodger blue
  '#dda0dd', // plum
  '#7fffd4', // aquamarine
  '#ff1493', // deep pink
  '#bdb76b', // dark khaki
  '#4682b4', // steel blue
];

type Node = {
  index: number;
  firstConnection: number;
  secondConnection: number;
  function: number;
};

type Curve = {
  generations: number[];
  bestFitnesses: number[];
  activeNodesCounts: number[];
};

type Genome = {
  inputs: number;
  outputs: number;
  columns: number;
  rows: number;
  nodeInputs: number;
  lBack: number;
};

type Run = {
  id: number;
  curve: Curve;
  genome: Genome;
  chromosome: Node[];
};

type Props = {
  runs: Run[];
  onRunClick?: (runId: number) => void;
};

interface DataPoint {
  generation: number;
  fitness: number;
}

const ConvergentionCurvesGraph: React.FC<Props> = ({ runs, onRunClick }) => {
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState<number | null>(null);

  const validRuns = runs.filter(run => run?.curve?.generations && run.curve.bestFitnesses);

  if (validRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" />
    );
  }

  const runData: DataPoint[][] = validRuns.map(run =>
    run.curve.generations.map((generation, i) => ({
      generation,
      fitness: run.curve.bestFitnesses[i],
    }))
  );

  const allGenerations = Array.from(
    new Set(runData.flat().map(data => data.generation))
  ).sort((a, b) => a - b);

  const chartData: ChartJSType<'line', (number | null)[], number> = {
    labels: allGenerations,
    datasets: runData.map((data, idx) => {
      const baseColor = palette30[idx % palette30.length];
      const fadedColor50 = baseColor + '80';
      const fadedColor40 = baseColor + '33';
    
      return {
        label: `Run ${idx + 1}`,
        data: allGenerations.map(gen => {
          const match = data.find(d => d.generation === gen);
          return match ? match.fitness : null;
        }),
        borderColor: selectedDatasetIndex === null || selectedDatasetIndex === idx ? baseColor : fadedColor50,
        borderWidth: selectedDatasetIndex === null || selectedDatasetIndex === idx ? 4 : 1.5,
        backgroundColor: selectedDatasetIndex === null || selectedDatasetIndex === idx ? baseColor : fadedColor40,
        stepped: true,
        spanGaps: true,
        pointBackgroundColor: selectedDatasetIndex === null || selectedDatasetIndex === idx ? baseColor : fadedColor50,
        pointHoverBackgroundColor: baseColor,
        pointBorderColor: selectedDatasetIndex === null || selectedDatasetIndex === idx ? baseColor : fadedColor50,
        pointHoverBorderColor: selectedDatasetIndex === null || selectedDatasetIndex === idx ? baseColor : fadedColor50,
      };
    }),
  };

  const handleChartClick = (event: ChartEvent) => {
    if (!chartRef.current) return;

    const points = chartRef.current.getElementsAtEventForMode(
      event as unknown as MouseEvent,
      'nearest',
      { intersect: false },
      true
    );

    if (points.length > 0) {
      const datasetIndex = (points[0] as ActiveElement).datasetIndex;
      setSelectedDatasetIndex(datasetIndex);

      const selectedRun = validRuns[datasetIndex];
      if (selectedRun && onRunClick) {
        onRunClick(selectedRun.id);
      }
    }
  };

  const legendSpacingPlugin: Plugin<'line'> = {
    id: 'legendSpacing',
    beforeInit(chart) {
      const originalFit = chart.legend?.fit;
      if (originalFit) {
        chart.legend.fit = function fit() {
          originalFit.bind(chart.legend)();
          this.height += 20;
        };
      }
    }
  };

  return (
    <div  
      style={{
          width: "100%",
          height: "60vh",
      }}
    >
        <Line
          ref={chartRef}
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: handleChartClick,
            plugins: {
              legend: { 
                position: 'top',
                labels: {
                  padding: 20,
                  color: 'black',
                  font: { size: 12, weight: 'bold'},
                  boxWidth: 15,
                  boxHeight: 15,
                  textAlign: 'center',
                  usePointStyle: false
                }
              },
              title: { 
                display: false,
                text: 'Convergence Curves',
                color: 'black',
                font: { size: 20, weight: 'bold' }
              },
              tooltip: {
                enabled: true,
                animation: false,
                callbacks: {
                  title: (tooltipItems) => {
                    const item = tooltipItems[0];
                    return `Generation ${item.label}`;
                  },
                  labelColor: (context) => {
                    const datasetIndex = context.datasetIndex;
                    const color = palette30[datasetIndex % palette30.length];
                    return {
                      borderColor: color,
                      backgroundColor: color,
                    };
                  },
                  label: (context) => {
                    const datasetLabel = context.dataset.label || '';
                    const generation = context.label || '';

                    const match = datasetLabel.match(/Run (\d+)/);
                    const runIndex = match ? parseInt(match[1]) - 1 : null;
                  
                    if (runIndex !== null && validRuns[runIndex]?.curve?.activeNodesCounts) {
                      let index = -1;
                      if (generation) {
                        index = validRuns[runIndex].curve.generations.indexOf(Number(generation));
                      }

                      if (index !== -1) {
                        const value = validRuns[runIndex].curve.activeNodesCounts[index];
                        return ` ${datasetLabel} - fitness: ${context.raw}, used nodes: ${value}`;
                      }
                    }
                  
                    return datasetLabel;
                  },
                },
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleColor: 'orange',
                bodyColor: 'white',
              }
            },
            layout: {
              padding: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
              },
            },
            scales: {
              x: {
                type: 'category',
                title: {
                  display: true,
                  text: 'Generations',
                  font: { size: 15, weight: 'bold' },
                  color: 'black'
                },
                ticks: { color: 'black' }
              },
              y: {
                title: {
                  display: true,
                  text: 'Fitness',
                  font: { size: 15, weight: 'bold' },
                  color: 'black'
                },
                ticks: { color: 'black' }
              },
            },
            elements: {
              point: {
                radius: 4,
                hoverRadius: 4,
                borderWidth: 4,
                hoverBorderWidth: 4,
              },
            },
          }}

          plugins={[legendSpacingPlugin]}
        />
    </div>
  );
};

export default ConvergentionCurvesGraph;