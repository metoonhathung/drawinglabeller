function NeuralNetwork(h, a, i) {
    let x = [];
    let y = [];
    let inputSize = 0;
    let outputSize = 0;
    let hiddenSize = h;
    let alpha = a;
    let iterations = i;
    let error = 0;
    let synapse0, synapse1, layer0, layer1, layer1Error, layer1Delta, layer2, layer2Error, layer2Delta;

    function collect(data) {
        x = [];
        y = [];
        data.forEach(item => {
            x.push(item.input);
            y.push(item.output);
        });
        inputSize = x[0].length;
        outputSize = y[0].length;
    };

    this.train = (data) => {
        console.log("h", hiddenSize, "a", alpha, "i", iterations);
        console.log('DATA', data);
        collect(data);

        if (!synapse0 && !synapse1) {
            // randomly initialize weights with mean 0
            synapse0 = random(inputSize, hiddenSize); //inputSize x hiddenSize
            synapse1 = random(hiddenSize, outputSize); //hiddenSize x outputSize
        }

        for (let j = 0; j < iterations; j++) {

            // feed forward through layers 0, 1, and 2
            layer0 = x; //sample x inputSize
            layer1 = sigmoid(mult(layer0, synapse0)); //sample x hiddenSize
            layer2 = sigmoid(mult(layer1, synapse1)); //sample x outputSize

            // miss from target
            layer2Error = operation(layer2, "-", y); //sample x outputSize

            calculateError();
            if (j % Math.floor(iterations / 10) === 0) {
                console.log("ERROR", j, error);
            }


            // direction to target
            layer2Delta = operation(layer2Error, "*", sigmoidOutputToDerivative(layer2)); //sample x outputSize

            // backpropagating
            layer1Error = mult(layer2Delta, transpose(synapse1)); //sample x hiddenSize

            // direction to target l1
            layer1Delta = operation(layer1Error, "*", sigmoidOutputToDerivative(layer1)); //sample x hiddenSize

            //update weights
            synapse1 = operation(synapse1, "-", operation(create(hiddenSize, outputSize, alpha), "*", mult(transpose(layer1), layer2Delta)));
            synapse0 = operation(synapse0, "-", operation(create(inputSize, hiddenSize, alpha), "*", mult(transpose(layer0), layer1Delta)));

        }
        console.log("LAYER2", layer2);
        return { inputSize, outputSize, hiddenSize, alpha, iterations, error };
    };

    this.run = (input) => {
        let newLayer0 = [input]; //sample x inputSize
        let newLayer1 = sigmoid(mult(newLayer0, synapse0)); //sample x hiddenSize
        let newLayer2 = sigmoid(mult(newLayer1, synapse1)); //sample x outputSize
        console.log('RESULT', newLayer2[0]);
        return newLayer2[0];
    };

    this.likely = (result) => {
        let max = -1;
        let index = -1;
        for (let i = 0; i < result.length; i++) {
            if (result[i] > max) {
                max = result[i];
                index = i;
            }
        }
        console.log("LIKELY", index);
        return index;
    };

    function calculateError() {
        error = 0;
        for (let row = 0; row < layer2Error.length; row++) {
            for (let col = 0; col < layer2Error[row].length; col++) {
                error += Math.abs(layer2Error[row][col]);
            }
        }
        error /= layer2Error.length * layer2Error[0].length;
    }

    // *********************************** UTILS ***********************************

    // sigmoid nonlinearity
    function sigmoid(mat) {
        return mat.map(row => {
            return row.map(col => 1 / (1 + Math.exp(-col)));
        });
    }

    // sigmoid to derivative
    function sigmoidOutputToDerivative(mat) {
        return mat.map(row => {
            return row.map(col => col * (1 - col));
        });
    }

    function mult(mat1, mat2) {
        return mat1.map((row, i) => {
            return transpose(mat2).map((rowT, j) => {
                return dot(row, rowT);
            });
        });
    };

    function dot(arr1, arr2) {
        return arr1.map((elm, i) => {
            return arr1[i] * arr2[i];
        }).reduce((sum, curr) => { return sum + curr; });
    };

    function transpose(mat) {
        return mat[0].map((col, i) => {
            return mat.map((row, j) => {
                return row[i];
            });
        });
    };

    function operation(mat1, operator, mat2) {
        return mat1.map((row, i) => {
            return row.map((col, j) => {
                switch (operator) {
                    case "+":
                        return mat1[i][j] + mat2[i][j];
                        break;
                    case "-":
                        return mat1[i][j] - mat2[i][j];
                        break;
                    case "*":
                        return mat1[i][j] * mat2[i][j];
                        break;
                    case "/":
                        return mat1[i][j] / mat2[i][j];
                        break;
                    default:
                        break;
                }
            });
        });
    }

    function create(row, col, val = 0) {
        return Array(row).fill(Array(col).fill(val));
    }

    function random(row, col) {
        let mat = [];
        for (let i = 0; i < row; i++) {
            let arr = [];
            for (let j = 0; j < col; j++) {
                arr.push(Math.random() * 2 - 1);
            }
            mat.push(arr);
        }
        return mat;
    }
}
