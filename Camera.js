class Camera {
    constructor() {
        // this.eye = new Vector3([0, 1, 15]);  // Start above ground
        // this.at = new Vector3([0, 1, 14]);   // Look downward
        // this.up = new Vector3([0, 1, 0]);    // Up
        // this.eye = new Vector3([0,0,3]);
        // this.at = new Vector3([0,0,-100]);
        // this.up = new Vector3([0,1,0]);
        this.eye = new Vector3([0.39882692694664, 0.0760546624660492, 8.576414108276367]);
        this.at = new Vector3([0.38836950063705444, 0.023718707263469696, 7.577840805053711]);
        //this.eye = new Vector3([-5.491016387939453, 0.3449055850505829, -8.434207916259766]);
        //this.at = new Vector3([-5.400880336761475, 0.24037712812423706, -7.443778991699219]);
        this.up = new Vector3([0,1,0]);
        
        this.multiplyer = 0.2;   
        this.rotationSpeed = 2; 

        this.yaw = 0;   // Left/right rotation
        this.pitch = 0;
    }

    forward() {
        //var f = this.at.sub(this.eye);
        //f = f.normalize();
        //f = f.mul(0.2);
        var f = new Vector3(this.at.elements);
        f = f.sub(this.eye).normalize().mul(this.multiplyer);
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);
    }

    backward() {
        var f = new Vector3(this.at.elements);
        f = f.sub(this.eye).normalize().mul(this.multiplyer);
        this.eye = this.eye.sub(f);
        this.at = this.at.sub(f);
    }

    left() {
        var f = new Vector3(this.at.elements);
        f = f.sub(this.eye).normalize();
        var s = Vector3.cross(this.up, f).normalize().mul(this.multiplyer);
        //s = s.normalize();  
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }

    right() {
        var f = new Vector3(this.at.elements);
        f = f.sub(this.eye).normalize();
        var s = Vector3.cross(this.up, f).normalize().mul(this.multiplyer);  
        this.eye = this.eye.sub(s);
        this.at = this.at.sub(s);
    }

    upward() {
        var f = new Vector3([0,1,0]);
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);
    }

    downward() {
        var f = new Vector3([0,1,0]);
        this.eye = this.eye.sub(f);
        this.at = this.at.sub(f);
        
    }

    panLeft() {
        var f = new Vector3(this.at.elements);
        f = f.sub(this.eye).normalize();
        var rotationMatrix = new Matrix4().setRotate(this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        f = rotationMatrix.multiplyVector3(f);
        this.at = f.add(this.eye);
    }

    panRight() {
        var f = new Vector3(this.at.elements);
        f = f.sub(this.eye).normalize();
        var rotationMatrix = new Matrix4().setRotate(-this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        f = rotationMatrix.multiplyVector3(f);
        this.at = f.add(this.eye);
    }

    updateDirection() {
        // 1. convert to radians
        let radYaw = this.yaw * Math.PI / 180;
        let radPitch = this.pitch * Math.PI / 180;
        
        // 2. calculate xyz
        let x = Math.cos(radPitch) * Math.sin(radYaw);
        let y = Math.sin(radPitch);
        let z = Math.cos(radPitch) * Math.cos(radYaw);

        // 3. update eye
        this.at = new Vector3([
            this.eye.elements[0] + x,
            this.eye.elements[1] + y,
            this.eye.elements[2] + z
        ]);
    }

    mouseLook(deltaX, deltaY) {
        // Mouse SEnsitivity
        this.yaw -= deltaX * this.multiplyer;
        this.pitch -= deltaY * this.multiplyer;
        //convert
        this.pitch = Math.max(-89, Math.min(89, this.pitch));

        this.updateDirection();
    }
}
