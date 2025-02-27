class Cube{
    constructor(){
      this.type = 'cube';
      this.color = [1.0,1.0,1.0,1.0];
      this.matrix = new Matrix4();
      this.textureNum = -1;
    }

    
    render(){

      var rgba = this.color;

      //pass the texture num
      gl.uniform1i(u_whichTexture, this.textureNum);

      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      //this is for texture
      //drawTriangle3DUV( [0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0 ] );
      //drawTriangle3DUV( [0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1 ] );

      // drawTriangle3DUV( 
      //   [0,0,0,  1,1,0,  1,0,0],  // First triangle (Bottom-right)
      //   [0,0,   1,1,    1,0]      // Correct UV mapping
      // );
      // drawTriangle3DUV( 
      //   [0,0,0,  0,1,0,  1,1,0],  // Second triangle (Top-left)
      //   [0,0,   0,1,    1,1]      // Correct UV mapping
      // );

      // Front face
      drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
      drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

      // Back face
      drawTriangle3DUV([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
      drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

      // Top face
      drawTriangle3DUV([0,1,0, 1,1,0, 1,1,1], [0,0, 1,0, 1,1]);
      drawTriangle3DUV([0,1,0, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

      // Bottom face
      drawTriangle3DUV([0,0,0, 1,0,1, 1,0,0], [0,0, 1,1, 1,0]);
      drawTriangle3DUV([0,0,0, 0,0,1, 1,0,1], [0,0, 0,1, 1,1]);

      // Left face
      drawTriangle3DUV([0,0,0, 0,1,1, 0,0,1], [0,0, 1,1, 0,1]);
      drawTriangle3DUV([0,0,0, 0,1,0, 0,1,1], [0,0, 1,0, 1,1]);

      // Right face
      drawTriangle3DUV([1,0,0, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
      drawTriangle3DUV([1,0,0, 1,1,1, 1,1,0], [0,0, 1,1, 0,1]);


    }

    renderfast(){
      
      var rgba = this.color;

      //pass the texture num
      gl.uniform1i(u_whichTexture, this.textureNum);

      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      var allverts = [];
      var alluv = [];

      // Front face
      allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
      alluv = alluv.concat( [0,0, 1,1, 1,0]);
      allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);
      alluv = alluv.concat( [0,0, 0,1, 1,1]);

      // Back face
      allverts = allverts.concat([0,0,1, 1,0,1, 1,1,1]);
      alluv = alluv.concat( [0,0, 1,0, 1,1]);
      allverts = allverts.concat([0,0,1, 1,1,1, 0,1,1]);
      alluv = alluv.concat( [0,0, 1,1, 0,1]);

      // Top face
      allverts = allverts.concat([0,1,0, 1,1,0, 1,1,1]);
      alluv = alluv.concat( [0,0, 1,0, 1,1]);
      allverts = allverts.concat([0,1,0, 1,1,1, 0,1,1]);
      alluv = alluv.concat( [0,0, 1,1, 0,1]);

      // Bottom face
      allverts = allverts.concat([0,0,0, 1,0,1, 1,0,0]);
      alluv = alluv.concat( [0,0, 1,1, 1,0]);
      allverts = allverts.concat([0,0,0, 0,0,1, 1,0,1]);
      alluv = alluv.concat( [0,0, 0,1, 1,1]);

      // Left face
      allverts = allverts.concat([0,0,0, 0,1,1, 0,0,1]);
      alluv = alluv.concat( [0,0, 1,1, 0,1]);
      allverts = allverts.concat([0,0,0, 0,1,0, 0,1,1]);
      alluv = alluv.concat( [0,0, 1,0, 1,1]);

      // Right face
      allverts = allverts.concat([1,0,0, 1,0,1, 1,1,1]);
      alluv = alluv.concat( [0,0, 1,0, 1,1]);
      allverts = allverts.concat([1,0,0, 1,1,1, 1,1,0]);
      alluv = alluv.concat( [0,0, 1,1, 0,1]);

      drawTriangle3DUV(allverts, alluv);
    }
  }
