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

const gc = new DrawableCanvas(document.getElementById('g'));

let arr = [...document.querySelectorAll(".data")].map(item => new DrawableCanvas(item));

const myNet = new neuralNetwork();

train.addEventListener('click', () => {
    const data = [];
    arr.forEach(item => data.push({ input: item.getVector(), output: [item.type] }));
    console.log('data', data);
    myNet.train(data);
});

guess.addEventListener('click', () => {
    const result = myNet.run(gc.getVector());
    answer.innerHTML = `${result} Type ${Math.round(result)}`;
    gc.reset();
});
