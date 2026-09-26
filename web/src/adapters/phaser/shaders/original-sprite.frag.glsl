precision mediump float;
uniform sampler2D uTexture;
varying vec2 outTexCoord;
void main() {
    gl_FragColor = texture2D(uTexture, outTexCoord);
}
