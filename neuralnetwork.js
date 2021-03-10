function neuralNetwork() {
    let x = [];
    let y = [];
    let inputSize = 0;
    let outputSize = 0;
    let hiddenSize = 32;
    let alpha = 1;
    let iterations = 1001;
    let logPeriod = 100;
    let error = 0;
    let synapse_0, synapse_1, layer_0, layer_1, layer_1_error, layer_1_delta, layer_2, layer_2_error, layer_2_delta;

    function collect(data) {
        data.forEach(item => {
            x.push(item.input);
            y.push(item.output);
        });
        inputSize = x[0].length;
        outputSize = y[0].length;
    };

    this.train = (data) => {
        collect(data);

        // randomly initialize our weights with mean 0
        synapse_0 = random(create(inputSize, hiddenSize)); //inputSize x hiddenSize
        synapse_1 = random(create(hiddenSize, outputSize)); //hiddenSize x outputSize

        for (let j = 0; j < iterations; j++) {

            // Feed forward through layers 0, 1, and 2
            layer_0 = x; //sample x inputSize
            layer_1 = sigmoid(mult(layer_0, synapse_0)); //sample x hiddenSize
            layer_2 = sigmoid(mult(layer_1, synapse_1)); //sample x outputSize

            // how much did we miss the target value?
            layer_2_error = operation(layer_2, "-", y); //sample x outputSize

            if (j % logPeriod === 0) {
                error = 0;
                for (let row = 0; row < layer_2_error.length; row++) {
                    for (let col = 0; col < layer_2_error[row].length; col++) {
                        error += Math.abs(layer_2_error[row][col]);
                    }
                }
                error /= layer_2_error.length * layer_2_error[0].length;
                console.log("Error after " + j + " iterations: " + error);
            }

            // in what direction is the target value?
            // were we really sure? if so, don't change too much.
            layer_2_delta = operation(layer_2_error, "*", sigmoid_output_to_derivative(layer_2)); //sample x outputSize

            // how much did each l1 value contribute to the l2 error (according to the weights)?
            layer_1_error = mult(layer_2_delta, transpose(synapse_1)); //sample x hiddenSize

            // in what direction is the target l1?
            // were we really sure? if so, don't change too much.
            layer_1_delta = operation(layer_1_error, "*", sigmoid_output_to_derivative(layer_1)); //sample x hiddenSize

            //update weights
            synapse_1 = operation(synapse_1, "-", operation(create(hiddenSize, outputSize, alpha), "*", mult(transpose(layer_1), layer_2_delta)));
            synapse_0 = operation(synapse_0, "-", operation(create(inputSize, hiddenSize, alpha), "*", mult(transpose(layer_0), layer_1_delta)));
        }
        console.log("layer_2", layer_2);
    };

    this.run = (input) => {
        layer_0 = [input]; //sample x inputSize
        layer_1 = sigmoid(mult(layer_0, synapse_0)); //sample x hiddenSize
        layer_2 = sigmoid(mult(layer_1, synapse_1)); //sample x outputSize
        console.log('RESULT', layer_2);
        return layer_2;
    };

    // *********************************** UTILS ***********************************

    // compute sigmoid nonlinearity
    function sigmoid(mat) {
        return mat.map(row => {
            return row.map(col => 1 / (1 + Math.exp(-col)));
        });
    }

    // convert output of sigmoid function to its derivative
    function sigmoid_output_to_derivative(mat) {
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

    function dot(mat1, mat2) {
        return mat1.map((row, i) => {
            return mat1[i] * mat2[i];
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

    function random(mat) {
        for (let i = 0; i < mat.length; i++) {
            for (let j = 0; j < mat[i].length; j++) {
                mat[i][j] = Math.random() * 2 - 1;
            }
        }
        return mat;
    }
}
