uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D normalMap;
uniform sampler2D specularMap;
uniform vec3 sunDirection;
uniform vec3 ambientColor;
uniform float ambientIntensity;
uniform vec3 sunColor;
uniform float sunIntensity;
uniform float normalScale;
uniform float specularIntensity;
uniform float shininess;
uniform float debugNormals;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Sample textures
  vec3 dayColor = texture2D(dayTexture, vUv).rgb;
  vec3 nightColor = texture2D(nightTexture, vUv).rgb;
  
  // Sample and apply normal map
  vec3 normalMapSample = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
  normalMapSample.xy *= normalScale;
  
  // Perturb the surface normal with the normal map
  vec3 normal = normalize(vNormal + normalMapSample);
  float sunDot = dot(normal, normalize(sunDirection));

  // Diffuse lighting
  float diffuse = max(sunDot, 0.0);

  // Smooth blend between day and night at the terminator
  // sunDot > 0.1 = full day, sunDot < -0.1 = full night, in between = blend
  float dayMix = smoothstep(-0.2, 0.2, sunDot);

  // Blend between day and night textures
  // Make city lights much brighter and more intense
  vec3 baseColor = mix(nightColor * 1.1, dayColor, dayMix);

  // Apply lighting only to day side
  vec3 ambient = ambientColor * ambientIntensity;
  vec3 diffuseLight = sunColor * sunIntensity * diffuse * dayMix;

  // Specular reflection (for water/ice)
  float specularMask = texture2D(specularMap, vUv).r;
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 lightDir = normalize(sunDirection);
  vec3 reflectDir = reflect(-lightDir, normal);
  float specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specularLight = sunColor * specular * specularMask * specularIntensity * dayMix;

  vec3 finalColor = baseColor * (ambient + diffuseLight) + specularLight;

  // Add extra emissive glow to city lights on the night side
  vec3 emissiveLights = nightColor * 1.0 * (1.0 - dayMix);
  finalColor += emissiveLights;

  // Debug mode: visualize normals
  if (debugNormals > 0.5) {
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
  } else {
    gl_FragColor = vec4(finalColor, 1.0);
  }
}
