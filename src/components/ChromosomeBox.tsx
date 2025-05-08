import React, { useState, useEffect } from "react";
import * as d3 from "d3";

enum Coord{
	X = 0,
	Y = 1,
}

enum Gate {
	BUFFER = 0,
	AND = 1,
	OR = 2,
	XOR = 3,
	NOT_I1 = 4,
	NOT_I2 = 5,
	AND_I1_NOT_I2 = 6,
	NAND = 7,
	NOR = 8
}

const OUTPUT = -1;

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

interface ChromosomeBoxProps {
    inputs: string[];
    outputs: string[];
	run: Run;
	hideInactive: boolean;
	selectedRunId: number;
}

interface Coordinates {
	x_coord: number;
	y_coord: number;
}

const ChromosomeBox: React.FC<ChromosomeBoxProps> = ({inputs, outputs, run, hideInactive}) => {
	const svgRef = React.useRef<SVGSVGElement>(null);
	const connectionGroupRef = React.useRef<SVGGElement | null>(null);
	const zoomGroupRef = React.useRef<SVGGElement | null>(null);
	const [inactiveNodes, setInactiveNodes] = useState<number[]>([]);
	const [activeNodes, setActiveNodes] = useState<number[]>([]);
	
	const width = 900;
	const height = 600;

	const drawIO = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node_name: string,
		node_index: number
	) => {
		svg.append("circle")
			.attr("class", `node-${node_index}`)
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", 16)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)

		svg.append("text")
			.attr("class", `node-${node_index}`)
			.attr("x", x)
			.attr("y", y + 2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node_index)

		if (node_name) {
			const tempText = svg.append("text")
								.attr("x", 0)
								.attr("y", 0)
								.attr("font-size", 12)
								.text(node_name);

			const textWidth = tempText.node()?.getBBox().width ?? 0;
			tempText.remove();

			const rectWidth = textWidth + 10;
			const rectStart = x - rectWidth / 2;
		
			svg.append("rect")
				.attr("class", `node-${node_index}`)
				.attr("x", rectStart)
				.attr("y", y - 40)
				.attr("width", rectWidth)
				.attr("height", 20)
				.attr("rx", 5)
				.attr("ry", 5)
				.attr("fill", "lightblue")
				.attr("stroke", "black")
				.attr("stroke-width", 2)

			svg.append("text")
				.attr("class", `node-${node_index}`)
				.attr("x", x)
				.attr("y", y - 29)
				.attr("text-anchor", "middle")
				.attr("dominant-baseline", "middle")
				.attr("font-size", 12)
				.attr("fill", "black")
				.attr("font-weight", "bold")
				.text(node_name)
		}

		return [
			{ x_coord: x, y_coord: y }
		];
	}

	const drawOutput = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node_name: string,
		node_index: number,
		connection: number,
	) => {

		svg.append("line")
			.attr("class", `node-${node_index}`)
			.attr("x1", x - 26)
			.attr("y1", y)
			.attr("x2", x - 16)
			.attr("y2", y)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node_index}`)
			.attr("cx", x - 34)
			.attr("cy", y)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node_index}`)
			.attr("x", x - 34)
			.attr("y", y + 1)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(connection)
			.style("visibility", "hidden")

		let output_coord: Coordinates;
		[output_coord] = drawIO(svg, x, y, node_name, node_index);

		return [
			{ x_coord: output_coord.x_coord - 34, y_coord: output_coord.y_coord }
		];
	}

	const drawBuffer = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number, 
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		const lPoint = [x - 17, y];
		const rPoint = [x + 27, y];

		const points = `${lPoint[Coord.X]},${lPoint[Coord.Y] - 25} ${lPoint[Coord.X]},${lPoint[Coord.Y] + 25} ${rPoint[Coord.X]},${rPoint[Coord.Y]}`

		svg.append("polygon")
			.attr("class", `node-${node.index}`)
			.attr("points", points)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", lPoint[Coord.X] - 20)
			.attr("y1", y)
			.attr("x2", lPoint[Coord.X])
			.attr("y2", y)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", lPoint[Coord.X] - 25)
			.attr("cy", y)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", lPoint[Coord.X] - 25)
			.attr("y", y + 1)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(`${node.function == Gate.NOT_I2 ? node.secondConnection : node.firstConnection}`)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", `${(node.function == Gate.NOT_I1 || node.function == Gate.NOT_I2) ? rPoint[Coord.X] + 11 : rPoint[Coord.X]}`)
			.attr("y1", rPoint[Coord.Y])
			.attr("x2", `${(node.function == Gate.NOT_I1 || node.function == Gate.NOT_I2) ? rPoint[Coord.X] + 24 : rPoint[Coord.X] + 15}`)
			.attr("y2", rPoint[Coord.Y])
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", x)
			.attr("y", y + 2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.index)
			.style("visibility", "hidden")


		return [
			{ x_coord: lPoint[Coord.X] - 25, y_coord: y},
			{ x_coord: (node.function == Gate.NOT_I1 || node.function == Gate.NOT_I2) ? rPoint[Coord.X] + 24 : rPoint[Coord.X] + 15, y_coord: rPoint[Coord.Y] }
		]
	}

	const drawNot = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", x + 33)
			.attr("cy", y)
			.attr("r", 5)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		return drawBuffer(svg, x, y, node);
	}

	const drawAnd = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		const ltPoint = [x - 32, y - 25];
		const rtPoint = [ltPoint[Coord.X] + 40, ltPoint[Coord.Y]];
		const rbPoint = [rtPoint[Coord.X], rtPoint[Coord.Y] + 50];
		const lbPoint = [rbPoint[Coord.X] - 40, rbPoint[Coord.Y]];

		const pathData = `M ${ltPoint[Coord.X]} ${ltPoint[Coord.Y]}
						  L ${rtPoint[Coord.X]} ${rtPoint[Coord.Y]}
						  A 20 20 0 0 1 ${rbPoint[Coord.X]} ${rbPoint[Coord.Y]}
						  L ${lbPoint[Coord.X]} ${lbPoint[Coord.Y]} 
						  Z`;
		
		svg.append("path")
			.attr("class", `node-${node.index}`)
			.attr("d", pathData)
			.attr("stroke", "black")
			.attr("fill", "white")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", ltPoint[Coord.X] - 20)
			.attr("y1", y - 12)
			.attr("x2", ltPoint[Coord.X])
			.attr("y2", y - 12)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", ltPoint[Coord.X] - 25)
			.attr("cy", y - 12)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", ltPoint[Coord.X] - 25)
			.attr("y", y - 11)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.firstConnection)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", lbPoint[Coord.X] - 20)
			.attr("y1", y + 12)
			.attr("x2", lbPoint[Coord.X])
			.attr("y2", y + 12)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", lbPoint[Coord.X] - 25)
			.attr("cy", y + 12)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", lbPoint[Coord.X] - 25)
			.attr("y", y + 13)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.secondConnection)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", `${node.function == Gate.NAND ? rtPoint[Coord.X] + 35 : rtPoint[Coord.X] + 25}`)
			.attr("y1", y)
			.attr("x2", `${node.function == Gate.NAND ? rtPoint[Coord.X] + 50 : rtPoint[Coord.X] + 40}`)
			.attr("y2", y)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", x)
			.attr("y", y + 2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.index)
			.style("visibility", "hidden")

		return [
			{ x_coord: ltPoint[Coord.X] - 25, y_coord: y - 12 },
			{ x_coord: lbPoint[Coord.X] - 25, y_coord: y + 12 },
			{ x_coord: node.function == Gate.NAND ? rtPoint[Coord.X] + 50 : rtPoint[Coord.X] + 40, y_coord: y }
		];
	}

	const drawAndI1notI2 = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {

		const lPoint = [x - 35, y + 9];
		const rPoint = [x - 20, y + 9];

		const points = `${lPoint[Coord.X]},${lPoint[Coord.Y] - 9} ${lPoint[Coord.X]},${lPoint[Coord.Y] + 9} ${rPoint[Coord.X]},${rPoint[Coord.Y]}`

		svg.append("polygon")
			.attr("class", `node-${node.index}`)
			.attr("points", points)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", lPoint[Coord.X] - 10)
			.attr("y1", y + 9)
			.attr("x2", lPoint[Coord.X])
			.attr("y2", y + 9)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", lPoint[Coord.X] - 18)
			.attr("cy", y + 9)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", lPoint[Coord.X] - 18)
			.attr("y", y + 10)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(`${node.secondConnection}`)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", rPoint[Coord.X] + 7)
			.attr("y1", rPoint[Coord.Y])
			.attr("x2", rPoint[Coord.X] + 15)
			.attr("y2", rPoint[Coord.Y])
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", x - 16)
			.attr("cy", rPoint[Coord.Y])
			.attr("r", 3)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		const ltPoint = [x - 8, y - 20];
		const rtPoint = [ltPoint[Coord.X] + 32, ltPoint[Coord.Y]];
		const rbPoint = [rtPoint[Coord.X], rtPoint[Coord.Y] + 40];
		const lbPoint = [rbPoint[Coord.X] - 32, rbPoint[Coord.Y]];

		const pathData = `M ${ltPoint[Coord.X]} ${ltPoint[Coord.Y]}
						  L ${rtPoint[Coord.X]} ${rtPoint[Coord.Y]}
						  A 10 10 0 0 1 ${rbPoint[Coord.X]} ${rbPoint[Coord.Y]}
						  L ${lbPoint[Coord.X]} ${lbPoint[Coord.Y]} 
						  Z`;
		
		svg.append("path")
			.attr("class", `node-${node.index}`)
			.attr("d", pathData)
			.attr("stroke", "black")
			.attr("fill", "white")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", ltPoint[Coord.X] - 37)
			.attr("y1", y - 10)
			.attr("x2", ltPoint[Coord.X])
			.attr("y2", y - 10)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", ltPoint[Coord.X] - 45)
			.attr("cy", y - 10)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", ltPoint[Coord.X] - 45)
			.attr("y", y - 9)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.firstConnection)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", rtPoint[Coord.X] + 19)
			.attr("y1", y)
			.attr("x2", rtPoint[Coord.X] + 32)
			.attr("y2", y)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", x + 17)
			.attr("y", y + 2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.index)
			.style("visibility", "hidden")

		return [
			{ x_coord: ltPoint[Coord.X] - 45, y_coord: y - 10 },
			{ x_coord: lPoint[Coord.X] - 18, y_coord: y + 9 },
			{ x_coord: rtPoint[Coord.X] + 32, y_coord: y }
		];
	}

	const drawNand = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", x + 38)
			.attr("cy", y)
			.attr("r", 5)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		return drawAnd(svg, x, y, node);
	}

	const drawOr = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		const ltPoint = [x - 32, y - 25];
		const rtPoint = [ltPoint[Coord.X] + 25, ltPoint[Coord.Y]];
		const mrPoint = [rtPoint[Coord.X] + 40, rtPoint[Coord.Y] + 25];
		const rbPoint = [rtPoint[Coord.X], rtPoint[Coord.Y] + 50];
		const lbPoint = [ltPoint[Coord.X], ltPoint[Coord.Y] + 50];

		const pathData = `M ${ltPoint[Coord.X]} ${ltPoint[Coord.Y]} 
						  L ${rtPoint[Coord.X]} ${rtPoint[Coord.Y]} 
						  A 50 40 0 0 1 ${mrPoint[Coord.X]} ${mrPoint[Coord.Y]} 
						  A 50 40 0 0 1 ${rbPoint[Coord.X]} ${rbPoint[Coord.Y]}
						  L ${lbPoint[Coord.X]} ${lbPoint[Coord.Y]}
						  A 60 50 0 0 0 ${ltPoint[Coord.X]} ${ltPoint[Coord.Y]}
						  Z`;

		svg.append("path")
			.attr("class", `node-${node.index}`)
			.attr("d", pathData)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", ltPoint[Coord.X] - 14)
			.attr("y1", y - 12)
			.attr("x2", `${node.function == Gate.XOR ? ltPoint[Coord.X] : ltPoint[Coord.X] + 6}`)
			.attr("y2", y - 12)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", ltPoint[Coord.X] - 19)
			.attr("cy", y - 12)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", ltPoint[Coord.X] - 19)
			.attr("y", y - 11)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.firstConnection)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", lbPoint[Coord.X] - 14)
			.attr("y1", y + 12)
			.attr("x2", `${node.function == Gate.XOR ? lbPoint[Coord.X] : lbPoint[Coord.X] + 6}`)
			.attr("y2", y + 12)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", lbPoint[Coord.X] - 19)
			.attr("cy", y + 12)
			.attr("r", 8)
			.attr("fill", "lightblue")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", lbPoint[Coord.X] - 19)
			.attr("y", y + 13)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 9)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.secondConnection)
			.style("visibility", "hidden")

		svg.append("line")
			.attr("class", `node-${node.index}`)
			.attr("x1", `${node.function == Gate.NOR ? mrPoint[Coord.X] + 10 : mrPoint[Coord.X]}`)
			.attr("y1", y)
			.attr("x2", `${node.function == Gate.NOR ? mrPoint[Coord.X] + 25 : mrPoint[Coord.X] + 15}`)
			.attr("y2", y)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		svg.append("text")
			.attr("class", `node-${node.index}`)
			.attr("x", x)
			.attr("y", y + 2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.attr("fill", "black")
			.attr("font-weight", "bold")
			.text(node.index)
			.style("visibility", "hidden")

		return [
			{ x_coord: ltPoint[Coord.X] - 19, y_coord: y - 12 },
			{ x_coord: lbPoint[Coord.X] - 19, y_coord: y + 12 },
			{ x_coord: node.function == Gate.NOR ? mrPoint[Coord.X] + 25 : mrPoint[Coord.X] + 15, y_coord: y }
		];
	}

	const drawXor = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		const ltPoint = [x - 38, y - 25];
		const lbPoint = [x - 38, y + 25];

		const pathData = `M ${ltPoint[Coord.X]} ${ltPoint[Coord.Y]} A 60 50 0 0 1 ${lbPoint[Coord.X]} ${lbPoint[Coord.Y]}`;

		svg.append("path")
			.attr("class", `node-${node.index}`)
			.attr("d", pathData)
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.attr("fill", "none")
			.style("visibility", "hidden")

		return drawOr(svg, x, y, node);
	}

	const drawNor = (
		svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		node: {index: number, firstConnection: number, secondConnection: number, function: number}
	) => {
		svg.append("circle")
			.attr("class", `node-${node.index}`)
			.attr("cx", x + 38)
			.attr("cy", y)
			.attr("r", 5)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.style("visibility", "hidden")

		return drawOr(svg, x, y, node);
	}

	const drawConnection = (connectionGroup: d3.Selection<SVGGElement, unknown, null, undefined>, connectionFrom: Coordinates, connectionTo: Coordinates, node_index: number) => {
		connectionGroup.append("line")
				.attr("class", `node-${node_index}`)
				.attr("x1", connectionFrom.x_coord)
				.attr("y1", connectionFrom.y_coord)
				.attr("x2", connectionTo.x_coord)
				.attr("y2", connectionTo.y_coord)
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.style("visibility", "hidden")
	}

	const makeConnections = (
		connectionGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
		node : { index: number; firstConnection: number; secondConnection: number; function: number },
		nodesCoordinates: Coordinates[][]
	) => {
		let nodeCoordinates = nodesCoordinates[node.index];

		let firstConnectionNode = nodesCoordinates[node.firstConnection];
		let secondConnectionNode = nodesCoordinates[node.secondConnection];

		let connectionsFrom: Coordinates[] = [];
		let connectionsTo: Coordinates[] = [];

		for (const connectionNode of [firstConnectionNode, secondConnectionNode]) {
			if (connectionNode.length == 1) {
				connectionsFrom.push( {x_coord: connectionNode[0].x_coord, y_coord: connectionNode[0].y_coord} );
			} else if (connectionNode.length == 2) {
				connectionsFrom.push( {x_coord: connectionNode[1].x_coord, y_coord: connectionNode[1].y_coord} );
			} else {
				connectionsFrom.push( {x_coord: connectionNode[2].x_coord, y_coord: connectionNode[2].y_coord} );
			}
		}

		connectionsTo.push( {x_coord: nodeCoordinates[0].x_coord, y_coord: nodeCoordinates[0].y_coord} )
		if (nodeCoordinates.length > 1) {
			connectionsTo.push( {x_coord: nodeCoordinates[1].x_coord, y_coord: nodeCoordinates[1].y_coord} )
		}

		switch (node.function) {
			case OUTPUT:
			case Gate.NOT_I1:
			case Gate.BUFFER:
				drawConnection(connectionGroup, connectionsFrom[0], connectionsTo[0], node.index);
				break;

			case Gate.NOT_I2:
				drawConnection(connectionGroup, connectionsFrom[1], connectionsTo[0], node.index);
				break;

			case Gate.AND:
			case Gate.OR:
			case Gate.XOR:	
			case Gate.NAND:
			case Gate.NOR:
			case Gate.AND_I1_NOT_I2:
				drawConnection(connectionGroup, connectionsFrom[0], connectionsTo[0], node.index);
				drawConnection(connectionGroup, connectionsFrom[1], connectionsTo[1], node.index);
				break;

		}
	}

    const findInactiveNodes = (genome : Genome, chromosome : Node[]) => {
		let visit: Node[] = []
        let visited: number[] = []
        let notVisited: number[] = []

        for (let index = genome.outputs; index > 0; index--) {
            visit.push(chromosome[chromosome.length - index])
        }

		while (visit.length) {
			let node = visit.shift();
			if (!node || visited.includes(node.index)) {
				continue;
			}
     
            if (node) {
                if (node.function == Gate.BUFFER || node.function == Gate.NOT_I1) {
                    visit.push(chromosome[node.firstConnection - 5])
                } else if (node.function == Gate.NOT_I2) {
                    visit.push(chromosome[node.secondConnection - 5])
                } else {
                    visit.push(chromosome[node.firstConnection - 5])

                    if (chromosome[node.firstConnection - 5] != chromosome[node.secondConnection - 5]) {
                        visit.push(chromosome[node.secondConnection - 5])
                    }
                }

                visited.push(node.index)
            }
		}

        chromosome.forEach(node => {
            if (!visited.includes(node.index)) {
                notVisited.push(node.index)
            }
        });

        setActiveNodes(visited)
		setInactiveNodes(notVisited)
	}

  	useEffect(() => {
		if (svgRef.current) {
            const svg = d3.select(svgRef.current);

            connectionGroupRef.current = svg.select<SVGGElement>("#connections-layer").node();
            if (!connectionGroupRef.current) {
                connectionGroupRef.current = svg.append("g").attr("id", "connections-layer").node() as SVGGElement;
            }

            zoomGroupRef.current = svg.select<SVGGElement>("#zoom-group").node();
            if (!zoomGroupRef.current) {
                zoomGroupRef.current = svg.append("g").attr("id", "zoom-group").node() as SVGGElement;
            }

            const zoomGroup = d3.select(zoomGroupRef.current);
            const connectionGroup = d3.select(connectionGroupRef.current);

            zoomGroup.selectAll("*").remove();
            connectionGroup.selectAll("*").remove();

			const genome = run.genome
			const chromosome = run.chromosome

			findInactiveNodes(genome, chromosome)

			const chromosomeWidth = 165 + genome.columns * 130;
			const initialWidth = (width - chromosomeWidth > 0) ? + 25 + (width - chromosomeWidth) / 2 : 25;

			const maxRowElem = (genome.rows >= genome.inputs) ? genome.rows :
							   (genome.inputs >= genome.outputs) ? genome.inputs : genome.outputs;

			const chromosomeHeight = 80 + (maxRowElem - 1) * 90;
			const initialHeight = (height - chromosomeHeight > 0) ? 40 + (height - chromosomeHeight) / 2 : 50;

			const initialInputOffset = [initialWidth, initialHeight];

			const initialGridOffset = [initialInputOffset[Coord.X] + 115, initialInputOffset[Coord.Y]];
			const offsetBetweenNodes = [130, 90];

			const initialOutputOffset = [
				initialGridOffset[Coord.X] + genome.columns * offsetBetweenNodes[Coord.X], 
				initialGridOffset[Coord.Y]
			];

			let nodesCoordinates: Coordinates[][] = [];

			for (let index = 0; index < genome.inputs; index++) {
				const y = initialInputOffset[Coord.Y] + index * offsetBetweenNodes[Coord.Y];
				nodesCoordinates.push(drawIO(zoomGroup, initialInputOffset[Coord.X], y, inputs[index], index));
			}

			for (let col = 0; col < genome.columns; col++) {
				for (let row = 0; row < genome.rows; row++) {
					const node = chromosome[col * genome.rows + row];
					if (node) {
						const x = initialGridOffset[Coord.X] + col * offsetBetweenNodes[Coord.X];
						const y = initialGridOffset[Coord.Y] + row * offsetBetweenNodes[Coord.Y];

						switch (node.function) {
							case Gate.BUFFER:
								nodesCoordinates.push(drawBuffer(zoomGroup, x, y, node));
								break;

							case Gate.AND:
								nodesCoordinates.push(drawAnd(zoomGroup, x, y, node));
								break;

							case Gate.OR:
								nodesCoordinates.push(drawOr(zoomGroup, x, y, node));
								break;

							case Gate.XOR:
								nodesCoordinates.push(drawXor(zoomGroup, x, y, node));
								break;

							case Gate.NOT_I1:
							case Gate.NOT_I2:
								nodesCoordinates.push(drawNot(zoomGroup, x, y, node));
								break;

							case Gate.AND_I1_NOT_I2:
								nodesCoordinates.push(drawAndI1notI2(zoomGroup, x, y, node));
								break;

							case Gate.NAND:
								nodesCoordinates.push(drawNand(zoomGroup, x, y, node));
								break;

							case Gate.NOR:
								nodesCoordinates.push(drawNor(zoomGroup, x, y, node));
								break;
						}
					}
				}
			}

			const startOutIndex = genome.inputs + genome.rows * genome.columns;
			for (let index = 0; index < genome.outputs; index++) {
				const y = initialOutputOffset[Coord.Y] + index * offsetBetweenNodes[Coord.Y];
				const outputIndex = startOutIndex + index;

				nodesCoordinates.push(drawOutput(zoomGroup, initialOutputOffset[Coord.X], y, outputs[index], outputIndex, chromosome[outputIndex - 5].firstConnection));
			}

			for (let node = 0; node < chromosome.length; node++) {
				makeConnections(connectionGroup, chromosome[node], nodesCoordinates);
			}

			const zoom = d3.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.8, 3])
				.on("zoom", (event) => {
					zoomGroup.attr("transform", event.transform.scale(1));
					connectionGroup.attr("transform", event.transform.scale(1));
				});

			svg.call(zoom);
			svg.attr("viewBox", "0 0 900 600");
		}
	}, [inputs, outputs, run]);

	useEffect(() => {
		if (zoomGroupRef.current && connectionGroupRef.current) {
			if (hideInactive) {
				activeNodes.forEach((value) => {
					d3.select(zoomGroupRef.current)
						.selectAll(`.node-${value}`)
						.style("visibility", "visible");
	
					d3.select(connectionGroupRef.current)
						.selectAll(`.node-${value}`)
						.style("visibility", "visible");
				});
			} else {
				d3.select(zoomGroupRef.current).selectAll("*").style("visibility", "visible");
				d3.select(connectionGroupRef.current).selectAll("*").style("visibility", "visible");
			}
		}
	}, [activeNodes]);
	
	useEffect(() => {
		if (zoomGroupRef.current && connectionGroupRef.current) {
			if (hideInactive) {
				inactiveNodes.forEach((value) => {
					d3.select(zoomGroupRef.current)
						.selectAll(`.node-${value}`)
						.style("visibility", "hidden");
	
					d3.select(connectionGroupRef.current)
						.selectAll(`.node-${value}`)
						.style("visibility", "hidden");
				});
			} else {
				d3.select(zoomGroupRef.current).selectAll("*").style("visibility", "visible");
				d3.select(connectionGroupRef.current).selectAll("*").style("visibility", "visible");
			}
		}
	}, [hideInactive]);

  return (
	<svg 
		ref={svgRef}
		id="chromosome-box" 
		width={width} 
		height={height} 
		style={{
			position: "relative", 
			top: "0px",        
			left: "0px",       
			zIndex: 10         
		}}
	></svg>
  );
};

export default ChromosomeBox;