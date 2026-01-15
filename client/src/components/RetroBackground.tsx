import { useEffect, useRef } from 'react';

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - Retro CRT + Matrix rain effect
const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  
  // Random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // Matrix rain character effect
  float matrixChar(vec2 uv, float speed) {
    float t = u_time * speed;
    vec2 cell = floor(uv * vec2(40.0, 20.0));
    float r = random(cell);
    float drop = fract(t * 0.5 + r * 10.0);
    float brightness = smoothstep(0.0, 0.3, drop) * smoothstep(1.0, 0.7, drop);
    float char = step(0.5, random(cell + floor(t * 2.0)));
    return brightness * char * 0.15;
  }
  
  // Scanline effect
  float scanline(vec2 uv) {
    return sin(uv.y * 400.0) * 0.04 + 1.0;
  }
  
  // CRT curve distortion
  vec2 crtCurve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0, 4.0);
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
  }
  
  // Vignette effect
  float vignette(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    return 1.0 - dot(uv * 0.5, uv * 0.5);
  }
  
  // Grid effect
  float grid(vec2 uv) {
    vec2 grid = abs(fract(uv * 30.0) - 0.5);
    float line = min(grid.x, grid.y);
    return smoothstep(0.0, 0.05, line) * 0.3 + 0.7;
  }
  
  // Horizontal moving lines
  float horizLines(vec2 uv) {
    float y = uv.y + u_time * 0.1;
    return step(0.98, fract(y * 50.0)) * 0.1;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 curvedUV = crtCurve(uv);
    
    // Base dark purple/blue gradient
    vec3 color1 = vec3(0.05, 0.02, 0.1);
    vec3 color2 = vec3(0.02, 0.05, 0.15);
    vec3 baseColor = mix(color1, color2, uv.y);
    
    // Add matrix rain
    float matrix = matrixChar(curvedUV, 1.0);
    vec3 matrixColor = vec3(0.0, 1.0, 0.8) * matrix;
    
    // Add cyan/magenta accents
    float accent1 = matrixChar(curvedUV + vec2(0.3, 0.0), 0.7);
    vec3 cyanAccent = vec3(0.0, 1.0, 1.0) * accent1 * 0.5;
    
    float accent2 = matrixChar(curvedUV + vec2(0.6, 0.0), 0.5);
    vec3 magentaAccent = vec3(1.0, 0.0, 0.8) * accent2 * 0.3;
    
    // Grid overlay
    float gridVal = grid(curvedUV + vec2(0.0, u_time * 0.02));
    
    // Horizontal scan lines moving
    float hLines = horizLines(curvedUV);
    
    // Combine effects
    vec3 finalColor = baseColor;
    finalColor += matrixColor;
    finalColor += cyanAccent;
    finalColor += magentaAccent;
    finalColor *= gridVal;
    finalColor += vec3(0.0, 1.0, 1.0) * hLines;
    
    // Apply scanlines
    finalColor *= scanline(curvedUV);
    
    // Apply vignette
    finalColor *= vignette(uv);
    
    // CRT flicker
    finalColor *= 0.95 + 0.05 * sin(u_time * 10.0);
    
    // Clamp and output
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

export const RetroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    // Set up geometry (full-screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Get attribute/uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    // Handle resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const startTime = Date.now();
    
    const render = () => {
      const time = (Date.now() - startTime) / 1000;
      
      gl.useProgram(program);
      
      // Set uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      
      // Set up position attribute
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
