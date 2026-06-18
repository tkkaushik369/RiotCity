// import * as THREE from 'three'
import * as THREE from 'three/webgpu'
import * as CANNON from 'cannon-es'
import { threeToCannon, ShapeType } from 'three-to-cannon'

function vertInx(indices: number[], vertices: number[]) {
	const iv: number[] = []
	indices.forEach((index) => {
		iv.push(vertices[index * 3])
		iv.push(vertices[index * 3 + 1])
		iv.push(vertices[index * 3 + 2])
	})
	const indexedVertices = new Float32Array(iv)
	return indexedVertices
}

export class TrimeshCollider {
	public mesh: any
	public options: any
	public body: CANNON.Body
	public debugModel: any

	constructor(mesh: THREE.Object3D) {
		this.mesh = mesh.clone()

		this.options = {
			mass: 0,
			position: mesh.position,
			rotation: mesh.quaternion,
			friction: 0.3,
		}

		// Add phys sphere
		let physBox = new CANNON.Body({
			mass: this.options.mass,
			position: this.options.position,
			quaternion: this.options.rotation,
		})

		let mat = new CANNON.Material('triMat')
		mat.friction = this.options.friction
		physBox.material = mat

		let bufferGeometry = (mesh as THREE.Mesh).geometry
		let indices = []
		let vertices = []

		let indicesBuffer = bufferGeometry.getIndex()
		if (indicesBuffer !== null) {
			let inxBuff = indicesBuffer.array
			let vertBuff = bufferGeometry.attributes.position.array
			inxBuff.forEach((i) => {
				indices.push(i)
			})
			for (let i = 0; i < inxBuff.length; i++) {
				indices.push(inxBuff[i])
			}
			for (let i = 0; i < vertBuff.length; i++) {
				vertices.push(vertBuff[i])
			}

			bufferGeometry.setAttribute('position', new THREE.BufferAttribute(vertInx(indices, vertices), 3))
			bufferGeometry.computeVertexNormals()
		}

		let shape = threeToCannon(this.mesh, { type: ShapeType.MESH })
		if (shape != null) {
			physBox.addShape(shape.shape)
		}
		this.body = physBox
	}
}
