const restartButton = document.getElementById("restartButton");
const trainButton = document.getElementById("trainButton");
const guessButton = document.getElementById("guessButton");
const logText = document.getElementById("logText");
const answerText = document.getElementById("answerText");
const canvasTable = document.getElementById("canvasTable");
const testCanvas = document.getElementById("testCanvas");
const imagesInput = document.getElementById("imagesInput");
const typesInput = document.getElementById("typesInput");
let myNet, arr, test;

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

                if (nonEmptyPixelsCount > 1) {
                    cell(x, y, xStep, yStep);
                }

                vector.push(nonEmptyPixelsCount > 1 ? 1 : 0);
            }
        }
        grid();
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
        for (let i = 0; i < parseInt(typesInput.value); i++) {
            if (item.type === i) {
                let outputArr = new Array(parseInt(typesInput.value)).fill(0);
                outputArr[i] = 1;
                data.push({ input: item.getVector(), output: outputArr });
            }
        }
    });
    let stats = myNet.train(data);
    if (stats.error < 0.1) {
        logText.innerHTML = `Training completed.<br>${JSON.stringify(stats)}`;
        guessButton.classList.remove("disabled");
    } else {
        logText.innerHTML = "Training failed.<br>Please click Restart and try again.";
    }
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

function createAll() {
    createCanvas();
    arr.forEach(item => item.reset());
    test = new DrawableCanvas(testCanvas);
    test.reset();
    myNet = new NeuralNetwork();
    guessButton.classList.add("disabled");
    logText.innerHTML = "Please click Train and wait for a few seconds.";
    answerText.innerHTML = "Draw your test data.";
}

function createCanvas() {
    let string = "";
    for (let i = 0; i < parseInt(typesInput.value); i++) {
        string += `
        <tr>
            <th>
                <p class="lead">Type ${i}</p>
            </th>
        `;
        for (let j = 0; j < parseInt(imagesInput.value); j++) {
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