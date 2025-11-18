varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  float alpha = vAlpha * (1.0 - dist * 2.0);
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
