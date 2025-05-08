import { useState } from "react";

import ChromosomeBox from "./components/ChromosomeBox";
import FileReaderComponent from "./components/FileReader";
import ConvergentionCurvesGraph from "./components/ConvergentionCurvesGraph";

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
}

type Run = {
    id: number;
    curve: Curve;
    genome: Genome;
    chromosome: Node[];
}

function App() {
    const [inputs, setInputs] = useState<string[]>([]);
    const [outputs, setOutputs] = useState<string[]>([]);
    const [runs, setRuns] = useState<Run[]>([]);

    const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
    const handleRunClick = (runId: number) => {
        setSelectedRunId(runId);
    };

    const handleParsedData = (parsedInputs: string[], parsedOutputs: string[], parsedRuns: Run[]) => {
        setInputs(parsedInputs);
        setOutputs(parsedOutputs);
        setRuns(parsedRuns);

        if (parsedRuns.length > 0) {
            setSelectedRunId(parsedRuns[0].id);
        }
    };

    const [hideInactive, setHideInactive] = useState<boolean>(false)
    const handleHideInactiveButton = () => {
        setHideInactive(!hideInactive)
    }

    return (

    <div style={{ padding: "19px" }}>
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "10vh",
                marginTop: "10px",
                marginBottom: "30px",
                gap: "50px",
            }}
        >
            <h1 style={{ margin: 0, fontWeight: "bold", fontSize: "48px" }}>CGP Visualizer</h1>
            <FileReaderComponent onDataParsed={handleParsedData} />
        </div>
        
        <div
            style={{
                display: "flex",
                gap: "40px",
                justifyContent: "center",
                flexWrap: "wrap",
                width: "100%",
            }}
        >
            <div
            style={{
                backgroundColor: "#8aaae5",
                flex: "1 1 40%",
                minWidth: "600px",
                maxWidth: "900px",
                height: "65vh",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            >
            {runs.length === 0 ? (
                <p style={{ fontWeight: "bold", fontSize: "32px", color: "#ffffff" }}>
                Convergence curves
                </p>
            ) : (
                <ConvergentionCurvesGraph runs={runs} onRunClick={handleRunClick} />
            )}
            </div>

            <div
            style={{
                backgroundColor: "#8aaae5",
                flex: "1 1 40%",
                minWidth: "600px",
                maxWidth: "900px",
                height: "65vh",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            >
            {selectedRunId !== null ? (
                <ChromosomeBox
                    inputs={inputs}
                    outputs={outputs}
                    run={runs[selectedRunId]}
                    hideInactive={hideInactive}
                    selectedRunId={selectedRunId}
                />
            ) : (
                <p style={{ fontWeight: "bold", fontSize: "32px", color: "#ffffff" }}>
                Chromosome visualization
                </p>
            )}
            </div>
        </div>
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "10vh",
                marginTop: "30px",
                gap: "50px"
            }}
        >
            <button
                onClick={handleHideInactiveButton}
                style={{
                    padding: "12px 24px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: hideInactive ? "darkred" : "green",
                    border: "none",
                    borderRadius: "10px",
                    width: "230px",
                    height: "58px",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                }}
                onMouseOver={(e) => {
                    hideInactive
                        ? (e.target as HTMLButtonElement).style.backgroundColor = "#a30000"
                        : (e.target as HTMLButtonElement).style.backgroundColor = "#009c00"
                }}
                onMouseOut={(e) => {
                    hideInactive
                        ? (e.target as HTMLButtonElement).style.backgroundColor = "darkred"
                        : (e.target as HTMLButtonElement).style.backgroundColor = "green"
                }}
            > {hideInactive ? "Show inactive nodes" : "Hide inactive nodes"} </button>
        </div>
    </div>
    );
}

export default App;