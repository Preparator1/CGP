import React from "react";

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

interface ParsedProps {
    onDataParsed: (
        inputs: string[],
        outputs: string[],
        runs: Run[]
    ) => void;
}

const FileReaderComponent: React.FC<ParsedProps> = ({onDataParsed}) => {
    const fileInputRef = React.createRef<HTMLInputElement>();
    const readAndParse = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === "string")
                parse(result.trim());
        };

        reader.readAsText(file);
    };

    const filterData = (curve: Curve) => {        
        const filteredGenerations: number[] = [];
        const filteredBestFitnesses: number[] = [];
        const filteredActiveNodesCounts: number[] = [];

        const seenFitness = new Set<number>();
        const maxFitness = Math.max(...curve.bestFitnesses);
        const seenActiveNodesCount = new Set<number>();
        const maxGeneration = Math.max(...curve.generations);

        for (let i = 0; i < curve.generations.length; i++) {
            const fitness = curve.bestFitnesses[i];
            const activeNodes = curve.activeNodesCounts[i];
            const generation = curve.generations[i];

            if (fitness !== maxFitness && !seenFitness.has(fitness)) {
                seenFitness.add(fitness);
                filteredGenerations.push(generation);
                filteredBestFitnesses.push(fitness);
                filteredActiveNodesCounts.push(activeNodes);
            } else if (fitness === maxFitness && !seenActiveNodesCount.has(activeNodes)) {
                seenActiveNodesCount.add(activeNodes);
                filteredGenerations.push(generation);
                filteredBestFitnesses.push(fitness);
                filteredActiveNodesCounts.push(activeNodes);
            } else if (generation === maxGeneration) {
                filteredGenerations.push(generation);
                filteredBestFitnesses.push(fitness);
                filteredActiveNodesCounts.push(activeNodes);
            }
        }

        return {
            generations: filteredGenerations,
            bestFitnesses: filteredBestFitnesses,
            activeNodesCounts: filteredActiveNodesCounts,
        };
    };

    const parse = (input : string) => {
        const fileRows = input.split(/\r?\n/);
        
        let inputs: string[] = [];
        let outputs: string[] = [];
        let runsCurves: Curve[] = [];
        let runsGenomes: Genome[] = [];
        let runsNodes: Node[][] = [];

        fileRows.forEach((row, index) => {
            if (row.startsWith("#")) {
                if (row.startsWith("#%")) {
                    const prefix = row.slice(0, 3);
                    const data = row.slice(3)?.replace(/ /g, '').split(',');

                    switch (prefix) {
                        case "#%i":
                            inputs = data;
                            break;

                        case "#%o":
                            outputs = data;
                            break;
                    }
                } else {
                    // TODO: ZPRACOVAT UVODNI KOMENTAR ?
                    console.log(row)
                }
            } else if (index % 2 === 0) {
                let genome: Genome = {inputs: 0, outputs: 0, columns: 0, rows: 0, nodeInputs: 0, lBack: 0};
                let genomeInfo = row.match(/{\s*(\d+\s*,\s*){6}\d+\s*}/g)?.[0]

                if (genomeInfo) {
                    genomeInfo = genomeInfo.replace(/[{ }]/g, '');
    
                    const genomeInfoArray = genomeInfo.split(',');
                    genome = {inputs: Number(genomeInfoArray?.[0]), outputs: Number(genomeInfoArray?.[1]), columns: Number(genomeInfoArray?.[2]),
                              rows: Number(genomeInfoArray?.[3]), nodeInputs: Number(genomeInfoArray?.[4]), lBack: Number(genomeInfoArray?.[5])};
                }

                let nodes: Node[] = [];
                let nodesInfo = row.match(/\(\[\d+\](\d+,){2}\d+\)/g)?.map(node => node.replace(/[\[\(\) ]/g, ''))?.map(node => node.replace(/\]/g, ','));
                
                if (nodesInfo) {
                    for (const nodeInfo of nodesInfo) {
                        const nodeInfoArray = nodeInfo.split(',');
                        nodes.push({index: Number(nodeInfoArray?.[0]), firstConnection: Number(nodeInfoArray?.[1]), 
                                    secondConnection: Number(nodeInfoArray?.[2]), function: Number(nodeInfoArray?.[3])});
                    }
                }

                let outputInfo = row.match(/\(\d+(,\d+)*\)/g)?.map(node => node.replace(/[\(\) ]/g, ''));

                if (outputInfo) {
                    const outputInfoArray = outputInfo[0].split(',');
                    for (const outputConnection of outputInfoArray) {
                        nodes.push({index: nodes[nodes.length - 1].index + 1, firstConnection: Number(outputConnection),
                                    secondConnection: Number(outputConnection), function: -1});
                    }
                }

                runsGenomes.push(genome)
                runsNodes.push(nodes)

            } else {
                let curve: Curve = {generations: [], bestFitnesses: [], activeNodesCounts: []};
                let curvesInfo = row.match(/\(\d+(,\d+)*\)/g)?.map(data => data.replace(/[\(\) ]/g, ''));

                if (curvesInfo) {
                    for (const curveInfo of curvesInfo) {
                        const iterationData = curveInfo.split(',');
                        curve.generations.push(parseInt(iterationData?.[0]));
                        curve.bestFitnesses.push(parseInt(iterationData?.[1]));
                        curve.activeNodesCounts.push(parseInt(iterationData?.[2]));
                    }
                }

                runsCurves.push(curve)
            }
        });

        runsCurves = runsCurves.map(curve => filterData(curve));

        let runs: Run[] = [];
        for (let index = 0; index < runsGenomes.length; index++) {
            runs.push({id: index, curve: runsCurves?.[index], genome: runsGenomes?.[index], chromosome: runsNodes?.[index]})
        }

        onDataParsed(inputs, outputs, runs);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <button
                onClick={handleClick}
                style={{
                    padding: "12px 24px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: "blue",
                    border: "none",
                    borderRadius: "10px",
                    height: "55px",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                }}
                onMouseOver={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#5175fc";
                }}
                onMouseOut={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#0000ff";
                }}
            > Load visualization </button>
            <input type="file" accept=".cgp" onChange={readAndParse} ref={fileInputRef} style={{ display: "none" }} />
        </>
    );
};

export default FileReaderComponent;