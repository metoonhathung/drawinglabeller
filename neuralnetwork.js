function NeuralNetwork(h, lr, d, i) {
    let x = [];
    let y = [];
    let hiddenSizes = h;
    let learningRate = lr;
    let dropoutPercent = d;
    let iterations = i;
    let mse = 0;
    let layerSizes = [];
    let weights = [];
    let biases = [];
    let layers = [];
    let deltas = [];

    function collect(data) {
        x = [];
        y = [];
        data.forEach(item => {
            x.push(item.input);
            y.push(item.output);
        });
        layerSizes = [x[0].length, ...hiddenSizes, y[0].length];
        weights.length = biases.length = layers.length = deltas.length = layerSizes.length;
    };

    this.train = (data) => {
        collect(data);
        
        // initialize weights
        for (let i = 0; i < weights.length - 1; i++) {
            weights[i] = create(layerSizes[i], layerSizes[i+1]);
        }

        // initialize biases
        for (let i = 1; i < biases.length; i++) {
            biases[i] = create(1, layerSizes[i])[0];
        }

        for (let j = 0; j < iterations; j++) {

            // feedforward
            layers[0] = x;
            for (let i = 1; i < layers.length; i++) {
                let output = operation(mul(layers[i-1], weights[i-1]), "+", broadcast(biases[i], x.length));
                let dropout = dropoutVector(layerSizes[i], dropoutPercent);
                layers[i] = i === layers.length - 1 ? softmax(output) : operation(sigmoid(output), "*", broadcast(dropout, x.length));
            }
            
            // backprop
            for (let i = deltas.length - 1; i >= 1; i--) {
                // miss from target
                let error = i === layers.length - 1 ? operation(layers[i], "-", y) : mul(deltas[i+1], transpose(weights[i]));
                // direction to target
                deltas[i] = operation(error, "*", sigmoidDerivative(layers[i]))
                // mean squared error
                if (i === layers.length - 1) calculateMSE(error);
            }

            // update weights
            for (let i = weights.length - 2; i >= 0; i--) {
                weights[i] = operation(weights[i], "-", operation(create(layerSizes[i], layerSizes[i+1], learningRate), "*", mul(transpose(layers[i]), deltas[i+1])));
            }

            // update biases
            for (let i = biases.length - 1; i >= 1; i--) {
                for (let dRow of deltas[i]) {
                    biases[i] = operation([biases[i]], "-", [dRow])[0];
                }
            }

            if (j % Math.floor(iterations / 10) === 0) {
                console.log("ERROR", j, mse);
            }
            
        }
        return { layerSizes, learningRate, dropoutPercent, iterations, mse };
    };

    this.run = (input) => {
        let layer = [input];
        for (let i = 1; i < layerSizes.length; i++) {
            let output = operation(mul(layer, weights[i-1]), "+", broadcast(biases[i], 1));
            layer = i === layerSizes.length - 1 ? softmax(output) : sigmoid(output);
        }
        return layer[0];
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
        return index;
    };

    function calculateMSE(error) {
        mse = 0;
        for (let row = 0; row < error.length; row++) {
            for (let col = 0; col < error[row].length; col++) {
                mse += Math.pow(error[row][col], 2);
            }
        }
        mse /= error.length * error[0].length;
    }

    // *********************************** UTILS ***********************************

    // sigmoid nonlinearity
    function sigmoid(mat) {
        return mat.map(row => {
            return row.map(col => 1 / (1 + Math.exp(-col)));
        });
    }

    // sigmoid to derivative
    function sigmoidDerivative(mat) {
        return mat.map(row => {
            return row.map(col => col * (1 - col));
        });
    }

    // softmax
    function softmax(mat) {
        return mat.map(row => {
            let denominator = row.map(col => Math.exp(col)).reduce((sum, curr) => { return sum + curr; });
            return row.map(col => Math.exp(col) / denominator);
        });
    }

    // dropout
    function dropoutVector(length, p) {
        let arr = [];
        for (let i = 0; i < length; i++) {
            let rand = Math.random();
            if (rand <= p) arr.push(0);
            else arr.push(1);
        }
        return arr.map(elm => elm / (1 - p));
    }

    function mul(mat1, mat2) {
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

    function create(row, col, val) {
        let mat = [];
        for (let i = 0; i < row; i++) {
            let arr = [];
            for (let j = 0; j < col; j++) {
                let value = val ? val : Math.random() * 2 - 1;
                arr.push(value);
            }
            mat.push(arr);
        }
        return mat;
    }

    function broadcast(arr, times, isRow = true) {
        let mat = [];
        for (let i = 0; i < times; i++) {
            mat.push(arr);
        }
        return isRow ? mat : transpose(mat);
    }
}
