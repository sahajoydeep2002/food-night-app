'use strict';

const noiseGLSL = `
// Description : Array and textureless GLSL 2D/3D/4D simplex noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }
`;

const hsb2rgbGLSL = `
//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(in vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0, 1.0);
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}
`;

const vertexShader = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

const fragmentShader = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float noise_speed;
uniform float metaball;
uniform float discard_threshold;
uniform float antialias_threshold;
uniform float noise_height;
uniform float noise_scale;
uniform float x_value;

${noiseGLSL}
${hsb2rgbGLSL}

void main() {
  float ar = resolution.x / resolution.y;
  vec2 pos = gl_FragCoord.xy / resolution;
  pos.y /= ar;

  vec2 mouse = mouse / resolution;
  mouse.y = (1. - mouse.y) / ar;

  float noise = snoise(vec3(pos * noise_scale, time * noise_speed)); // (-1, 1)
  noise = (noise + 1.) / 2.; // (-1, 1) to (0, 1)
  float val = noise * noise_height; // (0, noise_height)

  val += 1.5;
  val -= pos.x * 0.5;

	// float d = distance(mouse, pos); // (0=near, 1=far)
	// float u = d / (metaball + 0.00001);  // avoid division by 0
	// float mouseMetaball = max(5. * u, -25. * u * u + 10. * u);
	// mouseMetaball = clamp(1. - mouseMetaball, 0., 1.);
	// val += mouseMetaball / 4.;

  val -= distance(vec2(0., 1. / ar + 0.1), pos) * 1.5;

  // antialiasing
  float low = discard_threshold - antialias_threshold;
  float high = discard_threshold;
  float alpha = smoothstep(low, high, val);

  vec3 c1 = vec3(144., 12., 63.) / 255.;
  vec3 c2 = vec3(199., 0., 57.) / 255.;
  vec3 c3 = vec3(255., 87., 51.) / 255.;
  vec3 c4 = vec3(255., 195., 7.) / 255.;

  vec3 color = vec3(0.);
  float interp = 1. - gl_FragCoord.y / resolution.y;

  if (interp >= 0.66) {
    color = mix(c3, c4, (interp - 0.66) / 0.33);
  } else if (interp >= 0.33) {
    color = mix(c2, c3, (interp - 0.33) / 0.33);
  } else {
    color = mix(c1, c2, interp / 0.33);
  }

  gl_FragColor = vec4(vec3(color), alpha);
}
`;