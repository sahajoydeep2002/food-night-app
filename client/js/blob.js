let canvas, gl, programInfo, bufferInfo;
let dpr;

const uniforms = {
	resolution: [0, 0],
	mouse: [0, 0],
	time: 0,
	noise_speed: 0.15,
	metaball: 1,
	discard_threshold: 0.5,
	antialias_threshold: 0.001,
	noise_height: 0.2,
	noise_scale: 2,
	x_value: 1.,
};

// makes sure the canvas is fit to the window
function onResize() {
	let w = window.innerWidth;
	let h = window.innerHeight;
	dpr = window.devicePixelRatio || 1;

	canvas.width = w * dpr;
	canvas.height = h * dpr;

	canvas.style.width = '100%';
	canvas.style.height = '100%';

	uniforms.resolution = [w * dpr, h * dpr];

	gl.viewport(0, 0, gl.canvas.width * dpr, gl.canvas.height * dpr);
}

function setup3d() {
	const div = document.querySelector('body');
	canvas = document.createElement('canvas');
	div.appendChild(canvas);
	gl = canvas.getContext('webgl', {
		antialias: false,
		alpha: true,
		premultipliedAlpha: false,
	});

	programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
	bufferInfo = twgl.createBufferInfoFromArrays(gl, {
		position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
	});

	// update the renderer dimensions on window resize
	window.addEventListener('resize', onResize, false);
	onResize();

	// track mouse position
	document.body.addEventListener('mousemove', (evt) => {
		const rect = div.getBoundingClientRect();
		uniforms.mouse = [(evt.clientX - rect.left) * dpr, (evt.clientY - rect.top) * dpr];
	}, { passive: true });

	requestAnimationFrame(update);
}

function update(time) {
	uniforms.time = time / 1000;

	// uniforms.x_value = Math.max(1, 4 - time / 1000);

	gl.useProgram(programInfo.program);
	twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
	twgl.setUniforms(programInfo, uniforms);
	twgl.drawBufferInfo(gl, bufferInfo);

	requestAnimationFrame(update);
}

setup3d();
