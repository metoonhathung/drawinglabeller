const restartButton = document.getElementById("restartButton");
const trainButton = document.getElementById("trainButton");
const guessButton = document.getElementById("guessButton");
const logText = document.getElementById("logText");
const answerText = document.getElementById("answerText");
const canvasTable = document.getElementById("canvasTable");
const testCanvas = document.getElementById("testCanvas");
const imagesInput = document.getElementById("imagesInput");
const typesInput = document.getElementById("typesInput");
const hiddenSizesInput = document.getElementById("hiddenSizesInput");
const learningRateInput = document.getElementById("learningRateInput");
const iterationsInput = document.getElementById("iterationsInput");
const dropoutPercentInput = document.getElementById("dropoutPercentInput");
let myNet, arr, test, images, types, hiddenSizes, learningRate, dropoutPercent, iterations;

function DrawableCanvas(el) {
    this.type = parseInt(el.dataset.type);

    const px = 10;
    const ctx = el.getContext('2d');
    let x = [];
    let y = [];
    let moves = [];
    let isPainting = false;

    const clear = () => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const addPoint = (_x, _y, isMoving) => {
        x.push(_x);
        y.push(_y);
        moves.push(isMoving);
    };

    const redraw = () => {
        clear();

        ctx.strokeStyle = 'red';
        ctx.lineJoin = 'round';
        ctx.lineWidth = px;

        for (let i = 0; i < moves.length; i++) {
            ctx.beginPath();
            if (moves[i] && i) {
                ctx.moveTo(x[i - 1], y[i - 1]);
            } else {
                ctx.moveTo(x[i] - 1, y[i]);
            }
            ctx.lineTo(x[i], y[i]);
            ctx.closePath();
            ctx.stroke();
        }
    };

    const drawLine = (x1, y1, x2, y2, color = 'lightgray') => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineJoin = 'miter';
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    const grid = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        const p = el.clientWidth / px;
        const xStep = w / p;
        const yStep = h / p;

        for (let x = 0; x < w; x += xStep) {
            drawLine(x, 0, x, h);
        }
        for (let y = 0; y < h; y += yStep) {
            drawLine(0, y, w, y);
        }
    };

    const cell = (x, y, w, h) => {
        ctx.fillStyle = 'blue';
        ctx.strokeStyle = 'blue';
        ctx.lineJoin = 'miter';
        ctx.lineWidth = 1;
        ctx.rect(x, y, w, h);
        ctx.fill();
    };


    this.reset = () => {
        isPainting = false;
        x = [];
        y = [];
        moves = [];
        clear();
    };

    this.getVector = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        const p = el.clientWidth / px;
        const xStep = w / p;
        const yStep = h / p;
        const vector = [];
        for (let x = 0; x < w; x += xStep) {
            for (let y = 0; y < h; y += yStep) {
                const data = ctx.getImageData(x, y, xStep, yStep);

                let nonEmptyPixelsCount = 0;
                for (let i = 0; i < data.data.length; i += 4) {
                    const isEmpty = data.data[i] === 0;

                    if (!isEmpty) {
                        nonEmptyPixelsCount += 1;
                    }
                }

                // if (nonEmptyPixelsCount > 0) {
                //     cell(x, y, xStep, yStep);
                // }

                vector.push(nonEmptyPixelsCount > 0 ? 1 : 0);
            }
        }
        // grid();
        return vector;
    };

    el.addEventListener('mousedown', event => {
        const bounds = event.target.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        isPainting = true;
        addPoint(x, y, false);
        redraw();
    });

    el.addEventListener('mousemove', event => {
        const bounds = event.target.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        if (isPainting) {
            addPoint(x, y, true);
            redraw();
        }
    });

    el.addEventListener('mouseup', () => {
        isPainting = false;
    });

    el.addEventListener('mouseleave', () => {
        isPainting = false;
    });
}

createAll();

trainButton.addEventListener('click', () => {
    const data = [];
    arr.forEach(item => {
        for (let i = 0; i < types; i++) {
            if (item.type === i) {
                // one-hot vector
                let outputArr = new Array(types).fill(0);
                outputArr[i] = 1;
                data.push({ input: item.getVector(), output: outputArr });
            }
        }
    });
    createNet();
    let stats = myNet.train(data);
    if (stats.mse < 0.25) {
        logText.innerHTML = "Training completed.";
        guessButton.classList.remove("disabled");
    } else {
        logText.innerHTML = "Training failed. Please click Train again and wait.";
    }
    logText.innerHTML += `<br>${JSON.stringify(stats)}`;
});

guessButton.addEventListener('click', () => {
    const result = myNet.run(test.getVector());
    const likely = myNet.likely(result);
    answerText.innerHTML = `<b style="color:red;">Type ${likely}</b><br>(${result})`;
    test.reset();
});

restartButton.addEventListener('click', createAll);
imagesInput.addEventListener('change', createAll);
typesInput.addEventListener('change', createAll);
hiddenSizesInput.addEventListener('change', createNet);
learningRateInput.addEventListener('change', createNet);
iterationsInput.addEventListener('change', createNet);
dropoutPercentInput.addEventListener('change', createNet);

function createAll() {
    images = parseInt(imagesInput.value);
    types = parseInt(typesInput.value);
    createCanvas();
    arr.forEach(item => item.reset());
    test = new DrawableCanvas(testCanvas);
    test.reset();
    createNet();
    guessButton.classList.add("disabled");
    logText.innerHTML = "Please click Train and wait.";
    answerText.innerHTML = "Draw an image to test.";
}

function createCanvas() {
    let string = "";
    for (let i = 0; i < types; i++) {
        string += `
        <tr>
            <th>
                <p class="lead">Type ${i}</p>
            </th>
        `;
        for (let j = 0; j < images; j++) {
            string += `
            <td>
                <canvas class="data" data-type="${i}" width="200" height="200"></canvas>
            </td>
            `;
        }
        string += `</tr>`;
    }
    canvasTable.innerHTML = string;
    arr = [...document.querySelectorAll(".data")].map(item => new DrawableCanvas(item));
}

function createNet() {
    hiddenSizes = hiddenSizesInput.value.split('/').map(Number);;
    learningRate = parseFloat(learningRateInput.value);
    dropoutPercent = parseFloat(dropoutPercentInput.value);
    iterations = parseInt(iterationsInput.value);
    myNet = new NeuralNetwork(hiddenSizes, learningRate, dropoutPercent, iterations);
}