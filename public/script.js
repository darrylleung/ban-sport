(function () {
    const canvas = $("#canvas");
    const ctx = canvas[0].getContext("2d");
    const submit = $("#submit");
    const clear = $("#clear");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#ffffff";

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    let setPosition = (e) => {
        lastX = e.offsetX;
        lastY = e.offsetY;
    };

    let draw = (e) => {
        if (!isDrawing) return;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        setPosition(e);
    };

    canvas.on("mousedown", (e) => {
        isDrawing = true;
        setPosition(e);
    });
    canvas.on("mousemove", draw);
    canvas.on("mouseup", () => {
        isDrawing = false;
    });
    canvas.on("mouseout", () => {
        isDrawing = false;
    });

    submit.on("click", () => {
        let dataURL = canvas[0].toDataURL();
        $("#sig").val(dataURL);
    });

    let clearCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    clear.on("click", () => {
        clearCanvas();
        console.log("clear: ");
    });
})();
