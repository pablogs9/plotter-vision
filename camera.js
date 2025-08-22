/*
 * Perspective camera implementation.
 * Derived from https://github.com/osresearch/papercraft/blob/master/camera.c
 */

function m44_mult(a,b)
{
	let c = [
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0],
	];
	for(let i = 0 ; i < 4 ; i++)
		for(let j = 0 ; j < 4 ; j++)
			for(let k = 0 ; k < 4 ; k++)
				c[i][j] += a[i][k] * b[k][j];

	return c;
}


function Camera(eye,lookat,up,fov)
{
	this.eye = eye;
	this.lookat = lookat;
	this.up = up;
	this.fov = fov;
	this.generation = 0;
	this.width = width;
	this.height = height;

	// project a point from model space to camera space
	this.project = function(v_in,v_out=null)
	{
		let v = [v_in.x, v_in.y, v_in.z, 1];
		let p = [0,0,0,0];

		for(let i = 0 ; i < 4 ; i++)
			for(let j = 0 ; j < 4 ; j++)
				p[i] += this.matrix[i][j] * v[j];

		// Cull points behind the camera (perspective only). For orthographic we used -Z, so keep sign consistent.
		if (!(typeof projection_mode !== 'undefined' && projection_mode !== 'perspective')) {
			if (p[2] <= 0)
				return;
		}

		let w = p[3] === 0 ? 1 : p[3];
		let x = p[0] / w;
		let y = p[1] / w;
		let z = p[2] / w;
		if (!v_out)
			return createVector(x,y,z);

		// update in place to avoid an allocation
		v_out.x = x;
		v_out.y = y;
		v_out.z = z;
		return v_out;
	}

	// Update the camera projection matrix with eye/lookat/fov
	this.update_matrix = function()
	{
		// compute the three basis vectors for the camera

		// w is the Z axis from the eye to the destination point
		let w = p5.Vector.sub(this.eye, this.lookat).normalize();

		// u is the X axis to the right side of the camera
		let u = this.up.cross(w).normalize();

		// v is the Y axis aligned with the UP axis
		let v = w.cross(u).normalize();

		let cam = [
			[ u.x, u.y, u.z, -u.dot(this.eye) ],
			[ v.x, v.y, v.z, -v.dot(this.eye) ],
			[ w.x, w.y, w.z, -w.dot(this.eye) ],
			[ 0,   0,   0,   1 ],
		];

		// If global isometric_mode is true, use an orthographic/isometric style projection
		if (typeof projection_mode !== 'undefined' && projection_mode !== 'perspective') {
			// Orthographic base
			let scale = 800 / (typeof camera_radius !== 'undefined' ? camera_radius : 100);
			let ortho = [
				[ scale, 0,     0, 0 ],
				[ 0,     scale, 0, 0 ],
				[ 0,     0,    -1, 0 ],
				[ 0,     0,     0, 1 ],
			];
			this.matrix = m44_mult(ortho, cam);
		} else {
			let scale = 1000.0 / tan(this.fov * PI / 180 / 2);
			let near = 1;
			let far = 200;
			let f1 = - far / (far - near);
			let f2 = - far * near / (far - near);

			let perspective = [
				[ scale, 0, 0, 0 ],
				[ 0, scale, 0, 0 ],
				[ 0, 0, f2, -1 ],
				[ 0, 0, f1,  0 ],
			];

			this.matrix = m44_mult(perspective, cam);
		}
		this.u = u;
		this.v = v;
		this.w = w;

		if (typeof projection_mode !== 'undefined')
			console.log("Camera matrix: " + this.matrix + " (" + projection_mode + ")");
		this.generation++;
	}

	this.update_matrix();
}
