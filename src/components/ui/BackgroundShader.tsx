import { useEffect, useRef } from "react";

export const BackgroundShader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas?.clientWidth || 1280;
      const h = canvas?.clientHeight || 720;
      if (canvas && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    // Official Brand Background: Deep Navy (#0B183D)
    vec3 color = vec3(0.043, 0.094, 0.239); 
    
    // Deep ambient depth
    float distToCenter = length(uv - vec2(0.5));
    color -= distToCenter * 0.06;
    
    // Interactive Golden Dust Particles (Antique Gold #C9A227)
    for(float i=0.0; i<50.0; i++) {
        float n = noise(vec2(i, 1.23));
        vec2 p = vec2(noise(vec2(i, 0.0)), noise(vec2(0.0, i)));
        
        // Slow, cinematic drift
        p.y = fract(p.y - u_time * 0.005 * (0.3 + n));
        p.x += sin(u_time * 0.03 + i) * 0.15;
        
        // Subtle mouse repulsion
        float mDist = length(uv - p);
        float mouseAvoid = smoothstep(0.25, 0.0, length(uv - mouse));
        p += (uv - mouse) * mouseAvoid * 0.02;
        
        float dist = length(uv - p);
        float particle = smoothstep(0.0012, 0.0, dist);
        color += particle * vec3(0.788, 0.635, 0.153) * (0.1 + 0.5 * n); 
    }
    
    // Cinematic light beam from top-right
    vec2 rayOrigin = vec2(1.15, 1.15);
    float ray = pow(max(0.0, 1.0 - length(uv - rayOrigin)), 3.5);
    color += ray * vec3(0.878, 0.706, 0.31) * 0.15;
    
    // Microscopic paper grain texture
    float grain = noise(uv * u_resolution + u_time) * 0.015;
    color += grain;
    
    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) throw new Error("Could not create shader");
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="shader-bg">
      <div style={{ display: "block", width: "100%", height: "100%", minHeight: "200px" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};
