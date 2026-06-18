import * as CANNON from 'cannon-es'
// import * as THREE from 'three'
import * as THREE from 'three/webgpu'

export class BoxCollider {
	public options: any
	public body: CANNON.Body
	public debugModel: THREE.Mesh | null

	constructor(size?: THREE.Vector3) {
		this.options = {
			mass: 0,
			position: new THREE.Vector3(),
			size: new THREE.Vector3(0.3, 0.3, 0.3),
			friction: 0.3,
		}
		if (size !== undefined) {
			this.options.size = size
		}

		this.debugModel = null

		this.options.position = new CANNON.Vec3(
			this.options.position.x,
			this.options.position.y,
			this.options.position.z
		)
		this.options.size = new CANNON.Vec3(this.options.size.x, this.options.size.y, this.options.size.z)

		let shape = new CANNON.Box(this.options.size)

		let mat = new CANNON.Material('boxMat')
		mat.friction = this.options.friction

		// Add phys sphere
		let physBox = new CANNON.Body({
			mass: this.options.mass,
			position: this.options.position,
			shape,
		})

		physBox.material = mat

		this.body = physBox
	}
}
